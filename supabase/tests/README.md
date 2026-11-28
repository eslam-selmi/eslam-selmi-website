Local RLS tests (embedded Postgres via @electric-sql/pglite, no live database touched).
Run: `npm i --no-save @electric-sql/pglite && node supabase/tests/tenant_isolation.test.mjs`
Limits: SQL-level checks with simulated JWT claims and stub auth/storage. Not an end-to-end or production security proof.
