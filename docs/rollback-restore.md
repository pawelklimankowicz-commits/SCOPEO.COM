# Rollback and restore

1. Stop new deployments.
2. Revert to previous approved release artifact.
3. Validate application health endpoints and login flow.
4. Restore database only if data corruption occurred and restore point is verified.
5. Re-run smoke tests for KSeF import, factor import, review workflow and emission calculation.
