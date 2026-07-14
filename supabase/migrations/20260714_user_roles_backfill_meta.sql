-- =============================================================================
-- Backfill display_name / email em user_roles a partir de auth.users
-- (owner e admins antigos foram criados sem esses campos)
-- =============================================================================

BEGIN;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.user_roles ur
SET
  email = COALESCE(ur.email, au.email),
  display_name = COALESCE(
    NULLIF(ur.display_name, ''),
    NULLIF(au.raw_user_meta_data->>'display_name', ''),
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    NULLIF(au.raw_user_meta_data->>'name', ''),
    split_part(au.email, '@', 1)
  )
FROM auth.users au
WHERE ur.user_id = au.id
  AND (
    ur.email IS NULL
    OR ur.email = ''
    OR ur.display_name IS NULL
    OR ur.display_name = ''
  );

COMMIT;
