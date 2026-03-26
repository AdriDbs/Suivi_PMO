# PMO Tracker

Application web de suivi PMO pour les opportunités Orange, construite avec React + Vite + Firebase.

## Stack technique

- **React 18** + **Vite** (SPA)
- **Firebase v10** – Firestore (données) + Auth (authentification)
- **Tailwind CSS** – styles
- **Recharts** – graphiques
- **React Router v6** – navigation
- **Déploiement** : GitHub Pages via GitHub Actions

---

## Développement local

### 1. Prérequis

- Node.js 20+
- Un projet Firebase configuré (voir ci-dessous)

### 2. Installation

```bash
cd pmo-tracker
npm install
```

### 3. Lancer l'application

```bash
npm run dev
```

L'application est disponible sur `http://localhost:5173/pmo-tracker/`

### 4. Build de production

```bash
npm run build
```

---

## Configuration Firebase

Le fichier `src/firebase.js` contient déjà la configuration du projet `pmo-tracker-b8b8b`.

### Activer Firebase Authentication

1. Aller dans la console Firebase → Authentication → Sign-in methods
2. Activer **Email/Password**
3. Créer un utilisateur dans "Users" → "Add user"

### Activer Firestore

1. Aller dans Firestore Database → Create database
2. Choisir le mode **Production** (les règles de sécurité sont dans `firestore.rules`)
3. Sélectionner la région

### Déployer les règles Firestore

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

---

## Données de démo (seed)

### Prérequis

1. Télécharger la clé de compte de service Firebase :
   - Console Firebase → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée
   - Sauvegarder le fichier JSON dans `scripts/serviceAccountKey.json`

2. Installer firebase-admin :

```bash
npm install firebase-admin
```

### Exécuter le seed

```bash
node scripts/seed.js
```

Ceci crée :
- **8 opportunités** (mix de statuts, responsables : Alice, Bob, Claire)
- **15 actions** liées aux opportunités
- **5 contacts** Orange

---

## Déploiement GitHub Pages

Le fichier `.github/workflows/deploy.yml` déploie automatiquement sur la branche `gh-pages` à chaque push sur `main`.

### Configuration requise

Dans les paramètres GitHub du dépôt :
- **Settings → Pages** → Source : branche `gh-pages`, dossier `/ (root)`
- **Settings → Actions → General** → Workflow permissions : "Read and write permissions"

L'application sera disponible sur : `https://<username>.github.io/pmo-tracker/`

---

## Structure du projet

```
pmo-tracker/
├── src/
│   ├── components/     # Composants réutilisables (Layout, Modal, Forms...)
│   ├── context/        # AuthContext (Firebase Auth)
│   ├── hooks/          # useCollection (Firestore realtime)
│   ├── pages/          # Dashboard, Pipeline, Actions, Contacts, Detail
│   ├── services/       # Firestore CRUD
│   ├── utils/          # Constantes, helpers (dates, formatage)
│   ├── App.jsx         # Routes + Auth guard
│   ├── firebase.js     # Config Firebase
│   └── main.jsx        # Point d'entrée React
├── scripts/
│   └── seed.js         # Script de seed Firestore
├── .github/workflows/
│   └── deploy.yml      # GitHub Actions CI/CD
├── firestore.rules     # Règles de sécurité Firestore
├── vite.config.js      # Base path /pmo-tracker/
└── tailwind.config.js
```

---

## Fonctionnalités

| Page | Description |
|------|-------------|
| **Dashboard** | KPIs, graphiques Recharts, alertes PMO, filtres globaux |
| **Pipeline** | Kanban par statut, création d'opportunités |
| **Actions PMO** | Table smart avec filtres, édition, actions bulk |
| **Contacts** | Liste avec recherche, liens vers opportunités |
| **Détail Opp.** | Édition inline, historique de statut, onglets |

### Règles PMO appliquées

- Probabilité requise pour Proposal / Négociation / Won / Lost
- "Prochaine étape" requise quand une action passe à "Fait"
- Badge "Stale" si statut inchangé depuis 60+ jours
- Alertes dashboard si aucune action planifiée dans 14 jours
