const { PrismaClient } = require('@prisma/client');
const geminiService = require('../services/geminiService');
const fs = require('fs');

const prisma = new PrismaClient();

exports.getProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: { grades: true, mobilityZones: true }
    });
    if (!profile) return res.status(404).json({ error: 'Profil introuvable' });

    // Désérialiser les JSON stockés en string
    const parsed = {
      ...profile,
      specialites: profile.specialites ? JSON.parse(profile.specialites) : [],
      previousSpecialites: profile.previousSpecialites ? JSON.parse(profile.previousSpecialites) : [],
    };

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil', details: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      profileType,
      currentSchool,
      formation,
      level,
      filiere,
      specialites,
      previousSchool,
      previousFiliere,
      previousSpecialites,
      currentPath,
      previousPath,
      budgetMax,
      address,
      mobilityType,
      mobilityZones,
      grades
    } = req.body;

    const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
    if (!profile) return res.status(404).json({ error: 'Profil introuvable' });

    // Mise à jour du profil principal
    const updated = await prisma.profile.update({
      where: { userId: req.userId },
      data: {
        profileType: profileType ?? profile.profileType,
        currentSchool: currentSchool ?? profile.currentSchool,
        formation: formation ?? profile.formation,
        level: level ?? profile.level,
        filiere: filiere ?? profile.filiere,
        specialites: specialites !== undefined ? JSON.stringify(specialites) : profile.specialites,
        previousSchool: previousSchool ?? profile.previousSchool,
        previousFiliere: previousFiliere ?? profile.previousFiliere,
        previousSpecialites: previousSpecialites !== undefined ? JSON.stringify(previousSpecialites) : profile.previousSpecialites,
        currentPath: currentPath ?? profile.currentPath,
        previousPath: previousPath ?? profile.previousPath,
        budgetMax: budgetMax !== undefined ? parseFloat(budgetMax) : profile.budgetMax,
        address: address ?? profile.address,
        mobilityType: mobilityType ?? profile.mobilityType,
      }
    });

    // Mise à jour des notes si fournies
    if (grades && Array.isArray(grades)) {
      await prisma.academicGrade.deleteMany({ where: { profileId: profile.id } });
      if (grades.length > 0) {
        await prisma.academicGrade.createMany({
          data: grades.map(g => ({
            profileId: profile.id,
            subject: g.subject,
            grade: parseFloat(g.grade),
            subjectType: g.subjectType || 'tronc_commun',
            source: 'manual'
          }))
        });
      }
    }

    // Mise à jour des zones de mobilité si fournies
    if (mobilityZones && Array.isArray(mobilityZones)) {
      await prisma.mobilityZone.deleteMany({ where: { profileId: profile.id } });
      if (mobilityZones.length > 0) {
        await prisma.mobilityZone.createMany({
          data: mobilityZones.map(z => ({
            profileId: profile.id,
            zoneType: z.zoneType,
            value: z.value
          }))
        });
      }
    }

    const final = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: { grades: true, mobilityZones: true }
    });

    res.json({
      ...final,
      specialites: final.specialites ? JSON.parse(final.specialites) : [],
      previousSpecialites: final.previousSpecialites ? JSON.parse(final.previousSpecialites) : [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil', details: err.message });
  }
};

exports.extractBulletin = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const base64 = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    const extracted = await geminiService.extractBulletin(base64, mimeType);

    // Nettoyer le fichier temporaire
    fs.unlinkSync(req.file.path);

    if (!extracted || !extracted.grades) {
      return res.status(422).json({ error: 'Impossible d\'extraire les données du bulletin' });
    }

    // Sauvegarder les notes extraites en base
    const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
    if (profile) {
      // Supprimer les anciennes notes OCR
      await prisma.academicGrade.deleteMany({ where: { profileId: profile.id, source: 'ocr' } });
      if (extracted.grades.length > 0) {
        await prisma.academicGrade.createMany({
          data: extracted.grades.map(g => ({
            profileId: profile.id,
            subject: g.subject,
            grade: parseFloat(g.grade),
            subjectType: g.subjectType || 'tronc_commun',
            source: 'ocr'
          }))
        });
      }
    }

    res.json({ grades: extracted.grades, rawText: extracted.rawText });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'extraction du bulletin', details: err.message });
  }
};