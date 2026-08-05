import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { TitleProvider } from './context/TitleContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TitleProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </TitleProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
