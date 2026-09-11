import { createHash } from 'node:crypto';

export const languageKey = locale => locale === 'zh-CN' ? 'zh' : locale;
export const readmeFile = locale => locale === 'en' ? 'README.md' : `README.${locale}.md`;
export const caseAnchor = id => `case-${id}`;
export const weights = { likes: 0.35, bookmarks: 0.35, reposts: 0.20, views: 0.10 };

export function popularity(engagement) {
  let score = 0, weight = 0;
  for (const [key, w] of Object.entries(weights)) {
    const value = engagement[key];
    if (Number.isSafeInteger(value) && value >= 0) {
      score += w * Math.log1p(value);
      weight += w;
    }
  }
  return weight ? score / weight : null;
}

export function orderEntries(entries) {
  return [...entries].sort((a, b) => (popularity(b.engagement) ?? -1) - (popularity(a.engagement) ?? -1) || a.id.localeCompare(b.id, 'en'));
}

export function translationBasis(e) {
  return { title: e.title?.en, summary: e.summary?.en,
    steps: e.prompt?.kind === 'original' ? e.prompt.original_steps : e.prompt?.steps?.map(s => s.en),
    inputs: e.inputs?.map(s => s.en), notes: e.notes?.map(s => s.en) };
}

export function sourceDigest(e) {
  return createHash('sha256').update(JSON.stringify(translationBasis(e))).digest('hex');
}

export function textFor(e, locale) {
  if (locale === 'en' || locale === 'zh-CN') {
    const key = languageKey(locale);
    return { title: e.title[key], summary: e.summary[key], steps: e.prompt.steps.map(s => s[key]), inputs: e.inputs.map(s => s[key]), notes: e.notes.map(s => s[key]) };
  }
  return e.localizations?.[locale];
}

export function projectEntry(e, locales) {
  const projected = structuredClone(e);
  for (const locale of locales) {
    const t = textFor(e, locale);
    projected.title[locale] = t.title;
    projected.summary[locale] = t.summary;
    t.steps.forEach((value, i) => projected.prompt.steps[i][locale] = value);
    for (const key of ['inputs', 'notes']) t[key].forEach((value, i) => projected[key][i][locale] = value);
  }
  projected.discovery_score = popularity(e.engagement);
  delete projected.localizations;
  return projected;
}
