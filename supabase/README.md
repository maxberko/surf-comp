# PoyPoyo Surf — Backend Supabase

Tout le backend tient dans les migrations SQL de `migrations/`. Elles s'appliquent
dans l'ordre (schéma → fonctions/triggers → RLS).

## Appliquer le schéma

### Option A — Dashboard (le plus rapide pour démarrer)
1. Crée un projet sur [supabase.com](https://supabase.com).
2. Ouvre **SQL Editor** et exécute, dans l'ordre :
   - `migrations/0001_schema.sql`
   - `migrations/0002_functions.sql`
   - `migrations/0003_rls.sql`
3. Récupère l'URL du projet + l'anon key dans **Project Settings → API**, mets-les
   dans `.env` à la racine (voir `.env.example`).
4. Active **Auth → Email** (magic link) et ajoute ton scheme de redirection
   `poypoyo://` (+ `http://localhost:8081` pour le web) dans **URL Configuration**.

### Option B — CLI
```bash
supabase link --project-ref <ref>
supabase db push          # applique migrations/
```

## Modèle mental du scoring

- **Fait** (`type='fait'`) : le rider crée une `action` (`proposed`, `points` = snapshot
  du barème). Les autres ajoutent un `action_witness`. Le trigger
  `trg_witness_validate` passe l'action à `validated` dès **2 témoins**, puis
  `trg_action_to_ledger` écrit **une** ligne dans `ledger`.
- **Superlatif** (`type='superlatif'`) : en fin de session, `open_awards(session_id)`
  crée un award par règle superlatif. Chacun vote (`award_votes`). `close_award(award_id)`
  désigne le gagnant (le plus voté ; égalité → vote reçu le plus tôt) et écrit dans `ledger`.
- **Bites de surf** : `floor(total_cm / 21)`, le reste (`reste_cm`) est reporté. Vue `user_scores`.
- **Reset** : `new_trip(crew_id, name)` clôt le trip actif et en ouvre un neuf → classement à zéro,
  l'historique reste dans `ledger`.

## Anti-double-comptage
`ledger` a un `unique (source_type, source_id)` : une action validée ou un award clôturé
ne peuvent produire qu'une seule écriture, même si les triggers/RPC sont rejoués.

## RPC exposées au client
| RPC | Rôle |
|---|---|
| `create_crew(name, trip_name)` | crée crew + membre + barème par défaut + 1er trip actif |
| `join_crew(code)` | rejoint un crew via son invite_code |
| `new_trip(crew_id, name)` | clôt le trip actif, en ouvre un nouveau (reset) |
| `open_awards(session_id)` | ouvre les awards superlatif de la session |
| `close_award(award_id)` | clôt un award et attribue les points |
