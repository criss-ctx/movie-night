# Plan — Identités & données privées

Refactoring en 4 phases pour lier chaque participant à un compte Supabase Auth,
sécuriser le film secret, et poser la fondation du système de votes.

---

## État d'avancement

| Phase | Titre | Statut |
|-------|-------|--------|
| 1 | Lier les profils aux comptes Auth | ✅ Terminé |
| 2 | Magic link (remplace email + mot de passe) | ✅ Terminé |
| 3 | Film secret (`pending_movie`) | 🔶 En test (colonnes tmdb_id/title à supprimer de pending_draw après validation) |
| 4 | Votes / notes | ⬜ À faire |

---

## Phase 1 — Lier les profils aux comptes Auth

> Fondation invisible — aucun changement UI. Toutes les RLS des phases suivantes dépendent de cette jointure.

### Étape 1.1 — Ajouter les colonnes `user_id` et `is_admin` à `profiles`

Dans Supabase Dashboard → **SQL Editor** :

```sql
ALTER TABLE profiles
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
```

### Étape 1.2 — Créer les 4 comptes Auth dans le dashboard

Pour **chaque participant**, dans Supabase Dashboard → **Authentication** → **Users** :

1. Cliquer sur **"Add user"** (bouton en haut à droite)
2. Saisir l'adresse email du participant
3. Cocher **"Auto Confirm User"** (ainsi pas besoin d'une vérification d'email préalable — ils se connecteront via magic link de toute façon)
4. Cliquer **"Create user"**
5. L'utilisateur apparaît dans la liste — cliquer sur sa ligne pour voir son **UUID** (format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
6. **Copier et noter ce UUID** quelque part temporairement

Répéter pour les 4 participants.

### Étape 1.3 — Lier les profils à leurs comptes

Dans **SQL Editor**, remplacer les UUIDs et noms par les valeurs réelles :

```sql
UPDATE profiles SET user_id = 'uuid-du-participant-1' WHERE id = 1;
UPDATE profiles SET user_id = 'uuid-du-participant-2' WHERE id = 2;
UPDATE profiles SET user_id = 'uuid-du-participant-3' WHERE id = 3;
UPDATE profiles SET user_id = 'uuid-du-participant-4' WHERE id = 4;
```

Puis marquer ton propre profil comme admin :
```sql
UPDATE profiles SET is_admin = true WHERE id = <ton_id>;
```

Vérification :
```sql
SELECT id, name, user_id, is_admin FROM profiles ORDER BY id;
-- Toutes les lignes doivent avoir un user_id non-null
-- Ta ligne doit avoir is_admin = true
```

### Étape 1.4 — Mettre à jour les RLS policies

Actuellement les policies écrivent/lisent sans contrôle d'identité fine. À renforcer :

Un helper réutilisable à créer **une seule fois** (évite de dupliquer la logique admin dans chaque policy) :
```sql
-- Helper : vérifie si l'utilisateur connecté est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Table `journal`** :
```sql
-- Tout authentifié peut insérer (inchangé)
-- UPDATE/DELETE : auteur du profil OU admin
CREATE POLICY "owner or admin can modify journal"
ON journal FOR ALL
USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  OR is_admin()
)
WITH CHECK (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  OR is_admin()
);
```

**Table `profiles`** — lecture publique, écriture admin uniquement (déjà OK)

**Table `pending_draw`** :
```sql
-- Propriétaire du tirage OU admin peut modifier/supprimer
CREATE POLICY "owner or admin can write pending_draw"
ON pending_draw
FOR ALL
USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  OR is_admin()
)
WITH CHECK (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  OR is_admin()
);
```

---

## Phase 2 — Magic link

> Remplace `signInWithPassword` par `signInWithOtp`. Déployable indépendamment.

### Fichiers à modifier

- `app/composables/useAuth.ts` — changer `signInWithPassword` → `signInWithOtp`
- `app/components/LoginModal.vue` — supprimer le champ password, ajouter l'état "email envoyé"

### Comportement cible

```
User saisit email → clic "Envoyer le lien"
→ état "Vérifie ta boîte mail 📬" (pas de redirect)
→ l'utilisateur clique sur le lien dans son email
→ il est authentifié, la modale se ferme, l'action en attente s'exécute
```

---

## Phase 3 — Film secret (`pending_film`)

> Scinder `pending_draw` : la partie publique reste, le film choisi devient privé.

### Principe

| Donnée | Visibilité |
|--------|-----------|
| `profile_id`, `year`, `drawn_at` | Tout le monde |
| `tmdb_id`, `title` (film choisi) | **Owner uniquement** |

### Étapes SQL (à exécuter dans cet ordre)

```sql
-- 1. Créer la table pending_film
CREATE TABLE pending_film (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pending_draw_id BIGINT REFERENCES pending_draw(id) ON DELETE CASCADE,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE SET NULL,
  tmdb_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activer RLS
ALTER TABLE pending_film ENABLE ROW LEVEL SECURITY;

-- 3. Policy : visible uniquement par l'owner
CREATE POLICY "owner can read pending_film"
ON pending_film FOR SELECT
USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
);

CREATE POLICY "owner can write pending_film"
ON pending_film FOR ALL
USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
)
WITH CHECK (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
);
```

⚠️ **Ne pas encore supprimer `tmdb_id`/`title` de `pending_draw`** — attendre que le code soit déployé, puis :
```sql
ALTER TABLE pending_draw DROP COLUMN tmdb_id, DROP COLUMN title;
```

### Fichiers à modifier (code)

- `app/types/index.ts` — ajout de `PendingFilm`, mise à jour de `PendingDraw` (sans `tmdb_id`/`title`)
- `app/composables/usePendingDraw.ts` — `load()` joint `pending_film` si owner, `setFilm()` insère dans `pending_film`
- `app/pages/add.vue` — la bannière affiche le film **seulement si** `pendingFilm` est retourné
- `app/pages/movie/[id].vue` — bouton "Choisir ce film" appelle le nouveau `setFilm()`
- `app/pages/discover/[year].vue` — bouton +/✓ appelle le nouveau `setFilm()`

---

## Phase 4 — Votes / notes

> Nouvelle feature, non bloquante. Requiert la Phase 1 pour fonctionner correctement.

### SQL

```sql
CREATE TABLE votes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  journal_id BIGINT REFERENCES journal(id) ON DELETE CASCADE NOT NULL,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE SET NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journal_id, profile_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tout le groupe voit les votes)
CREATE POLICY "votes are public"
ON votes FOR SELECT USING (true);

-- Écriture uniquement par l'owner du vote
CREATE POLICY "owner can write vote"
ON votes FOR ALL
USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
)
WITH CHECK (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
);
```

### Fichiers à créer / modifier

- `app/types/index.ts` — ajout de `Vote`
- `app/composables/useVotes.ts` — `loadVotes(journalId)`, `castVote(journalId, profileId, rating)`, `updateVote(...)`
- `app/pages/entry/[id].vue` — section votes (affichage + interaction)
