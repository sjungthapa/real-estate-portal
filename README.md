# Buyer Portal - Real Estate Application

A simple real estate buyer portal with authentication and property favourites functionality.

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt (no plain text passwords)
- Session management with HTTP-only cookies
- User dashboard showing name and role
- Property favourites management (add/remove)
- User-specific favourites (users can only see/modify their own)
- Basic validation and error handling
- SQLite database with proper schema

## Tech Stack

- Backend: Node.js + Express
- Database: SQLite (sqlite3)
- Auth: JWT + bcryptjs
- Frontend: React + React Router

## Installation

1. Install backend dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

## Running the Application

You need to run backend and frontend in separate terminals:

**Terminal 1 - Backend:**
```bash
npm start
# or
npm run server
```
Backend will run on `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
npm run client
```
Frontend will run on `http://localhost:3000`

The React app uses a proxy to connect to the backend API, so all `/api/*` requests from the frontend automatically go to `http://localhost:4000`.

### Production Build

```bash
npm run build
NODE_ENV=production npm start
```

## Example Flows

### 1. Sign Up Flow
1. Open `http://localhost:3000` in your browser
2. Click "Register" link
3. Fill in:
   - Full Name: John Doe
   - Email: john@example.com
   - Password: password123 (min 6 characters)
4. Click "Register"
5. You'll be automatically logged in and redirected to the dashboard

### 2. Login Flow
1. Open `http://localhost:3000`
2. Enter your email and password
3. Click "Login"
4. Redirected to dashboard

### 3. Add Favourite Flow
1. After logging in, scroll to "All Properties" section
2. Click "🤍 Add to Favourites" on any property
3. Property appears in "My Favourites" section at the top
4. Button changes to "❤️ Remove from Favourites"

### 4. Remove Favourite Flow
1. In "My Favourites" section, click "❤️ Remove from Favourites"
2. Property is removed from favourites
3. Still visible in "All Properties" with "🤍 Add to Favourites" button

## Database Schema

### users
- id (PRIMARY KEY)
- email (UNIQUE)
- password_hash (bcrypt hashed)
- name
- role (default: 'buyer')
- created_at

### properties
- id (PRIMARY KEY)
- title
- address
- price
- description

### favourites
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- property_id (FOREIGN KEY)
- created_at
- UNIQUE constraint on (user_id, property_id)

## API Endpoints

### Public
- POST `/api/register` - Register new user
- POST `/api/login` - Login user
- POST `/api/logout` - Logout user

### Protected (requires authentication)
- GET `/api/me` - Get current user info
- GET `/api/properties` - Get all properties with favourite status
- GET `/api/favourites` - Get user's favourites
- POST `/api/favourites/:propertyId` - Add property to favourites
- DELETE `/api/favourites/:propertyId` - Remove property from favourites

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens stored in HTTP-only cookies
- Auth middleware protects sensitive endpoints
- Users can only access their own favourites
- Input validation on all endpoints
- SQL injection protection via prepared statements

## Sample Data

The application seeds 6 sample properties on first run:
1. Modern Apartment in Thamel - NPR 15,000,000
2. Spacious House in Lalitpur - NPR 35,000,000
3. Penthouse in Durbar Marg - NPR 75,000,000
4. Cozy Flat in Bhaktapur - NPR 8,500,000
5. Villa in Budhanilkantha - NPR 55,000,000
6. Commercial Space in New Road - NPR 45,000,000

## Project Structure

```
buyer-portal/
├── backend/
│   ├── server.js      # Express server and routes
│   ├── db.js          # Database operations
│   └── auth.js        # JWT auth logic
├── client/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js      # Login/Register page
│   │   │   └── Dashboard.js  # User dashboard
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```
