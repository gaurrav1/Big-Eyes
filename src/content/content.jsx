import React from 'react'
import ReactDOM from 'react-dom/client'

// Instead of importing as styles, get the file URL
import cssUrl from './content.css?url'

const App = () => {
  return (
    <div className="box light">
      Hello from Content Script with light theme
    </div>
  )
}

// Create shadow root mount
const host = document.createElement('div')
host.id = 'extension-host'
document.body.appendChild(host)

const shadow = host.attachShadow({ mode: 'open' })

// Inject CSS via <link>
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = cssUrl
shadow.appendChild(link)

// Add container and mount React app
const container = document.createElement('div')
shadow.appendChild(container)

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
