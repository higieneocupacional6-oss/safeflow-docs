import { apiRequest, clearApiCsrf, setApiCsrf } from "@/lib/apiClient";

type FilterOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "in"
  | "is"
  | "contains";

type Filter = { column: string; op: FilterOp; value: unknown };

type ThenableResult<T> = PromiseLike<{ data: T; error: Error | null }> & {
  then: Promise<{ data: T; error: Error | null }>["then"];
};

const wrap = <T>(promise: Promise<T>): ThenableResult<T> => {
  const run = promise
    .then((data) => ({ data, error: null as Error | null }))
    .catch((error: Error) => ({ data: null as T, error }));
  return run as ThenableResult<T>;
};

class QueryBuilder {
  private filters: Filter[] = [];
  private selectCols = "*";
  private orderBy: { column: string; ascending?: boolean }[] = [];
  private limitN?: number;
  private wantSingle = false;
  private wantMaybeSingle = false;
  private action: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload?: Record<string, unknown> | Record<string, unknown>[];
  private conflict?: string;
  private ignoreDuplicates = false;

  constructor(private table: string) {}

  select(columns = "*") {
    this.selectCols = columns;
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    this.action = "insert";
    this.payload = data;
    return this;
  }

  update(data: Record<string, unknown>) {
    this.action = "update";
    this.payload = data;
    return this;
  }

  upsert(
    data: Record<string, unknown> | Record<string, unknown>[],
    opts?: { onConflict?: string; ignoreDuplicates?: boolean },
  ) {
    this.action = "upsert";
    this.payload = data;
    this.conflict = opts?.onConflict;
    this.ignoreDuplicates = opts?.ignoreDuplicates === true;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, op: "gt", value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, op: "gte", value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, op: "lt", value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, op: "lte", value });
    return this;
  }

  like(column: string, value: unknown) {
    this.filters.push({ column, op: "like", value });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.filters.push({ column, op: "ilike", value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, op: "in", value });
    return this;
  }

  is(column: string, value: null | boolean) {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  contains(column: string, value: unknown) {
    this.filters.push({ column, op: "contains", value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy.push({ column, ascending: opts?.ascending });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.wantMaybeSingle = true;
    return this;
  }

  then<TResult1 = { data: any; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return wrap(
      apiRequest<{ data: any }>("/api/data/query", {
        method: "POST",
        csrf: true,
        body: {
          table: this.table,
          action: this.action,
          select: this.selectCols,
          filters: this.filters,
          data: this.payload,
          order: this.orderBy,
          limit: this.limitN,
          single: this.wantSingle,
          maybeSingle: this.wantMaybeSingle,
          onConflict: this.conflict,
          ignoreDuplicates: this.ignoreDuplicates,
        },
      }).then((result) => result.data),
    ).then(onfulfilled, onrejected);
  }
}

class StorageBucket {
  constructor(private bucket: string) {}

  async upload(path: string, file: Blob | File | ArrayBuffer | Uint8Array, opts?: { upsert?: boolean; contentType?: string }) {
    const buffer = file instanceof ArrayBuffer
      ? new Uint8Array(file)
      : file instanceof Uint8Array
        ? file
        : new Uint8Array(await (file as Blob).arrayBuffer());
    let binary = "";
    buffer.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const contentBase64 = btoa(binary);
    try {
      const result = await apiRequest<{ data: { path: string } }>(`/api/files/${this.bucket}/upload`, {
        method: "POST",
        csrf: true,
        body: { path, contentBase64, upsert: opts?.upsert === true, contentType: opts?.contentType },
      });
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async download(path: string) {
    try {
      const response = await fetch(`/api/files/${this.bucket}/download?path=${encodeURIComponent(path)}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Download falhou.");
      const blob = await response.blob();
      return { data: blob, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async remove(paths: string[]) {
    try {
      await apiRequest(`/api/files/${this.bucket}/remove`, {
        method: "POST",
        csrf: true,
        body: { paths },
      });
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async list(prefix = "", _opts?: { limit?: number }) {
    try {
      const result = await apiRequest<{ data: any[] }>(
        `/api/files/${this.bucket}/list?prefix=${encodeURIComponent(prefix)}`,
      );
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async createSignedUrl(path: string, _expiresIn: number) {
    const url = `/api/files/${this.bucket}/download?path=${encodeURIComponent(path)}`;
    return { data: { signedUrl: url }, error: null };
  }
}

export type AuthUser = {
  id: string;
  email: string;
  nome: string;
  ativo: boolean;
  role: "admin" | "usuario";
  mustChangePassword: boolean;
};

export const db = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  rpc(name: string, args?: Record<string, unknown>) {
    return wrap(
      apiRequest<{ data: unknown }>(`/api/rpc/${name}`, {
        method: "POST",
        csrf: name !== "psico_get_public_link" && name !== "psico_submit_resposta",
        body: args ?? {},
      }).then((result) => result.data),
    );
  },
  storage: {
    from(bucket: string) {
      return new StorageBucket(bucket);
    },
  },
  functions: {
    async invoke(name: string, opts?: { body?: unknown }) {
      try {
        if (name === "manage-users") {
          const result = await apiRequest("/api/users/manage", {
            method: "POST",
            csrf: true,
            body: opts?.body ?? {},
          });
          return { data: result, error: null };
        }
        const response = await fetch(`/api/ai/${name}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": (await apiRequest<{ csrfToken: string }>("/api/auth/csrf")).csrfToken
              || "",
          },
          body: JSON.stringify(opts?.body ?? {}),
        });
        // Para invoke legado (psico/aet), lê NDJSON e devolve o result final.
        const text = await response.text();
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        let data: any = null;
        let error: Error | null = null;
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === "result") data = event.data;
            if (event.type === "error") error = new Error(event.error || "Falha na IA");
          } catch {
            /* ignore */
          }
        }
        if (!response.ok && !error) error = new Error(`HTTP ${response.status}`);
        return { data, error };
      } catch (error) {
        return { data: null, error: error as Error };
      }
    },
  },
  channel(_name: string) {
    const noop = {
      on() {
        return noop;
      },
      subscribe() {
        return { unsubscribe() {} };
      },
    };
    return noop;
  },
  removeChannel() {
    return Promise.resolve("ok");
  },
  auth: {
    async getSession() {
      try {
        const me = await apiRequest<{ user: AuthUser }>("/api/auth/me");
        return {
          data: {
            session: {
              user: { id: me.user.id, email: me.user.email },
              access_token: "cookie",
            },
          },
          error: null,
        };
      } catch {
        return { data: { session: null }, error: null };
      }
    },
    async getUser() {
      try {
        const me = await apiRequest<{ user: AuthUser }>("/api/auth/me");
        return {
          data: { user: { id: me.user.id, email: me.user.email } },
          error: null,
        };
      } catch {
        return { data: { user: null }, error: null };
      }
    },
    async signOut() {
      try {
        await apiRequest("/api/auth/logout", { method: "POST", csrf: true });
      } catch {
        /* ignore */
      }
      clearApiCsrf();
      return { error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },
};

export { setApiCsrf, clearApiCsrf };
