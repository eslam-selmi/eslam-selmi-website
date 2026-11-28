# Reviewer harness runbook (independent PGlite reconstruction)

Purpose: reproduce the reviewer-run of the writer's 87-check suite plus the reviewer's 28
adversarial checks, fully isolated (no accounts, no live DB, no Docker, no network beyond
the one-time npm install).

## Prerequisites
- Node.js 18+ (reviewer used v22.23.5)
- One-time: `npm install @electric-sql/pglite` in the working directory

## Directory layout
```
workdir/
  package.json                (npm init -y)
  node_modules/               (npm install @electric-sql/pglite)
  review/
    new/
      tenant_isolation.test.mjs            (from the review package, unmodified)
      20261128100000_tenant_foundation.sql (from the review package)
      20261128100000_tenant_foundation.down.sql (from the review package)
      stubs.sql                            (reviewer file: tenant-review-stubs.sql)
      extra-tests.mjs                      (reviewer file: tenant-review-extra-tests.mjs)
    migrations/
      <all 23 files from review package legacy_migrations/>
      20261128100000_tenant_foundation.sql (COPY of the new migration; the test loop
                                            expects it inside the migrations dir)
      20260523120000_stub_extra_columns.sql (reviewer file: tenant-review-stub-columns.sql)
```

## What the reviewer stubs are (and are not)
- `stubs.sql`: Supabase built-ins the sandbox lacks (roles anon/authenticated/service_role,
  auth.users + auth.uid()/auth.role() reading `request.jwt.claim.*`, storage.buckets/objects
  + storage.foldername) and the baseline tables the packaged legacy migrations reference but
  do not create (assignments, assignment_submissions, coupons, coupon_redemptions,
  course_interests, consultation_slots, custom_countries, site_popups, platform_settings,
  support_tickets), plus `create publication supabase_realtime`.
- `20260523120000_stub_extra_columns.sql`: live-DB state that exists via migrations NOT in
  the package: app_role value 'trainer' (confirmed on live by the writer's schema read),
  enrollments.blocked/discount_amount/coupon_code/grace_until, profiles.activation_status,
  courses.total_hours, tool-assets bucket + tool helper functions, two dummy trigger
  functions revoked by 20260523133209.
- The reviewer's stubs are a reconstruction. The writer's own stubs.sql was NOT in the
  review package; if the writer supplies it, diff these against theirs.

## Run
```
cd workdir/review/new
node tenant_isolation.test.mjs     # writer's suite, verbatim
node extra-tests.mjs               # reviewer adversarial + rollback checks
```

## Expected results (reviewer's run, 2026-11-28)
- `tenant_isolation.test.mjs`: `RESULT pass=87 fail=0 (base migrations failing in harness: 1)`
  - The 1 failing base migration is `20260526150000_trainer_rls_isolation.sql`:
    `syntax error at or near "FOR"` (it contains `ON public.*`, invalid on any Postgres,
    and duplicate policy names vs 20260526121700). Expected and load-bearing for finding
    HIGH 2: this file's policies may be only partially present on the live DB.
- `extra-tests.mjs`: `FINAL EXTRA RESULT pass=28 fail=0`, including:
  - A1-A3 PASS = legacy trainer policies DO leak cross-tenant (hole demonstrated)
  - B1-B3 PASS = tenant admin CAN issue certificates w/ arbitrary URL and set money fields
  - C1-C2 PASS = suspended tenant's learners KEEP read access and CAN still enroll
  - D1-D3 PASS = tenant admins CANNOT use course_sessions / submissions / certificates bucket
  - G1-G5 PASS = rollback on owner-only data preserves owner rows and restores tenant-free
    policy definitions
  - H1-H2 PASS = rollback REFUSES when a trainer tenant exists and leaves data intact

## Notes
- PGlite runs as superuser with simulated JWT claims (`set role` + `request.jwt.claim.sub`).
  This exercises real Postgres RLS/policy/trigger semantics but is NOT real Supabase Auth:
  no JWT issuance, no signup triggers, no storage API. It does not replace a real-auth test.
- The test grants `ALL ON ALL TABLES` to anon/authenticated, so GRANT-level misconfig on the
  live DB is invisible to this harness; it tests RLS logic only.
