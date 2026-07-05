/* eslint-disable @typescript-eslint/no-explicit-any */
// Backend factice, en mémoire, activé par EXPO_PUBLIC_DEMO=1.
// Il imite juste ce que `queries.ts` / providers / add-fact utilisent du client
// Supabase (query builder chaînable + RPC + auth + realtime + storage), avec un
// jeu de données seedé, pour pouvoir itérer sur l'UI sans backend réel.
//
// La logique de scoring du vrai backend (2 témoins -> validated -> ledger,
// clôture d'award -> ledger) est rejouée ici pour que le classement bouge en live.

const now = () => new Date().toISOString();
const todayStr = () => new Date().toISOString().slice(0, 10);

let idSeq = 1000;
const uid = (p: string) => `${p}-${idSeq++}`;

export const DEMO_USER_ID = 'u-me';

type Any = Record<string, any>;

// --------------------------------------------------------------------------
// Seed
// --------------------------------------------------------------------------
function seed() {
  const profiles: Any[] = [
    { id: 'u-me', pseudo: 'Max', avatar_url: null, created_at: now() },
    { id: 'u-tom', pseudo: 'Tom', avatar_url: null, created_at: now() },
    { id: 'u-val', pseudo: 'Val', avatar_url: null, created_at: now() },
  ];

  const crews: Any[] = [
    { id: 'c1', name: 'Les Barrels de Popoyo', invite_code: 'POPOYO', created_by: 'u-me', created_at: now() },
  ];

  const crew_members: Any[] = profiles.map((p) => ({
    crew_id: 'c1',
    user_id: p.id,
    joined_at: now(),
  }));

  const trips: Any[] = [
    { id: 't1', crew_id: 'c1', name: 'Trip Nica 🌴', is_active: true, started_at: now(), ended_at: null },
  ];

  const R = (key: string, label: string, points: number, type: string) => ({
    id: `r-${key}`,
    crew_id: 'c1',
    key,
    label,
    points,
    type,
    active: true,
  });
  const score_rules: Any[] = [
    R('barrel', 'Barrel', 3, 'fait'),
    R('vague_jour', 'Vague du jour', 2, 'superlatif'),
    R('engagement', 'Plus gros engagement', 2, 'superlatif'),
    R('barrel_enferme', 'Barrel enfermé', 1, 'fait'),
    R('cascade_jour', 'Cascade du jour', 1, 'superlatif'),
    R('refus', 'Refus / circonstance', -1, 'fait'),
  ];

  const sessions: Any[] = [
    { id: 's1', trip_id: 't1', spot: 'Popoyo Main', date: todayStr(), created_by: 'u-tom', created_at: now() },
  ];

  // Faits du jour (feed de la session)
  const actions: Any[] = [
    { id: 'a1', session_id: 's1', user_id: 'u-tom', rule_id: 'r-barrel', points: 3, status: 'validated', media_url: null, created_at: now() },
    { id: 'a2', session_id: 's1', user_id: 'u-val', rule_id: 'r-refus', points: -1, status: 'proposed', media_url: null, created_at: now() },
    { id: 'a3', session_id: 's1', user_id: 'u-me', rule_id: 'r-barrel_enferme', points: 1, status: 'proposed', media_url: null, created_at: now() },
  ];

  const action_witnesses: Any[] = [
    { action_id: 'a1', user_id: 'u-val', created_at: now() },
    { action_id: 'a1', user_id: 'u-me', created_at: now() },
    { action_id: 'a2', user_id: 'u-tom', created_at: now() }, // 1/2 : à toi (Max) de valider
    { action_id: 'a3', user_id: 'u-tom', created_at: now() }, // ton fait, en attente d'un 2e témoin
  ];

  const awards: Any[] = []; // ouverts par l'utilisateur via "Ouvrir les superlatifs"
  const award_votes: Any[] = [];

  // Ledger (source de vérité du classement) — donne des scores de départ.
  const L = (user_id: string, source_type: string, points: number) => ({
    id: uid('l'),
    trip_id: 't1',
    user_id,
    source_type,
    source_id: uid('src'),
    points,
    created_at: now(),
  });
  const ledger: Any[] = [
    // Tom : 26 cm -> 🍆 x1
    L('u-tom', 'action', 3), L('u-tom', 'action', 3), L('u-tom', 'action', 3),
    L('u-tom', 'action', 3), L('u-tom', 'action', 3), L('u-tom', 'action', 3),
    L('u-tom', 'action', 3), L('u-tom', 'award', 2), L('u-tom', 'action', 3),
    // Val : 21 cm -> 🍆 x1 (juste au palier)
    L('u-val', 'action', 3), L('u-val', 'action', 3), L('u-val', 'action', 3),
    L('u-val', 'action', 3), L('u-val', 'action', 3), L('u-val', 'action', 3),
    L('u-val', 'action', 3),
    // Max (toi) : 17 cm -> 0 🍆, tout proche du palier (gland engorgé)
    L('u-me', 'action', 3), L('u-me', 'action', 3), L('u-me', 'action', 3),
    L('u-me', 'action', 3), L('u-me', 'action', 3), L('u-me', 'award', 2),
  ];

  return { profiles, crews, crew_members, trips, score_rules, sessions, actions, action_witnesses, awards, award_votes, ledger };
}

