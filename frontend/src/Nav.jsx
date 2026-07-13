import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useTheme } from './hooks/useTheme';

function Nav() {
    const { isAuthenticated, logout } = useAuth0();
    const { theme, toggleTheme, isOnCooldown } = useTheme();
    const location = useLocation();

    if (!isAuthenticated) {
        return null;
    }

    function linkClass(path) {
        return `nav__link${location.pathname === path ? ' active' : ''}`;
    }

    return (
        <nav className="nav">
            <span className="nav__brand">Inventory Tracker</span>
            <Link to="/" className={linkClass("/")}>Home</Link>
            {" | "}
            <Link to="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
            {" | "}
            <Link to="/products" className={linkClass("/products")}>Products</Link>
            {" | "}
            <button className="btn btn--ghost" onClick={toggleTheme} disabled={isOnCooldown}>
                 {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <button 
                className="btn btn--danger"
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                Log Out
            </button>
        </nav>
    );
}

export default Nav