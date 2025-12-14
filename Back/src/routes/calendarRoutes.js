const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

router.get('/auth', calendarController.auth);
router.get('/callback', calendarController.callback);
router.get('/events', calendarController.getEvents);

module.exports = router;