type DB = ReturnType<typeof seed>;

// --------------------------------------------------------------------------
// Scoring (rejoue les triggers du vrai backend)
// --------------------------------------------------------------------------
function tripOfSession(db: DB, sessionId: string): string | null {
  const s = db.sessions.find((x) => x.id === sessionId);
  const t = s && db.trips.find((x) => x.id === s.trip_id);
  return t ? t.id : null;
}

function addLedger(db: DB, tripId: string | null, userId: string, sourceType: string, sourceId: string, points: number) {
  if (!tripId) return;
  if (db.ledger.some((l) => l.source_type === sourceType && l.source_id === sourceId)) return; // idempotent
  db.ledger.push({ id: uid('l'), trip_id: tripId, user_id: userId, source_type: sourceType, source_id: sourceId, points, created_at: now() });
}

function onWitnessInserted(db: DB, actionId: string) {
  const action = db.actions.find((a) => a.id === actionId);
  if (!action || action.status !== 'proposed') return;
  const count = db.action_witnesses.filter((w) => w.action_id === actionId).length;
  if (count >= 2) {
    action.status = 'validated';
    addLedger(db, tripOfSession(db, action.session_id), action.user_id, 'action', action.id, action.points);
  }
}

// --------------------------------------------------------------------------
// Query builder chaînable et "thenable"
// --------------------------------------------------------------------------
class Builder {
  private filters: { col: string; val: any; kind: 'eq' | 'in' }[] = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private limitN: number | null = null;
  private singleMode: 'single' | 'maybe' | null = null;
  private op: 'select' | 'insert' | 'update' | 'upsert' = 'select';
  private selectStr = '*';
  private payload: any = null;

  constructor(private db: DB, private table: string) {}

  select(str = '*') {
    if (this.op === 'select') this.selectStr = str;
    else this.selectStr = str; // insert/upsert().select()
    this._returnRows = true;
    return this;
  }
  private _returnRows = false;

