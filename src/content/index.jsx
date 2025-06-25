import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.jsx";
import "./index.css";
import { UserStatus } from "./UserStatus.jsx";

// Shadow DOM setup
const host = document.createElement("div");
host.id = "extension-host";
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });
const container = document.createElement("div");
container.className = "extension-ui";
shadow.appendChild(container);

// Helper to inject after navigation bar
function injectUserStatus() {
  const navBar = document.querySelector(
    'div[data-test-component="StencilReactCol"].navigation-bar',
  );
  if (!navBar) {
    setTimeout(injectUserStatus, 500);
    return;
  }

  // Prevent duplicate injection
  if (document.getElementById("user-status-root")) return;

  const statusRoot = document.createElement("div");
  statusRoot.id = "user-status-root";
  navBar.parentNode.insertBefore(statusRoot, navBar.nextSibling);

  // Render UserStatus into this node
  const statusRootReact = ReactDOM.createRoot(statusRoot);
  statusRootReact.render(
    <React.StrictMode>
      <UserStatus />
    </React.StrictMode>,
  );
}

// Wait for DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectUserStatus);
} else {
  injectUserStatus();
}
// CSS injection
const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = chrome.runtime.getURL("content/index.css");
shadow.appendChild(styleLink);

// Render UI
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
