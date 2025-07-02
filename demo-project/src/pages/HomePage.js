
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };
  
  return (
    <div className="home-page">
      <nav className="navbar">
        <h1>Welcome to Dashboard</h1>
        <div>
          <Link to="/profile" data-testid="profile-link">Profile</Link>
          <button onClick={handleLogout} data-testid="logout-button">Logout</button>
        </div>
      </nav>
      <main>
        <h2>Dashboard Content</h2>
        <p>This is the main dashboard page.</p>
      </main>
    </div>
  );
}

export default HomePage;
    