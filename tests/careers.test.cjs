const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('careers.html', 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const catalog = JSON.parse(fs.readFileSync('jobs.json', 'utf8'));
const openCatalog = {...catalog, jobs: catalog.jobs.map(job => ({...job, open: true}))};

async function run(response, hash = '') {
  const elements = Object.fromEntries(['jobList','filters','openCount'].map(id => [id, {
    innerHTML: '', textContent: '', hidden: true, querySelectorAll: () => [],
  }]));
  const context = {
    URL, console: {error(){}}, location: {hash},
    document: {getElementById: id => elements[id]},
    window: {addEventListener(){}}, fetch: async () => response,
  };
  vm.runInNewContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  return elements;
}
const ok = data => ({ok:true,status:200,json:async()=>data});

test('four roles route to four distinct responder forms with labeled full-time annual equivalents', async () => {
  assert.equal(catalog.jobs.length, 4);
  assert.equal(new Set(catalog.jobs.map(j=>j.id)).size, 4);
  assert.equal(new Set(catalog.jobs.map(j=>j.applyUrl)).size, 4);
  const page = await run(ok(openCatalog), '#%invalid');
  assert.match(page.openCount.innerHTML, /4.*open roles/);
  for (const job of catalog.jobs) {
    assert.ok(page.jobList.innerHTML.includes(job.applyUrl));
    assert.ok(job.description.length && job.requirements.length && job.engagement.length);
  }
  assert.match(page.jobList.innerHTML, /45.*65.*hour/);
  assert.match(page.jobList.innerHTML, /Full-time equivalent: CAD \$93,600 – \$135,200 \/ year \(40 hours\/week × 52 weeks\)/);
  assert.match(page.jobList.innerHTML, /Up to 30 hours\/week/);
  assert.doesNotMatch(page.jobList.innerHTML, /Apply by email|spreadsheets\/d|\/edit/);
});
test('unsafe, malformed and editor application links cannot become Apply links', async () => {
  for (const applyUrl of ['javascript:alert(1)','https://evil.example/form','not a URL','https://docs.google.com/forms/d/private/edit']) {
    const page=await run(ok({jobs:[{...openCatalog.jobs[0],applyUrl}]}));
    assert.match(page.jobList.innerHTML,/Applications opening soon/);
    assert.doesNotMatch(page.jobList.innerHTML,/Apply via Google Forms/);
  }
});
test('closed roles are hidden and failures differ from an empty catalog', async () => {
  const closed=await run(ok({jobs:catalog.jobs.map(j=>({...j,open:false}))}));
  assert.match(closed.jobList.innerHTML,/No open roles/);
  const missing=await run({ok:false,status:404});
  assert.match(missing.jobList.innerHTML,/No open roles/);
  for (const response of [{ok:false,status:500},{ok:true,status:200,json:async()=>{throw Error('invalid JSON');}}]) {
    const page=await run(response);
    assert.match(page.jobList.innerHTML,/Unable to load roles/);
  }
});


test('annual equivalents handle single rates and omit absent or invalid pay', async () => {
  const job = openCatalog.jobs[0];
  const fixed = await run(ok({jobs: [{...job, pay: {currency: 'USD', hourlyMin: 50}}]}));
  assert.match(fixed.jobList.innerHTML, /Full-time equivalent: USD \$104,000 \/ year/);
  for (const pay of [undefined, {hourlyMin: -1}, {hourlyMin: 'invalid'}, {hourlyMin: 65, hourlyMax: 45}]) {
    const page = await run(ok({jobs: [{...job, pay}]}));
    assert.doesNotMatch(page.jobList.innerHTML, /Full-time equivalent|NaN|Infinity/);
  }
});
