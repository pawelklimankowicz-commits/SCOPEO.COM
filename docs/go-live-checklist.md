# Go-live checklist

- `npx prisma migrate deploy` runs against production `DATABASE_URL` as part of release (Vercel build alone does not apply migrations).
- Production env variables configured.
- Database backups verified.
- Rollback procedure tested.
- Sentry alerts tested.
- Branch protection enabled on main.
- Required checks enforced.
- Coverage threshold passing.
- Release artifact produced from signed tag or approved workflow run.
