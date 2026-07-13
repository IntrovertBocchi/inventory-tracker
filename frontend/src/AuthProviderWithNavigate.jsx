import { Auth0Provider } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'

function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate();

  // Auth0 default post-login redirect changes the browser's URL directly,
  // bypassing the React Router. That leaves the address bar showing the right
  // page while React Router still renders the old one. This custom
  // onRedirectCallback fixes that by using React Router's own navigate()
  // function instead, so the two stay in sync.
  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_API_AUDIENCE
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  )
}

export default Auth0ProviderWithNavigate