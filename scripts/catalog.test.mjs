import test from 'node:test';
import assert from 'node:assert/strict';
import { popularity, sourceDigest, translationDigest, textFor, exportEntry, readmeFile, caseAnchor, qualityScore, orderEntries, placement, featuredEntries, websiteLink } from './catalog.mjs';
import { readData, validate } from './validate.mjs';
import { generate } from './build.mjs';
const {entries,site,locales}=readData();
const isolatedSite={...site,promptPages:{}};
const outputs=generate(entries,site,locales);

test('unknown popularity stays null; heat cannot change quality order',()=>{
 assert.equal(popularity({likes:null,bookmarks:null,reposts:null,views:null}),null);
 assert.equal(popularity({likes:100,bookmarks:null,reposts:null,views:null}),Math.log1p(100));
 assert.equal(popularity({likes:0,bookmarks:0,reposts:0,views:0}),0);
 const a=structuredClone(entries[0]),b=structuredClone(a);a.id='a';b.id='b';a.engagement.likes=null;b.engagement.likes=99999999;
 assert.deepEqual(orderEntries([b,a]).map(e=>e.id),['a','b']);
 b.curation.ratings.reuse=0;a.curation.ratings.reuse=4;
 assert.equal(orderEntries([b,a])[0].id,'a');
});
test('quality weights, boundaries and content placement are explicit',()=>{
 const e=structuredClone(entries[0]);e.curation={...e.curation,decision:'publish',content_flags:[],educational:true,ratings:{reuse:4,result:4,usefulness:4,clarity:4,distinctiveness:4}};
 assert.equal(qualityScore(e),100);assert.equal(placement(e),'main');
 e.curation.content_flags=['suggestive'];assert.equal(placement(e),'explore');assert.equal(featuredEntries([e]).length,0);
 e.curation.content_flags=['horror'];assert.equal(placement(e),'explore');
 e.curation.decision='hold';assert.equal(placement(e),'held');
 e.curation.decision='publish';e.curation.content_flags=[];e.curation.ratings={reuse:2,result:2,usefulness:2,clarity:2,distinctiveness:2};
 assert.equal(qualityScore(e),50);assert.equal(placement(e),'explore');
 e.curation.educational=false;assert.ok(validate([e],isolatedSite).some(s=>s.includes('low quality')));
});
test('featured selection keeps quality threshold, category diversity and author cap',()=>{
 const rows=Array.from({length:8},(_,i)=>{const e=structuredClone(entries[0]);e.id=`case-${i}`;e.category=`category-${i}`;e.source.author=i<4?'same':`author-${i}`;e.curation.decision='publish';e.curation.content_flags=[];e.curation.ratings={reuse:4,result:4,usefulness:4,clarity:4,distinctiveness:4};return e;});
 const selected=featuredEntries(rows);assert.equal(selected.length,6);assert.equal(selected.filter(e=>e.source.author==='same').length,2);
 rows.forEach(e=>e.category='one');assert.equal(featuredEntries(rows).length,1);
 rows.forEach(e=>Object.keys(e.curation.ratings).forEach(k=>e.curation.ratings[k]=3));assert.equal(featuredEntries(rows).length,0);
});
test('language maps are unique and exported without projections',()=>{
 for(const e of entries){
  const exported=exportEntry(e,site);
  for(const field of ['title','summary','prompt','inputs','notes'])assert.deepEqual(exported[field],e[field]);
  for(const value of [e.title,e.summary,...e.prompt.steps,...e.inputs,...e.notes])assert.deepEqual(Object.keys(value).sort(),locales.locales.map(l=>l.id).sort());
  assert.ok(!('localizations' in exported));assert.ok(!('schema_version' in exported));
 }
});
test('post language, source wording and translated content remain distinct',()=>{
 const e=structuredClone(entries.find(e=>e.id==='clay-skateboard-cat-loop'));
 assert.equal(e.source.post_language,'pt');assert.equal(e.prompt.original_language,'en');
 assert.deepEqual(validate([e],isolatedSite),[]);
 e.prompt.original_language='ja';e.prompt.original_steps=e.prompt.steps.map(()=> '写真を撮ってください。');
 e.translation_meta.source_digest=sourceDigest(e);
 for(const l of Object.keys(e.translation_meta.text_digests))e.translation_meta.text_digests[l]=translationDigest(e,l);
 assert.deepEqual(validate([e],isolatedSite),[]);
});
test('source and translated-body edits both expire translation review',()=>{
 const e=structuredClone(entries[0]);e.summary.en+=' Updated.';
 assert.ok(validate([e],isolatedSite).some(x=>x.includes('translation is stale')));
 const b=structuredClone(entries[0]);b.prompt.steps[0].ja+=' 変更';
 assert.ok(validate([b],isolatedSite).some(x=>x.includes('ja: translation review is stale')));
});
test('image copy and variables survive every locale',()=>{
 const e=structuredClone(entries.find(e=>e.id==='fresh-grocery-mobile-ui'));
 e.prompt.steps[0].ja=e.prompt.steps[0].ja.replace('早上好，林小姐','おはようございます');
 assert.ok(validate([e],isolatedSite).some(x=>x.includes('missing preserved literal')));
});
test('verified detail links use UTM; new cases fall back to gallery',()=>{
 const id=Object.keys(site.promptPages)[0],known=websiteLink(site,{id,locale:'ja',position:'case'});
 assert.equal(known.detail,true);const u=new URL(known.url);assert.equal(u.pathname,`/prompt/community-${id}`);assert.equal(u.searchParams.get('utm_content'),`case--ja--${id}`);
 const pending=websiteLink(site,{id:'unpublished-recipe',locale:'zh-CN',position:'case'});assert.equal(pending.detail,false);assert.equal(new URL(pending.url).pathname,new URL(site.promptDestination).pathname);
});
test('catalog excludes held bodies, derives flags and keeps stable explanations',()=>{
 const catalog=JSON.parse(outputs.get('data/catalog.json'));assert.equal(catalog.schema_version,2);
 assert.deepEqual(catalog.entries.map(e=>e.id),orderEntries(entries).filter(e=>placement(e)!=='held').map(e=>e.id));
 assert.deepEqual(catalog.featured_ids,featuredEntries(entries).map(e=>e.id));
 for(const e of entries.filter(e=>placement(e)==='held')){assert.ok(catalog.withheld.some(x=>x.id===e.id));assert.ok(!catalog.entries.some(x=>x.id===e.id));const page=outputs.get(`prompts/${e.id}.md`);assert.ok(!page.includes('<img'));assert.ok(!page.includes(e.prompt.steps[0].en));}
});
test('nine full galleries isolate exploration and put one case CTA inside prompt details',()=>{
 for(const l of locales.locales){
  const body=outputs.get(readmeFile(l.id));assert.ok(!/<script|<iframe/i.test(body));
  for(const e of entries.filter(e=>placement(e)!=='held')){
   const start=body.indexOf(`<a id="${caseAnchor(e.id)}">`),end=body.indexOf('\n---\n',start);const card=body.slice(start,end<0?undefined:end);
   assert.ok(start>=0);for(const other of locales.locales)assert.ok(card.includes(`${readmeFile(other.id)}#user-content-${caseAnchor(e.id)}`));
   const cta=card.indexOf('utm_content=case--');assert.ok(cta>0);assert.ok(card.indexOf('</details>',card.indexOf('<summary>'+locales.messages[l.id].prompt))>cta);
   assert.equal((card.match(/https:\/\/image-2-5\.com/g)||[]).length,1);
   assert.equal(card.indexOf('<details>')<card.indexOf('<img '),placement(e)==='explore');assert.ok(!card.includes('<details open'));
   assert.ok(card.includes(e.engagement.observed_at));assert.ok(card.includes(e.source.url));
  }
 }
});
test('standalone pages include full English and Chinese prompts and prerequisites',()=>{
 for(const e of entries.filter(e=>placement(e)!=='held')){const page=outputs.get(`prompts/${e.id}.md`);assert.ok(page.includes('<a id="中文"></a>'));for(const l of ['en','zh-CN']){for(const step of textFor(e,l).steps)assert.ok(page.includes(step));for(const input of textFor(e,l).inputs)assert.ok(page.includes(input));}assert.equal((page.match(/https:\/\/image-2-5\.com/g)||[]).length,1);}
});
