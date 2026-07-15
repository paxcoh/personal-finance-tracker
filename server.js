const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

app.use(express.json());

// Session Middleware Configuration
app.use(session({
    secret: 'finance-flow-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false // Set to true if running on HTTPS
    }
}));

// Route guard middleware for standard users
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    next();
}

// Route guard middleware for administrators
function requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.userRole === 'admin') {
        return next();
    }
    return res.status(403).json({ error: "Access denied. Administrators only." });
}

let db;

// Initialize SQLite DB, Auto-build Tables, Seed Default Admin, and Start Server
async function initializeDatabaseAndServer() {
    try {
        db = await open({
            filename: './database.db',
            driver: sqlite3.Database
        });

        // Create Users Table (Includes Role definition)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user'
            )
        `);

        // Create Transactions Table with foreign key linking
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

        // SEED AN INITIAL ADMIN ACCOUNT (If not already created)
        // Credentials: admin@flow.com / admin123
        const adminExists = await db.get("SELECT * FROM users WHERE email = 'admin@flow.com'");
        if (!adminExists) {
            const defaultHashedPassword = await bcrypt.hash('admin123', 12);
            await db.run(
                "INSERT INTO users (name, email, password, role) VALUES ('System Admin', 'admin@flow.com', ?, 'admin')",
                [defaultHashedPassword]
            );
            console.log("🔒 Seeded default Admin account: admin@flow.com / admin123");
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Database initialization failed:", err.message);
        process.exit(1);
    }
}

initializeDatabaseAndServer();

// --- AUTHENTICATION API ENDPOINTS ---

app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await db.run(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
            [name, email.toLowerCase().trim(), hashedPassword]
        );
        
        req.session.userId = result.lastID;
        req.session.userName = name;
        req.session.userRole = 'user';
        
        res.status(201).json({ success: true, user: { id: result.lastID, name, email, role: 'user' } });
    } catch (err) {
        if (err.message.includes("UNIQUE constraint failed: users.email")) {
            return res.status(400).json({ error: "An account with this email already exists." });
        }
        res.status(500).json({ error: err.message });
    }
});

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
        req.session.userRole = user.role;

        res.json({ success: true, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Failed to log out" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
    });
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, user: { name: req.session.userName, role: req.session.userRole } });
    } else {
        res.json({ authenticated: false });
    }
});

// --- TRANSACTIONS CRUD (USER PROTECTED) ---

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

app.put('/api/transactions/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { type, category, amount, date } = req.body;

    try {
        const result = await db.run(
            'UPDATE transactions SET type = ?, category = ?, amount = ?, date = ? WHERE id = ? AND user_id = ?',
            [type, category, parseFloat(amount), date, parseInt(id, 10), req.session.userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// --- EXCLUSIVE ADMIN CONTROL ENDPOINTS ---

app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await db.all("SELECT id, name, email, role FROM users");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const userExists = await db.get("SELECT id FROM users WHERE email = ?", [email]);
        if (userExists) {
            return res.status(400).json({ error: "Email address already registered" });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        await db.run(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email.toLowerCase().trim(), hashedPassword, role || 'user']
        );
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    try {
        await db.run("DELETE FROM transactions WHERE user_id = ?", [userId]);
        await db.run("DELETE FROM users WHERE id = ?", [userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/users/:id/transactions', requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    try {
        const transactions = await db.all(
            "SELECT id, type, category, amount, date FROM transactions WHERE user_id = ? ORDER BY date DESC",
            [userId]
        );
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    try {
        const stats = await db.get(`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
            FROM transactions
        `);
        res.json({
            totalIncome: stats.totalIncome || 0,
            totalExpense: stats.totalExpense || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROUTE DELEGATOR / VIEW MIDDLEWARE ---

app.get('*', (req, res, next) => {
    const publicFiles = ['/', '/login.html', '/style.css', '/auth.js', '/app.js', '/admin.js', '/admin.html'];
    if (publicFiles.includes(req.path)) {
        return next();
    }
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));