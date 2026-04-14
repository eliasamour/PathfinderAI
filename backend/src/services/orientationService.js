const geminiService = require('./geminiService');

exports.generateRecommendations = async (userInput, profile) => {
  // Construire le résumé des notes
  const gradesInfo = profile.grades && profile.grades.length > 0
    ? profile.grades.map(g => `${g.subject}: ${g.grade}/20 (${g.subjectType === 'specialite' ? 'spécialité' : 'tronc commun'})`).join(', ')
    : 'Aucune note renseignée';

  // Construire le résumé de mobilité
  let mobilityInfo = 'Non renseignée';
  if (profile.mobilityType === 'none') {
    mobilityInfo = 'Pas mobile (reste sur place)';
  } else if (profile.mobilityType === 'all') {
    mobilityInfo = 'Mobile partout en France';
  } else if (profile.mobilityType === 'specific' && profile.mobilityZones) {
    const zones = profile.mobilityZones.map(z => `${z.zoneType}: ${z.value}`).join(', ');
    mobilityInfo = `Mobile sur zones spécifiques : ${zones}`;
  }

  const result = await geminiService.generateOrientation(userInput, profile, gradesInfo, mobilityInfo);
  return result;
};