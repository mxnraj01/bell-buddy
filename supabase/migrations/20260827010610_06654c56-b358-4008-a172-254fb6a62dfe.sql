
ALTER TABLE public.walktimes DROP CONSTRAINT walktimes_to_classroom_id_fkey;
ALTER TABLE public.walktimes ADD CONSTRAINT walktimes_to_classroom_id_fkey FOREIGN KEY (to_classroom_id) REFERENCES public.classrooms(classroom_id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.class_sessions DROP CONSTRAINT class_sessions_classroom_id_fkey;
ALTER TABLE public.class_sessions ADD CONSTRAINT class_sessions_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(classroom_id) ON UPDATE CASCADE ON DELETE CASCADE;

UPDATE public.classrooms SET classroom_id = 'O1' WHERE classroom_id = 'A101';
UPDATE public.classrooms SET classroom_id = 'O2' WHERE classroom_id = 'A102';
UPDATE public.classrooms SET classroom_id = 'H1' WHERE classroom_id = 'B204';
UPDATE public.classrooms SET classroom_id = 'Q1' WHERE classroom_id = 'B205';
UPDATE public.classrooms SET classroom_id = 'R1' WHERE classroom_id = 'C301';
UPDATE public.classrooms SET classroom_id = 'L1' WHERE classroom_id = 'C302';

UPDATE public.classrooms SET corridor_zone = 'O Block' WHERE corridor_zone = 'Science Wing';
UPDATE public.classrooms SET corridor_zone = 'Q Block' WHERE corridor_zone = 'Gym Corridor';
UPDATE public.classrooms SET corridor_zone = 'HIVE' WHERE corridor_zone = 'Library Corridor';
UPDATE public.classrooms SET corridor_zone = 'R Block' WHERE corridor_zone = 'Arts Corridor';
UPDATE public.classrooms SET corridor_zone = 'L Block' WHERE corridor_zone = 'Main Corridor';

UPDATE public.walktimes SET from_zone = 'O Block' WHERE from_zone = 'Science Wing';
UPDATE public.walktimes SET from_zone = 'Q Block' WHERE from_zone = 'Gym Corridor';
UPDATE public.walktimes SET from_zone = 'HIVE' WHERE from_zone = 'Library Corridor';
UPDATE public.walktimes SET from_zone = 'R Block' WHERE from_zone = 'Arts Corridor';
UPDATE public.walktimes SET from_zone = 'L Block' WHERE from_zone = 'Main Corridor';
