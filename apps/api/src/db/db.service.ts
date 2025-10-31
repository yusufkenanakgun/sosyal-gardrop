// apps/api/src/db/db.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DbService implements OnModuleDestroy {
  private pool: Pool;

  constructor(private cfg: ConfigService) {
    const connStr = this.cfg.get<string>('DATABASE_URL');
    this.pool = new Pool(
      connStr
        ? { connectionString: connStr }
        : {
            host: this.cfg.get<string>('PGHOST') ?? 'localhost',
            port: Number(this.cfg.get<string>('PGPORT') ?? 5432),
            user: this.cfg.get<string>('PGUSER') ?? 'postgres',
            password: this.cfg.get<string>('PGPASSWORD') ?? 'postgres',
            database: this.cfg.get<string>('PGDATABASE') ?? 'sw_dev',
          },
    );
  }

  // T: satır tipi; pg'nin temel satır tipi olan QueryResultRow'u genişletir
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: ReadonlyArray<unknown>,
  ): Promise<QueryResult<T>> {
    // ESLint: pg'nin query imzası any[] istediği için tek satırda cast ediyoruz.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.pool.query<T>(text, params as any[] | undefined);
  }

  async tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const out = await fn(client);
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
