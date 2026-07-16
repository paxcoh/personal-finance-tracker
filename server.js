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
        maxAge: 24 * 60 * 60 * 1000,
        secure: false
    }
}));

// Route guard middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.userRole === 'admin') {
        return next();
    }
    return res.status(403).json({ error: "Access denied. Administrators only." });
}

let db;

// Initialize Database
async function initializeDatabaseAndServer() {
    try {
        db = await open({
            filename: './database.db',
            driver: sqlite3.Database
        });

        // ===== USERS TABLE =====
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                avatar TEXT DEFAULT '👤',
                currency TEXT DEFAULT 'USD',
                theme TEXT DEFAULT 'dark',
                language TEXT DEFAULT 'en',
                notifications INTEGER DEFAULT 1,
                budget_limit REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ===== TRANSACTIONS TABLE =====
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                type TEXT CHECK(type IN ('income', 'expense')),
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                description TEXT,
                is_recurring INTEGER DEFAULT 0,
                recurring_frequency TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // ===== CATEGORIES TABLE =====
        await db.exec(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                type TEXT CHECK(type IN ('income', 'expense')),
                color TEXT DEFAULT '#10b981',
                icon TEXT DEFAULT '📊',
                is_default INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // ===== BUDGETS TABLE =====
        await db.exec(`
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // ===== SAVINGS GOALS TABLE =====
        await db.exec(`
            CREATE TABLE IF NOT EXISTS savings_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                target_amount REAL NOT NULL,
                current_amount REAL DEFAULT 0,
                deadline DATE,
                status TEXT DEFAULT 'active',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // ===== AUDIT LOGS TABLE =====
        await db.exec(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // ===== INSERT DEFAULT CATEGORIES =====
        await seedDefaultCategories();

        // ===== SEED ADMIN ACCOUNT =====
        const adminExists = await db.get("SELECT * FROM users WHERE email = 'admin@flow.com'");
        if (!adminExists) {
            const defaultHashedPassword = await bcrypt.hash('admin123', 12);
            await db.run(
                "INSERT INTO users (name, email, password, role, avatar) VALUES ('System Admin', 'admin@flow.com', ?, 'admin', '👤')",
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

// ===== SEED DEFAULT CATEGORIES =====
async function seedDefaultCategories() {
    const defaultCategories = [
        // Income categories
        { name: 'Salary', type: 'income', color: '#10b981', icon: '💰' },
        { name: 'Freelance', type: 'income', color: '#06b6d4', icon: '💼' },
        { name: 'Investment', type: 'income', color: '#8b5cf6', icon: '📈' },
        { name: 'Gifts', type: 'income', color: '#ec4899', icon: '🎁' },
        // Expense categories
        { name: 'Housing', type: 'expense', color: '#ef4444', icon: '🏠' },
        { name: 'Transportation', type: 'expense', color: '#f59e0b', icon: '🚗' },
        { name: 'Food', type: 'expense', color: '#f97316', icon: '🍕' },
        { name: 'Utilities', type: 'expense', color: '#6366f1', icon: '💡' },
        { name: 'Entertainment', type: 'expense', color: '#ec4899', icon: '🎮' },
        { name: 'Healthcare', type: 'expense', color: '#14b8a6', icon: '🏥' },
        { name: 'Education', type: 'expense', color: '#8b5cf6', icon: '📚' },
        { name: 'Shopping', type: 'expense', color: '#f472b6', icon: '🛍️' }
    ];

    for (const cat of defaultCategories) {
        const exists = await db.get(
            "SELECT id FROM categories WHERE name = ? AND type = ? AND is_default = 1",
            [cat.name, cat.type]
        );
        if (!exists) {
            await db.run(
                "INSERT INTO categories (name, type, color, icon, is_default) VALUES (?, ?, ?, ?, 1)",
                [cat.name, cat.type, cat.color, cat.icon]
            );
        }
    }
}

// ===== AUDIT LOGGING FUNCTION =====
async function logAudit(userId, action, details) {
    try {
        await db.run(
            'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
            [userId, action, details]
        );
    } catch (err) {
        console.error('Failed to log audit:', err);
    }
}

initializeDatabaseAndServer();

// ========== AUTHENTICATION ENDPOINTS ==========

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
        
        await logAudit(result.lastID, 'signup', 'User registered successfully');
        
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

        await logAudit(user.id, 'login', 'User logged in');

        res.json({ success: true, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    if (req.session.userId) {
        logAudit(req.session.userId, 'logout', 'User logged out');
    }
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

// ========== USER PROFILE & SETTINGS ENDPOINTS ==========

app.get('/api/user/profile', requireAuth, async (req, res) => {
    try {
        const user = await db.get(
            'SELECT id, name, email, role, avatar, currency, theme, language, notifications, budget_limit, created_at FROM users WHERE id = ?',
            [req.session.userId]
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user/profile', requireAuth, async (req, res) => {
    const { name, email, avatar, currency, theme, language, notifications, budget_limit } = req.body;
    try {
        await db.run(
            `UPDATE users SET 
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                avatar = COALESCE(?, avatar),
                currency = COALESCE(?, currency),
                theme = COALESCE(?, theme),
                language = COALESCE(?, language),
                notifications = COALESCE(?, notifications),
                budget_limit = COALESCE(?, budget_limit),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [name, email, avatar, currency, theme, language, notifications, budget_limit, req.session.userId]
        );
        await logAudit(req.session.userId, 'profile_update', 'Updated profile settings');
        res.json({ success: true });
    } catch (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(400).json({ error: "Email already in use" });
        }
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Both passwords are required" });
    }

    try {
        const user = await db.get('SELECT password FROM users WHERE id = ?', [req.session.userId]);
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.session.userId]);
        await logAudit(req.session.userId, 'password_change', 'Changed password');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/user/delete-account', requireAuth, async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: "Password is required to delete account" });
    }

    try {
        const user = await db.get('SELECT password FROM users WHERE id = ?', [req.session.userId]);
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        await db.run('DELETE FROM users WHERE id = ?', [req.session.userId]);
        req.session.destroy();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== TRANSACTIONS ENDPOINTS ==========

app.get('/api/transactions', requireAuth, async (req, res) => {
    const { startDate, endDate, category, type, search } = req.query;
    try {
        let query = 'SELECT * FROM transactions WHERE user_id = ?';
        const params = [req.session.userId];

        if (startDate) {
            query += ' AND date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND date <= ?';
            params.push(endDate);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        if (search) {
            query += ' AND (category LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY date DESC';
        const transactions = await db.all(query, params);
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
    const { type, category, amount, date, description, is_recurring, recurring_frequency } = req.body;
    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const result = await db.run(
            `INSERT INTO transactions 
                (user_id, type, category, amount, date, description, is_recurring, recurring_frequency) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.session.userId, type, category, parseFloat(amount), date, description, is_recurring || 0, recurring_frequency]
        );
        await logAudit(req.session.userId, 'transaction_create', `Created ${type}: ${category} - $${amount}`);
        res.status(201).json({ id: result.lastID, type, category, amount: parseFloat(amount), date });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/transactions/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { type, category, amount, date, description } = req.body;

    try {
        const result = await db.run(
            `UPDATE transactions SET 
                type = ?, category = ?, amount = ?, date = ?, description = ? 
             WHERE id = ? AND user_id = ?`,
            [type, category, parseFloat(amount), date, description, parseInt(id, 10), req.session.userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }
        await logAudit(req.session.userId, 'transaction_update', `Updated transaction ${id}`);
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
        await logAudit(req.session.userId, 'transaction_delete', `Deleted transaction ${id}`);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== ANALYTICS ENDPOINTS ==========

app.get('/api/analytics/overview', requireAuth, async (req, res) => {
    const { period } = req.query;
    const userId = req.session.userId;

    try {
        let dateFilter = '';
        if (period === 'month') {
            dateFilter = "AND date >= date('now', '-30 days')";
        } else if (period === 'quarter') {
            dateFilter = "AND date >= date('now', '-90 days')";
        } else if (period === 'year') {
            dateFilter = "AND date >= date('now', '-365 days')";
        }

        const overview = await db.get(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
                COUNT(*) as totalTransactions,
                COALESCE(SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END), 0) as incomeCount,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END), 0) as expenseCount
            FROM transactions 
            WHERE user_id = ? ${dateFilter}
        `, [userId]);

        const monthlyData = await db.all(`
            SELECT 
                strftime('%Y-%m', date) as month,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions 
            WHERE user_id = ? ${dateFilter}
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month DESC
            LIMIT 12
        `, [userId]);

        const categoryData = await db.all(`
            SELECT 
                category,
                type,
                COALESCE(SUM(amount), 0) as total
            FROM transactions 
            WHERE user_id = ? ${dateFilter}
            GROUP BY category, type
            ORDER BY total DESC
        `, [userId]);

        res.json({
            overview,
            monthlyData: monthlyData.reverse(),
            categoryData
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== BUDGET ENDPOINTS ==========

app.get('/api/budgets', requireAuth, async (req, res) => {
    try {
        const budgets = await db.all(
            'SELECT * FROM budgets WHERE user_id = ? AND month = strftime("%m", "now") AND year = strftime("%Y", "now")',
            [req.session.userId]
        );
        res.json(budgets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/budgets', requireAuth, async (req, res) => {
    const { category, amount } = req.body;
    if (!category || !amount) {
        return res.status(400).json({ error: "Category and amount are required" });
    }

    try {
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        
        await db.run(
            `INSERT OR REPLACE INTO budgets (user_id, category, amount, month, year) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.session.userId, category, parseFloat(amount), month, year]
        );
        await logAudit(req.session.userId, 'budget_update', `Updated budget for ${category}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== CATEGORIES ENDPOINTS ==========

app.get('/api/categories', requireAuth, async (req, res) => {
    try {
        const categories = await db.all(
            'SELECT * FROM categories WHERE user_id = ? OR is_default = 1 ORDER BY type, name',
            [req.session.userId]
        );
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', requireAuth, async (req, res) => {
    const { name, type, color, icon } = req.body;
    if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
    }

    try {
        const result = await db.run(
            'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, name, type, color || '#10b981', icon || '📊']
        );
        res.status(201).json({ id: result.lastID, name, type });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== SAVINGS GOALS ENDPOINTS ==========

app.get('/api/savings-goals', requireAuth, async (req, res) => {
    try {
        const goals = await db.all(
            'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY deadline ASC',
            [req.session.userId]
        );
        res.json(goals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/savings-goals', requireAuth, async (req, res) => {
    const { name, target_amount, deadline } = req.body;
    if (!name || !target_amount) {
        return res.status(400).json({ error: "Name and target amount are required" });
    }

    try {
        const result = await db.run(
            'INSERT INTO savings_goals (user_id, name, target_amount, deadline) VALUES (?, ?, ?, ?)',
            [req.session.userId, name, parseFloat(target_amount), deadline]
        );
        await logAudit(req.session.userId, 'goal_create', `Created savings goal: ${name}`);
        res.status(201).json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/savings-goals/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [id, req.session.userId]);
        await logAudit(req.session.userId, 'goal_delete', `Deleted savings goal ${id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== ADMIN ENDPOINTS ==========

app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await db.all(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.avatar, 
                u.currency, 
                u.created_at, 
                u.updated_at,
                COALESCE(COUNT(t.id), 0) as transaction_count,
                COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const stats = await db.get(`
            SELECT 
                (SELECT COUNT(*) FROM users) as totalUsers,
                (SELECT COUNT(*) FROM transactions) as totalTransactions,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as adminCount,
                (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-7 days')) as newUsersThisWeek,
                (SELECT COUNT(*) FROM transactions WHERE created_at >= datetime('now', '-7 days')) as transactionsThisWeek
            FROM transactions
        `);
        res.json(stats);
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    try {
        const monthlyData = await db.all(`
            SELECT 
                strftime('%Y-%m', date) as month,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
                COUNT(*) as transactions
            FROM transactions 
            WHERE date >= date('now', '-365 days')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month DESC
            LIMIT 12
        `);

        const topCategories = await db.all(`
            SELECT 
                category,
                type,
                COALESCE(SUM(amount), 0) as total
            FROM transactions 
            WHERE date >= date('now', '-90 days')
            GROUP BY category, type
            ORDER BY total DESC
            LIMIT 10
        `);

        const userActivity = await db.all(`
            SELECT 
                strftime('%Y-%m-%d', created_at) as date,
                COUNT(*) as registrations
            FROM users
            WHERE created_at >= date('now', '-30 days')
            GROUP BY strftime('%Y-%m-%d', created_at)
            ORDER BY date DESC
        `);

        res.json({
            monthlyData: monthlyData.reverse(),
            topCategories,
            userActivity: userActivity.reverse()
        });
    } catch (err) {
        console.error('Error fetching admin analytics:', err);
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
        console.error('Error fetching user transactions:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const userExists = await db.get("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (userExists) {
            return res.status(400).json({ error: "Email address already registered" });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await db.run(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email.toLowerCase().trim(), hashedPassword, role || 'user']
        );
        await logAudit(req.session.userId, 'admin_create_user', `Created user: ${email} with role: ${role}`);
        res.status(201).json({ success: true, id: result.lastID });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    try {
        // Check if user exists
        const user = await db.get("SELECT id, email FROM users WHERE id = ?", [userId]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Delete user (cascade will handle transactions)
        await db.run("DELETE FROM users WHERE id = ?", [userId]);
        await logAudit(req.session.userId, 'admin_delete_user', `Deleted user: ${user.email}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
    try {
        const logs = await db.all(`
            SELECT al.*, u.name as user_name, u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT 100
        `);
        res.json(logs);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== DATA EXPORT ==========

app.get('/api/export/transactions', requireAuth, async (req, res) => {
    try {
        const transactions = await db.all(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
            [req.session.userId]
        );
        
        // Create CSV
        let csv = 'Date,Type,Category,Amount,Description\n';
        transactions.forEach(t => {
            csv += `${t.date},${t.type},${t.category},${t.amount},${t.description || ''}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== SERVE STATIC FILES ==========

app.get('*', (req, res, next) => {
    const publicFiles = ['/', '/login.html', '/auth.js', '/app.js', '/admin.js', '/admin.html', '/settings.html', '/analytics.html', '/settings.js', '/analytics.js'];
    if (publicFiles.includes(req.path)) {
        return next();
    }
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));