CREATE TABLE public.feedback_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('stars','yesno','choice','text')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feedback_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.feedback_questions TO authenticated;
GRANT ALL ON public.feedback_questions TO service_role;
ALTER TABLE public.feedback_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read visible questions, admins read all" ON public.feedback_questions FOR SELECT TO authenticated
USING (is_visible OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage questions" ON public.feedback_questions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER feedback_questions_updated_at BEFORE UPDATE ON public.feedback_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- default questions cannot be deleted
CREATE OR REPLACE FUNCTION public.trg_protect_default_question() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.is_default THEN RAISE EXCEPTION 'Default questions can be hidden but not deleted'; END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER protect_default_question BEFORE DELETE ON public.feedback_questions FOR EACH ROW EXECUTE FUNCTION public.trg_protect_default_question();

INSERT INTO public.feedback_questions (key,label_ar,label_en,kind,options,is_default,is_required,sort_order) VALUES
('content_rating','جودة المحتوى','Content quality','stars','[]',true,true,1),
('trainer_rating','أداء المدرب','Trainer','stars','[]',true,true,2),
('expectations_rating','مدى تحقيق توقعاتك','Met your expectations','stars','[]',true,true,3),
('pace','سرعة الشرح كانت','The pace was','choice','[{"value":"slow","ar":"بطيئة","en":"Slow"},{"value":"right","ar":"مناسبة","en":"Just right"},{"value":"fast","ar":"سريعة","en":"Fast"}]',true,true,4),
('would_recommend','هل ترشّح الكورس لغيرك؟','Would you recommend it?','yesno','[]',true,true,5),
('comments','ملاحظاتك واقتراحاتك','Comments & suggestions','text','[]',true,false,6);

ALTER TABLE public.course_feedback
  ALTER COLUMN content_rating DROP NOT NULL,
  ALTER COLUMN trainer_rating DROP NOT NULL,
  ALTER COLUMN expectations_rating DROP NOT NULL,
  ALTER COLUMN would_recommend DROP NOT NULL,
  ALTER COLUMN pace DROP NOT NULL,
  ADD COLUMN answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins update feedback" ON public.course_feedback FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.trg_feedback_feature_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    IF TG_OP = 'INSERT' THEN NEW.is_featured := false;
    ELSE NEW.is_featured := OLD.is_featured; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_feature_guard BEFORE INSERT OR UPDATE ON public.course_feedback FOR EACH ROW EXECUTE FUNCTION public.trg_feedback_feature_guard();

CREATE OR REPLACE FUNCTION public.get_featured_feedback() RETURNS TABLE (
  id uuid, trainee_name text, course_title text, rating numeric, comments text, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id,
    split_part(coalesce(nullif(e.name_ar,''), nullif(p.full_name,''), 'متدرب'), ' ', 1)
      || coalesce(' ' || left(nullif(split_part(coalesce(nullif(e.name_ar,''), p.full_name, ''), ' ', 2),''),1) || '.', ''),
    c.title,
    round((coalesce(f.content_rating,0)+coalesce(f.trainer_rating,0)+coalesce(f.expectations_rating,0))::numeric
      / nullif((f.content_rating IS NOT NULL)::int+(f.trainer_rating IS NOT NULL)::int+(f.expectations_rating IS NOT NULL)::int,0), 1),
    f.comments, f.created_at
  FROM public.course_feedback f
  JOIN public.courses c ON c.id = f.course_id
  LEFT JOIN public.profiles p ON p.id = f.user_id
  LEFT JOIN public.enrollments e ON e.user_id = f.user_id AND e.course_id = f.course_id
  WHERE f.is_featured AND f.comments IS NOT NULL AND length(trim(f.comments)) > 0
  ORDER BY f.created_at DESC LIMIT 24
$$;
GRANT EXECUTE ON FUNCTION public.get_featured_feedback() TO anon, authenticated;