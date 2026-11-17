import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Generation and builds do not need a database or a local .env file.
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
