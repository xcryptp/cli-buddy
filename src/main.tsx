import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PopupApp } from "./PopupApp";
import "./styles/globals.css";

const isPopup =
  new URLSearchParams(window.location.search).get("mode") === "popup";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isPopup ? <PopupApp /> : <App />}</React.StrictMode>,
);
