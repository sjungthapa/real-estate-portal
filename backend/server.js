const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./db');
const { generateToken, authMiddleware } = require('./auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Auth endpoints
app.post('/api/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  db.getUserByEmail(email, (err, existingUser) => {
    if (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Registration failed' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    db.createUser(email, password, name, (err, userId) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Registration failed' });
      }

      const token = generateToken(userId);
      res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
      res.json({ message: 'Registration successful', token });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.getUserByEmail(email, (err, user) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }

    if (!user || !db.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ message: 'Login successful', token });
  });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Protected endpoints
app.get('/api/me', authMiddleware, (req, res) => {
  db.getUserById(req.userId, (err, user) => {
    if (err) {
      console.error('Get user error:', err);
      return res.status(500).json({ error: 'Failed to get user info' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

app.get('/api/properties', authMiddleware, (req, res) => {
  db.getAllProperties((err, properties) => {
    if (err) {
      console.error('Get properties error:', err);
      return res.status(500).json({ error: 'Failed to get properties' });
    }

    db.getUserFavourites(req.userId, (err, favourites) => {
      if (err) {
        console.error('Get favourites error:', err);
        return res.status(500).json({ error: 'Failed to get properties' });
      }

      const favouriteIds = new Set(favourites.map(f => f.id));
      const propertiesWithFavStatus = properties.map(p => ({
        ...p,
        isFavourite: favouriteIds.has(p.id)
      }));

      res.json(propertiesWithFavStatus);
    });
  });
});

app.get('/api/favourites', authMiddleware, (req, res) => {
  db.getUserFavourites(req.userId, (err, favourites) => {
    if (err) {
      console.error('Get favourites error:', err);
      return res.status(500).json({ error: 'Failed to get favourites' });
    }
    res.json(favourites);
  });
});

app.post('/api/favourites/:propertyId', authMiddleware, (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  
  db.getPropertyById(propertyId, (err, property) => {
    if (err) {
      console.error('Add favourite error:', err);
      return res.status(500).json({ error: 'Failed to add favourite' });
    }
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    db.isFavourite(req.userId, propertyId, (err, exists) => {
      if (err) {
        console.error('Add favourite error:', err);
        return res.status(500).json({ error: 'Failed to add favourite' });
      }
      if (exists) {
        return res.status(400).json({ error: 'Property already in favourites' });
      }

      db.addFavourite(req.userId, propertyId, (err) => {
        if (err) {
          console.error('Add favourite error:', err);
          return res.status(500).json({ error: 'Failed to add favourite' });
        }
        res.json({ message: 'Added to favourites' });
      });
    });
  });
});

app.delete('/api/favourites/:propertyId', authMiddleware, (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  db.removeFavourite(req.userId, propertyId, (err) => {
    if (err) {
      console.error('Remove favourite error:', err);
      return res.status(500).json({ error: 'Failed to remove favourite' });
    }
    res.json({ message: 'Removed from favourites' });
  });
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
