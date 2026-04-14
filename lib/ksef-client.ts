import { logger } from '@/lib/logger';

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
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
      Accept: 'application/xml, text/xml, application/octet-stream',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
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
}
