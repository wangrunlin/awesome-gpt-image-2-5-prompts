import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export function readData() {
  const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
  const entries = fs.readdirSync(path.join(root, 'data/prompts')).filter(f => f.endsWith('.json')).sort().map(file => {
    const entry = JSON.parse(fs.readFileSync(path.join(root, 'data/prompts', file), 'utf8'));
    if (file !== `${entry.id}.json`) throw new Error(`Filename must match id: ${file}`);
    return entry;
  });
  return { site, entries };
}

export function validate(entries, site) {
  const errors = [];
  const ids = new Set();
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
  const url = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
  };
  const categories = new Set((site.categories ?? []).map(c => c.id));
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
    if (e.prompt?.kind === 'original' && e.prompt.original_language !== 'en') fail('original English block must identify en as its original language');
    if (!Array.isArray(e.prompt?.steps) || !e.prompt.steps.length) fail('prompt steps required');
    for (const s of e.prompt?.steps ?? []) bilingual(s, 'prompt step');
    for (const field of ['inputs', 'notes']) {
      if (!Array.isArray(e[field])) fail(`${field} must be an array`);
      for (const v of e[field] ?? []) bilingual(v, field);
    }
    if (['edit', 'workflow'].includes(e.mode) && !e.inputs?.length) fail('edit/workflow must explain required inputs or tools');
    if (e.prompt?.kind !== 'original' && !e.notes?.length) fail('translated/adapted prompts need provenance notes');
    if (!e.source?.author || e.source.status !== 'source-checked') fail('checked source and author required');
    for (const key of ['url', 'prompt_url']) if (!url(e.source?.[key])) fail(`source.${key}: HTTPS URL required`);
    if (!validDate(e.source?.checked_at)) fail('source.checked_at: ISO timestamp required');
    if (e.model?.family !== 'GPT Image 2.5' || !url(e.model?.evidence_url) || !e.model?.evidence) fail('model family and evidence required');
    if (![null, 'flare', 'sunburst'].includes(e.model?.variant)) fail('unknown model variant; use null when unspecified');
    if (!Array.isArray(e.previews)) fail('previews must be an array');
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
    console.log(`Validated ${entries.length} bilingual, source-backed entries.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
