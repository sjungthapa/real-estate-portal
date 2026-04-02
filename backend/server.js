const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./db');
const { generateToken, authMiddleware } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend')));

// Auth endpoints
app.post('/api/register', (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = db.createUser(email, password, name);
    const token = generateToken(userId);

    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ message: 'Registration successful', token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user || !db.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Protected endpoints
app.get('/api/me', authMiddleware, (req, res) => {
  try {
    const user = db.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

app.get('/api/properties', authMiddleware, (req, res) => {
  try {
    const properties = db.getAllProperties();
    const favourites = db.getUserFavourites(req.userId);
    const favouriteIds = new Set(favourites.map(f => f.id));

    const propertiesWithFavStatus = properties.map(p => ({
      ...p,
      isFavourite: favouriteIds.has(p.id)
    }));

    res.json(propertiesWithFavStatus);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to get properties' });
  }
});

app.get('/api/favourites', authMiddleware, (req, res) => {
  try {
    const favourites = db.getUserFavourites(req.userId);
    res.json(favourites);
  } catch (error) {
    console.error('Get favourites error:', error);
    res.status(500).json({ error: 'Failed to get favourites' });
  }
});

app.post('/api/favourites/:propertyId', authMiddleware, (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    
    const property = db.getPropertyById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (db.isFavourite(req.userId, propertyId)) {
      return res.status(400).json({ error: 'Property already in favourites' });
    }

    db.addFavourite(req.userId, propertyId);
    res.json({ message: 'Added to favourites' });
  } catch (error) {
    console.error('Add favourite error:', error);
    res.status(500).json({ error: 'Failed to add favourite' });
  }
});

app.delete('/api/favourites/:propertyId', authMiddleware, (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    db.removeFavourite(req.userId, propertyId);
    res.json({ message: 'Removed from favourites' });
  } catch (error) {
    console.error('Remove favourite error:', error);
    res.status(500).json({ error: 'Failed to remove favourite' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
