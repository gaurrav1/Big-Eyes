import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from "./App.jsx";
import "./index.css";

// Shadow DOM setup
const host = document.createElement('div');
host.id = 'extension-host';
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: 'open' });
const container = document.createElement('div');
container.className = 'extension-ui';
shadow.appendChild(container);

// CSS injection
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = chrome.runtime.getURL('content/index.css');
shadow.appendChild(styleLink);

// Render UI
const root = ReactDOM.createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);