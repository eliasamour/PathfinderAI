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

// ─── Module 1 : Extraction de bulletin ───────────────────────────────────────

exports.extractBulletin = async (base64Data, mimeType) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Tu es un expert en lecture de bulletins scolaires français.
Analyse ce document et extrais toutes les matières et leurs notes.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, dans ce format exact :
{
  "grades": [
    {
      "subject": "Nom de la matière",
      "grade": 14.5,
      "subjectType": "tronc_commun" 
    }
  ],
  "rawText": "texte brut extrait du document"
}

Règles :
- subjectType doit être "tronc_commun" ou "specialite"
- grade doit être un nombre décimal (sur 20)
- Si une note est absente ou non numérique, ne pas inclure la matière
- Les spécialités de terminale (ex: Maths, Physique-Chimie, SVT, HGGSP, SES, NSI, Arts, etc.) doivent avoir subjectType "specialite"`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType, data: base64Data } }
  ]);

  const text = result.response.text();
  const parsed = parseJSON(text);

  return parsed || { grades: [], rawText: text };
};

// ─── Module 3 : Chatbot exploratoire ─────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `Tu es un conseiller d'orientation scolaire bienveillant et expert pour les étudiants français.
Ton objectif est de comprendre les centres d'intérêt, les valeurs et les envies de vie de l'étudiant pour l'aider à trouver sa voie.

Instructions strictes :
1. Pose UNE seule question à la fois, courte et naturelle
2. Propose toujours 3 à 5 choix rapides dans le champ "choices" (l'utilisateur peut aussi répondre librement)
3. Après 6 à 8 échanges, génère le profil final
4. Ne parle JAMAIS de filières ou de formations spécifiques pendant la conversation — concentre-toi sur les préférences et la personnalité
5. Sois chaleureux, encourage l'étudiant

Réponds TOUJOURS avec ce JSON exact, sans texte avant ou après :
{
  "message": "Ta réponse ou question ici",
  "choices": ["Choix 1", "Choix 2", "Choix 3"],
  "isCompleted": false,
  "extractedProfile": null
}

Quand tu as assez d'informations (après 6-8 échanges), mets isCompleted à true et remplis extractedProfile :
{
  "message": "Message de conclusion encourageant",
  "choices": [],
  "isCompleted": true,
  "extractedProfile": {
    "interests": ["intérêt 1", "intérêt 2"],
    "workStyle": "description du style de travail",
    "values": ["valeur 1", "valeur 2"],
    "lifeGoals": "description des envies de vie",
    "orientationPrompt": "Phrase de 1-2 lignes décrivant la direction idéale pour cet étudiant, utilisable pour une recherche d'orientation"
  }
}`;

exports.chatIntro = async () => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent([
    { text: CHAT_SYSTEM_PROMPT },
    { text: 'Commence la conversation avec un message d\'accueil et la première question.' }
  ]);

  const text = result.response.text();
  const parsed = parseJSON(text);

  return parsed || {
    message: "Bonjour ! Je suis là pour t'aider à explorer tes envies. Pour commencer, qu'est-ce qui t'intéresse le plus dans la vie en dehors des études ?",
    choices: ['Le sport et l\'activité physique', 'La technologie', 'Les arts et la culture', 'Les sciences', 'Les relations humaines'],
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
    { text: `Voici la conversation jusqu\'ici :\n\n${historyText}\n\nRéponds maintenant en JSON.` }
  ]);

  const text = result.response.text();
  const parsed = parseJSON(text);

  return parsed || {
    message: "Je n'ai pas bien compris. Peux-tu reformuler ?",
    choices: [],
    isCompleted: false
  };
};

// ─── Module 2 : Moteur d'orientation ─────────────────────────────────────────

exports.generateOrientation = async (userInput, profile, gradesInfo, mobilityInfo) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const profileContext = `
PROFIL DE L'ÉTUDIANT :
- Type : ${profile.profileType === 'lyceen' ? 'Lycéen en Terminale' : profile.profileType === 'etudiant' ? 'Étudiant' : 'En réorientation'}
- École actuelle : ${profile.currentSchool || 'Non renseignée'}
- Formation : ${profile.formation || 'Non renseignée'}
- Niveau : ${profile.level || 'Non renseigné'}
- Filière : ${profile.filiere || 'Non renseignée'}
- Budget maximum : ${profile.budgetMax ? profile.budgetMax + '€/an' : 'Non renseigné'}
- Mobilité : ${mobilityInfo}
- Notes : ${gradesInfo}
  `.trim();

  const prompt = `${profileContext}

DEMANDE DE L'ÉTUDIANT : "${userInput}"

Tu es un conseiller d'orientation expert du système éducatif français. Génère des recommandations personnalisées et réalistes.

Réponds UNIQUEMENT avec ce JSON valide, sans texte avant ou après :
{
  "idealPath": {
    "title": "Titre du parcours idéal",
    "description": "Description détaillée du parcours",
    "steps": [
      { "level": "Bac+2", "formation": "BTS Aéronautique", "duration": "2 ans", "schools": ["École 1", "École 2"], "cost": "Gratuit (public)" }
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
      "whyAlternative": "Explication de pourquoi c'est une alternative intéressante"
    }
  ],
  "aiComment": "Analyse personnalisée de la demande, conseils spécifiques basés sur le profil, points d'attention. 3-4 phrases.",
  "domainSuggestions": ["Domaine proche 1", "Domaine proche 2"]
}

Règles importantes :
- Propose 2 à 3 parcours alternatifs
- Les formations doivent être réelles et accessibles en France
- Prends en compte le budget et la mobilité du profil
- accessibilityScore est entre 0 et 100 (100 = très accessible)
- difficulty : "Accessible", "Modéré", "Sélectif", "Très sélectif"
- Si la demande est vague, propose des domaines proches dans domainSuggestions`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseJSON(text);

  if (!parsed) {
    throw new Error('Réponse IA non parseable : ' + text.substring(0, 200));
  }

  return parsed;
};