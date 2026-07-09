-- End June promo: restore standard daily rates.

update public.cars
set daily_price = 55
where image_url in ('agya-1', 'agya-2');

update public.cars
set daily_price = 65
where image_url = 'yaris-1';
