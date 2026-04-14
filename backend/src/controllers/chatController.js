const { PrismaClient } = require('@prisma/client');
const geminiService = require('../services/geminiService');

const prisma = new PrismaClient();

exports.startSession = async (req, res) => {
  try {
    // Fermer les sessions actives précédentes
    await prisma.chatSession.updateMany({
      where: { userId: req.userId, status: 'active' },
      data: { status: 'completed' }
    });

    const session = await prisma.chatSession.create({
      data: { userId: req.userId }
    });

    // Message d'introduction de l'assistant
    const intro = await geminiService.chatIntro();

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: intro.message,
        choices: intro.choices ? JSON.stringify(intro.choices) : null
      }
    });

    res.json({
      sessionId: session.id,
      message: { role: 'assistant', content: intro.message, choices: intro.choices || [] }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du démarrage de la session', details: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, content } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({ error: 'sessionId et content requis' });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!session || session.userId !== req.userId) {
      return res.status(404).json({ error: 'Session introuvable' });
    }

    // Sauvegarder le message utilisateur
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content }
    });

    // Construire l'historique pour Gemini
    const history = session.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    history.push({ role: 'user', content });

    // Appeler Gemini avec l'historique complet
    const response = await geminiService.chat(history);

    // Sauvegarder la réponse
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: response.message,
        choices: response.choices ? JSON.stringify(response.choices) : null
      }
    });

    // Si le chatbot a terminé son analyse, extraire le profil et générer le prompt
    let orientationPrompt = null;
    if (response.isCompleted && response.extractedProfile) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          extractedProfile: JSON.stringify(response.extractedProfile)
        }
      });
      orientationPrompt = response.extractedProfile.orientationPrompt;
    }

    res.json({
      message: { role: 'assistant', content: response.message, choices: response.choices || [] },
      isCompleted: response.isCompleted || false,
      orientationPrompt
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message', details: err.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!session || session.userId !== req.userId) {
      return res.status(404).json({ error: 'Session introuvable' });
    }

    res.json({
      ...session,
      extractedProfile: session.extractedProfile ? JSON.parse(session.extractedProfile) : null,
      messages: session.messages.map(m => ({
        ...m,
        choices: m.choices ? JSON.parse(m.choices) : []
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};