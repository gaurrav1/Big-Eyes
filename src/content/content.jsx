import React from "react";
import ReactDOM from "react-dom/client";

const root = document.createElement("div");
root.id = "crx-root";
document.body.appendChild(root);

console.log("Content script loaded");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <h1>Content Script Loaded</h1>
  </React.StrictMode>
);