const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Simple starting route
app.get('/', (req, res) => {
    res.json({ message: "Welcome to your Personal Finance Tracker API!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});