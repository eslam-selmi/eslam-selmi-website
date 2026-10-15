# Phase 1 progress — actual project structure

**Last updated:** 2026-10-15

## Stack
- TanStack Start v1 (React 19, Vite 7), file routes in `src/routes/`.
- Lovable Cloud backend (database, auth, storage, realtime).
- Tailwind CSS v4 via `src/styles.css`; light/dark theme in `src/lib/theme.tsx`.
- Bilingual Arabic/English with RTL via the in-house provider `src/lib/i18n.tsx` (`useI18n`).
  i18next / react-i18next / zustand were removed; `src/config/i18n.ts`, `src/locales/*`,
  `src/store/*` and `NotificationProvider` do not exist.
- Notifications: `sonner` toasts + `src/lib/notifications.tsx`.

## Code organisation
| Area | Location |
|------|----------|
| Home page route (head + page assembly only) | `src/routes/index.tsx` |
| Home page sections | `src/components/home/` (Nav, Hero, AboutSections, Showcase, Testimonials, Courses, Library, Contact, Footer, Floating, Media, EmpowermentTools, Trainings, shared, data) |
| Home pieces reused by other pages | `src/components/home/index.ts` |
| Admin route (tabs, navigation, page state) | `src/routes/admin.tsx` |
| Admin panels | `src/components/admin/panels/` (Enrollments, EnrollmentDrawer, Courses, CourseContent, CourseAssignments, Coupons, ContentPanels, ActivationsPanel, Finance, CourseLeadsPanel, ui, types) |
| Other admin tools | `src/components/admin/` (ExecutiveOverview, Bookings, Feedback, Partners, Contracts, ...) |
| Trainee portal | `src/routes/portal.tsx` + `src/components/portal/` |
| Booking | `src/components/booking/` |

## Data fetching
- `QueryClient` is created per request in `src/router.tsx` (`defaultPreloadStaleTime: 0`).
- Migrated to `@tanstack/react-query` with caching: admin executive overview counts
  (realtime invalidation) and the trainee course detail page.
- Remaining components still use local `useEffect` loading and are migrated incrementally.

## Types
- Database types come from the generated `src/integrations/supabase/types.ts`.
- Portal (`src/components/portal/types.ts`) and admin course types derive from `Tables<...>`.

## Performance
- `jspdf` and `html-to-image` load only when a certificate is generated (`src/lib/certificate.tsx`).
- `html2canvas`, `i18next`, `react-i18next` removed.

## Done in Phase 1
- Admin redesign (four navigation groups, executive overview, cleaner actions).
- Portal tabs, continue-learning card, calendar export, module notes, live alerts.
- Booking system, course ratings with admin-managed questions and featured homepage reviews.
- Distinct admin/trainee sign-in pages, maintenance bypass for signed-in users.

## Still open
- Migrate remaining panels to react-query.
- Further split very large admin panels (e.g. EnrollmentDrawer, Finance).
