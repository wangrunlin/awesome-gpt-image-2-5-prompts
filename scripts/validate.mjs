import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceDigest, textFor } from './catalog.mjs';

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
    for (const c of site.categories) if (!(c[locale] ?? (locale === 'zh-CN' ? c.zh : null))?.trim()) errors.push(`Missing category translation: ${c.id}.${locale}`);
  }
  for (const key of ['url', 'promptDestination', 'repository']) if (!url(site[key])) errors.push(`site.${key}: HTTPS URL required`);
  if (!entries.length) errors.push('Catalog must contain at least one entry');
  for (const e of entries) {
    const fail = message => errors.push(`${e.id ?? '(missing id)'}: ${message}`);
    const bilingual = (v, name) => {
      if (!v || ['en', 'zh'].some(k => typeof v[k] !== 'string' || !v[k].trim())) fail(`${name} requires English and Chinese`);
    };
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id ?? '')) fail('id must be lowercase kebab-case');
    if (ids.has(e.id)) fail('duplicate id');
    ids.add(e.id);
    if (e.schema_version !== 1) fail('unsupported schema_version');
    bilingual(e.title, 'title'); bilingual(e.summary, 'summary');
    if (!categories.has(e.category)) fail('unknown category');
    if (!['generate', 'edit', 'workflow'].includes(e.mode)) fail('unknown mode');
    if (typeof e.featured !== 'boolean') fail('featured must be boolean');
    if (!Array.isArray(e.tags) || !e.tags.length || e.tags.some(t => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t))) fail('tags must be nonempty kebab-case strings');
    if (!['original', 'adaptation', 'translation'].includes(e.prompt?.kind)) fail('unknown prompt kind');
    if (e.source?.post_language !== null && !language(e.source?.post_language)) fail('source.post_language must be a canonical language code or null');
    if (e.prompt?.original_language !== null && !language(e.prompt?.original_language)) fail('prompt.original_language must be a canonical language code or null');
    if (e.prompt?.kind === 'original' && (!language(e.prompt.original_language) || !Array.isArray(e.prompt.original_steps) || !e.prompt.original_steps.length || e.prompt.original_steps.some(s => typeof s !== 'string' || !s.trim()))) fail('original prompt requires source language and exact original_steps');
    if (e.prompt?.kind === 'original' && e.prompt.original_steps?.length !== e.prompt.steps?.length) fail('original step count differs from translated steps');
    if (e.prompt?.kind === 'original' && e.prompt.original_language === 'en' && JSON.stringify(e.prompt.original_steps) !== JSON.stringify(e.prompt.steps?.map(s => s.en))) fail('English original must match preserved source wording');
    if (!Array.isArray(e.prompt?.steps) || !e.prompt.steps.length) fail('prompt steps required');
    for (const s of e.prompt?.steps ?? []) bilingual(s, 'prompt step');
    for (const field of ['inputs', 'notes']) {
      if (!Array.isArray(e[field])) fail(`${field} must be an array`);
      for (const v of e[field] ?? []) bilingual(v, field);
    }
    for (const locale of localeIds.filter(l => !['en', 'zh-CN'].includes(l))) {
      const content = textFor(e, locale);
      if (!content || typeof content.title !== 'string' || !content.title.trim() || typeof content.summary !== 'string' || !content.summary.trim()) fail(`${locale}: title and summary required`);
      for (const field of ['steps', 'inputs', 'notes']) {
        const expected = field === 'steps' ? e.prompt?.steps : e[field];
        if (!Array.isArray(content?.[field]) || content[field].length !== expected?.length || content[field].some(v => typeof v !== 'string' || !v.trim())) fail(`${locale}: incomplete ${field}`);
      }
      if (content?.source_digest !== sourceDigest(e)) fail(`${locale}: translation is stale`);
    }
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
