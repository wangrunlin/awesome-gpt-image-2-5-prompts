import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readData, root, validate } from './validate.mjs';
import { readmeFile } from './catalog.mjs';

const { entries, site: fullSite, locales } = readData();
const site = {...fullSite, promptPages: {}};
test('the checked-in collection satisfies the data contract', () => assert.deepEqual(validate(entries, site), []));
test('duplicate IDs cannot silently overwrite generated pages', () => assert.ok(validate([entries[0], entries[0]], site).some(e => e.includes('duplicate id'))));
test('missing metrics are unknown; a missing observation date fails', () => {
  const e = structuredClone(entries[0]);
  e.engagement.likes = null;
  assert.deepEqual(validate([e], site), []);
  delete e.engagement.observed_at;
  assert.ok(validate([e], site).some(e => e.includes('observed_at')));
});
test('a reference workflow cannot omit its prerequisites', () => {
  const e = structuredClone(entries.find(e => e.mode === 'workflow'));
  e.inputs = [];
  assert.ok(validate([e], site).some(e => e.includes('required inputs')));
});
test('independent testing requires an evidence URL', () => {
  const e = structuredClone(entries[0]);
  e.verification.independently_tested = true;
  assert.ok(validate([e], site).some(e => e.includes('public evidence')));
});
test('unsafe URLs and incomplete translations fail validation', () => {
  const e = structuredClone(entries[0]);
  e.source.url = 'javascript:alert(1)';
  e.prompt.steps[0]['zh-CN'] = '';
  const errors = validate([e], site);
  assert.ok(errors.some(e => e.includes('HTTPS')));
  assert.ok(errors.some(e => e.includes('missing translation zh-CN')));
});
test('generated Markdown local links resolve inside the repository', () => {
  const files = [...locales.locales.map(l => readmeFile(l.id)), ...entries.map(e => `prompts/${e.id}.md`)];
  for (const file of files) {
    const body = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
      const href = match[1].split('#')[0];
      if (!href || /^[a-z]+:/i.test(href)) continue;
      const target = path.resolve(root, path.dirname(file), href);
      assert.ok(target.startsWith(root), `Link escapes repository: ${file} -> ${href}`);
      assert.ok(fs.existsSync(target), `Broken local link: ${file} -> ${href}`);
    }
  }
});

test('legacy aliases and duplicate derived fields are rejected',()=>{
 const e=structuredClone(entries[0]);e.title.zh='duplicate';e.localizations={};e.schema_version=1;e.featured=true;
 const errors=validate([e],site);assert.ok(errors.some(s=>s.includes('unsupported language field zh')));assert.equal(errors.filter(s=>s.includes('redundant source field')).length,3);
});
test('wrong or unverified website details fail',()=>{
 const id=entries[0].id;
 for(const url of ['https://example.com/prompt/community-'+id,'https://image-2-5.com/','javascript:alert(1)'])assert.ok(validate(entries,{...site,promptPages:{[id]:{url,checked_at:new Date().toISOString()}}}).some(s=>s.includes('site.promptPages')));
 assert.ok(validate(entries,{...site,promptPages:{unknown:{url:'https://image-2-5.com/prompt/community-unknown',checked_at:null}}}).some(s=>s.includes('unknown case')));
});
test('missing curation and malformed source data report errors',()=>{
 const e=structuredClone(entries[0]);delete e.curation;delete e.prompt;
 assert.ok(validate([e],site).length>0);
});
