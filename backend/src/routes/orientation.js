const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateOrientation, getHistory } = require('../controllers/orientationController');

router.post('/generate', auth, generateOrientation);
router.get('/history', auth, getHistory);

module.exports = router;