const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');
const relationsRoutes = require('./routes/relationsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const configRoutes = require('./routes/configRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/relations', relationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/config', configRoutes);

module.exports = app;
