const geminiService = require('./geminiService');
const parcoursupService = require('./parcoursupService');

exports.generateRecommendations = async (userInput, profile) => {
  // Calculer la moyenne générale
  let moyenneGenerale = null;
  if (profile.grades && profile.grades.length > 0) {
    const sum = profile.grades.reduce((acc, g) => acc + g.grade, 0);
    moyenneGenerale = parseFloat((sum / profile.grades.length).toFixed(2));
  }

  // Résumé des notes
  const gradesInfo = profile.grades && profile.grades.length > 0
    ? profile.grades.map(g => `${g.subject}: ${g.grade}/20 (${g.subjectType === 'specialite' ? 'spécialité' : 'tronc commun'})`).join(', ')
    : 'Aucune note renseignée';

  // Résumé de mobilité
  let mobilityInfo = 'Non renseignée';
  if (profile.mobilityType === 'none') {
    mobilityInfo = 'Pas mobile (reste sur place)';
  } else if (profile.mobilityType === 'all') {
    mobilityInfo = 'Mobile partout en France';
  } else if (profile.mobilityType === 'specific' && profile.mobilityZones) {
    const zones = profile.mobilityZones.map(z => `${z.zoneType}: ${z.value}`).join(', ');
    mobilityInfo = `Mobile sur zones spécifiques : ${zones}`;
  }

  // Rechercher les vraies formations Parcoursup et les scorer
  let formationsReelles = [];
  try {
    const scored = await parcoursupService.getFormationsScored(userInput, profile);
    formationsReelles = scored;
    console.log(`[Parcoursup] ${scored.length} formations trouvées et scorées`);
  } catch (err) {
    console.error('[Parcoursup] Erreur recherche formations:', err.message);
  }

  // Contexte formations réelles pour Gemini
  let formationsContext = '';
  if (formationsReelles.length > 0) {
    formationsContext = `\n\nFORMATIONS RÉELLES PARCOURSUP 2026 DISPONIBLES :\n`;
    formationsContext += formationsReelles.map((f, i) => {
      const fo = f.formation;
      return `${i + 1}. ${fo.nom}
   - Établissement : ${fo.etablissement}
   - Lieu : ${fo.commune}, ${fo.departement} (${fo.region})
   - Type : ${fo.typeFormation} | ${fo.isPublic ? 'Public' : 'Privé'}${fo.isApprentissage ? ' | Apprentissage' : ''}
   - Score accessibilité calculé : ${f.score}/100 (${f.difficulte})
   - Seuil de moyenne requis : ~${f.seuilMoyenne}/20
   - Coût estimé : ${fo.isPublic ? 'Gratuit (frais inscription ~170€)' : `~${f.coutEstime}€/an`}
   - Site établissement : ${fo.etabUrl || 'Non disponible'}
   - Fiche Parcoursup : ${fo.ficheUrl || 'Non disponible'}`;
    }).join('\n\n');

    formationsContext += `\n\nMoyenne générale de l'étudiant : ${moyenneGenerale !== null ? moyenneGenerale + '/20' : 'Non renseignée'}`;
    formationsContext += `\n\nIMPORTANT : Base tes recommandations sur ces formations réelles. Respecte les scores d'accessibilité calculés.`;
  } else {
    formationsContext = '\n\nAucune formation Parcoursup trouvée. Génère des recommandations générales réalistes.';
  }

  // Appeler Gemini avec le contexte enrichi
  const result = await geminiService.generateOrientation(
    userInput, profile, gradesInfo, mobilityInfo, formationsContext, moyenneGenerale
  );

  // Réinjecter nos scores calculés (priorité sur ceux de Gemini)
  if (formationsReelles.length > 0 && result.idealPath) {
    result.idealPath.accessibilityScore = formationsReelles[0].score;
    result.idealPath.difficulty = formationsReelles[0].difficulte;

    if (result.alternativePaths) {
      result.alternativePaths = result.alternativePaths.map((path, i) => {
        const f = formationsReelles[i + 1];
        if (f) {
          path.accessibilityScore = f.score;
          path.difficulty = f.difficulte;
        }
        return path;
      });
    }
  }

  return result;
};