/**
 * Seed script – populate Firestore with demo data
 * Usage: node scripts/seed.js
 *
 * Prerequisites:
 *   npm install firebase-admin
 *   Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path
 *   OR place serviceAccountKey.json in this scripts/ folder
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Init Firebase Admin
let app
if (!getApps().length) {
  const keyPath = join(__dirname, 'serviceAccountKey.json')
  if (existsSync(keyPath)) {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
    app = initializeApp({ credential: cert(serviceAccount) })
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = initializeApp()
  } else {
    console.error('ERROR: No Firebase credentials found.')
    console.error('Place serviceAccountKey.json in scripts/ folder or set GOOGLE_APPLICATION_CREDENTIALS.')
    process.exit(1)
  }
}

const db = getFirestore()

function ts(daysFromNow = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return Timestamp.fromDate(d)
}

const opportunities = [
  {
    client: 'Orange Business Services',
    account: 'OBS - Digital',
    label: 'Transformation Digitale SI Finance',
    description: 'Refonte du SI finance avec approche cloud-native',
    service: 'Transformation',
    status: 'Proposal',
    probability: 60,
    value: 850000,
    closingDate: ts(45),
    owner: 'Alice',
    source: 'Appel d\'offres',
    createdAt: ts(-90),
    statusHistory: [
      { status: 'Lead', date: ts(-90), changedBy: 'alice@example.com' },
      { status: 'Qualifié', date: ts(-60), changedBy: 'alice@example.com' },
      { status: 'Proposal', date: ts(-20), changedBy: 'alice@example.com' },
    ]
  },
  {
    client: 'Orange France',
    account: 'DSIT Orange France',
    label: 'Stratégie Data & IA - Réseau',
    description: 'Définition de la stratégie data pour le réseau mobile 5G',
    service: 'Data',
    status: 'Négociation',
    probability: 75,
    value: 420000,
    closingDate: ts(20),
    owner: 'Bob',
    source: 'Relation client',
    createdAt: ts(-120),
    statusHistory: [
      { status: 'Lead', date: ts(-120), changedBy: 'bob@example.com' },
      { status: 'Qualifié', date: ts(-80), changedBy: 'bob@example.com' },
      { status: 'Proposal', date: ts(-40), changedBy: 'bob@example.com' },
      { status: 'Négociation', date: ts(-10), changedBy: 'bob@example.com' },
    ]
  },
  {
    client: 'Orange Cyberdefense',
    account: 'OCD - SOC',
    label: 'Audit Sécurité & PSSI',
    description: 'Audit complet de la posture sécurité et rédaction de la PSSI',
    service: 'IT',
    status: 'Won',
    probability: 100,
    value: 280000,
    closingDate: ts(-10),
    owner: 'Claire',
    source: 'Réseau',
    createdAt: ts(-150),
    statusHistory: [
      { status: 'Lead', date: ts(-150), changedBy: 'claire@example.com' },
      { status: 'Qualifié', date: ts(-100), changedBy: 'claire@example.com' },
      { status: 'Proposal', date: ts(-50), changedBy: 'claire@example.com' },
      { status: 'Won', date: ts(-10), changedBy: 'claire@example.com' },
    ]
  },
  {
    client: 'Orange Innovation',
    account: 'Orange Labs',
    label: 'Programme Innovation IA Générative',
    description: 'Accompagnement à la définition et déploiement d\'use cases IA Gen',
    service: 'Stratégie',
    status: 'Qualifié',
    probability: 40,
    value: 600000,
    closingDate: ts(90),
    owner: 'Alice',
    source: 'Event interne',
    createdAt: ts(-30),
    statusHistory: [
      { status: 'Lead', date: ts(-30), changedBy: 'alice@example.com' },
      { status: 'Qualifié', date: ts(-5), changedBy: 'alice@example.com' },
    ]
  },
  {
    client: 'Orange Wholesale',
    account: 'OW - IT',
    label: 'Migration Cloud AWS',
    description: 'Migration de 80% des applicatifs vers AWS',
    service: 'IT',
    status: 'Lead',
    probability: 20,
    value: 1200000,
    closingDate: ts(180),
    owner: 'Bob',
    source: 'Prospection',
    createdAt: ts(-15),
    statusHistory: [
      { status: 'Lead', date: ts(-15), changedBy: 'bob@example.com' },
    ]
  },
  {
    client: 'Orange MEA',
    account: 'Orange Maroc',
    label: 'PMO Transformation SI',
    description: 'Mise en place d\'une fonction PMO pour le programme de transformation SI',
    service: 'Transformation',
    status: 'Proposal',
    probability: 55,
    value: 350000,
    closingDate: ts(60),
    owner: 'Claire',
    source: 'Appel d\'offres',
    createdAt: ts(-70),
    statusHistory: [
      { status: 'Lead', date: ts(-70), changedBy: 'claire@example.com' },
      { status: 'Qualifié', date: ts(-40), changedBy: 'claire@example.com' },
      { status: 'Proposal', date: ts(-15), changedBy: 'claire@example.com' },
    ]
  },
  {
    client: 'Orange Bank',
    account: 'DSIO Orange Bank',
    label: 'Conformité DORA & NIS2',
    description: 'Programme de mise en conformité réglementaire DORA et NIS2',
    service: 'IT',
    status: 'Lost',
    probability: 0,
    value: 200000,
    closingDate: ts(-30),
    owner: 'Alice',
    source: 'Relation client',
    createdAt: ts(-180),
    statusHistory: [
      { status: 'Lead', date: ts(-180), changedBy: 'alice@example.com' },
      { status: 'Qualifié', date: ts(-120), changedBy: 'alice@example.com' },
      { status: 'Proposal', date: ts(-60), changedBy: 'alice@example.com' },
      { status: 'Lost', date: ts(-30), changedBy: 'alice@example.com' },
    ]
  },
  {
    client: 'Orange Business Services',
    account: 'OBS - RH',
    label: 'Digitalisation RH & Self-service',
    description: 'Déploiement d\'une solution de digitalisation des processus RH',
    service: 'Autre',
    status: 'Qualifié',
    probability: 35,
    value: 180000,
    closingDate: ts(120),
    owner: 'Bob',
    source: 'Salon professionnel',
    createdAt: ts(-45),
    statusHistory: [
      { status: 'Lead', date: ts(-45), changedBy: 'bob@example.com' },
      { status: 'Qualifié', date: ts(-20), changedBy: 'bob@example.com' },
    ]
  },
]

async function seedAll() {
  console.log('🌱 Seeding Firestore...\n')

  // Clear existing data
  const collections = ['opportunities', 'actions', 'contacts']
  for (const col of collections) {
    const snap = await db.collection(col).get()
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    console.log(`  ✓ Cleared ${col}`)
  }

  // Seed opportunities
  const oppIds = []
  for (const opp of opportunities) {
    const ref = await db.collection('opportunities').add(opp)
    oppIds.push(ref.id)
    console.log(`  ✓ Created opportunity: ${opp.label}`)
  }

  // Seed actions
  const actions = [
    { type: 'RDV client', opportunityId: oppIds[0], plannedDate: ts(3), status: 'À faire', owner: 'Alice', notes: 'Présentation soutenance propale', nextStep: '', priority: 'Haute' },
    { type: 'Envoi propale', opportunityId: oppIds[0], plannedDate: ts(-5), doneDate: ts(-5), status: 'Fait', owner: 'Alice', notes: 'Propale v2 envoyée', nextStep: 'Attendre retour client J+7', priority: 'Haute' },
    { type: 'Call', opportunityId: oppIds[1], plannedDate: ts(1), status: 'À faire', owner: 'Bob', notes: 'Point avancement négociation', nextStep: '', priority: 'Haute' },
    { type: 'RDV client', opportunityId: oppIds[1], plannedDate: ts(-3), doneDate: ts(-3), status: 'Fait', owner: 'Bob', notes: 'Réunion de négociation', nextStep: 'Envoyer contrat final', priority: 'Normale' },
    { type: 'Relance', opportunityId: oppIds[3], plannedDate: ts(7), status: 'À faire', owner: 'Alice', notes: 'Relance après qualification', nextStep: '', priority: 'Normale' },
    { type: 'Atelier', opportunityId: oppIds[3], plannedDate: ts(14), status: 'À faire', owner: 'Alice', notes: 'Atelier cadrage use cases IA', nextStep: '', priority: 'Normale' },
    { type: 'Call', opportunityId: oppIds[4], plannedDate: ts(-10), status: 'Reporté', owner: 'Bob', notes: 'Call décalé', nextStep: '', priority: 'Basse' },
    { type: 'RDV client', opportunityId: oppIds[4], plannedDate: ts(21), status: 'À faire', owner: 'Bob', notes: 'Premier RDV discovery', nextStep: '', priority: 'Normale' },
    { type: 'Envoi propale', opportunityId: oppIds[5], plannedDate: ts(-2), doneDate: ts(-2), status: 'Fait', owner: 'Claire', notes: 'Propale PMO envoyée', nextStep: 'Planifier soutenance', priority: 'Haute' },
    { type: 'RDV client', opportunityId: oppIds[5], plannedDate: ts(10), status: 'À faire', owner: 'Claire', notes: 'Soutenance propale PMO', nextStep: '', priority: 'Haute' },
    { type: 'Relance', opportunityId: oppIds[7], plannedDate: ts(5), status: 'À faire', owner: 'Bob', notes: 'Relance après qualification RH', nextStep: '', priority: 'Basse' },
    { type: 'Call', opportunityId: oppIds[2], plannedDate: ts(-20), doneDate: ts(-20), status: 'Fait', owner: 'Claire', notes: 'Kick-off projet won', nextStep: 'Démarrer la mission', priority: 'Haute' },
    { type: 'Atelier', opportunityId: oppIds[0], plannedDate: ts(15), status: 'À faire', owner: 'Alice', notes: 'Atelier technique architecture', nextStep: '', priority: 'Normale' },
    { type: 'RDV client', opportunityId: oppIds[1], plannedDate: ts(5), status: 'À faire', owner: 'Bob', notes: 'Signature contrat prévue', nextStep: '', priority: 'Haute' },
    { type: 'Autre', opportunityId: oppIds[3], plannedDate: ts(-30), status: 'Annulé', owner: 'Alice', notes: 'Atelier annulé côté client', nextStep: '', priority: 'Basse' },
  ]

  for (const action of actions) {
    await db.collection('actions').add({ ...action, createdAt: ts(-Math.floor(Math.random() * 30)) })
  }
  console.log(`  ✓ Created ${actions.length} actions`)

  // Seed contacts
  const contacts = [
    { name: 'Jean-Luc Martin', function: 'DSI', entity: 'Orange Business Services', influence: 'Décideur', decisionRole: 'Budget owner', opportunityIds: [oppIds[0], oppIds[7]] },
    { name: 'Sophie Dubois', function: 'Responsable Innovation', entity: 'Orange Labs', influence: 'Influenceur', decisionRole: 'Sponsor technique', opportunityIds: [oppIds[3]] },
    { name: 'Marc Lefebvre', function: 'RSSI', entity: 'Orange Cyberdefense', influence: 'Décideur', decisionRole: 'Validateur sécurité', opportunityIds: [oppIds[2]] },
    { name: 'Amina Benzara', function: 'Chef de projet IT', entity: 'Orange MEA', influence: 'Utilisateur', decisionRole: 'MOA', opportunityIds: [oppIds[5]] },
    { name: 'Thomas Girard', function: 'Directeur Transformation', entity: 'Orange France', influence: 'Décideur', decisionRole: 'Sponsor exécutif', opportunityIds: [oppIds[1], oppIds[4]] },
  ]

  for (const contact of contacts) {
    await db.collection('contacts').add({ ...contact, createdAt: ts(-Math.floor(Math.random() * 60)) })
  }
  console.log(`  ✓ Created ${contacts.length} contacts`)

  console.log('\n✅ Seeding complete!')
  process.exit(0)
}

seedAll().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
