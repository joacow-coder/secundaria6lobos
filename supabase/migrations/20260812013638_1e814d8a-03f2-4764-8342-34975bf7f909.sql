CREATE TABLE public.bib_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_role text NOT NULL,
  sender_name text NOT NULL DEFAULT 'Equipo institucional',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bib_message_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.bib_messages(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_role text,
  target_year integer,
  target_person text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bib_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.bib_messages(id) ON DELETE CASCADE,
  reader_key text NOT NULL,
  read_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, reader_key)
);

CREATE INDEX bib_message_targets_message_idx ON public.bib_message_targets(message_id);
CREATE INDEX bib_message_reads_reader_idx ON public.bib_message_reads(reader_key);

GRANT ALL ON public.bib_messages TO service_role;
GRANT ALL ON public.bib_message_targets TO service_role;
GRANT ALL ON public.bib_message_reads TO service_role;

ALTER TABLE public.bib_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_message_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_message_reads ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER bib_messages_touch BEFORE UPDATE ON public.bib_messages
FOR EACH ROW EXECUTE FUNCTION public.bib_touch_updated_at();
CREATE TRIGGER bib_message_reads_touch BEFORE UPDATE ON public.bib_message_reads
FOR EACH ROW EXECUTE FUNCTION public.bib_touch_updated_at();