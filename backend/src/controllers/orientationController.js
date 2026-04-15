const { PrismaClient } = require('@prisma/client');
const orientationService = require('../services/orientationService');

const prisma = new PrismaClient();

exports.generateOrientation = async (req, res) => {
  try {
    const { userInput, sourceType = 'direct', chatSessionId } = req.body;

    if (!userInput || userInput.trim().length < 3) {
      return res.status(400).json({ error: 'Veuillez décrire votre objectif' });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: { grades: true, mobilityZones: true }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profil introuvable. Complétez d\'abord votre profil.' });
    }

    const request = await prisma.orientationRequest.create({
      data: {
        userId: req.userId,
        userInput: userInput.trim(),
        sourceType,
        chatSessionId: chatSessionId || null
      }
    });

    const result = await orientationService.generateRecommendations(userInput, profile);

    const saved = await prisma.orientationResult.create({
      data: {
        requestId: request.id,
        idealPath: JSON.stringify(result.idealPath),
        altPaths: JSON.stringify(result.alternativePaths),
        aiComment: result.aiComment
      }
    });

    res.json({
      requestId: request.id,
      resultId: saved.id,
      idealPath: result.idealPath,
      alternativePaths: result.alternativePaths,
      aiComment: result.aiComment,
      domainSuggestions: result.domainSuggestions || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la génération des recommandations', details: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const requests = await prisma.orientationRequest.findMany({
      where: { userId: req.userId },
      include: { results: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const formatted = requests.map(r => ({
      id: r.id,
      userInput: r.userInput,
      sourceType: r.sourceType,
      chatSessionId: r.chatSessionId || null,
      createdAt: r.createdAt,
      result: r.results[0] ? {
        idealPath: JSON.parse(r.results[0].idealPath),
        alternativePaths: JSON.parse(r.results[0].altPaths),
        aiComment: r.results[0].aiComment
      } : null
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};