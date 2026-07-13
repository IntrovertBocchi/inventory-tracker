import { createRoot } from 'react-dom/client'
import Auth0ProviderWithNavigate from './AuthProviderWithNavigate.jsx'
import { BrowserRouter } from 'react-router-dom'
import './styles/main.scss'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
      <BrowserRouter>
        <Auth0ProviderWithNavigate>
          <App />
        </Auth0ProviderWithNavigate>
      </BrowserRouter>
)
