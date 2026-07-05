# 🏄‍♂️ PoyPoyo Surf

Scoreboard de surf entre potes. Chaque session, chacun logge ses faits d'armes, ça
rapporte des points (unité maison : le **cm**), classement en temps réel, et chaque
palier de **21 cm = 1 bite de surf** (cumulables). Reset **par trip**.

- **Front** : React Native + Expo (expo-router), une base iOS / Android / Web.
- **Back** : Supabase — Auth (magic link), Postgres + RLS, Realtime, Storage.
- **State** : TanStack Query + subscriptions Supabase Realtime.

## Démarrage rapide

```bash
# 1. Dépendances
npm install

# 2. Backend Supabase
#    Applique supabase/migrations/*.sql (dashboard ou CLI) — voir supabase/README.md
#    Crée un bucket Storage public "media" (preuves optionnelles).

# 3. Config
cp .env.example .env         # renseigne URL + anon key du projet Supabase

# 4. Lancer
npm start                    # puis 'i' (iOS), 'a' (Android), 'w' (web) ou Expo Go
```

### Mode démo (sans backend)

Pour itérer sur l'UI sans projet Supabase, lance en **mode démo** : un backend
factice en mémoire (crew + riders + faits + votes seedés) remplace Supabase, et la
logique de scoring (2 témoins → validé → ledger, clôture d'award) est rejouée en
local pour que le classement bouge en direct.

```bash
EXPO_PUBLIC_DEMO=1 npm run web      # ou: EXPO_PUBLIC_DEMO=1 npx expo start --web
```

Tu es auto-connecté en tant que « Toi » dans le crew « Les Barrels de Popoyo ».
Le code vit dans `src/lib/demo.ts` (aucun impact sur le vrai backend).

> Auth : active **Email → magic link** dans Supabase, et ajoute `poypoyo://` (natif)
> + `http://localhost:8081` (web) dans **Auth → URL Configuration**. En Expo Go, le
> code à 6 chiffres reçu par email fonctionne aussi (écran de login).

## Comment ça marche

| Concept | Règle |
|---|---|
| **Unité** | le cm. Barème éditable par crew (seedé par défaut). |
| **Fait** | auto-déclaré (`proposed`), validé dès **2 témoins** → 1 écriture ledger. Contestable avant validation. |
| **Superlatif** | 1 award/règle en fin de session, au vote ; le plus voté gagne (égalité → vote le plus ancien). |
| **Bite de surf** | `floor(total_cm / 21)`, le reste est reporté automatiquement. |
| **Classement** | `order by bites_de_surf desc, reste_cm desc`. |
| **Reset** | nouveau trip → classement à zéro, l'historique reste dans le ledger. |
| **Média** | preuve optionnelle, **aucun bonus de points**. |

Toute la logique de points vit côté Postgres (triggers + RPC SECURITY DEFINER) : le
client n'écrit jamais dans `ledger`. Détails dans [`supabase/README.md`](./supabase/README.md).

## Structure

```
app/                       # routes expo-router
  (auth)/login             # magic link + code OTP
  (auth)/onboarding        # pseudo / avatar
  crew                     # créer / rejoindre un crew
  join/[code]              # deep link d'invitation
  (app)/(tabs)/index       # 🏆 Classement (view user_scores, realtime)
  (app)/(tabs)/session     # 🌊 Feed des faits + témoins/contestation
  (app)/(tabs)/votes       # 🗳️  Superlatifs du soir
  (app)/(tabs)/rules       # 📖 Barème éditable + invitation
  (app)/add-fact           # Logger un fait (+ preuve optionnelle), modal
  (app)/profile/[id]       # cm, bites, journal du trip
src/
  lib/        supabase, queries (TanStack Query + realtime), types, format
  providers/  Auth, Crew (crew actif persisté)
  components/  UI kit, Avatar, BiteMeter, PalierCelebration
  theme/      palette
supabase/
  migrations/ 0001 schéma · 0002 fonctions/triggers · 0003 RLS + realtime
```

## Écrans (spec)

| Route | Écran |
|---|---|
| `/(auth)/login` | Login magic link |
| `/(app)/(tabs)` | Classement (cm + bites, trip courant) |
| `/(app)/(tabs)/session` | Session du jour (feed + validation) |
| `/(app)/add-fact` | Ajouter un fait (modal) |
| `/(app)/(tabs)/votes` | Votes du soir |
| `/(app)/profile/[id]` | Profil (cm, bites, journal) |
| `/(app)/(tabs)/rules` | Règles (barème éditable) |
| `/join/[code]` | Rejoindre un crew via lien |

## Périmètre

- **MVP (livré)** : 1 crew, barème éditable, log + validation témoins, votes superlatifs,
  classement + bites de surf, trips, realtime, notifs in-app (feed), animation de palier.
- **V2 (hors scope)** : multi-crews avancé, push (Expo Notifications), stats, carto des
  spots, mur de la honte, partage Insta, classement all-trips.
