# Déploiement — Lot v3 (interface choriste + annonces + messagerie)

Ce lot corrige l'écart avec les maquettes et ajoute : annonces visibles dans Le Fil,
notifications cliquables, mot de passe oublié, messagerie utilisable, logo admin recadré.

## 1. Base de données (à faire EN PREMIER)

Supabase → **SQL Editor** → colle le contenu de
`supabase/migrations/0003_ui_updates.sql` → **Run**.

> ⚠️ Sans cette étape, la publication d'annonce et le bouton « Envoyer un message »
> renverront une erreur : la migration crée les fonctions nécessaires.

Rien à désactiver : les fonctions sont en `security definer` et ne touchent pas au
trigger `trg_protect_profile`.

## 2. Fichiers à mettre sur GitHub

Nouveaux fichiers :
- `supabase/migrations/0003_ui_updates.sql`
- `public/logo-gold-pad.png`
- `public/logo-pad.png`

Fichiers modifiés :
- `src/App.jsx`
- `src/components/TabBar.jsx`
- `src/components/Layout.jsx`
- `src/theme/global.css`
- `src/routes/chorister/Dashboard.jsx`
- `src/routes/chorister/Feed.jsx`
- `src/routes/chorister/Messages.jsx`
- `src/routes/chorister/Notifications.jsx`
- `src/routes/chorister/MemberPublic.jsx`
- `src/routes/admin/Announcement.jsx`
- `src/routes/admin/AdminHome.jsx`
- `src/routes/auth/Login.jsx`
- `src/routes/auth/Welcome.jsx`

Le plus simple : remplace tout le dossier par le contenu du ZIP, puis « Commit ».
Vercel redéploie automatiquement (~90 s). L'URL ne change pas.

## 3. Realtime (si pas déjà fait)

Supabase → **Database → Publications → `supabase_realtime`** → active la table
`messages` (pour le chat en direct).

## Notes honnêtes

- **Notification « push » système** (bannière hors de l'app) : non incluse. Sur iPhone
  en PWA, elle exige une installation sur l'écran d'accueil + un serveur d'envoi ;
  c'est un lot séparé. Ici, les annonces arrivent dans **Le Fil** + la liste
  **Notifications** (cliquables).
- **Messages non lus (pastille chiffrée)** : non affichée, car la base ne mémorise pas
  encore l'état « lu » par personne. À ajouter dans un lot ultérieur si tu le souhaites.
