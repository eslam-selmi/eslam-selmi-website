
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS track_key text,
  ADD COLUMN IF NOT EXISTS phase smallint NOT NULL DEFAULT 1 CHECK (phase BETWEEN 1 AND 3);

CREATE INDEX IF NOT EXISTS courses_track_phase_idx ON public.courses(track_key, phase);
