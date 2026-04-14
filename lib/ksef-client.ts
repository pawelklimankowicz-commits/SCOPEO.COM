import { logger } from '@/lib/logger';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchKsefInvoiceXml(input: {
  token: string;
  referenceNumber: string;
}): Promise<string> {
  const baseUrl = (
    process.env.KSEF_API_BASE_URL?.trim() || 'https://ksef-test.mf.gov.pl/api'
  ).replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('KSEF_API_BASE_URL is missing');
  }
  const initUrl = `${baseUrl}/online/Session/InitSigned`;
  const invoiceUrl = `${baseUrl}/online/Invoice/KSeF?ksefReferenceNumber=${encodeURIComponent(
    input.referenceNumber
  )}`;
  const terminateUrl = `${baseUrl}/online/Session/Terminate`;
  const maxAttempts = Number(process.env.KSEF_FETCH_MAX_ATTEMPTS ?? '4');
  const timeoutMs = Number(process.env.KSEF_FETCH_TIMEOUT_MS ?? '15000');
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);
    try {
      const sessionInitRes = await fetch(initUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({}),
        cache: 'no-store',
        signal: abortController.signal,
      });
      if (!sessionInitRes.ok) {
        throw new Error(`KSeF session init failed with status ${sessionInitRes.status}`);
      }
      const sessionPayload = (await sessionInitRes.json().catch(() => ({}))) as Record<string, any>;
      const sessionToken =
        sessionPayload.sessionToken ||
        sessionPayload.referenceNumber ||
        sessionPayload.token ||
        input.token;

      const response = await fetch(invoiceUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          Accept: 'application/xml, text/xml, application/octet-stream',
        },
        cache: 'no-store',
        signal: abortController.signal,
      });

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
      await fetch(terminateUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }).catch(() => null);
      clearTimeout(timeout);
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
