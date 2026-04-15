// Lightweight Supabase REST client with chainable API

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials not configured");
}

// ------------------------------------
// Query Builder
// ------------------------------------

export class QueryBuilder {
  private url: string;
  private key: string;
  private table: string;

  private method: string = "GET";
  private body: any = null;
  private filters: string[] = [];
  private orderBy: string | null = null;
  private selectColumns: string = "*";

  constructor(url: string, key: string, table: string) {
    this.url = url;
    this.key = key;
    this.table = table;
  }

  private buildUrl() {
    let query = `select=${this.selectColumns}`;

    if (this.filters.length) {
      query += `&${this.filters.join("&")}`;
    }

    if (this.orderBy) {
      query += `&order=${this.orderBy}`;
    }

    return `${this.url}/rest/v1/${this.table}?${query}`;
  }

  async execute() {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.key}`,
      apikey: this.key,
      Prefer: "return=representation",
    };

    const res = await fetch(this.buildUrl(), {
      method: this.method,
      headers,
      body: this.body ? JSON.stringify(this.body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: err };
    }

    const data = await res.json().catch(() => null);
    return { data, error: null };
  }

  // -------------------------
  // Chainable methods
  // -------------------------

  select(columns: string = "*") {
    this.method = "GET";
    this.selectColumns = columns;
    return this;
  }

  insert(values: any[]) {
    this.method = "POST";
    this.body = values;
    return this.execute(); // executes immediately
  }

  update(values: any) {
    this.method = "PATCH";
    this.body = values;
    return this;
  }

  delete() {
    this.method = "DELETE";
    return this;
  }

  eq(column: string, value: string | number) {
    this.filters.push(`${column}=eq.${value}`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const dir = options?.ascending === false ? "desc" : "asc";
    this.orderBy = `${column}.${dir}`;
    return this;
  }
}

// ------------------------------------
// Client
// ------------------------------------

class SupabaseClient {
  private url: string;
  private key: string;

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  from(table: string) {
    return new QueryBuilder(this.url, this.key, table);
  }

  getSession() {
    return { data: { session: null } };
  }
}

export const supabase = new SupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);