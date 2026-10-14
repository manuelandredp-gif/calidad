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
  private conflictCols: string[] = [];

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
        const where = this.buildWhere();
        const order = this.orderCol
          ? sql` ORDER BY ${sql(this.orderCol)} ${this.orderAsc ? sql`ASC` : sql`DESC`}`
          : sql``;
        result = await sql`SELECT ${this.cols === '*' ? sql`*` : sql.unsafe(this.cols)} FROM ${sql(this.table)} ${where} ${order}`;
      } else if (this.op === 'insert') {
        const rows = Array.isArray(this.data) ? this.data : [this.data];
        const keys = Object.keys(rows[0]);
        result = await sql`INSERT INTO ${sql(this.table)} ${sql(rows as Record<string, unknown>[], ...keys)} RETURNING *`;
      } else if (this.op === 'update') {
        const where = this.buildWhere();
        const data = this.data as Row;
        result = await sql`UPDATE ${sql(this.table)} SET ${sql(data as Record<string, unknown>, ...Object.keys(data))} ${where} RETURNING *`;
      } else if (this.op === 'upsert') {
        const rows = Array.isArray(this.data) ? this.data : [this.data];
        const keys = Object.keys(rows[0]);
        result = await sql`INSERT INTO ${sql(this.table)} ${sql(rows as Record<string, unknown>[], ...keys)} ON CONFLICT DO UPDATE SET ${sql(rows[0] as Record<string, unknown>, ...keys)} RETURNING *`;
      } else {
        const where = this.buildWhere();
        result = await sql`DELETE FROM ${sql(this.table)} ${where} RETURNING *`;
      }

      if (this.isSingle) {
        return { data: result[0] ?? null, error: null };
      }
      return { data: result, error: null };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  }

  private buildWhere() {
    if (this.filters.length === 0) return sql``;
    let where = sql`WHERE `;
    for (let i = 0; i < this.filters.length; i++) {
      const f = this.filters[i];
      if (i > 0) where = sql`${where} AND `;
      if (f.op === 'IN') {
        where = sql`${where} ${sql(f.col)} IN ${sql(f.val as unknown[])}`;
      } else {
        where = sql`${where} ${sql(f.col)} = ${f.val}`;
      }
    }
    return where;
  }

  then(resolve: (val: { data: Row | Row[] | null; error: { message: string } | null }) => void, reject?: (err: unknown) => void) {
    return this.execute().then(resolve, reject);
  }
}

class RpcCaller {
  async call(fn: string, params: Row): Promise<{ data: unknown; error: { message: string } | null }> {
    try {
      await sql`SELECT set_config('app.current_user_id', ${LOCAL_USER_ID}, true)`;
      const args = Object.values(params);
      if (fn === 'save_version') {
        const result = await sql`SELECT public.save_version(${args[0]}::uuid, ${args[1]})`;
        return { data: result[0]?.save_version, error: null };
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
