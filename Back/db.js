const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite DB
const dbPath = path.resolve(__dirname, 'ceo_assistant.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Employees Table
        db.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            status TEXT DEFAULT 'Offline',
            department TEXT
        )`);

        // Relations Table
        db.run(`CREATE TABLE IF NOT EXISTS relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('prospect','partner','client')) NOT NULL,
            email TEXT,
            details TEXT,
            priority TEXT
        )`);

        // Events Table (for Calendar caching or manual events)
        db.run(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_iCalUID TEXT UNIQUE, 
            summary TEXT,
            start_date TEXT,
            end_date TEXT,
            description TEXT
        )`);

        // Seed Initial Data if Empty
        checkAndSeed();
    });
}

function checkAndSeed() {
    db.get("SELECT count(*) as count FROM employees", (err, row) => {
        if (row.count === 0) {
            console.log("Seeding Initial Employees...");
            const stmt = db.prepare("INSERT INTO employees (name, role, status) VALUES (?, ?, ?)");
            stmt.run("Alice Dubois", "CTO", "En ligne");
            stmt.run("Marc Dupont", "Head of Sales", "En réunion");
            stmt.run("Sophie Martin", "Lead Designer", "Absente");
            stmt.finalize();
        }
    });

    db.get("SELECT count(*) as count FROM relations", (err, row) => {
        if (row.count === 0) {
            console.log("Seeding Initial Relations...");
            const stmt = db.prepare("INSERT INTO relations (name, type, email, details, priority) VALUES (?, ?, ?, ?, ?)");
            stmt.run("Sarah Connor", "prospect", "sarah@cyberdyne.com", "Proposition Partenariat IA", "urgent");
            stmt.run("Sequoia Capital", "partner", "partners@sequoia.com", "Round B Update", "high");
            stmt.run("Coca-Cola", "client", "contact@coca-cola.com", "Renouvellement Contrat Enterprise", "normal");
            stmt.finalize();
        }
    });
}

module.exports = db;
