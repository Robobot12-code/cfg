const db = require('../config/db');

// Simple key-value store in a new table or just a file. 
// For robustness, let's use the DB. We'll add a 'settings' table if not exists, 
// but for MVP, let's just use a dedicated single-row table or in-memory if speed is key.
// Let's use DB to persist across restarts.

exports.getStatus = (req, res) => {
    db.get("SELECT value FROM settings WHERE key = 'user_status'", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: row ? row.value : 'Focus' }); // Default to Focus
    });
};

exports.updateStatus = (req, res) => {
    const { status } = req.body;
    db.run("INSERT INTO settings (key, value) VALUES ('user_status', ?) ON CONFLICT(key) DO UPDATE SET value = ?", [status, status], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status });
    });
};