  insert(payload: any) {
    this.op = 'insert';
    this.payload = payload;
    return this;
  }
  update(payload: any) {
    this.op = 'update';
    this.payload = payload;
    return this;
  }
  upsert(payload: any, _opts?: any) {
    this.op = 'upsert';
    this.payload = payload;
    return this;
  }
  eq(col: string, val: any) {
    this.filters.push({ col, val, kind: 'eq' });
    return this;
  }
  in(col: string, val: any[]) {
    this.filters.push({ col, val, kind: 'in' });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, asc: opts?.ascending !== false };
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.singleMode = 'single';
    return this;
  }
  maybeSingle() {
    this.singleMode = 'maybe';
    return this;
  }

  private base(): Any[] {
    if (this.table === 'user_scores') return this.computeScores();
    return (this.db as any)[this.table] ?? [];
  }

  private computeScores(): Any[] {
    const byUser = new Map<string, { trip: string; total: number }>();
    for (const l of this.db.ledger) {
      const cur = byUser.get(l.user_id) ?? { trip: l.trip_id, total: 0 };
      cur.total += l.points;
      cur.trip = l.trip_id;
      byUser.set(l.user_id, cur);
    }
    return [...byUser.entries()].map(([user_id, v]) => ({
      trip_id: v.trip,
      user_id,
      total_cm: v.total,
      bites_de_surf: Math.floor(v.total / 21),
      reste_cm: v.total - Math.floor(v.total / 21) * 21,
    }));
  }

  private applyFilters(rows: Any[]): Any[] {
    return rows.filter((r) =>
      this.filters.every((f) => (f.kind === 'eq' ? r[f.col] === f.val : (f.val as any[]).includes(r[f.col])))
    );
  }

  private expand(rows: Any[]): Any[] {
    const s = this.selectStr;
    return rows.map((row) => {
      if (this.table === 'crew_members' && s.includes('crews(')) {
        return { crews: this.db.crews.find((c) => c.id === row.crew_id) ?? null };
      }
      if (this.table === 'crew_members' && s.includes('profiles(')) {
        return { profiles: this.db.profiles.find((p) => p.id === row.user_id) ?? null };
      }
      if (this.table === 'actions' && s.includes('rule:')) {
        const rule = this.db.score_rules.find((r) => r.id === row.rule_id);
        const author = this.db.profiles.find((p) => p.id === row.user_id);
        return {
          ...row,
          rule: rule ? { label: rule.label, type: rule.type, points: rule.points } : null,
          author: author ? { pseudo: author.pseudo, avatar_url: author.avatar_url } : null,
          witnesses: this.db.action_witnesses.filter((w) => w.action_id === row.id).map((w) => ({ user_id: w.user_id })),
        };
      }
      if (this.table === 'awards' && s.includes('rule:score_rules')) {
        const rule = this.db.score_rules.find((r) => r.id === row.rule_id);
        return { ...row, rule: rule ? { label: rule.label, points: rule.points } : null };
      }
      return row;
    });
  }

  private exec(): { data: any; error: any } {
    try {
      if (this.op === 'insert') return this.doInsert();
      if (this.op === 'update') return this.doUpdate();
      if (this.op === 'upsert') return this.doUpsert();

      let rows = this.applyFilters(this.base());
      if (this.orderBy) {
        const { col, asc } = this.orderBy;
        rows = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
      }
      if (this.limitN != null) rows = rows.slice(0, this.limitN);
      rows = this.expand(rows);
      if (this.singleMode) return { data: rows[0] ?? null, error: null };
      return { data: rows, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e?.message ?? 'demo error' } };
    }
  }

  private doInsert(): { data: any; error: any } {
    const items = Array.isArray(this.payload) ? this.payload : [this.payload];
    const inserted: Any[] = [];
    for (const item of items) {
      // garde "pas ton propre témoin"
      if (this.table === 'action_witnesses') {
        const action = this.db.actions.find((a) => a.id === item.action_id);
        if (action && action.user_id === item.user_id) {
          return { data: null, error: { message: 'Tu ne peux pas être ton propre témoin.' } };
        }
      }
      const row: Any = { ...item };
      if ('id' in ((this.db as any)[this.table][0] ?? { id: 1 }) && !row.id) row.id = uid(this.table.slice(0, 2));
      if (!row.created_at) row.created_at = now();
      if (this.table === 'actions' && !row.status) row.status = 'proposed';
      if (this.table === 'sessions' && !row.date) row.date = todayStr();
      (this.db as any)[this.table].push(row);
      inserted.push(row);
      if (this.table === 'action_witnesses') onWitnessInserted(this.db, row.action_id);
    }
    return { data: this._returnRows ? (this.singleMode ? inserted[0] : inserted) : null, error: null };
  }

  private doUpdate(): { data: any; error: any } {
    const rows = this.applyFilters(this.base());
    rows.forEach((r) => Object.assign(r, this.payload));
    return { data: this._returnRows ? (this.singleMode ? rows[0] ?? null : rows) : null, error: null };
  }

  private doUpsert(): { data: any; error: any } {
    const items = Array.isArray(this.payload) ? this.payload : [this.payload];
    const table: Any[] = (this.db as any)[this.table];
    const out: Any[] = [];
    for (const item of items) {
      let match: Any | undefined;
      if (this.table === 'profiles') match = table.find((r) => r.id === item.id);
      else if (this.table === 'score_rules') match = table.find((r) => r.crew_id === item.crew_id && r.key === item.key);
      else if (this.table === 'award_votes') match = table.find((r) => r.award_id === item.award_id && r.voter_id === item.voter_id);
      if (match) {
        Object.assign(match, item);
        out.push(match);
      } else {
        const row = { ...item };
        if (this.table === 'score_rules' && !row.id) row.id = uid('r');
        if (!row.created_at && this.table !== 'score_rules') row.created_at = now();
        table.push(row);
        out.push(row);
      }
    }
    return { data: this._returnRows ? (this.singleMode ? out[0] : out) : null, error: null };
  }

  // rend l'objet awaitable
  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    try {
      return Promise.resolve(this.exec()).then(resolve, reject);
    } catch (e) {
      return Promise.resolve({ data: null, error: e }).then(resolve);
    }
  }
}

