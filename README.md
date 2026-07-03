# Chorale Divine Providence — PWA

Application mobile (PWA installable) pour une chorale paroissiale : fil, chants, agenda, présences, choriste du mois, messagerie, règlement, aide, et un espace administrateur complet.

**Stack** : React + Vite · PWA (vite-plugin-pwa) · React Router · Supabase (Auth + Postgres + Storage + Realtime) · Phosphor Icons · Google Fonts (Libre Baskerville + Montserrat).

Ce dépôt est **prêt à l'emploi**. Suivez le guide ci-dessous — comptez ~30 min pour être en ligne.

---

## 0. Ce que vous obtenez

- **Frontend** installable sur mobile (Ajouter à l'écran d'accueil), fonctionne hors-ligne pour les vues déjà consultées.
- **Backend Supabase** avec 19 tables, RLS, RPC (`generate_invitation`, `redeem_invitation`, `check_invitation`), 4 buckets Storage, vue d'agrégation des statistiques.
- **Deux rôles** cloisonnés côté DB par RLS : `chorister` et `admin`. Séparation matérielle, pas seulement UI.

---

## 1. Créer le projet Supabase

1. Allez sur https://supabase.com → **New project**.
2. Notez : **Project URL** (`https://xxxx.supabase.co`) et **anon public key** (Settings → API).
3. Ouvrez **SQL Editor** → **New query** → collez le contenu de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**. La migration crée toutes les tables, RLS, RPC et **les 4 buckets Storage** en un seul lancement.
4. **Créer le compte admin** :
   - Allez dans **Authentication → Users → Add user** (invite via email ou create with password).
   - Notez l'email + mot de passe.
   - Revenez dans **SQL Editor** et exécutez :
     ```sql
     update public.profiles
     set role = 'admin', status = 'active', full_name = 'Administrateur'
     where email = 'VOTRE_EMAIL_ADMIN';
     ```
5. **Générer le premier code d'invitation** (que vous partagerez au premier choriste) :
   ```sql
   select * from public.generate_invitation();
   -- Attention : cet appel SQL utilise votre session Studio (service role), pas la RLS.
   -- L'application, elle, appelle cette RPC via l'admin authentifié.
   ```
   → Vous obtenez un code du type `CDP-4B7Q`.

> **Note messagerie** : pour que le chat push en temps réel fonctionne, allez dans **Database → Replication** et activez la réplication pour la table `messages` (channel `supabase_realtime`).

---

## 2. Lancer l'application en local

Prérequis : **Node 18+** et **npm**.

```bash
# 1) Cloner / ouvrir le dossier
cp .env.example .env.local
# 2) Éditer .env.local avec vos valeurs Supabase :
#    VITE_SUPABASE_URL=https://xxxx.supabase.co
#    VITE_SUPABASE_ANON_KEY=eyJhb...

# 3) Installer + démarrer
npm install
npm run dev
# → http://localhost:5173
```

Le premier écran est **Welcome**. Testez le parcours :
- Se connecter en admin → vous atterrissez sur `/admin`.
- Générer un code d'invitation depuis l'écran **Invitations**.
- Ouvrir un onglet privé, revenir à `/`, saisir ce code, créer un compte choriste → activation automatique.

---

## 3. Publier sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# Créez le repo sur https://github.com/new (public ou privé), puis :
git remote add origin https://github.com/VOTRE-USER/chorale-divine-providence.git
git branch -M main
git push -u origin main
```

Le `.gitignore` bloque déjà `node_modules`, `dist`, et surtout `.env*`. Seul `.env.example` est commité.

---

## 4. Déployer sur Vercel

1. Allez sur https://vercel.com → **Add New Project** → sélectionnez votre repo GitHub.
2. Vercel détecte automatiquement Vite (framework auto-détecté). Ne modifiez rien.
3. Dans **Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre anon key
4. **Deploy**. En ~1 min votre app est en ligne (`https://xxxx.vercel.app`).
5. Chaque `git push` sur `main` redéploie automatiquement.

