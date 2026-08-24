-- Recent Supabase CLI versions stopped auto-exposing newly created tables,
-- views and functions to the Data API roles (see the `auto_expose_new_tables`
-- note in supabase/config.toml). Without these grants every PostgREST call
-- from the client fails with 403, even though RLS policies are correct —
-- GRANT is the coarse "can this role touch this relation at all" check,
-- RLS is the fine "which rows" check; both must pass.

grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Applies the same grants automatically to anything created by later
-- migrations, so this doesn't need to be repeated per table/function.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;
