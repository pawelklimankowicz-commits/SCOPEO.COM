import { logger } from '@/lib/logger';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchKsefInvoiceXml(input: {
  token: string;
  referenceNumber: string;
}): Promise<string> {
  const baseUrl = process.env.KSEF_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error('KSEF_API_BASE_URL is missing');
  }
  const url = `${baseUrl.replace(/\/$/, '')}/invoices/${encodeURIComponent(
    input.referenceNumber
  )}/xml`;
  const maxAttempts = Number(process.env.KSEF_FETCH_MAX_ATTEMPTS ?? '4');
  const timeoutMs = Number(process.env.KSEF_FETCH_TIMEOUT_MS ?? '15000');
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${input.token}`,
          Accept: 'application/xml, text/xml, application/octet-stream',
        },
        cache: 'no-store',
        signal: abortController.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const isRetryable = response.status >= 500 || response.status === 429 || response.status === 408;
        if (isRetryable && attempt < maxAttempts) {
          logger.warn({
            context: 'ksef_connector',
            message: 'Retrying KSeF fetch after retryable status',
            status: response.status,
            attempt,
          });
          await wait(Math.min(1000 * 2 ** (attempt - 1), 10_000));
          continue;
        }
        logger.error({
          context: 'ksef_connector',
          message: 'KSeF API request failed',
          status: response.status,
          responseBody: body.slice(0, 400),
        });
        throw new Error(`KSeF API responded with status ${response.status}`);
      }

      const xml = await response.text();
      if (!xml || !xml.includes('<')) {
        throw new Error('KSeF API response did not contain XML payload');
      }
      return xml;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error : new Error('Unknown KSeF fetch error');
      if (attempt < maxAttempts) {
        await wait(Math.min(1000 * 2 ** (attempt - 1), 10_000));
        continue;
      }
    }
  }

  throw lastError ?? new Error('KSeF fetch failed');
}
