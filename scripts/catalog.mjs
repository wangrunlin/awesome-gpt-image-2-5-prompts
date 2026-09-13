import { createHash } from 'node:crypto';

export const readmeFile = locale => locale === 'en' ? 'README.md' : `README.${locale}.md`;
export const caseAnchor = id => `case-${id}`;
export const weights = { likes: 0.35, bookmarks: 0.35, reposts: 0.20, views: 0.10 };
export const qualityWeights = { reuse: 30, result: 25, usefulness: 20, clarity: 15, distinctiveness: 10 };

export function popularity(engagement) {
  let score = 0, weight = 0;
  for (const [key, w] of Object.entries(weights)) {
    const value = engagement[key];
    if (Number.isSafeInteger(value) && value >= 0) { score += w * Math.log1p(value); weight += w; }
  }
  return weight ? score / weight : null;
}

export function qualityScore(entry) {
  return Object.entries(qualityWeights).reduce((total, [key, weight]) => total + entry.curation.ratings[key] * weight / 4, 0);
}

export function placement(entry) {
  if (entry.curation.decision === 'hold') return 'held';
  return entry.curation.content_flags.length || qualityScore(entry) < 65 ? 'explore' : 'main';
}

export const isFeatured = entry => placement(entry) === 'main' && qualityScore(entry) >= 80;
export function orderEntries(entries) {
  return [...entries].sort((a, b) => qualityScore(b) - qualityScore(a) || a.id.localeCompare(b.id, 'en'));
}

export function featuredEntries(entries) {
  const categories = new Set(), authors = new Map(), selected = [];
  for (const e of orderEntries(entries).filter(isFeatured)) {
    if (categories.has(e.category) || (authors.get(e.source.author) ?? 0) >= 2) continue;
    selected.push(e); categories.add(e.category); authors.set(e.source.author, (authors.get(e.source.author) ?? 0) + 1);
    if (selected.length === 6) break;
  }
  return selected;
}

export function textFor(e, locale) {
  return { title: e.title?.[locale], summary: e.summary?.[locale], steps: e.prompt?.steps?.map(s => s[locale]),
    inputs: e.inputs?.map(s => s[locale]), notes: e.notes?.map(s => s[locale]), notice: e.curation?.notice?.[locale] };
}

export function sourceDigest(e) {
  return createHash('sha256').update(JSON.stringify({ ...textFor(e, 'en'), original: e.prompt?.original_steps,
    original_language: e.prompt?.original_language, references: e.references ?? [] })).digest('hex');
}

export const translationDigest = (entry, locale) => createHash('sha256').update(JSON.stringify(textFor(entry, locale))).digest('hex');

export function websiteLink(site, { id, locale = 'en', position = 'gallery', home = false } = {}) {
  const detail = id && site.promptPages[id];
  const url = new URL(home ? site.url : detail?.url ?? site.promptDestination);
  url.searchParams.set('utm_source', 'github');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'awesome-gpt-image-2-5-prompts');
  url.searchParams.set('utm_content', [position, locale, id].filter(Boolean).join('--'));
  return { url: url.href, detail: Boolean(detail) };
}

export function exportEntry(e, site) {
  return { ...e, quality_score: qualityScore(e), discovery_score: popularity(e.engagement),
    featured: isFeatured(e), placement: placement(e), website_url: site.promptPages[e.id]?.url ?? null };
}
