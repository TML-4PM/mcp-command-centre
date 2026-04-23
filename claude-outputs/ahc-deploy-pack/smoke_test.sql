-- AHC smoke test — run after an attempted signup from the site
-- Expected: SUCCESS row in auth_event_log + matching profiles row

select created_at, status, email, error
from public.auth_event_log
where created_at > now() - interval '1 hour'
order by created_at desc
limit 20;

select p.id, p.email, p.full_name, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where u.created_at > now() - interval '1 hour'
order by u.created_at desc;

select * from cc.v_auth_health order by hr desc limit 10;
select * from cc.v_user_lifecycle;
