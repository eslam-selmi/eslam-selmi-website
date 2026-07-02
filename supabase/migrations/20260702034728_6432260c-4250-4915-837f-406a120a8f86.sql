
-- Table for admin-managed career snapshots (Moments)
CREATE TABLE public.snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption_ar TEXT,
  caption_en TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.snapshots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.snapshots TO authenticated;
GRANT ALL ON public.snapshots TO service_role;

ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Snapshots readable by everyone"
  ON public.snapshots FOR SELECT
  USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert snapshots"
  ON public.snapshots FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update snapshots"
  ON public.snapshots FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete snapshots"
  ON public.snapshots FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER snapshots_set_updated
  BEFORE UPDATE ON public.snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
