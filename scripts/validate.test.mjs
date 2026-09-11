import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readData, root, validate } from './validate.mjs';
import { readmeFile } from './catalog.mjs';

const { entries, site, locales } = readData();
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
  e.prompt.steps[0].zh = '';
  const errors = validate([e], site);
  assert.ok(errors.some(e => e.includes('HTTPS')));
  assert.ok(errors.some(e => e.includes('English and Chinese')));
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