> **PWA** : ouvrez l'URL sur mobile → Chrome/Safari propose « Ajouter à l'écran d'accueil ». L'app s'installe avec l'icône Chorale.

---

## 5. Configurer la chorale (une seule fois, dans l'espace admin)

Connectez-vous en admin, puis remplissez :

- **Bureau & aide** : le lien WhatsApp, l'email de contact, les membres du bureau, la FAQ.
- **Règlement** : les articles numérotés.
- **Chants** : quelques chants avec paroles, audio (MP3) et partition (image ou PDF).
- **Invitations** : générez et partagez un code par nouveau choriste.

---

## Arborescence du projet

```
├─ index.html
├─ vite.config.js         # Vite + PWA (manifest, SW, runtime caching)
├─ vercel.json            # SPA rewrites
├─ .env.example
├─ public/
│  ├─ logo.png            # logo fourni
│  ├─ favicon.png · apple-touch-icon.png
│  └─ icons/              # icônes PWA 192/512/maskable
├─ supabase/
│  └─ migrations/0001_init.sql
└─ src/
   ├─ main.jsx · App.jsx
   ├─ lib/               # supabase, format (dates/initiales)
   ├─ theme/             # tokens + global.css
   ├─ data/enums.js      # pupitres, catégories liturgiques
   ├─ context/           # AuthContext, ToastContext (+ confirm)
   ├─ hooks/useAsync.js
   ├─ components/        # Layout, TabBar, AudioPlayer, ImageUpload + ui/
   └─ routes/
      ├─ guards.jsx      # RequireActive, RequireAdmin, RedirectIfAuthed
      ├─ auth/           # Welcome, Register, Login, LoginAdmin, Pending
      ├─ chorister/      # 14 écrans (Dashboard, Feed, Songs, SongDetail,
      │                  #   Agenda, ChoristOfMonth, Messages, Chat,
      │                  #   Notifications, Profile, Presence, MemberPublic,
      │                  #   Reglement, Help)
      └─ admin/          # 14 écrans (AdminHome, ValidateAccounts,
                         #   Announcement, EventForm, ChoristOfMonthAdmin,
                         #   SongsAdmin, SongEditor, Members, Stats,
                         #   Invitations, ReglementAdmin, ReglementEditor,
                         #   Bureau, BureauEditor)
```

---

## Décisions techniques

- **Séparation des rôles par RLS**. Deux fonctions `SECURITY DEFINER` (`is_admin()`, `is_active_member()`) pilotent les policies. Un trigger empêche un choriste de modifier son propre `role` ou `status`.
- **Onboarding**. Le trigger `handle_new_user` crée le profil en `pending`. Si l'utilisateur saisit un code valide, la RPC `redeem_invitation` le passe en `active` — donc **code valide = accès immédiat**. Sinon, il reste en `pending` et l'admin doit valider depuis l'écran **Valider les comptes**.
- **Storage**. 4 buckets publics en lecture (`avatars`, `feed-photos`, `song-audio`, `song-scores`) avec écriture cloisonnée : chaque choriste peut poster dans le fil, seul l'admin uploade les médias des chants.
- **Statistiques**. Vue SQL `stats_attendance_by_pupitre` agrège présence % + compteurs, directement consommée par l'écran Stats.
- **PWA**. Service worker généré par vite-plugin-pwa avec mise en cache runtime des polices Google et des médias Supabase (StaleWhileRevalidate).
- **Mode sombre**. Toggle dans le profil, persisté en localStorage, appliqué via une classe `.dark` sur `<html>` qui redéfinit les tokens CSS.

---

## Après le déploiement

- **Créer un second admin** : idem qu'à l'étape 1.4 — inscrivez le compte puis `update profiles set role='admin'`.
- **Ré-appliquer une migration** : les futures migrations vont dans `supabase/migrations/000X_xxx.sql`. Exécutez-les dans le SQL Editor.
- **Politique Auth Supabase** : par défaut Supabase envoie un email de confirmation. Pour la démo, désactivez « Confirm email » dans **Authentication → Providers → Email** ; en production, gardez-le activé.

---

## Licence

Projet privé de la Chorale Divine Providence.
