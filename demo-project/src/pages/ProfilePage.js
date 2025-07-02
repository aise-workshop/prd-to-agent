
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ProfilePage() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  
  const handleSave = () => {
    alert('Profile saved!');
  };
  
  return (
    <div className="profile-page">
      <nav>
        <Link to="/home" data-testid="home-link">Back to Home</Link>
      </nav>
      <h1>User Profile</h1>
      <form className="profile-form">
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="name-input"
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input"
          />
        </div>
        <button type="button" onClick={handleSave} data-testid="save-button">
          Save Profile
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
    