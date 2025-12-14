require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db'); // Initialize DB connection

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Trigger restart

// Trigger restart
