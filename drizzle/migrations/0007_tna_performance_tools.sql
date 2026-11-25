-- TNA and Performance tools: per-user grants and private per-user workspaces.
-- Display on the home page and top menu reuses site_content flags (no new visibility system).
-- Admins manage grants. Admins have NO read policy on workspaces.

CREATE TABLE public.tool_access (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 tool text NOT NULL CHECK (tool IN ('tna','perf')),
 granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 granted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, tool)
);
GRANT SELECT ON public.tool_access TO authenticated;
GRANT INSERT, DELETE ON public.tool_access TO authenticated;
GRANT ALL ON public.tool_access TO service_role;
ALTER TABLE public.tool_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own tool grants" ON public.tool_access FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "administrators read tool grants" ON public.tool_access FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "administrators add tool grants" ON public.tool_access FOR INSERT TO authenticated WITH CHECK (public.has_role((SELECT auth.uid()), 'admin') AND granted_by = (SELECT auth.uid()));
CREATE POLICY "administrators remove tool grants" ON public.tool_access FOR DELETE TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Server-side check used by every workspace policy. Preserves the existing activation rule:
-- a pending or rejected profile has no tool access. Admin accounts are not special-cased.
CREATE FUNCTION public.has_tool_access(_tool text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.tool_access a JOIN public.profiles p ON p.id = a.user_id
  WHERE a.user_id = auth.uid() AND a.tool = _tool AND p.activation_status = 'active') $$;
REVOKE ALL ON FUNCTION public.has_tool_access(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_tool_access(text) TO authenticated, service_role;

CREATE FUNCTION public.get_my_tools()
RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE(array_agg(a.tool ORDER BY a.tool), '{}') FROM public.tool_access a JOIN public.profiles p ON p.id = a.user_id
  WHERE a.user_id = auth.uid() AND p.activation_status = 'active' $$;
REVOKE ALL ON FUNCTION public.get_my_tools() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_tools() TO authenticated, service_role;

CREATE TABLE public.tool_workspaces (
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 tool text NOT NULL CHECK (tool IN ('tna','perf')),
 data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(data) <= 2000000),
 revision integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, tool)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_workspaces TO authenticated;
GRANT ALL ON public.tool_workspaces TO service_role;
ALTER TABLE public.tool_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads workspace" ON public.tool_workspaces FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) AND public.has_tool_access(tool));
CREATE POLICY "owner creates workspace" ON public.tool_workspaces FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND public.has_tool_access(tool));
CREATE POLICY "owner updates workspace" ON public.tool_workspaces FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()) AND public.has_tool_access(tool)) WITH CHECK (user_id = (SELECT auth.uid()) AND public.has_tool_access(tool));
CREATE POLICY "owner deletes workspace" ON public.tool_workspaces FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- Version history: last saved snapshots, owner only.
CREATE TABLE public.tool_workspace_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 tool text NOT NULL CHECK (tool IN ('tna','perf')),
 data jsonb NOT NULL CHECK (pg_column_size(data) <= 2000000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tool_workspace_versions_owner ON public.tool_workspace_versions(user_id, tool, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.tool_workspace_versions TO authenticated;
GRANT ALL ON public.tool_workspace_versions TO service_role;
ALTER TABLE public.tool_workspace_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads versions" ON public.tool_workspace_versions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) AND public.has_tool_access(tool));
CREATE POLICY "owner creates versions" ON public.tool_workspace_versions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND public.has_tool_access(tool));
CREATE POLICY "owner deletes versions" ON public.tool_workspace_versions FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- Display flags (hidden by default). Shown/hidden from the existing admin visibility tab.
INSERT INTO public.site_content (section_key, label, content, is_visible) VALUES
 ('home.tna_tool','قسم: أداة تحليل الاحتياجات التدريبية / TNA tool','{}'::jsonb,false),
 ('home.perf_tool','قسم: أداة قياس الأداء قبل التدريب / Performance tool','{}'::jsonb,false),
 ('nav.tna_tool','قائمة: تحليل الاحتياجات التدريبية / TNA','{}'::jsonb,true),
 ('nav.perf_tool','قائمة: قياس الأداء قبل التدريب / Performance','{}'::jsonb,false)
ON CONFLICT (section_key) DO NOTHING;
