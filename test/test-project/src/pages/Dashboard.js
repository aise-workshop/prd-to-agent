import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">1,234</p>
          </div>
          <div className="stat-card">
            <h3>Active Sessions</h3>
            <p className="stat-number">56</p>
          </div>
          <div className="stat-card">
            <h3>Revenue</h3>
            <p className="stat-number">$12,345</p>
          </div>
        </div>

        <div className="dashboard-sections">
          <section className="recent-activity">
            <h2>Recent Activity</h2>
            <ul className="activity-list">
              <li>User John Doe logged in</li>
              <li>New order #12345 created</li>
              <li>System backup completed</li>
            </ul>
          </section>

          <section className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="action-btn">Add User</button>
              <button className="action-btn">Generate Report</button>
              <button className="action-btn">Settings</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;