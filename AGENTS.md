# Project rules

- Program and course cover decorations share CoverReflection and scoped token-based CSS so both stay visually consistent without filtering the underlying media.

- Keep popup notification presentation in the shared Sonner wrapper and scoped global CSS tokens so admin and trainee notifications share site fonts, RTL and both themes without changing notification data workflows.

- Keep administration within the existing `/admin` route and use the shared trainee dashboard surfaces and controls rather than an independent admin theme; this preserves tab links and data workflows while keeping both workspaces visually aligned.
- Keep the executive overview's attention counts in a focused admin component using the signed-in browser client; existing row-level permissions continue to govern access to the data.
- Route files hold only route config and page assembly; home sections live in `src/components/home/` and admin panels in `src/components/admin/panels/`, keeping routes small and builds fast.
- New or touched data reads use `@tanstack/react-query` with explicit query keys and staleTime; realtime events invalidate those keys instead of refetching manually.
- Hand-written row types derive from the generated `Tables<...>` types (Pick/extend) so they track schema changes.
- Homepage text edits are stored as per-language overrides keyed by the original text in site_content `home.text_overrides` and applied to rendered text by `TextEditLayer`; this lets the admin change any text without wiring each string.

- Arabic and English certificates share a fixed-size document in `components/certificates`; the export utility embeds local fonts and media before capture to eliminate network/font races.
- Site logo, public portrait, contact links and footer copy come from `site_content` under `site.profile` through shared query options; all displayed branding and new certificate exports consume that setting without changing login identity or existing issued PDFs.
- Public CMS read policies use separate anon visibility-only and authenticated admin-aware scopes; anonymous policies must not call authenticated-only role functions, so published content remains accessible to signed-out visitors.
- Public country choices use `get_public_custom_countries` with only display fields; section visibility uses `get_public_site_visibility` with flags only, so hidden content and country creator metadata remain protected while public controls keep working.
- Latest-addition reads follow the homepage section visibility; private `public-uploads` reads require ownership or administrator access, while public images retain administrator-issued signed links.
- Below-fold homepage sections use intersection-gated lazy modules with hash-link activation so their code, reads and media do not compete with the first screen.
- Site fonts are local Fontsource subsets with swap behavior and essential weights only; certificate exports still embed their own fonts to avoid external render-blocking requests.
- Known portrait and snapshot originals use immutable optimized asset variants for display, while administrator replacements and full-size lightbox originals remain unchanged.
- Mobile homepage marquees use native swipe rails without repeated copies or background blur; desktop keeps its existing presentation.
- Program, course and consultation covers use shared `site.media` CMS query options and stable program/course keys; administrator uploads retain the existing signed-link storage workflow without altering course records or permissions.
