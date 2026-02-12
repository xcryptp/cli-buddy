use serde::Serialize;
use std::io::BufRead;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Clone)]
pub struct VmmemStats {
    pub used_mb: u64,
    pub limit_mb: u64,
    pub usage_percent: f64,
    pub status: String, // "normal", "warning", "danger"
}

#[derive(Serialize, Clone)]
pub struct ClaudeSession {
    pub session_id: String,
    pub project: String,
    pub project_path: String,
    pub last_modified: String,
    pub message_count: u32,
    pub size_kb: u64,
    pub resume_command: String,
    pub topic: String,
}

fn new_hidden_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

#[tauri::command]
pub fn get_vmmem_stats() -> Result<VmmemStats, String> {
    // Process name can be "vmmem" or "vmmemWSL" depending on Windows version
    let output = new_hidden_command("powershell.exe")
        .args([
            "-NoProfile",
            "-Command",
            "(Get-Process -Name vmmem* -ErrorAction SilentlyContinue | Measure-Object -Property WorkingSet64 -Sum).Sum",
        ])
        .output()
        .map_err(|e| format!("Failed to run PowerShell: {}", e))?;

    let used_bytes: u64 = String::from_utf8_lossy(&output.stdout)
        .trim()
        .parse()
        .unwrap_or(0);
    let used_mb = used_bytes / 1024 / 1024;

    let limit_mb = get_wsl_memory_limit().unwrap_or(16384);

    let usage_percent = if limit_mb > 0 {
        (used_mb as f64 / limit_mb as f64) * 100.0
    } else {
        0.0
    };

    let status = if usage_percent >= 90.0 {
        "danger".to_string()
    } else if usage_percent >= 75.0 {
        "warning".to_string()
    } else {
        "normal".to_string()
    };

    Ok(VmmemStats {
        used_mb,
        limit_mb,
        usage_percent,
        status,
    })
}

fn get_wsl_memory_limit() -> Option<u64> {
    let userprofile = std::env::var("USERPROFILE").ok()?;
    let config_path = std::path::Path::new(&userprofile).join(".wslconfig");
    let content = std::fs::read_to_string(config_path).ok()?;

    for line in content.lines() {
        let line = line.trim().to_lowercase();
        if line.starts_with("memory=") || line.starts_with("memory =") {
            let val = line.split('=').nth(1)?.trim().to_string();
            if let Some(gb) = val.strip_suffix("gb") {
                return gb.trim().parse::<u64>().ok().map(|g| g * 1024);
            }
            if let Some(mb) = val.strip_suffix("mb") {
                return mb.trim().parse::<u64>().ok();
            }
        }
    }
    None
}

#[tauri::command]
pub fn get_claude_sessions() -> Result<Vec<ClaudeSession>, String> {
    let mut sessions = Vec::new();

    // Try multiple paths to find Claude sessions
    let mut search_paths: Vec<std::path::PathBuf> = Vec::new();

    // 1. Windows native: %USERPROFILE%\.claude\projects
    if let Ok(userprofile) = std::env::var("USERPROFILE") {
        let win_path = std::path::PathBuf::from(&userprofile)
            .join(".claude")
            .join("projects");
        if win_path.exists() {
            search_paths.push(win_path);
        }
    }

    // 2. WSL: use wslpath to get the correct Windows-accessible path
    if let Ok(wsl_path) = get_wsl_claude_path() {
        let path = std::path::PathBuf::from(&wsl_path);
        if path.exists() && !search_paths.contains(&path) {
            search_paths.push(path);
        }
    }

    for projects_dir in &search_paths {
        if let Ok(entries) = std::fs::read_dir(projects_dir) {
            for project_entry in entries.flatten() {
                if !project_entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                    continue;
                }

                let project_dir_name = project_entry.file_name().to_string_lossy().to_string();
                let project_path = project_dir_name.replace('-', "/");
                let project_name = project_dir_name
                    .rsplit('-')
                    .next()
                    .unwrap_or(&project_dir_name)
                    .to_string();

                let project_path_full = project_entry.path();
                let file_entries = match std::fs::read_dir(&project_path_full) {
                    Ok(e) => e,
                    Err(_) => continue,
                };

                for file_entry in file_entries.flatten() {
                    let filename = file_entry.file_name().to_string_lossy().to_string();
                    if !filename.ends_with(".jsonl") {
                        continue;
                    }

                    let session_id = filename.trim_end_matches(".jsonl").to_string();
                    let metadata = match file_entry.metadata() {
                        Ok(m) => m,
                        Err(_) => continue,
                    };
                    let size_kb = metadata.len() / 1024;

                    let last_modified = metadata
                        .modified()
                        .ok()
                        .and_then(|m| m.duration_since(std::time::UNIX_EPOCH).ok())
                        .and_then(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0))
                        .map(|dt| dt.format("%m/%d %H:%M").to_string())
                        .unwrap_or_default();

                    // Count lines and extract topic from first user message
                    let (message_count, topic) = extract_session_info(&file_entry.path());

                    let resume_command = format!("claude --resume {}", session_id);

                    sessions.push(ClaudeSession {
                        session_id,
                        project: project_name.clone(),
                        project_path: project_path.clone(),
                        last_modified,
                        message_count,
                        size_kb,
                        resume_command,
                        topic,
                    });
                }
            }
        }
    }

    // Sort by last modified (newest first)
    sessions.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
    sessions.truncate(20);

    Ok(sessions)
}

