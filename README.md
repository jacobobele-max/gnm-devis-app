# GN&M — Devis & Factures

Application de gestion des demandes de devis et du suivi des dossiers pour Gabon Nettoyage & Multiservices.

⚠️ Cette version utilise le **stockage local du navigateur** (`localStorage`) : les données restent sur l'appareil utilisé, elles ne sont pas partagées entre plusieurs téléphones/ordinateurs. Pour une version avec une vraie base de données partagée (Supabase), on pourra migrer plus tard.

## Déploiement — étape par étape

### 1. Créer le dépôt GitHub
1. Va sur [github.com/new](https://github.com/new)
2. Nom du dépôt : `gnm-devis-app` (ou autre)
3. Laisse "Public" ou "Private", ne coche rien d'autre
4. Clique "Create repository"

### 2. Envoyer le code sur GitHub
Dans un terminal, à l'intérieur de ce dossier :
```bash
git init
git add .
git commit -m "Première version - app devis GN&M"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/gnm-devis-app.git
git push -u origin main
```
(remplace `TON-COMPTE` par ton nom d'utilisateur GitHub)

### 3. Déployer sur Railway
1. Va sur [railway.app](https://railway.app) et connecte-toi
2. "New Project" → "Deploy from GitHub repo"
3. Choisis le dépôt `gnm-devis-app`
4. Railway détecte automatiquement Node.js. Vérifie que :
   - **Build Command** : `npm run build`
   - **Start Command** : `npm start`
5. Clique "Deploy"
6. Une fois déployé, Railway te donne une URL du type `gnm-devis-app-production.up.railway.app`
7. Dans les paramètres du projet, tu peux activer "Generate Domain" si ce n'est pas déjà fait

### 4. Partager le lien
Cette URL Railway est celle que tu peux envoyer par WhatsApp — elle ouvre l'application directement dans le navigateur, sur n'importe quel téléphone.

## Développement local
```bash
npm install
npm run dev
```
