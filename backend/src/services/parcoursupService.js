const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEUILS_MOYENNES = {
  'CPGE': 17,
  'Formations des écoles d\'ingénieurs': 15.5,
  'Formations des écoles de commerce et de management': 14,
  'Sciences Po - Instituts d\'études politiques': 15,
  'Etudes de santé': 17,
  'Licence sélective': 13,
  'BUT': 12,
  'Licence': 11,
  'BTS - BTSA - BTSM': 11,
  'DUT': 12,
  'Formations d\'art, de design et du spectacle vivant': 12,
  'Formations diplômantes du travail social': 11,
  'Formations professionnelles': 10,
  'Formations aux métiers du sport': 11,
  'DCG': 12,
  'Mentions complémentaires': 10,
  'DEUST': 11,
  'Formations préparatoires à l\'enseignement supérieur': 13,
  'default': 10
};

const COUTS_ESTIMES = {
  'CPGE': 0,
  'Licence': 0,
  'BUT': 0,
  'BTS - BTSA - BTSM': 0,
  'Formations des écoles d\'ingénieurs': 3000,
  'Formations des écoles de commerce et de management': 8000,
  'Sciences Po - Instituts d\'études politiques': 3000,
  'Etudes de santé': 0,
  'default': 0
};

// Synonymes : clé = ce que l'utilisateur tape, valeur = typeFormation exact dans Parcoursup
const SYNONYMES_TYPE = {
  'cpge': 'CPGE',
  'classe préparatoire': 'CPGE',
  'prépa': 'CPGE',
  'médecine': 'Etudes de santé',
  'pass': 'Etudes de santé',
  'santé': 'Etudes de santé',
  'ingénieur': 'Formations des écoles d\'ingénieurs',
  'école ingénieur': 'Formations des écoles d\'ingénieurs',
  'commerce': 'Formations des écoles de commerce et de management',
  'école de commerce': 'Formations des écoles de commerce et de management',
  'sciences po': 'Sciences Po - Instituts d\'études politiques',
  'iep': 'Sciences Po - Instituts d\'études politiques',
  'bts': 'BTS - BTSA - BTSM',
  'btsa': 'BTS - BTSA - BTSM',
  'but': 'BUT',
  'licence pro': 'Licence professionnelle',
  'art': 'Formations d\'art, de design et du spectacle vivant',
  'design': 'Formations d\'art, de design et du spectacle vivant',
  'social': 'Formations diplômantes du travail social',
  'éducateur': 'Formations diplômantes du travail social',
  'sport': 'Formations aux métiers du sport',
  'staps': 'Formations aux métiers du sport',
  'architecture': 'Formations d\'architecture, du paysage et du patrimoine',
  'licence sélective': 'Licence sélective',
  'licence selective': 'Licence sélective',
  'licence': 'Licence',
};

// Mots-clés domaine : clé = ce que l'utilisateur tape, valeur = mots à chercher dans nom/filiere
const SYNONYMES_DOMAINE = {
  'informatique': ['Informatique', 'SIO', 'NSI', 'numérique', 'développement'],
  'droit': ['Droit', 'juridique'],
  'psychologie': ['Psychologie'],
  'économie': ['Économie', 'Sciences économiques'],
  'gestion': ['Gestion', 'management', 'GEA'],
  'comptabilité': ['Comptabilité', 'CG', 'DCG'],
  'marketing': ['Marketing', 'communication', 'MCO'],
  'biologie': ['Biologie', 'SVT', 'Sciences de la vie'],
  'chimie': ['Chimie', 'Physique-chimie'],
  'mathématiques': ['Mathématiques', 'MPSI', 'MP'],
  'électronique': ['Électronique', 'électrique', 'GEII'],
  'mécanique': ['Mécanique', 'génie mécanique'],
  'aéronautique': ['Aéronautique', 'aérospatial'],
  'audiovisuel': ['Audiovisuel', 'cinéma', 'médias'],
  'tourisme': ['Tourisme', 'hôtellerie'],
  'agriculture': ['Agriculture', 'agronomie', 'BTSA'],
  'environnement': ['Environnement', 'développement durable', 'écologie'],
};

