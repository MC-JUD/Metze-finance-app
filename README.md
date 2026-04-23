# METZE CARE — Application Finance & Comptabilité

Application interne de finance et comptabilité — déployée sur GitHub Pages, accessible à toute l'équipe.

## 🚀 Lien de l'application

> **https://TON-USERNAME.github.io/metze-finance-app/**

_(remplace TON-USERNAME par ton nom d'utilisateur GitHub)_

---

## 📦 Structure du projet

```
metze-finance-app/
├── .github/
│   └── workflows/
│       └── deploy.yml       ← Déploiement automatique GitHub Actions
├── src/
│   ├── data/
│   │   ├── transactions.js  ← Données Pennylane Mars 2026
│   │   └── sharepoint.js    ← Fichiers SharePoint METZECARE
│   ├── App.jsx              ← Application principale
│   └── main.jsx             ← Point d'entrée React
├── index.html
├── vite.config.js           ← ⚠️ Vérifier le champ `base`
└── package.json
```

---

## ⚙️ Installation locale

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔄 Mettre à jour les données

### Pennylane (transactions)
Modifier le fichier `src/data/transactions.js` et ajouter/modifier les transactions.

### SharePoint (fichiers)
Modifier le fichier `src/data/sharepoint.js` et ajouter/modifier les entrées.

### Airtable
Deux options disponibles :

**Option A+ — Export CSV :**
1. Exporter la table "Sales Dashboard | Facturation" depuis Airtable en CSV
2. Créer `src/data/airtable.js` avec les données
3. Modifier le composant `AirtablePage` dans `App.jsx` pour les afficher

**Option B — Backend proxy (recommandé pour les données live) :**
1. Créer un endpoint sur Vercel/Render/Netlify Functions
2. L'endpoint appelle l'API Airtable avec le token
3. Le frontend appelle cet endpoint

---

## 📤 Déployer une mise à jour

```bash
git add .
git commit -m "Mise à jour données Mars 2026"
git push
```

GitHub Actions se déclenche automatiquement → l'app est publiée en ~2 min.

---

## 🔧 Configuration initiale (première fois)

1. **Vérifier `vite.config.js`** : le champ `base` doit correspondre exactement au nom du repo GitHub
2. **Activer GitHub Pages** : Settings → Pages → Source : GitHub Actions
3. **Pousser le code** : `git push origin main`

---

## 📊 Sources de données

| Source | Connexion | Scope |
|--------|-----------|-------|
| Pennylane | Make "Anthropic CLAUDE V3" | Transactions Mars 2026 |
| Airtable | METZE CARE - NEW PROD | Sales Dashboard / Facturation |
| SharePoint | metzecarecom.sharepoint.com | COMPTABILITE / Rapports |

---

## 👥 Accès équipe

L'URL GitHub Pages est publique. Pour restreindre l'accès :
- Passer le repo en **Private** + utiliser GitHub Pages avec GitHub Pro/Teams
- Ou ajouter une authentification simple (mot de passe dans le localStorage)
