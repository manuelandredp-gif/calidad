import sql from './client';

const LOCAL_USER_ID = process.env.LOCAL_USER_ID ?? 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const LOCAL_USER_EMAIL = process.env.LOCAL_USER_EMAIL ?? 'admin@qualireq.test';

type Row = Record<string, unknown>;

class QueryBuilder {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private cols = '*';
  private filters: { col: string; op: string; val: unknown }[] = [];
  private data: Row | Row[] = {};
  private orderCol: string | null = null;
  private orderAsc = true;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*') {
    this.op = 'select';
    this.cols = columns;
    return this;
  }

  insert(data: Row | Row[]) {
    this.op = 'insert';
    this.data = data;
    return this;
  }

  update(data: Row) {
    this.op = 'update';
    this.data = data;
    return this;
  }

  upsert(data: Row | Row[]) {
    this.op = 'upsert';
    this.data = data;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: '=', val });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push({ col, op: 'IN', val: vals });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  async execute(): Promise<{ data: Row | Row[] | null; error: { message: string } | null }> {
    try {
      await sql`SELECT set_config('app.current_user_id', ${LOCAL_USER_ID}, true)`;
      let result: Row[];

      if (this.op === 'select') {
        const orderClause = this.orderCol
          ? ` ORDER BY "${this.orderCol}" ${this.orderAsc ? 'ASC' : 'DESC'}`
          : '';
        const whereClause = this.buildWhereString();
        const q = `SELECT ${this.cols === '*' ? '*' : this.cols} FROM "${this.table}"${whereClause}${orderClause}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = (await sql.unsafe(q, this.filterValues() as any[])) as Row[];
      } else if (this.op === 'insert') {
        const rows = Array.isArray(this.data) ? this.data : [this.data];
        const keys = Object.keys(rows[0]);
        const cols = keys.map((k) => `"${k}"`).join(', ');
        const placeholders = rows.map((_, ri) =>
          `(${keys.map((_, ki) => `$${ri * keys.length + ki + 1}`).join(', ')})`
        ).join(', ');
        const vals = rows.flatMap((r) => keys.map((k) => r[k]));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = (await sql.unsafe(
          `INSERT INTO "${this.table}" (${cols}) VALUES ${placeholders} RETURNING *`,
          vals as any[]
        )) as Row[];
      } else if (this.op === 'update') {
        const data = this.data as Row;
        const keys = Object.keys(data);
        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const setVals = keys.map((k) => data[k]);
        const whereClause = this.buildWhereString(keys.length);
        const vals = [...setVals, ...this.filterValues()];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = (await sql.unsafe(
          `UPDATE "${this.table}" SET ${setClause}${whereClause} RETURNING *`,
          vals as any[]
        )) as Row[];
      } else if (this.op === 'upsert') {
        const rows = Array.isArray(this.data) ? this.data : [this.data];
        const keys = Object.keys(rows[0]);
        const cols = keys.map((k) => `"${k}"`).join(', ');
        const placeholders = rows.map((_, ri) =>
          `(${keys.map((_, ki) => `$${ri * keys.length + ki + 1}`).join(', ')})`
        ).join(', ');
        const vals = rows.flatMap((r) => keys.map((k) => r[k]));
        const updateSet = keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(', ');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = (await sql.unsafe(
          `INSERT INTO "${this.table}" (${cols}) VALUES ${placeholders} ON CONFLICT DO UPDATE SET ${updateSet} RETURNING *`,
          vals as any[]
        )) as Row[];
      } else {
        const whereClause = this.buildWhereString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = (await sql.unsafe(
          `DELETE FROM "${this.table}"${whereClause} RETURNING *`,
          this.filterValues() as any[]
        )) as Row[];
      }

      if (this.isSingle) {
        return { data: result[0] ?? null, error: null };
      }
      return { data: result, error: null };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  }

  private buildWhereString(offset = 0): string {
    if (this.filters.length === 0) return '';
    const parts: string[] = [];
    let idx = offset + 1;
    for (const f of this.filters) {
      if (f.op === 'IN') {
        const vals = f.val as unknown[];
        const placeholders = vals.map(() => `$${idx++}`).join(', ');
        parts.push(`"${f.col}" IN (${placeholders})`);
      } else {
        parts.push(`"${f.col}" = $${idx++}`);
      }
    }
    return ` WHERE ${parts.join(' AND ')}`;
  }

  private filterValues(): unknown[] {
    const vals: unknown[] = [];
    for (const f of this.filters) {
      if (f.op === 'IN') {
        vals.push(...(f.val as unknown[]));
      } else {
        vals.push(f.val);
      }
    }
    return vals;
  }

  then(resolve: (val: { data: Row | Row[] | null; error: { message: string } | null }) => void, reject?: (err: unknown) => void) {
    return this.execute().then(resolve, reject);
  }
}

class RpcCaller {
  async call(fn: string, params: Row): Promise<{ data: unknown; error: { message: string } | null }> {
    try {
      await sql`SELECT set_config('app.current_user_id', ${LOCAL_USER_ID}, true)`;
      if (fn === 'save_version') {
        const pid = String(params.pid);
        const pNote = params.p_note != null ? String(params.p_note) : null;
        const result = await sql.unsafe(
          `SELECT public.save_version($1::uuid, $2)`,
          [pid, pNote]
        );
        return { data: (result[0] as Row)?.save_version, error: null };
      }
      return { data: null, error: { message: `Unknown function: ${fn}` } };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  }
}

export function createLocalClient() {
  const rpcCaller = new RpcCaller();

  return {
    from: (table: string) => new QueryBuilder(table),
    rpc: (fn: string, params: Row) => rpcCaller.call(fn, params),
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: LOCAL_USER_ID,
            email: LOCAL_USER_EMAIL,
          },
        },
        error: null,
      }),
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        if (email && password) {
          return {
            data: { user: { id: LOCAL_USER_ID, email: LOCAL_USER_EMAIL } },
            error: null,
          };
        }
        return { data: { user: null }, error: { message: 'Credenciales invalidas' } };
      },
      signOut: async () => ({ error: null }),
    },
  };
}
