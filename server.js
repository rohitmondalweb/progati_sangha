const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
  })
);

// Database setup
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) console.error(err);
  else console.log('SQLite DB connected');
});

db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`
);

// ---------- Registration ----------
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, password],
    function (err) {
      if (err) {
        return res.send('User already exists or error occurred.');
      }
      res.send(`
        Registration successful! Redirecting to login page...
        <script>
          setTimeout(() => { window.location.href = '/login.html'; }, 3000);
        </script>
      `);
    }
  );
});

// ---------- Login ----------
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
    if (!row) return res.send('User not found');
    if (password === row.password) {
      req.session.user = { username: row.username };
      return res.redirect('/dashboard');
    } else {
      return res.send('Incorrect password');
    }
  });
});

// ---------- Dashboard ----------
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }

  const username = req.session.user.username;
  const filePath = path.join(__dirname, 'public', 'dashboard.html');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.send('Error loading dashboard');

    // Inject username into placeholder
    const page = data.replace('<%= username %>', username);
    res.send(page);
  });
});

// ---------- Logout ----------
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
  