-- Correct fleet categories: Yaris = sedan, Agya units = compact.

update public.cars
set category = 'Compact · Unit 1'
where image_url = 'agya-1';

update public.cars
set category = 'Compact · Unit 2'
where image_url = 'agya-2';

update public.cars
set category = 'Sedan'
where image_url = 'yaris-1';
