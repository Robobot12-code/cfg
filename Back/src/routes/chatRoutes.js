const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/', chatController.chat);
router.post('/recruitment/analyze', chatController.analyzeRecruitment);

module.exports = router;
