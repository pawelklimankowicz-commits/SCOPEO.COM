/** Bump when cookie / analytics policy text or categories change — users must see the banner again. */
export const COOKIE_CONSENT_VERSION = 'cookie-analytics-v1';

/** Legacy key used in CookieConsent and client checks. */
export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent';

export type CookieConsentChoice = 'accepted' | 'rejected';
