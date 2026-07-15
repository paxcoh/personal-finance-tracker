const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
// Serves your HTML, CSS, and JS files from the public folder automatically
app.use(express.static(path.join(__dirname, 'public')));

let db;

// Connect to SQLite Database and Start Server
async function initializeDatabaseAndServer() {
    try {
        db = await open({
            filename: './database.db',
            driver: sqlite3.Database
        });

        // Create table for our finances if it doesn't exist yet
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT CHECK(type IN ('income', 'expense')),
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL
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

// --- API ENDPOINTS (ROUTES) ---

// Get all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await db.all('SELECT * FROM transactions ORDER BY date DESC');
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new transaction
app.post('/api/transactions', async (req, res) => {
    const { type, category, amount, date } = req.body;

    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const result = await db.run(
            'INSERT INTO transactions (type, category, amount, date) VALUES (?, ?, ?, ?)',
            [type, category, parseFloat(amount), date]
        );
        res.status(201).json({ id: result.lastID, type, category, amount: parseFloat(amount), date });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a transaction
app.delete('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Convert route param to integer to align with SQLite row ID type
        const transactionId = parseInt(id, 10);
        
        const result = await db.run('DELETE FROM transactions WHERE id = ?', transactionId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an existing transaction
app.put('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    const { type, category, amount, date } = req.body;

    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const transactionId = parseInt(id, 10);
        
        const result = await db.run(
            'UPDATE transactions SET type = ?, category = ?, amount = ?, date = ? WHERE id = ?',
            [type, category, parseFloat(amount), date, transactionId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        res.json({ id: transactionId, type, category, amount: parseFloat(amount), date });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});