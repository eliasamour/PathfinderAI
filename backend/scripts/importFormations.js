require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Chargement des formations...');

  const filePath = path.join(__dirname, '../../formations_2026.json');
  if (!fs.existsSync(filePath)) {
    console.error('Fichier formations_2026.json introuvable. Mets-le à la racine du projet.');
    process.exit(1);
  }

  const formations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`${formations.length} formations à importer...`);

  await prisma.formation.deleteMany();
  console.log('Anciennes données supprimées.');

  const batchSize = 500;
  let imported = 0;

  for (let i = 0; i < formations.length; i += batchSize) {
    const batch = formations.slice(i, i + batchSize);
    await prisma.formation.createMany({
      data: batch.map(f => ({
        gta: f.gta || `unknown-${i}`,
        nom: f.nom || '',
        typeFormation: f.type_formation || '',
        filiere: f.filiere || '',
        etablissement: f.etab_nom || '',
        region: f.region || '',
        departement: f.departement || '',
        commune: f.commune || '',
        isPublic: (f.tc || '').toLowerCase().includes('public'),
        isApprentissage: f.is_apprentissage || false,
        ficheUrl: f.fiche_url || null,
        etabUrl: f.etab_url || null,
        lat: f.lat || null,
        lon: f.lon || null,
      }))
    });
    imported += batch.length;
    process.stdout.write(`\r${imported}/${formations.length} importées...`);
  }

  console.log(`\nImport terminé ! ${imported} formations dans la base.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());