/// Extract line count and first user message topic from a .jsonl session file
fn extract_session_info(path: &std::path::Path) -> (u32, String) {
    let file = match std::fs::File::open(path) {
        Ok(f) => f,
        Err(_) => return (0, String::new()),
    };
    let reader = std::io::BufReader::new(file);
    let mut count = 0u32;
    let mut topic = String::new();

    for line in reader.lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => break,
        };
        count += 1;

        // Only look for topic in first 20 lines to keep it fast
        if topic.is_empty() && count <= 20 {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                // Claude Code session format: {"type":"human","message":{"content":"..."}}
                let msg_type = val.get("type").and_then(|t| t.as_str()).unwrap_or("");
                if msg_type == "human" {
                    // Try nested message.content (array or string)
                    if let Some(msg) = val.get("message") {
                        if let Some(content) = msg.get("content") {
                            if let Some(s) = content.as_str() {
                                topic = s.chars().take(80).collect();
                            } else if let Some(arr) = content.as_array() {
                                // content can be [{type:"text", text:"..."}]
                                for item in arr {
                                    if let Some(text) = item.get("text").and_then(|t| t.as_str()) {
                                        topic = text.chars().take(80).collect();
                                        break;
                                    }
                                }
                            }
                        } else if let Some(s) = msg.as_str() {
                            topic = s.chars().take(80).collect();
                        }
                    }
                    // Also try flat "content" field
                    if topic.is_empty() {
                        if let Some(content) = val.get("content") {
                            if let Some(s) = content.as_str() {
                                topic = s.chars().take(80).collect();
                            }
                        }
                    }
                }
            }
        }
    }

    (count, topic)
}

/// Use wslpath to get the Windows-accessible path to Claude projects in WSL
fn get_wsl_claude_path() -> Result<String, String> {
    // wslpath auto-resolves the correct distro name (Ubuntu, Ubuntu-24.04, Debian, etc.)
    let output = new_hidden_command("wsl.exe")
        .args(["-e", "sh", "-c", "wslpath -w \"$HOME/.claude/projects\""])
        .output()
        .map_err(|e| format!("Failed to run wsl: {}", e))?;

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if path.is_empty() || !output.status.success() {
        return Err("Could not get WSL Claude path".to_string());
    }

    Ok(path)
}

#[tauri::command]
pub fn restart_wsl() -> Result<String, String> {
    let shutdown = new_hidden_command("wsl.exe")
        .args(["--shutdown"])
        .output()
        .map_err(|e| format!("Failed to shutdown WSL: {}", e))?;

    if !shutdown.status.success() {
        return Err(format!(
            "WSL shutdown failed: {}",
            String::from_utf8_lossy(&shutdown.stderr)
        ));
    }

    std::thread::sleep(std::time::Duration::from_secs(2));

    let restart = new_hidden_command("wsl.exe")
        .args(["-e", "echo", "WSL restarted"])
        .output()
        .map_err(|e| format!("Failed to restart WSL: {}", e))?;

    if restart.status.success() {
        Ok("WSL restarted successfully".to_string())
    } else {
        Err(format!(
            "WSL restart failed: {}",
            String::from_utf8_lossy(&restart.stderr)
        ))
    }
}
