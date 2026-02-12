use serde::Serialize;
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
}

fn new_hidden_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

#[tauri::command]
pub fn get_vmmem_stats() -> Result<VmmemStats, String> {
    // Get Vmmem process memory via PowerShell
    let output = new_hidden_command("powershell.exe")
        .args([
            "-NoProfile",
            "-Command",
            "(Get-Process -Name vmmem -ErrorAction SilentlyContinue | Measure-Object -Property WorkingSet64 -Sum).Sum",
        ])
        .output()
        .map_err(|e| format!("Failed to run PowerShell: {}", e))?;

    let used_bytes: u64 = String::from_utf8_lossy(&output.stdout)
        .trim()
        .parse()
        .unwrap_or(0);
    let used_mb = used_bytes / 1024 / 1024;

    // Read .wslconfig for memory limit
    let limit_mb = get_wsl_memory_limit().unwrap_or(16384); // default 16GB

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
            // Parse "16GB", "8GB", "4096MB" etc
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
    let wsl_home = get_wsl_home_path()?;
    let claude_dir = format!("{}/.claude/projects", wsl_home);

    let mut sessions = Vec::new();

    let projects_dir = std::path::Path::new(&claude_dir);
    if !projects_dir.exists() {
        return Ok(sessions);
    }

    for project_entry in std::fs::read_dir(projects_dir).map_err(|e| e.to_string())? {
        let project_entry = project_entry.map_err(|e| e.to_string())?;
        if !project_entry.file_type().map_err(|e| e.to_string())?.is_dir() {
            continue;
        }

        let project_dir_name = project_entry.file_name().to_string_lossy().to_string();

        // Decode project path from directory name (e.g., "-home-hyunsu-Dev-cli-buddy" -> "/home/hyunsu/Dev/cli-buddy")
        let project_path = project_dir_name.replace('-', "/");
        let project_name = project_dir_name
            .rsplit('-')
            .next()
            .unwrap_or(&project_dir_name)
            .to_string();

        // Find .jsonl session files
        let project_path_full = project_entry.path();
        let entries = match std::fs::read_dir(&project_path_full) {
            Ok(e) => e,
            Err(_) => continue,
        };

        for file_entry in entries {
            let file_entry = match file_entry {
                Ok(e) => e,
                Err(_) => continue,
            };
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

            // Get last modified time
            let last_modified = metadata
                .modified()
                .ok()
                .and_then(|m| m.duration_since(std::time::UNIX_EPOCH).ok())
                .and_then(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0))
                .map(|dt| dt.format("%m/%d %H:%M").to_string())
                .unwrap_or_default();

            // Count messages (quick: count lines)
            let message_count = std::fs::read_to_string(file_entry.path())
                .map(|content| content.lines().count() as u32)
                .unwrap_or(0);

            let resume_command = format!("claude --resume {}", session_id);

            sessions.push(ClaudeSession {
                session_id,
                project: project_name.clone(),
                project_path: project_path.clone(),
                last_modified,
                message_count,
                size_kb,
                resume_command,
            });
        }
    }

    // Sort by last modified (newest first)
    sessions.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));

    // Limit to 20 most recent
    sessions.truncate(20);

    Ok(sessions)
}

fn get_wsl_home_path() -> Result<String, String> {
    let output = new_hidden_command("wsl.exe")
        .args(["-e", "echo", "$HOME"])
        .output()
        .map_err(|e| format!("Failed to run wsl: {}", e))?;

    let wsl_home = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if wsl_home.is_empty() {
        return Err("Could not determine WSL home directory".to_string());
    }

    let distro = get_default_wsl_distro().unwrap_or("Ubuntu".to_string());
    let windows_path = format!("\\\\wsl.localhost\\{}{}",
        distro,
        wsl_home.replace('/', "\\")
    );

    Ok(windows_path)
}

fn get_default_wsl_distro() -> Option<String> {
    let output = new_hidden_command("wsl.exe")
        .args(["--list", "--quiet"])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout
        .lines()
        .next()
        .map(|s| s.replace('\0', "").trim().to_string())
        .filter(|s| !s.is_empty())
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
