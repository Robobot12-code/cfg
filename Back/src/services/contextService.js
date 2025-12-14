const db = require('../config/db');

exports.getSystemContext = () => {
    return new Promise((resolve, reject) => {
        const context = {};

        // Parallel fetching
        db.serialize(() => {
            db.all("SELECT name, role, status FROM employees", [], (err, rows) => {
                if (err) return reject(err);
                context.employees = rows;

                db.all("SELECT name, type, details, priority FROM relations", [], (err, rows) => {
                    if (err) return reject(err);
                    context.relations = rows;
                    resolve(context);
                });
            });
        });
    });
};
