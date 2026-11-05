import { drizzle } from 'drizzle-orm/bun-sql';
import { sql } from '../../db';
import * as schema from './schema';

export const orm = drizzle(sql, { schema });
