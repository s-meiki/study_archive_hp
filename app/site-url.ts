function normalizeSiteUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return new URL(url.origin);
  } catch {
    return null;
  }
}

const siteUrlCandidates = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.SITE_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL
];

export const siteUrl = siteUrlCandidates.map(normalizeSiteUrl).find(Boolean) ?? null;

export function absoluteSiteUrl(pathname = "/") {
  return siteUrl ? new URL(pathname, siteUrl).toString() : null;
}
