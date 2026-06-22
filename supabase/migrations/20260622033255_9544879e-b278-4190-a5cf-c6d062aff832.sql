INSERT INTO public.site_content (section_key, label, content, is_visible)
VALUES ('ask_selmi', 'اسأل سلمي', '{}', true)
ON CONFLICT (section_key) DO NOTHING;