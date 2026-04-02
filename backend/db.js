const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('portal.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'buyer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS favourites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    UNIQUE(user_id, property_id)
  );
`);

// Seed some sample properties if empty
const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get();
if (propertyCount.count === 0) {
  const insertProperty = db.prepare('INSERT INTO properties (title, address, price, description) VALUES (?, ?, ?, ?)');
  insertProperty.run('Modern Downtown Condo', '123 Main St, City Center', 450000, 'Beautiful 2BR condo with city views');
  insertProperty.run('Suburban Family Home', '456 Oak Ave, Suburbia', 650000, 'Spacious 4BR home with large backyard');
  insertProperty.run('Luxury Penthouse', '789 Sky Tower, Downtown', 1200000, 'Exclusive penthouse with panoramic views');
  insertProperty.run('Cozy Starter Home', '321 Elm St, Quiet Neighborhood', 320000, 'Perfect 2BR starter home');
}

module.exports = {
  // User operations
  createUser: (email, password, name) => {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
    const result = stmt.run(email, passwordHash, name);
    return result.lastInsertRowid;
  },

  getUserByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  getUserById: (id) => {
    return db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(id);
  },

  verifyPassword: (password, hash) => {
    return bcrypt.compareSync(password, hash);
  },

  // Property operations
  getAllProperties: () => {
    return db.prepare('SELECT * FROM properties').all();
  },

  getPropertyById: (id) => {
    return db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  },

  // Favourite operations
  getUserFavourites: (userId) => {
    return db.prepare(`
      SELECT p.*, f.created_at as favourited_at
      FROM favourites f
      JOIN properties p ON f.property_id = p.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);
  },

  addFavourite: (userId, propertyId) => {
    const stmt = db.prepare('INSERT INTO favourites (user_id, property_id) VALUES (?, ?)');
    return stmt.run(userId, propertyId);
  },

  removeFavourite: (userId, propertyId) => {
    const stmt = db.prepare('DELETE FROM favourites WHERE user_id = ? AND property_id = ?');
    return stmt.run(userId, propertyId);
  },

  isFavourite: (userId, propertyId) => {
    const result = db.prepare('SELECT 1 FROM favourites WHERE user_id = ? AND property_id = ?').get(userId, propertyId);
    return !!result;
  }
};
