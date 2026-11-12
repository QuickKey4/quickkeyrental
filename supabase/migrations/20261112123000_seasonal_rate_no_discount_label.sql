-- Seasonal rates are not discounts — don't surface a discount label on the public site.
create or replace function public.resolve_effective_daily_price(
  p_car_id uuid,
  p_at timestamptz default now()
)
returns table (
  base_price numeric,
  effective_price numeric,
  discount_id uuid,
  discount_label text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_base numeric;
  v_image_url text;
  v_period public.pricing_rate_periods%rowtype;
  v_discount public.pricing_discounts%rowtype;
begin
  select c.daily_price, c.image_url
  into v_base, v_image_url
  from public.cars c
  where c.id = p_car_id;

  if v_base is null then
    return;
  end if;

  base_price := v_base;

  select r.*
  into v_period
  from public.pricing_rate_periods r
  where r.is_active = true
    and p_at >= r.starts_at
    and p_at < r.ends_at
    and public.pricing_rate_period_applies_to_car(r, p_car_id, v_image_url)
  order by r.created_at desc
  limit 1;

  if v_period.id is not null then
    effective_price := round(v_period.daily_price);
    discount_id := null;
    discount_label := null;
    return next;
    return;
  end if;

  select d.*
  into v_discount
  from public.pricing_discounts d
  where d.is_active = true
    and p_at >= d.starts_at
    and p_at < d.ends_at
    and public.pricing_discount_applies_to_car(d, p_car_id, v_image_url)
  order by d.created_at desc
  limit 1;

  if v_discount.id is null then
    effective_price := v_base;
    discount_id := null;
    discount_label := null;
    return next;
    return;
  end if;

  effective_price := public.compute_discounted_daily_price(
    v_base,
    v_discount.discount_type,
    v_discount.discount_value
  );
  discount_id := v_discount.id;
  discount_label := v_discount.name;
  return next;
end;
$$;