function resoudreSynonymes(userInput) {
  const inputLower = userInput.toLowerCase();

  // 1. Chercher un type de formation exact
  let typeFormation = null;
  for (const [cle, type] of Object.entries(SYNONYMES_TYPE)) {
    if (inputLower.includes(cle)) {
      typeFormation = type;
      break; // On prend le premier match
    }
  }

  // 2. Chercher des mots-clés de domaine
  const motsDomaine = [];
  for (const [cle, mots] of Object.entries(SYNONYMES_DOMAINE)) {
    if (inputLower.includes(cle)) {
      motsDomaine.push(...mots);
    }
  }

  // 3. Mots bruts en fallback (si rien trouvé)
  const motsBruts = inputLower
    .replace(/[^a-zàâçéèêëîïôûùüÿæœ\s]/g, ' ')
    .split(/\s+/)
    .filter(m => m.length > 3)
    .filter(m => !['dans', 'pour', 'avec', 'faire', 'travailler', 'devenir',
      'veux', 'voudrais', 'aimerais', 'classe', 'école', 'formation',
      'licence', 'sélective', 'selective'].includes(m));

  return { typeFormation, motsDomaine, motsBruts };
}

function calculerScore(formation, profile, moyenneGenerale) {
  let score = 0;
  const details = [];

  // 1. Adéquation académique (40 pts)
  const seuilType = SEUILS_MOYENNES[formation.typeFormation] || SEUILS_MOYENNES['default'];

  if (moyenneGenerale !== null) {
    const ecart = moyenneGenerale - seuilType;
    if (ecart >= 1.5) {
      score += 40;
      details.push(`Niveau académique excellent (+40)`);
    } else if (ecart >= 0) {
      score += 28;
      details.push(`Niveau académique suffisant (+28)`);
    } else if (ecart >= -1.5) {
      score += 15;
      details.push(`Niveau académique limite (+15)`);
    } else if (ecart >= -3) {
      score += 7;
      details.push(`Niveau académique insuffisant (+7)`);
    } else {
      score += 2;
      details.push(`Niveau académique très insuffisant (+2)`);
    }
  } else {
    score += 20;
    details.push(`Pas de notes renseignées (+20)`);
  }

  // 2. Budget (30 pts)
  const coutEstime = formation.isPublic
    ? 0
    : (COUTS_ESTIMES[formation.typeFormation] || 2000);

  if (!profile.budgetMax) {
    score += 20;
  } else if (profile.budgetMax >= coutEstime + 500) {
    score += 30;
    details.push(`Budget largement compatible (+30)`);
  } else if (profile.budgetMax >= coutEstime) {
    score += 20;
    details.push(`Budget juste compatible (+20)`);
  } else {
    score += 3;
    details.push(`Budget insuffisant (+3)`);
  }

  // 3. Mobilité (20 pts)
  if (profile.mobilityType === 'all') {
    score += 20;
  } else if (profile.mobilityType === 'none') {
    score += 3;
  } else if (profile.mobilityType === 'specific' && profile.mobilityZones) {
    const match = profile.mobilityZones.some(z => {
      const val = z.value.toLowerCase();
      if (z.zoneType === 'region') return (formation.region || '').toLowerCase().includes(val);
      if (z.zoneType === 'departement') return (formation.departement || '').toLowerCase().includes(val);
      if (z.zoneType === 'ville') return (formation.commune || '').toLowerCase().includes(val);
      return false;
    });
    score += match ? 20 : 3;
  }

  // 4. Public vs privé (10 pts)
  score += formation.isPublic ? 10 : 4;

  return {
    score: Math.min(100, Math.round(score)),
    details,
    seuilMoyenne: seuilType,
    coutEstime
  };
}

