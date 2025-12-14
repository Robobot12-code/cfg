const db = require('../config/db');

exports.getAllEmployees = (req, res) => {
    db.all("SELECT * FROM employees", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.createEmployee = (req, res) => {
    const { name, role, status } = req.body;
    db.run("INSERT INTO employees (name, role, status) VALUES (?, ?, ?)", [name, role, status], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, role, status });
    });
};

exports.deleteEmployee = (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM employees WHERE id = ?", id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted", changes: this.changes });
    });
};
