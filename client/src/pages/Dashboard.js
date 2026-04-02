import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ne-NP', { 
      style: 'currency', 
      currency: 'NPR', 
      maximumFractionDigits: 0 
    }).format(price);
  };

  const loadDashboard = async () => {
    try {
      const [userRes, propertiesRes, favouritesRes] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/properties'),
        fetch('/api/favourites')
      ]);

      if (!userRes.ok) {
        navigate('/');
        return;
      }

      const userData = await userRes.json();
      const propertiesData = await propertiesRes.json();
      const favouritesData = await favouritesRes.json();

      setUser(userData);
      setProperties(propertiesData);
      setFavourites(favouritesData);
    } catch (error) {
      showMessage('Failed to load dashboard', 'error');
    }
  };

  const toggleFavourite = async (propertyId, isFavourite) => {
    try {
      const method = isFavourite ? 'DELETE' : 'POST';
      const response = await fetch(`/api/favourites/${propertyId}`, { method });
      const data = await response.json();

      if (response.ok) {
        showMessage(data.message, 'success');
        loadDashboard();
      } else {
        showMessage(data.error || 'Operation failed', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    navigate('/');
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Buyer Portal</h1>
        <div className="user-info">
          <span>{user.name} ({user.role})</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="section">
          <h2>My Favourites</h2>
          {favourites.length === 0 ? (
            <p className="empty-state">No favourites yet. Browse properties below!</p>
          ) : (
            <div className="property-grid">
              {favourites.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={{ ...property, isFavourite: true }}
                  onToggleFavourite={toggleFavourite}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2>All Properties</h2>
          <div className="property-grid">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onToggleFavourite={toggleFavourite}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </section>
      </main>

      {message.text && (
        <div className={`message ${message.type}`} style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property, onToggleFavourite, formatPrice }) {
  return (
    <div className="property-card">
      <h3>{property.title}</h3>
      <p className="address">{property.address}</p>
      <p className="price">{formatPrice(property.price)}</p>
      <p className="description">{property.description}</p>
      <button
        className={`fav-btn ${property.isFavourite ? 'active' : ''}`}
        onClick={() => onToggleFavourite(property.id, property.isFavourite)}
      >
        {property.isFavourite ? '❤️ Remove from Favourites' : '🤍 Add to Favourites'}
      </button>
    </div>
  );
}

export default Dashboard;
