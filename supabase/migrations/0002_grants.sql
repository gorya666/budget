-- New Supabase projects no longer auto-grant table privileges to API roles.
-- Only the server (service_role) may touch the data; anon/authenticated get nothing.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.months, public.entries, public.tasks to service_role;
revoke all on public.months, public.entries, public.tasks from anon, authenticated;
