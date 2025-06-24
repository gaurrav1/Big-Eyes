import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from "./App.jsx";
import "./content.css";
import './script.js'

// Shadow DOM setup with optimized rendering
const host = document.createElement('div');
host.id = 'extension-host';
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: 'open' });
const container = document.createElement('div');
shadow.appendChild(container);

// CSS injection
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = chrome.runtime.getURL('content/content.css');
shadow.appendChild(styleLink);

// Render with performance monitoring
const renderStart = performance.now();
const root = ReactDOM.createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Add delay before registration
setTimeout(() => {
    chrome.runtime.sendMessage({ type: "REGISTER_TAB" }, (response) => {
        console.log("Registration response:", response);
        if (response?.isActive) {
            startFetching();
        }
    });
}, 1000); // 1-second delay

// Performance logging
requestIdleCallback(() => {
    console.log(`Extension rendered in ${performance.now() - renderStart}ms`);
});