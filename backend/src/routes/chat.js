const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { startSession, sendMessage, getSession } = require('../controllers/chatController');

router.post('/session', auth, startSession);
router.post('/message', auth, sendMessage);
router.get('/session/:sessionId', auth, getSession);

module.exports = router;