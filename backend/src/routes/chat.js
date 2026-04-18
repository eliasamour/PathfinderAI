const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { startSession, sendMessage, getSession } = require('../controllers/chatController');

const prisma = new PrismaClient();

router.post('/session', auth, startSession);
router.post('/message', auth, sendMessage);
router.get('/session/:sessionId', auth, getSession);

router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.userId, status: 'completed' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json(sessions.map(s => ({
      ...s,
      messages: s.messages.map(m => ({
        ...m,
        choices: m.choices ? JSON.parse(m.choices) : []
      }))
    })));
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions', details: err.message });
  }
});

module.exports = router;