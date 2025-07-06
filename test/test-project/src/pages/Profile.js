import React, { useState } from 'react';

function Profile() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    bio: 'Software developer with 5+ years experience'
  });

  const [editing, setEditing] = useState(false);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEditing(false);
    alert('Profile updated successfully!');
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <h1>User Profile</h1>
          <button 
            className="edit-btn"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </header>

        <div className="profile-content">
          <div className="profile-avatar">
            <img src="/api/placeholder/150/150" alt="Profile" />
            <button className="change-avatar-btn">Change Avatar</button>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                disabled={!editing}
                rows="4"
              />
            </div>

            {editing && (
              <div className="form-actions">
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
                <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;