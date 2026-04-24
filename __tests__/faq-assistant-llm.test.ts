import { describe, it, expect } from 'vitest';
import { FAQ_ASSISTANT_CATALOG } from '@/lib/faq-assistant-catalog';
import { getOpenAIV1BaseUrl, isAnswerConsistentWithCatalog, parseFaqLlmJson } from '@/lib/faq-assistant-llm';

describe('getOpenAIV1BaseUrl', () => {
  it('defaults to OpenAPI v1', () => {
    const prev = process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_BASE_URL;
    expect(getOpenAIV1BaseUrl()).toBe('https://api.openai.com/v1');
    process.env.OPENAI_BASE_URL = prev;
  });

  it('strips trailing slashes', () => {
    const prev = process.env.OPENAI_BASE_URL;
    process.env.OPENAI_BASE_URL = 'https://example.com/openai/v1///';
    expect(getOpenAIV1BaseUrl()).toBe('https://example.com/openai/v1');
    if (prev === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = prev;
  });
});

describe('FAQ_ASSISTANT_CATALOG size', () => {
  it('has exactly 100 entries (intro + 99 wygenerowanych) — brak gubienia 100. wpisu przez slice', () => {
    expect(FAQ_ASSISTANT_CATALOG.length).toBe(100);
    expect(FAQ_ASSISTANT_CATALOG[0]?.id).toBe('faq-intro-product');
  });
});

describe('parseFaqLlmJson', () => {
  it('parses plain JSON', () => {
    const p = parseFaqLlmJson('{"answer":"Abc","decline":false}');
    expect(p).toEqual({ answer: 'Abc', decline: false });
  });

  it('handles fenced code block', () => {
    const p = parseFaqLlmJson('```json\n{"answer": "X", "decline": false}\n```');
    expect(p).toEqual({ answer: 'X', decline: false });
  });

  it('returns decline', () => {
    expect(parseFaqLlmJson('{"decline":true}')).toEqual({ answer: '', decline: true });
  });

  it('returns null on invalid', () => {
    expect(parseFaqLlmJson('not json')).toBeNull();
  });
});

describe('isAnswerConsistentWithCatalog', () => {
  const hint =
    'Scopeo łączy faktury KSeF z kategoriami GHG. W 2024 cena planu Mikro wynosi 149 zł miesięcznie. Więcej w cenniku.';

  it('rejects when key tokens missing', () => {
    const bad = 'To jest inny produkt do zupełnie czego innego, bez faktur.';
    expect(isAnswerConsistentWithCatalog(bad, hint)).toBe(false);
  });

  it('accepts when overlap and years/digits present', () => {
    const good =
      'W Scopeo importujesz faktury KSeF i przypisujesz je do GHG. Plan Mikro w 2024 to 149 zł miesięcznie — zobacz cennik.';
    expect(isAnswerConsistentWithCatalog(good, hint)).toBe(true);
  });

  it('rejects very short model answer for long hint', () => {
    const longHint = 'a '.repeat(100) + 'KSeF emisje Scopeo raport 2023.';
    expect(isAnswerConsistentWithCatalog('OK.', longHint)).toBe(false);
  });
});
