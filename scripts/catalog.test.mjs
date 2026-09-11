import test from 'node:test';
import assert from 'node:assert/strict';
import { popularity, sourceDigest, textFor, projectEntry, readmeFile, caseAnchor } from './catalog.mjs';
import { readData, validate } from './validate.mjs';
import { generate } from './build.mjs';
const {entries,site,locales}=readData();

test('missing popularity metrics stay unknown and visible weights are normalized',()=>{
  assert.equal(popularity({likes:null,bookmarks:null,reposts:null,views:null}),null);
  assert.equal(popularity({likes:100,bookmarks:null,reposts:null,views:null}),Math.log1p(100));
  assert.equal(popularity({likes:0,bookmarks:0,reposts:0,views:0}),0);
  assert.ok(popularity({likes:100,bookmarks:100,reposts:10,views:10000})>popularity({likes:100,bookmarks:0,reposts:0,views:1000}));
});
test('source post language and original prompt language are independent',()=>{
  const e=structuredClone(entries.find(e=>e.id==='clay-skateboard-cat-loop'));
  assert.equal(e.source.post_language,'pt');assert.equal(e.prompt.original_language,'en');
  assert.deepEqual(validate([e],site,locales),[]);
});
test('a non-English original is valid and exact wording remains separate',()=>{
  const e=structuredClone(entries.find(e=>e.prompt.kind==='original' && !e.prompt.preserved_literals));
  e.source.post_language='pt';e.prompt.original_language='ja';e.prompt.original_steps=e.prompt.steps.map(()=> '写真を撮ってください。');
  for(const t of Object.values(e.localizations))t.source_digest=sourceDigest(e);
  assert.deepEqual(validate([e],site,locales),[]);
});
test('changed source text invalidates translations',()=>{
  const e=structuredClone(entries[0]);e.notes[0].en+=' Updated input requirement.';
  assert.ok(validate([e],site,locales).some(x=>x.includes('translation is stale')));
});
test('literal image text and result previews cannot disappear',()=>{
  const e=structuredClone(entries.find(e=>e.id==='fresh-grocery-mobile-ui'));
  e.localizations.ja.steps[0]=e.localizations.ja.steps[0].replace('早上好，林小姐','おはようございます');
  assert.ok(validate([e],site,locales).some(x=>x.includes('missing preserved literal')));
  e.previews=[];
  assert.ok(validate([e],site,locales).some(x=>x.includes('source-result preview')));
});
test('catalog retains legacy en/zh fields and projects every supported locale',()=>{
  const e=entries[0],p=projectEntry(e,locales.locales.map(l=>l.id));
  assert.equal(p.prompt.steps[0].en,e.prompt.steps[0].en);
  assert.equal(p.prompt.steps[0].zh,e.prompt.steps[0].zh);
  assert.equal(p.prompt.steps[0]['zh-CN'],p.prompt.steps[0].zh);
  for(const l of locales.locales)assert.equal(p.prompt.steps[0][l.id],textFor(e,l.id).steps[0]);
});
test('all locale galleries keep source images before collapsed text and switch to the same case',()=>{
  const outputs=generate(entries,site,locales);
  for(const l of locales.locales){
    const body=outputs.get(readmeFile(l.id));
    assert.ok(!/<script|<iframe/i.test(body));
    for(const e of entries){
      const start=body.indexOf(`<a id="${caseAnchor(e.id)}">`);
      assert.ok(start>=0);
      const end=body.indexOf('\n---\n',start),card=body.slice(start,end<0?undefined:end);
      assert.ok(card.indexOf('<img ')<card.indexOf('<details>'));
      for(const other of locales.locales)assert.ok(card.includes(`${readmeFile(other.id)}#${caseAnchor(e.id)}`));
      assert.ok(card.includes(e.engagement.observed_at));
    }
  }
  for(const e of entries){const legacy=outputs.get(`prompts/${e.id}.md`);assert.ok(legacy.includes('<a id="中文"></a>'));assert.ok(legacy.includes(`../README.zh-CN.md#${caseAnchor(e.id)}`));}
});
