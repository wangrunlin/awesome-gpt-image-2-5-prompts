import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceDigest, translationDigest, textFor, qualityScore, qualityWeights } from './catalog.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export function readData() {
  const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
  const entries = fs.readdirSync(path.join(root, 'data/prompts')).filter(f => f.endsWith('.json')).sort().map(file => {
    const entry = JSON.parse(fs.readFileSync(path.join(root, 'data/prompts', file), 'utf8'));
    if (file !== `${entry.id}.json`) throw new Error(`Filename must match id: ${file}`);
    return entry;
  });
  const locales = JSON.parse(fs.readFileSync(path.join(root, 'data/locales.json'), 'utf8'));
  return { site, entries, locales };
}

export function validate(entries, site, locales = JSON.parse(fs.readFileSync(path.join(root, 'data/locales.json'), 'utf8'))) {
  const errors = [];
  const ids = new Set();
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
  const url = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
  };
  const categories = new Set((site.categories ?? []).map(c => c.id));
  const language = value => {
    try { return typeof value === 'string' && Intl.getCanonicalLocales(value)[0] === value; } catch { return false; }
  };
  const localeIds = locales.locales.map(l => l.id);
  if (new Set(localeIds).size !== localeIds.length) errors.push('Duplicate locale');
  for (const locale of localeIds) {
    if (!language(locale)) errors.push(`Invalid locale: ${locale}`);
    for (const key of Object.keys(locales.messages.en)) if (!locales.messages[locale]?.[key]?.trim()) errors.push(`Missing UI translation: ${locale}.${key}`);
    for (const c of site.categories) if (!c[locale]?.trim()) errors.push(`Missing category translation: ${c.id}.${locale}`);
  }
  for (const key of ['url', 'promptDestination', 'repository']) if (!url(site[key])) errors.push(`site.${key}: HTTPS URL required`);
  if (!entries.length) errors.push('Catalog must contain at least one entry');
  if (!site.promptPages || typeof site.promptPages !== 'object') errors.push('site.promptPages required');
  for (const c of site.categories) if ('zh' in c) errors.push('category: unsupported language field zh');
  for (const [id, page] of Object.entries(site.promptPages ?? {})) {
    if (!entries.some(e => e.id === id)) errors.push(`site.promptPages: unknown case ${id}`);
    if (!url(page.url) || !validDate(page.checked_at)) errors.push(`site.promptPages.${id}: verified HTTPS URL and date required`);
    else if (!url(site.url) || new URL(page.url).origin !== new URL(site.url).origin || new URL(page.url).pathname !== `/prompt/community-${id}` || new URL(page.url).search || new URL(page.url).hash) errors.push(`site.promptPages.${id}: wrong detail destination`);
  }
  const recipes = new Map();
  for (const e of entries) {
    const fail = message => errors.push(`${e.id ?? '(missing id)'}: ${message}`);
    const localized = (v, name) => {
      if (!v || typeof v !== 'object' || Array.isArray(v)) { fail(`${name}: localized object required`); return; }
      for (const l of localeIds) if (typeof v[l] !== 'string' || !v[l].trim()) fail(`${name}: missing translation ${l}`);
      for (const k of Object.keys(v)) if (!localeIds.includes(k)) fail(`${name}: unsupported language field ${k}`);
    };
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id ?? '')) fail('id must be lowercase kebab-case');
    if (ids.has(e.id)) fail('duplicate id');
    ids.add(e.id);
    for (const key of ['schema_version', 'localizations', 'featured', 'quality_score', 'discovery_score', 'placement', 'website_url']) if (key in e) fail(`redundant source field: ${key}`);
    localized(e.title, 'title'); localized(e.summary, 'summary');
    if (!categories.has(e.category)) fail('unknown category');
    if (!['generate', 'edit', 'workflow'].includes(e.mode)) fail('unknown mode');
    if (!Array.isArray(e.tags) || !e.tags.length || e.tags.some(t => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t))) fail('tags must be nonempty kebab-case strings');
    if (!['original', 'adaptation', 'translation'].includes(e.prompt?.kind)) fail('unknown prompt kind');
    if (e.source?.post_language !== null && !language(e.source?.post_language)) fail('source.post_language must be a canonical language code or null');
    if (e.prompt?.original_language !== null && !language(e.prompt?.original_language)) fail('prompt.original_language must be a canonical language code or null');
    if (e.prompt?.kind === 'original' && (!language(e.prompt.original_language) || !Array.isArray(e.prompt.original_steps) || !e.prompt.original_steps.length || e.prompt.original_steps.some(s => typeof s !== 'string' || !s.trim()))) fail('original prompt requires source language and exact original_steps');
    if (e.prompt?.kind === 'original' && e.prompt.original_steps?.length !== e.prompt.steps?.length) fail('original step count differs from translated steps');
    if (e.prompt?.kind === 'original' && e.prompt.original_language === 'en' && JSON.stringify(e.prompt.original_steps) !== JSON.stringify(e.prompt.steps?.map(s => s.en))) fail('English original must match preserved source wording');
    if (!Array.isArray(e.prompt?.steps) || !e.prompt.steps.length) fail('prompt steps required');
    for (const s of e.prompt?.steps ?? []) localized(s, 'prompt step');
    for (const field of ['inputs', 'notes']) {
      if (!Array.isArray(e[field])) fail(`${field} must be an array`);
      for (const v of e[field] ?? []) localized(v, field);
    }
    if (e.translation_meta?.source_digest !== sourceDigest(e)) fail('translation is stale');
    for (const locale of localeIds.filter(l => l !== 'en')) {
      if (e.translation_meta?.text_digests?.[locale] !== translationDigest(e, locale)) fail(`${locale}: translation review is stale`);
    }
    if (Object.keys(e.translation_meta ?? {}).some(k => !['source_digest', 'text_digests'].includes(k))) fail('unsupported translation metadata field');
    if (Object.keys(e.translation_meta?.text_digests ?? {}).some(l => l === 'en' || !localeIds.includes(l))) fail('unsupported translation metadata locale');
    if (e.prompt?.preserved_literals !== undefined) {
      const literals = e.prompt.preserved_literals;
      if (!Array.isArray(literals) || literals.some(v => typeof v !== 'string' || !v.trim())) fail('preserved_literals must contain nonempty strings');
      else for (const literal of literals) {
        if (!e.prompt.original_steps?.join('\n').includes(literal)) fail('preserved literal is absent from original wording');
        for (const locale of localeIds) {
          if (!textFor(e, locale)?.steps?.join('\n').includes(literal)) fail(`${locale}: missing preserved literal ${literal}`);
        }
      }
    }
    if (['edit', 'workflow'].includes(e.mode) && !e.inputs?.length) fail('edit/workflow must explain required inputs or tools');
    if (e.prompt?.kind !== 'original' && !e.notes?.length) fail('translated/adapted prompts need provenance notes');
    if (!e.source?.author || e.source.status !== 'source-checked') fail('checked source and author required');
    for (const key of ['url', 'prompt_url']) if (!url(e.source?.[key])) fail(`source.${key}: HTTPS URL required`);
    if (!validDate(e.source?.checked_at)) fail('source.checked_at: ISO timestamp required');
    if (e.model?.family !== 'GPT Image 2.5' || !url(e.model?.evidence_url) || !e.model?.evidence) fail('model family and evidence required');
    if (![null, 'flare', 'sunburst'].includes(e.model?.variant)) fail('unknown model variant; use null when unspecified');
    if (!Array.isArray(e.previews) || !e.previews.length) fail('at least one source-result preview is required');
    for (const p of e.previews ?? []) if (!url(p.url) || !url(p.source_url) || !p.credit || p.kind !== 'source-result') fail('preview requires source URL, credit, and source-result label');
    for (const key of ['likes', 'reposts', 'replies', 'bookmarks', 'views']) {
      const v = e.engagement?.[key];
      if (v !== null && (!Number.isSafeInteger(v) || v < 0)) fail(`${key} must be a nonnegative integer or null`);
    }
    if (!validDate(e.engagement?.observed_at)) fail('engagement.observed_at: ISO timestamp required');
    if (e.engagement?.source_url !== e.source?.url) fail('metrics must refer to the showcase source post');
    if (!e.engagement?.method) fail('metric observation method required');
    if (typeof e.verification?.independently_tested !== 'boolean') fail('independent test status required');
    if (e.verification?.independently_tested && !url(e.verification.test_url)) fail('independent tests require public evidence');
    for (const r of e.references ?? []) if (!url(r.url) || !url(r.source_url) || !r.credit) fail('reference requires HTTPS URL, source and credit');
    const c = e.curation;
    if (c?.decision === 'hold') localized(c.notice, 'hold notice');
    if (!c || c.version !== 1 || !validDate(c.reviewed_at) || !['publish', 'hold'].includes(c.decision) || typeof c.rationale !== 'string' || !c.rationale.trim() || typeof c.educational !== 'boolean') fail('curation requires version, date, decision, educational flag and rationale');
    if (!c?.ratings || Object.keys(c.ratings).length !== Object.keys(qualityWeights).length || Object.keys(qualityWeights).some(k => !Number.isInteger(c.ratings[k]) || c.ratings[k] < 0 || c.ratings[k] > 4)) fail('quality ratings must be integers from 0 to 4');
    if (!Array.isArray(c?.content_flags) || c.content_flags.some(f => !['suggestive', 'horror'].includes(f))) fail('unknown content flags');
    if (c?.ratings && c.decision === 'publish' && qualityScore(e) < 65 && !c.educational) fail('low quality requires an educational reason or hold');
    if (c?.decision === 'publish') {
      const recipe = e.prompt?.steps?.map(s => s.en?.toLowerCase().replace(/\s+/g, ' ').trim()).join('\n');
      if (recipes.has(recipe)) fail(`duplicate recipe: ${recipes.get(recipe)}`);
      recipes.set(recipe, e.id);
    }
    if (e.rights?.status !== 'third-party-terms' || !e.rights?.note) fail('third-party rights statement required');
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { entries, site } = readData();
    const errors = validate(entries, site);
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`Validated ${entries.length} multilingual, source-backed entries.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
