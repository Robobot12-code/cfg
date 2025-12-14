const express = require('express');
const router = express.Router();
const relationsController = require('../controllers/relationsController');

router.get('/', relationsController.getAllRelations);

module.exports = router;
