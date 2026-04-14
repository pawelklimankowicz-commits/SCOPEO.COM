/** Max wait for self-call from cron to `/api/ksef/jobs/process` (ms). Default below typical 60s platform limit. */
export function getKsefCronInnerFetchTimeoutMs(): number {
  const n = Number(process.env.KSEF_CRON_INNER_FETCH_TIMEOUT_MS ?? '55000');
  return Number.isFinite(n) && n > 0 ? n : 55_000;
}

/** Stop starting new jobs after this elapsed time (ms) so the worker finishes before platform / outer fetch limits. */
export function getKsefProcessBudgetMs(): number {
  const n = Number(process.env.KSEF_PROCESS_BUDGET_MS ?? '52000');
  return Number.isFinite(n) && n > 0 ? n : 52_000;
}
