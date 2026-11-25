-- DRAFT, local only. Private bucket for the tool page and handouts. Nothing here is public.
-- Objects: app/workbook.html (any granted tool), tna/handbook.pdf, tna/original-workbook.xlsx, perf/... later.
INSERT INTO storage.buckets (id, name, public) VALUES ('tool-assets', 'tool-assets', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "granted users read tool assets" ON storage.objects FOR SELECT TO authenticated
 USING (bucket_id = 'tool-assets' AND (
   (split_part(name, '/', 1) = 'app' AND cardinality(public.get_my_tools()) > 0)
   OR (split_part(name, '/', 1) IN ('tna','perf','exam') AND public.has_tool_access(split_part(name, '/', 1)))));
CREATE POLICY "administrators manage tool assets" ON storage.objects FOR ALL TO authenticated
 USING (bucket_id = 'tool-assets' AND public.has_role((SELECT auth.uid()), 'admin'))
 WITH CHECK (bucket_id = 'tool-assets' AND public.has_role((SELECT auth.uid()), 'admin'));
