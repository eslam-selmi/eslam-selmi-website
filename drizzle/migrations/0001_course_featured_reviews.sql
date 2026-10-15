CREATE OR REPLACE FUNCTION public.get_course_featured_reviews()
RETURNS TABLE(id uuid, course_id uuid, trainee_name text, rating numeric, content_rating smallint, trainer_rating smallint, would_recommend boolean, comments text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT f.id, f.course_id,
    split_part(coalesce(nullif(e.name_ar,''), nullif(p.full_name,''), 'متدرب'), ' ', 1)
      || coalesce(' ' || left(nullif(split_part(coalesce(nullif(e.name_ar,''), p.full_name, ''), ' ', 2),''),1) || '.', ''),
    round((coalesce(f.content_rating,0)+coalesce(f.trainer_rating,0)+coalesce(f.expectations_rating,0))::numeric
      / nullif((f.content_rating IS NOT NULL)::int+(f.trainer_rating IS NOT NULL)::int+(f.expectations_rating IS NOT NULL)::int,0), 1),
    f.content_rating, f.trainer_rating, f.would_recommend, nullif(trim(f.comments),''), f.created_at
  FROM public.course_feedback f
  JOIN public.courses c ON c.id = f.course_id AND c.active
  LEFT JOIN public.profiles p ON p.id = f.user_id
  LEFT JOIN public.enrollments e ON e.user_id = f.user_id AND e.course_id = f.course_id
  WHERE f.is_featured
  ORDER BY f.created_at DESC LIMIT 200
$$;
GRANT EXECUTE ON FUNCTION public.get_course_featured_reviews() TO anon, authenticated;