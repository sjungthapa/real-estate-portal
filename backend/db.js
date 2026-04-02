const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('portal.db');

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'buyer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      address TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS favourites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      UNIQUE(user_id, property_id)
    )
  `);

  // Seed some sample properties if empty
  db.get('SELECT COUNT(*) as count FROM properties', (err, row) => {
    if (!err && row.count === 0) {
      const stmt = db.prepare('INSERT INTO properties (title, address, price, description) VALUES (?, ?, ?, ?)');
      stmt.run('Modern Apartment in Thamel', 'Thamel, Kathmandu', 15000000, 'Beautiful 2BHK apartment in the heart of Thamel with modern amenities');
      stmt.run('Spacious House in Lalitpur', 'Jawalakhel, Lalitpur', 35000000, 'Luxurious 4BHK house with garden and parking space');
      stmt.run('Penthouse in Durbar Marg', 'Durbar Marg, Kathmandu', 75000000, 'Premium penthouse with stunning mountain views and rooftop access');
      stmt.run('Cozy Flat in Bhaktapur', 'Suryabinayak, Bhaktapur', 8500000, 'Affordable 1BHK flat perfect for small families or couples');
      stmt.run('Villa in Budhanilkantha', 'Budhanilkantha, Kathmandu', 55000000, 'Elegant 5BHK villa with swimming pool and mountain views');
      stmt.run('Commercial Space in New Road', 'New Road, Kathmandu', 45000000, 'Prime commercial property ideal for retail or office space');
      stmt.finalize();
    }
  });
});

module.exports = {
  // User operations
  createUser: (email, password, name, callback) => {
    const passwordHash = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', 
      [email, passwordHash, name], 
      function(err) {
        callback(err, this.lastID);
      }
    );
  },

  getUserByEmail: (email, callback) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], callback);
  },

  getUserById: (id, callback) => {
    db.get('SELECT id, email, name, role FROM users WHERE id = ?', [id], callback);
  },

  verifyPassword: (password, hash) => {
    return bcrypt.compareSync(password, hash);
  },

  // Property operations
  getAllProperties: (callback) => {
    db.all('SELECT * FROM properties', callback);
  },

  getPropertyById: (id, callback) => {
    db.get('SELECT * FROM properties WHERE id = ?', [id], callback);
  },

  // Favourite operations
  getUserFavourites: (userId, callback) => {
    db.all(`
      SELECT p.*, f.created_at as favourited_at
      FROM favourites f
      JOIN properties p ON f.property_id = p.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [userId], callback);
  },

  addFavourite: (userId, propertyId, callback) => {
    db.run('INSERT INTO favourites (user_id, property_id) VALUES (?, ?)', 
      [userId, propertyId], 
      callback
    );
  },

  removeFavourite: (userId, propertyId, callback) => {
    db.run('DELETE FROM favourites WHERE user_id = ? AND property_id = ?', 
      [userId, propertyId], 
      callback
    );
  },

  isFavourite: (userId, propertyId, callback) => {
    db.get('SELECT 1 FROM favourites WHERE user_id = ? AND property_id = ?', 
      [userId, propertyId], 
      (err, row) => {
        callback(err, !!row);
      }
    );
  }
};
