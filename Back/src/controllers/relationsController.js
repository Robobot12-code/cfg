const db = require('../config/db');

exports.getAllRelations = (req, res) => {
    const type = req.query.type;
    let sql = "SELECT * FROM relations";
    let params = [];
    if (type) {
        sql += " WHERE type = ?";
        params.push(type);
    }
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
