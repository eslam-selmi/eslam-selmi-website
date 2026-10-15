# Project rules

- Keep the administration workspace as a scoped presentation layer within the existing `/admin` route; this preserves its current tab links and data workflows while allowing its visual system to evolve independently of trainee pages.
- Keep the executive overview's attention counts in a focused admin component using the signed-in browser client; existing row-level permissions continue to govern access to the data.
- Route files hold only route config and page assembly; home sections live in `src/components/home/` and admin panels in `src/components/admin/panels/`, keeping routes small and builds fast.
- New or touched data reads use `@tanstack/react-query` with explicit query keys and staleTime; realtime events invalidate those keys instead of refetching manually.
- Hand-written row types derive from the generated `Tables<...>` types (Pick/extend) so they track schema changes.
- Homepage text edits are stored as per-language overrides keyed by the original text in site_content `home.text_overrides` and applied to rendered text by `TextEditLayer`; this lets the admin change any text without wiring each string.

- Arabic and English certificates share a fixed-size document in `components/certificates`; the export utility embeds local fonts and media before capture to eliminate network/font races.
- Public portrait, contact links and footer copy come from `site_content` under `site.profile` through a shared query-backed hook; keeping them separate from auth identity prevents website edits from changing login credentials.