function getDifficulte(score) {
  if (score >= 80) return 'Accessible';
  if (score >= 55) return 'Modéré';
  if (score >= 35) return 'Sélectif';
  return 'Très sélectif';
}

async function rechercherFormations(userInput, profile, limit = 20) {
  const { typeFormation, motsDomaine, motsBruts } = resoudreSynonymes(userInput);

  console.log('[Parcoursup] Type détecté:', typeFormation);
  console.log('[Parcoursup] Mots domaine:', motsDomaine);
  console.log('[Parcoursup] Mots bruts:', motsBruts);

  let whereFormation = {};

  if (typeFormation && motsDomaine.length > 0) {
    // Cas idéal : type ET domaine — on filtre sur les deux
    whereFormation = {
      AND: [
        { typeFormation: { contains: typeFormation } },
        { OR: motsDomaine.map(m => ({ OR: [{ nom: { contains: m } }, { filiere: { contains: m } }] })) }
      ]
    };
  } else if (typeFormation) {
    // Juste un type : toutes les formations de ce type
    whereFormation = { typeFormation: { contains: typeFormation } };
  } else if (motsDomaine.length > 0) {
    // Juste un domaine : recherche dans nom et filière
    whereFormation = {
      OR: motsDomaine.map(m => ({
        OR: [{ nom: { contains: m } }, { filiere: { contains: m } }]
      }))
    };
  } else if (motsBruts.length > 0) {
    // Fallback mots bruts avec AND pour plus de précision
    whereFormation = {
      AND: motsBruts.slice(0, 2).map(mot => ({
        OR: [{ nom: { contains: mot } }, { filiere: { contains: mot } }]
      }))
    };
  } else {
    return [];
  }

  // Filtre mobilité
  const mobilityFilter = [];
  if (profile.mobilityType === 'specific' && profile.mobilityZones?.length > 0) {
    for (const zone of profile.mobilityZones) {
      if (zone.zoneType === 'region') mobilityFilter.push({ region: { contains: zone.value } });
      if (zone.zoneType === 'departement') mobilityFilter.push({ departement: { contains: zone.value } });
      if (zone.zoneType === 'ville') mobilityFilter.push({ commune: { contains: zone.value } });
    }
  }

  const whereClause = mobilityFilter.length > 0
    ? { AND: [whereFormation, { OR: mobilityFilter }, { NOT: { typeFormation: 'Formations professionnelles' } }] }
    : { AND: [whereFormation, { NOT: { typeFormation: 'Formations professionnelles' } }] };

  const formations = await prisma.formation.findMany({
    where: whereClause,
    take: limit * 3,
    orderBy: { nom: 'asc' }
  });

  console.log('[Parcoursup] Formations trouvées:', formations.length);
  if (formations.length > 0) {
    console.log('[Parcoursup] Types:', [...new Set(formations.slice(0, 5).map(f => f.typeFormation))]);
  }

  return formations;
}

async function getFormationsScored(userInput, profile) {
  let moyenneGenerale = null;
  if (profile.grades && profile.grades.length > 0) {
    const sum = profile.grades.reduce((acc, g) => acc + g.grade, 0);
    moyenneGenerale = parseFloat((sum / profile.grades.length).toFixed(2));
  }

  const formations = await rechercherFormations(userInput, profile, 20);
  if (formations.length === 0) return [];

  const scored = formations.map(f => {
    const { score, details, seuilMoyenne, coutEstime } = calculerScore(f, profile, moyenneGenerale);
    return { formation: f, score, details, seuilMoyenne, coutEstime, difficulte: getDifficulte(score) };
  });

  scored.sort((a, b) => b.score - a.score);

  console.log('[Parcoursup] Top scores:');
  scored.slice(0, 5).forEach(s => {
    console.log(`  ${s.formation.typeFormation} | Score: ${s.score} (${s.difficulte}) | Seuil: ${s.seuilMoyenne} | Moyenne: ${moyenneGenerale}`);
  });

  return scored.slice(0, 10);
}

module.exports = { getFormationsScored, calculerScore, getDifficulte };