import React from 'react';

function Home() {
  return (
    <div className="home-page">
      <header className="hero-section">
        <h1 id="hero-title">Welcome to Test App</h1>
        <p className="hero-subtitle">This is a sample React application for testing</p>
        <button className="cta-button" onClick={() => alert('CTA clicked!')}>
          Get Started
        </button>
      </header>

      <section className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Feature 1</h3>
            <p>Description of feature 1</p>
          </div>
          <div className="feature-card">
            <h3>Feature 2</h3>
            <p>Description of feature 2</p>
          </div>
          <div className="feature-card">
            <h3>Feature 3</h3>
            <p>Description of feature 3</p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <h2>Contact Us</h2>
        <form className="contact-form">
          <input type="text" id="contact-name" placeholder="Your Name" />
          <input type="email" id="contact-email" placeholder="Your Email" />
          <textarea id="contact-message" placeholder="Your Message"></textarea>
          <button type="submit" className="submit-btn">Send Message</button>
        </form>
      </section>
    </div>
  );
}

export default Home;