// --------------------------------------------------------------------------
// RPC
// --------------------------------------------------------------------------
function rpc(db: DB, fn: string, args: any): { data: any; error: any } {
  try {
    if (fn === 'create_crew') {
      const crew = { id: uid('c'), name: args._name, invite_code: (args._name || 'CREW').slice(0, 6).toUpperCase(), created_by: DEMO_USER_ID, created_at: now() };
      db.crews.push(crew);
      db.crew_members.push({ crew_id: crew.id, user_id: DEMO_USER_ID, joined_at: now() });
      db.trips.push({ id: uid('t'), crew_id: crew.id, name: args._trip_name ?? 'Trip 1', is_active: true, started_at: now(), ended_at: null });
      return { data: crew, error: null };
    }
    if (fn === 'join_crew') {
      const crew = db.crews.find((c) => c.invite_code === String(args._code).toUpperCase());
      if (!crew) return { data: null, error: { message: 'Code invalide.' } };
      if (!db.crew_members.some((m) => m.crew_id === crew.id && m.user_id === DEMO_USER_ID)) {
        db.crew_members.push({ crew_id: crew.id, user_id: DEMO_USER_ID, joined_at: now() });
      }
      return { data: crew, error: null };
    }
    if (fn === 'new_trip') {
      db.trips.filter((t) => t.crew_id === args._crew_id && t.is_active).forEach((t) => {
        t.is_active = false;
        t.ended_at = now();
      });
      const trip = { id: uid('t'), crew_id: args._crew_id, name: args._name, is_active: true, started_at: now(), ended_at: null };
      db.trips.push(trip);
      return { data: trip, error: null };
    }
    if (fn === 'open_awards') {
      const session = db.sessions.find((s) => s.id === args._session_id);
      if (!session) return { data: null, error: { message: 'Session introuvable.' } };
      const trip = db.trips.find((t) => t.id === session.trip_id);
      const supers = db.score_rules.filter((r) => r.crew_id === trip?.crew_id && r.type === 'superlatif' && r.active);
      for (const r of supers) {
        if (!db.awards.some((a) => a.session_id === session.id && a.rule_id === r.id)) {
          db.awards.push({ id: uid('aw'), session_id: session.id, rule_id: r.id, winner_user_id: null, status: 'open', created_at: now() });
        }
      }
      return { data: db.awards.filter((a) => a.session_id === session.id), error: null };
    }
    if (fn === 'close_award') {
      const award = db.awards.find((a) => a.id === args._award_id);
      if (!award) return { data: null, error: { message: 'Award introuvable.' } };
      if (award.status === 'closed') return { data: award, error: null };
      const tally = new Map<string, { c: number; first: string }>();
      db.award_votes
        .filter((v) => v.award_id === award.id)
        .forEach((v) => {
          const cur = tally.get(v.nominee_id) ?? { c: 0, first: v.created_at };
          cur.c += 1;
          if (v.created_at < cur.first) cur.first = v.created_at;
          tally.set(v.nominee_id, cur);
        });
      const winner = [...tally.entries()].sort((a, b) => b[1].c - a[1].c || (a[1].first < b[1].first ? -1 : 1))[0];
      award.status = 'closed';
      award.winner_user_id = winner ? winner[0] : null;
      if (winner) {
        const rule = db.score_rules.find((r) => r.id === award.rule_id);
        const session = db.sessions.find((s) => s.id === award.session_id);
        addLedger(db, session?.trip_id ?? null, winner[0], 'award', award.id, rule?.points ?? 0);
      }
      return { data: award, error: null };
    }
    return { data: null, error: { message: `RPC inconnue: ${fn}` } };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? 'demo rpc error' } };
  }
}

// --------------------------------------------------------------------------
// Client factice
// --------------------------------------------------------------------------
export function createDemoClient() {
  const db = seed();
  const session = { user: { id: DEMO_USER_ID, email: 'toi@popoyo.surf' }, access_token: 'demo' };

  return {
    from: (table: string) => new Builder(db, table),
    rpc: async (fn: string, args: any) => rpc(db, fn, args),
    channel: (_name: string) => {
      const ch: any = { on: () => ch, subscribe: () => ch };
      return ch;
    },
    removeChannel: () => {},
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithOtp: async () => ({ data: {}, error: null }),
      verifyOtp: async () => ({ data: { session }, error: null }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async () => ({ data: { path: 'demo' }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
      }),
    },
  };
}
