const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
};

exports.extractBulletin = async (base64Data, mimeType) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `Tu es un expert en lecture de bulletins scolaires français.
Analyse ce document et extrais toutes les matières et leurs notes.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après :
{
  "grades": [
    { "subject": "Nom de la matière", "grade": 14.5, "subjectType": "tronc_commun" }
  ],
  "rawText": "texte brut extrait du document"
}
Règles :
- subjectType doit être "tronc_commun" ou "specialite"
- grade doit être un nombre décimal sur 20
- Si une note est absente ou non numérique, ne pas inclure la matière
- Les spécialités de terminale ont subjectType "specialite"`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType, data: base64Data } }
  ]);
  const text = result.response.text();
  const parsed = parseJSON(text);
  return parsed || { grades: [], rawText: text };
};

const CHAT_SYSTEM_PROMPT = `Tu es un conseiller d'orientation scolaire bienveillant et expert pour les étudiants français.
Ton objectif est de comprendre les centres d'intérêt, les valeurs et les envies de vie de l'étudiant pour l'aider à trouver sa voie.

Instructions strictes :
1. Pose UNE seule question à la fois, courte et naturelle
2. Propose toujours 3 à 5 choix rapides dans le champ "choices"
3. Après 6 à 8 échanges, génère le profil final
4. Ne parle JAMAIS de filières ou formations spécifiques pendant la conversation
5. Sois chaleureux et encourage l'étudiant

Réponds TOUJOURS avec ce JSON exact, sans texte avant ou après :
{
  "message": "Ta réponse ou question ici",
  "choices": ["Choix 1", "Choix 2", "Choix 3"],
  "isCompleted": false,
  "extractedProfile": null
}

Quand tu as assez d'informations (après 6-8 échanges), mets isCompleted à true :
{
  "message": "Message de conclusion encourageant",
  "choices": [],
  "isCompleted": true,
  "extractedProfile": {
    "interests": ["intérêt 1", "intérêt 2"],
    "workStyle": "description du style de travail",
    "values": ["valeur 1", "valeur 2"],
    "lifeGoals": "description des envies de vie",
    "orientationPrompt": "Phrase de 1-2 lignes décrivant la direction idéale pour cet étudiant"
  }
}`;

exports.chatIntro = async () => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    { text: CHAT_SYSTEM_PROMPT },
    { text: "Commence la conversation avec un message d'accueil et la première question." }
  ]);
  const text = result.response.text();
  const parsed = parseJSON(text);
  return parsed || {
    message: "Bonjour ! Je suis là pour t'aider à explorer tes envies. Pour commencer, qu'est-ce qui t'intéresse le plus dans la vie en dehors des études ?",
    choices: ["Le sport et l'activité physique", 'La technologie', 'Les arts et la culture', 'Les sciences', 'Les relations humaines'],
    isCompleted: false
  };
};

exports.chat = async (history) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const historyText = history.map(m =>
    `${m.role === 'user' ? 'Étudiant' : 'Conseiller'}: ${m.content}`
  ).join('\n');
  const result = await model.generateContent([
    { text: CHAT_SYSTEM_PROMPT },
    { text: `Voici la conversation jusqu'ici :\n\n${historyText}\n\nRéponds maintenant en JSON.` }
  ]);
  const text = result.response.text();
  const parsed = parseJSON(text);
  return parsed || {
    message: "Je n'ai pas bien compris. Peux-tu reformuler ?",
    choices: [],
    isCompleted: false
  };
};

exports.generateOrientation = async (userInput, profile, gradesInfo, mobilityInfo, formationsContext = '', moyenneGenerale = null) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const profileContext = `PROFIL DE L'ÉTUDIANT :
- Type : ${profile.profileType === 'lyceen' ? 'Lycéen en Terminale' : profile.profileType === 'etudiant' ? 'Étudiant' : 'En réorientation'}
- École actuelle : ${profile.currentSchool || 'Non renseignée'}
- Formation : ${profile.formation || 'Non renseignée'}
- Niveau : ${profile.level || 'Non renseigné'}
- Filière : ${profile.filiere || 'Non renseignée'}
- Budget maximum études : ${profile.budgetMax ? profile.budgetMax + '€/an' : 'Non renseigné'}
- Mobilité : ${mobilityInfo}
- Notes : ${gradesInfo}
- Moyenne générale : ${moyenneGenerale !== null ? moyenneGenerale + '/20' : 'Non calculée'}${formationsContext}`;

  const prompt = `${profileContext}

DEMANDE DE L'ÉTUDIANT : "${userInput}"

Tu es un conseiller d'orientation expert du système éducatif français. Génère des recommandations personnalisées basées sur les formations réelles Parcoursup fournies.

Réponds UNIQUEMENT avec ce JSON valide, sans texte avant ou après :
{
  "idealPath": {
    "title": "Titre du parcours idéal",
    "description": "Description détaillée",
    "steps": [
      { "level": "Bac+2", "formation": "BTS Aéronautique", "duration": "2 ans", "schools": ["Lycée X (Paris)"], "cost": "Gratuit (public)", "etabUrl": "https://...", "parcoursupUrl": "https://..." }
    ],
    "totalDuration": "5 ans",
    "estimatedCost": "2000€ - 5000€ au total",
    "difficulty": "Accessible",
    "accessibilityScore": 75
  },
  "alternativePaths": [
    {
      "title": "Titre alternatif",
      "description": "Description",
      "steps": [],
      "totalDuration": "3 ans",
      "estimatedCost": "0€ - 500€",
      "difficulty": "Accessible",
      "accessibilityScore": 85,
      "whyAlternative": "Pourquoi c'est une alternative intéressante"
    }
  ],
  "aiComment": "Analyse personnalisée en 3-4 phrases basée sur le profil réel.",
  "domainSuggestions": ["Domaine proche 1", "Domaine proche 2"]
}

Règles :
- Utilise les formations Parcoursup réelles fournies en priorité
- Propose 2 à 3 parcours alternatifs
- Respecte les scores d'accessibilité calculés
- difficulty : "Accessible", "Modéré", "Sélectif", "Très sélectif"
- Mentionne les vrais établissements et villes dans les steps
- Pour chaque step, inclure etabUrl avec le site web de l'établissement si fourni dans les formations, sinon null
- Pour chaque step, inclure parcoursupUrl avec le lien Parcoursup si fourni dans les formations, sinon null`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseJSON(text);
  if (!parsed) throw new Error('Réponse IA non parseable : ' + text.substring(0, 200));
  return parsed;
};