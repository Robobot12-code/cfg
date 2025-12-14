const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/status', configController.getStatus);
router.post('/status', configController.updateStatus);

module.exports = router;
