declare module "bun" {
  export interface SQLOptions {
    url?: string;
    max?: number;
    idleTimeout?: number;
    maxLifetime?: number;
    connectionTimeout?: number;
    prepare?: boolean;
    tls?: boolean | Record<string, unknown>;
  }

  export interface SQL {
    <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
    unsafe<T = unknown>(query: string, params?: unknown[]): Promise<T>;
    begin<T>(fn: (tx: SQL) => Promise<T>): Promise<T>;
    close(options?: { timeout?: number }): Promise<void>;
  }

  export const SQL: { new (options: SQLOptions | string): SQL };
}

declare const Bun: {
  env: Record<string, string | undefined>;
  serve(options: {
    hostname?: string;
    port?: number;
    fetch: (request: Request) => Response | Promise<Response>;
    error?: (error: Error) => Response;
    development?: boolean;
  }): { stop: (closeActiveConnections?: boolean) => void; url: URL };
  password: {
    hash(password: string, options?: { algorithm?: "bcrypt" | "argon2id"; cost?: number }): Promise<string>;
    verify(password: string, hash: string): Promise<boolean>;
  };
  file(path: string): { text(): Promise<string>; json<T = unknown>(): Promise<T> };
  CryptoHasher: new (algorithm: string) => {
    update(data: string | Uint8Array): void;
    digest(encoding: "hex"): string;
  };
};

interface ImportMeta { readonly main: boolean; }
