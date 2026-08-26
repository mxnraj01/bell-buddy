
CREATE TABLE public.students (
  student_id text PRIMARY KEY CHECK (student_id ~ '^[0-9]{6}$'),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon, authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.classrooms (
  classroom_id text PRIMARY KEY,
  name text NOT NULL,
  corridor_zone text NOT NULL,
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classrooms TO anon, authenticated;
GRANT ALL ON public.classrooms TO service_role;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open classrooms" ON public.classrooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.bell_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label text NOT NULL,
  bell_time time NOT NULL,
  end_time time NOT NULL,
  period_type text NOT NULL DEFAULT 'Class',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bell_schedule TO anon, authenticated;
GRANT ALL ON public.bell_schedule TO service_role;
ALTER TABLE public.bell_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open bell_schedule" ON public.bell_schedule FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.walktimes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_zone text NOT NULL,
  to_classroom_id text NOT NULL REFERENCES public.classrooms(classroom_id) ON DELETE CASCADE,
  walk_time_seconds integer NOT NULL DEFAULT 30 CHECK (walk_time_seconds >= 0),
  UNIQUE (from_zone, to_classroom_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.walktimes TO anon, authenticated;
GRANT ALL ON public.walktimes TO service_role;
ALTER TABLE public.walktimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open walktimes" ON public.walktimes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.class_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id text NOT NULL REFERENCES public.classrooms(classroom_id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  bell_time time NOT NULL,
  period_label text NOT NULL,
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  counted boolean NOT NULL DEFAULT false,
  broken boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (classroom_id, session_date, bell_time)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_sessions TO anon, authenticated;
GRANT ALL ON public.class_sessions TO service_role;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open class_sessions" ON public.class_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.attendance_records (
  record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  session_id uuid NOT NULL REFERENCES public.class_sessions(session_id) ON DELETE CASCADE,
  tap_timestamp timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('on-time','late')),
  valid boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO anon, authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open attendance" ON public.attendance_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.lateness_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.attendance_records(record_id) ON DELETE CASCADE,
  reason_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lateness_reasons TO anon, authenticated;
GRANT ALL ON public.lateness_reasons TO service_role;
ALTER TABLE public.lateness_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open lateness_reasons" ON public.lateness_reasons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.reason_categories (
  reason_code text PRIMARY KEY,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'HelpCircle',
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reason_categories TO anon, authenticated;
GRANT ALL ON public.reason_categories TO service_role;
ALTER TABLE public.reason_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open reason_categories" ON public.reason_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.reward_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  streak_threshold integer NOT NULL DEFAULT 15 CHECK (streak_threshold > 0),
  reward_label text NOT NULL DEFAULT 'Pizza Party Unlock'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reward_config TO anon, authenticated;
GRANT ALL ON public.reward_config TO service_role;
ALTER TABLE public.reward_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open reward_config" ON public.reward_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_at timestamptz NOT NULL DEFAULT now(),
  student_id_attempted text,
  error_type text NOT NULL,
  raw_input text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_log TO anon, authenticated;
GRANT ALL ON public.error_log TO service_role;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open error_log" ON public.error_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.students (student_id, name) VALUES
 ('100241','Amelia Nguyen'),('100242','Jack Thompson'),('100243','Priya Sharma'),
 ('100244','Liam O''Brien'),('100245','Sofia Rossi'),('100246','Noah Chen'),
 ('100247','Isla Mackenzie'),('100248','Ethan Kowalski'),('100249','Grace Adeyemi'),
 ('100250','Oliver Bennett'),('100251','Mia Petrov'),('100252','Lucas Fernandes'),
 ('100253','Chloe Yamamoto'),('100254','Harrison Patel'),('100255','Zara Ahmed'),
 ('100256','Ruby Callaghan'),('100257','Felix Mwangi'),('100258','Ava Lindqvist');

INSERT INTO public.classrooms (classroom_id, name, corridor_zone, current_streak) VALUES
 ('A101','Science Lab 1','Science Wing',12),
 ('A102','Science Lab 2','Science Wing',4),
 ('B204','Senior Maths','Library Corridor',7),
 ('B205','Sports Theory','Gym Corridor',0),
 ('C301','Art Studio','Arts Corridor',9),
 ('C302','English 3','Main Corridor',2);

INSERT INTO public.bell_schedule (period_label, bell_time, end_time, period_type) VALUES
 ('Homeroom','08:45','09:00','Homeroom'),
 ('Period 1','09:00','09:50','Class'),
 ('Period 2','09:50','10:40','Class'),
 ('Recess','10:40','11:00','Break'),
 ('Period 3','11:00','11:50','Class'),
 ('Period 4','11:50','12:40','Class'),
 ('Lunch','12:40','13:30','Break'),
 ('Period 5','13:30','14:20','Class'),
 ('Period 6','14:20','15:10','Class');

INSERT INTO public.walktimes (from_zone, to_classroom_id, walk_time_seconds)
SELECT z.zone, c.classroom_id,
  CASE WHEN z.zone = c.corridor_zone THEN 20 ELSE 40 + ((z.ord * 7 + length(c.classroom_id) * 5 + ascii(right(c.classroom_id,1))) % 6) * 10 END
FROM (VALUES ('Science Wing',1),('Gym Corridor',2),('Library Corridor',3),('Arts Corridor',4),('Main Corridor',5)) AS z(zone, ord)
CROSS JOIN public.classrooms c;

INSERT INTO public.reason_categories (reason_code, label, icon, sort_order) VALUES
 ('locker','Locker','Package',1),
 ('bathroom','Bathroom','Droplets',2),
 ('teacher','Held up by Teacher','UserCheck',3),
 ('friends','Talking with Friends','MessageCircle',4),
 ('lost','Got Lost','Compass',5),
 ('other','Other','HelpCircle',6);

INSERT INTO public.reward_config (id, streak_threshold, reward_label) VALUES (1, 15, 'Pizza Party Unlock');
