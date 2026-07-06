import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { UnreadProvider } from './context/UnreadContext'
import './theme/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <div className="phone">
            <div className="phone-screen">
              <ToastProvider>
                <UnreadProvider>
                  <App />
                </UnreadProvider>
              </ToastProvider>
            </div>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
