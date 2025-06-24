import React from 'react';
import ReactDOM from 'react-dom/client';
import './script.js'
import {App} from "./App.jsx";

// Shadow DOM setup
const host = document.createElement('div');
host.id = 'extension-host';
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: 'open' });
const container = document.createElement('div');
shadow.appendChild(container);

ReactDOM.createRoot(container).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);