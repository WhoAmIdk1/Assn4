import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';

import { AuthContext } from '../contexts/AuthContext'; 

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {

      await logout(); 
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="brand-link">🗳️ Cozy Polls</Link>
      </div>
      
      <div className="nav-links">
        {user ? (
          <>
            <span className="welcome-text">Welcome, {user.username}!</span>
            <Link to="/polls/new" className="nav-link">Create Poll</Link>
            <Link to="/my-polls" className="nav-link">My Polls</Link>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}