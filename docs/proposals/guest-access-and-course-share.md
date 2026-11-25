# Proposal: shared guest access and single-course share link (private, nothing applied)

Status: proposal only. No SQL has been run, no migration journal entry exists, nothing is installed.
Both items are free-course browsing features; none touches payments.

## A. Shared guest login (browse all courses without registering)
User ask (20:37): set an email and password in site settings; anyone given them can browse all courses free, no sign-up.

Option A1 (recommended): one real, read-only account.
- A normal auth user `guest@<site>` with a new role `guest` (separate from trainee and admin).
- RLS: SELECT only on published courses and their content (course_modules, items, files). No access to enrollments, profiles, payments, other users' data. No INSERT/UPDATE anywhere; progress, notes, uploads, certificates and feedback are hidden for guests in the UI and blocked by RLS.
- Admin settings screen: "حساب الضيف": on/off, email shown, button "تغيير كلمة المرور" calling a server function (service role) that sets the password. The password is never stored in site_content and never read back.
- Risk: anyone with the credentials shares them further. Mitigation: admin can rotate or switch off in one click; guest cannot see personal data; optional rate limit.
Option A2 (not recommended): store the shared email and password in site_content and match them in the browser. Plain-text secret readable by the client; no.
Option A3: per-course or per-person links (see section B) instead of one shared login.

DB draft (for review, not for execution):
```sql
-- guest role value (if app_role is an enum)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guest';
-- read-only select on published course content; repeat per content table
CREATE POLICY "guest reads published courses" ON public.courses
  FOR SELECT TO authenticated
  USING (active = true AND public.has_role(auth.uid(), 'guest'::app_role));
CREATE POLICY "guest reads course modules" ON public.course_modules
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'guest'::app_role));
```
Table names above follow src/integrations/supabase/types.ts (courses, course_modules); the exact content tables and file-storage policies still need to be listed from the live schema, which I cannot read.

## B. Single-course share link, optional auto-close
Built so far: pure rules and 14 tests (src/lib/course-share-core.ts on feature/course-share-links).
Still to build:
1. Table `course_share_links` (id, course_id, token_hash, expires_at, revoked_at, auto_close, bind_first, claim_hash, closed_at, created_by, created_at). RLS on, no client policies; only server functions (service role) touch it.
2. Server functions: create (admin only, returns the link once), open (GET never claims), start (POST claims, binds first browser), revoke, complete (apply auto_close).
3. Admin UI: "إنشاء رابط" on each course (expiry, auto-close, bind-to-first-browser), list and revoke.
4. Visitor page /c/<token>: read-only course player, no portal account.
5. Optional email-OTP binding (user approved preparing only). Needs the project's email delivery verified first.
Decisions for the user (not in his original words): (1) guest shape A1 vs A3; (2) should share-link visitors be able to submit quiz answers and keep progress, or view only; (3) email-OTP now or later; (4) allow the DB change to be applied by whoever has database access (see blocker).

## C. Real blocker
No access path to the database today: the Lovable project is gated by a Search Console connection owned by another Lovable user, and Lovable does not run migration files that arrive through Git sync. Code can be prepared on branches. The SQL must be applied by someone with database access (user in the Lovable project chat, or an approved route), as an explicit production step.

## D. Next concrete deliverables I can do without any access
- Wire section B as code on the local branch: server function handlers using an injected client, tests with a fake client, admin component and visitor page behind a route, tsc and a harness render. No push.
- Write the exact SQL as a draft file outside the migrations folder.
