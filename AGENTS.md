# Project rules

- Keep the administration workspace as a scoped presentation layer within the existing `/admin` route; this preserves its current tab links and data workflows while allowing its visual system to evolve independently of trainee pages.
- Keep the executive overview's attention counts in a focused admin component using the signed-in browser client; existing row-level permissions continue to govern access to the data.
- Route files hold only route config and page assembly; home sections live in `src/components/home/` and admin panels in `src/components/admin/panels/`, keeping routes small and builds fast.
- New or touched data reads use `@tanstack/react-query` with explicit query keys and staleTime; realtime events invalidate those keys instead of refetching manually.
- Hand-written row types derive from the generated `Tables<...>` types (Pick/extend) so they track schema changes.
