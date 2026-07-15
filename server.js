const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

app.use(express.json());

// Session Middleware
app.use(session({
    secret: 'finance-flow-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false // Set to true if deploying over HTTPS
    }
}));

// Route guard middleware to protect pages and API routes
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    next();
}

let db;

// Connect to SQLite Database and Start Server
async function initializeDatabaseAndServer() {
    try {
        db = await open({
            filename: './database.db',
            driver: sqlite3.Database
        });

        // 1. Create Users Table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `);

        // 2. Create Transactions Table (with foreign key linking to users)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                type TEXT CHECK(type IN ('income', 'expense')),
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to initialize database and server:", err.message);
        process.exit(1);
    }
}

initializeDatabaseAndServer();

// --- AUTHENTICATION ENDPOINTS ---

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email.toLowerCase().trim(), hashedPassword]
        );
        
        // Log user in automatically on signup
        req.session.userId = result.lastID;
        req.session.userName = name;
        res.status(201).json({ success: true, user: { id: result.lastID, name, email } });
    } catch (err) {
        if (err.message.includes("UNIQUE constraint failed: users.email")) {
            return res.status(400).json({ error: "An account with this email already exists." });
        }
        res.status(500).json({ error: err.message });
    }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        req.session.userId = user.id;
        req.session.userName = user.name;
        res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout Route
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Failed to log out" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
    });
});

// Check Session Status
app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, user: { name: req.session.userName } });
    } else {
        res.json({ authenticated: false });
    }
});


// --- PROTECTED API ENDPOINTS (requireAuth applied) ---

// Get all transactions for the LOGGED IN user
app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
        const transactions = await db.all(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', 
            [req.session.userId]
        );
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new transaction for the LOGGED IN user
app.post('/api/transactions', requireAuth, async (req, res) => {
    const { type, category, amount, date } = req.body;

    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const result = await db.run(
            'INSERT INTO transactions (user_id, type, category, amount, date) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, type, category, parseFloat(amount), date]
        );
        res.status(201).json({ id: result.lastID, type, category, amount: parseFloat(amount), date });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update transaction
app.put('/api/transactions/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { type, category, amount, date } = req.body;

    try {
        const result = await db.run(
            'UPDATE transactions SET type = ?, category = ?, amount = ? WHERE id = ? AND user_id = ?',
            [type, category, parseFloat(amount), parseInt(id, 10), req.session.userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a transaction
app.delete('/api/transactions/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.run(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?', 
            [parseInt(id, 10), req.session.userId]
        );
        if (result.changes === 0) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend assets smoothly (Wildcard router handles route-auth fallback)
app.get('*', (req, res, next) => {
    const publicPages = ['/', '/login.html', '/style.css', '/auth.js', '/app.js'];
    if (publicPages.includes(req.path)) {
        return next();
    }
    // Redirect unauthenticated clients loading dashboard directly to login
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));