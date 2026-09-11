const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup(reduced = false) {
  let time = 0, id = 0;
  const frames = new Map();
  const events = new Map();
  const classes = new Set();
  const listen = scope => (name, fn) => events.set(scope + name, fn);
  const span = () => ({style: {}, getBoundingClientRect: () => ({width: 3200})});
  const rows = Array.from({length: 10}, (_, i) => ({children: [span(), span()], get firstElementChild() {return this.children[0];}, getBoundingClientRect: () => ({top: i * 100, bottom: i * 100 + 100})}));
  const light = {cloneNode: () => ({style:{}, classList:{add(){}},setAttribute(){},querySelectorAll: () => rows.map(() => ({children:[span(),span()]}))}), style: {}, querySelectorAll: () => rows.map(() => ({children: [span(), span()]}))};
  let captured = false;
  const hero = {appendChild(){},setPointerCapture(){captured=true;},hasPointerCapture(){return captured;},releasePointerCapture(){captured=false;},classList: {add: c => classes.add(c), remove: c => classes.delete(c)}, querySelectorAll: () => rows, getBoundingClientRect: () => ({left:0,top:0,width:1200,height:800}), addEventListener: listen('hero:')};
  const context = {Math, matchMedia: () => ({matches: reduced, addEventListener(){}}), performance: {now:()=>time}, requestAnimationFrame: fn => {frames.set(++id,fn); return id;}, cancelAnimationFrame: n => frames.delete(n), IntersectionObserver: class {observe(){}}, document: {hidden:false,getElementById: id => id==='hero'?hero:id==='noiseTurb'?{setAttribute(){}}:light,fonts:{ready:{then:fn=>fn()}},addEventListener:listen('document:')}, window:{addEventListener:listen('window:')}};
  vm.runInNewContext(fs.readFileSync('hero-sheen.js','utf8'),context);
  const tick = ms => {for(let elapsed=0;elapsed<ms;elapsed+=16){time+=16; const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));}};
  const event = (scope,name,extra={}) => events.get(scope+':'+name)({button:0,isPrimary:true,pointerId:1,pointerType:'mouse',clientX:400,clientY:250,target:{closest:()=>null},...extra});
  tick(32);
  return {tick,event,light,classes,rows,captured:()=>captured};
}
test('short click emits one bounded wave that expires',()=>{
 const s=setup();s.event('hero','pointerdown');s.tick(80);s.event('window','pointerup');s.tick(160);
 assert.match(s.light.style.maskImage,/data:image\/svg\+xml/);
 s.tick(2600);assert.doesNotMatch(s.light.style.maskImage,/data:image\/svg\+xml/);
});
test('hold reveals neighbors and releases without a second wave',()=>{
 const s=setup();s.event('hero','pointerdown');s.tick(1200);
 assert.ok(s.classes.has('is-holding'));
 assert.match(s.light.style.maskImage,/circle [\d.]+px/);
 s.event('window','pointerup');s.tick(2400);
 assert.ok(!s.classes.has('is-holding'));
 assert.doesNotMatch(s.light.style.maskImage,/circle/);
});
test('right click and canceled touches do not trigger an effect',()=>{
 const s=setup();s.event('hero','pointerdown',{button:2});s.tick(500);
 assert.ok(!s.classes.has('is-holding'));
 s.event('hero','pointerdown',{pointerType:'touch'});
 s.event('hero','pointermove',{pointerType:'touch',clientY:300});s.tick(400);
 assert.ok(!s.classes.has('is-holding'));
});
test('reduced motion suppresses the outward wave',()=>{
 const s=setup(true);s.event('hero','pointerdown');s.tick(80);s.event('window','pointerup');s.tick(400);
 assert.doesNotMatch(s.light.style.maskImage,/data:image\/svg\+xml/);
});

const waveCount = s => (s.light.style.maskImage.match(/data:image\/svg\+xml/g) || []).length;
const position = (s, row) => Number(s.rows[row].children[0].style.transform.match(/-?[\d.]+/)[0]);
test('rapid mouse clicks and touch taps preserve multiple fading ripples',()=>{
 for (const pointerType of ['mouse','touch']) {
  const s=setup();
  for(let i=0;i<3;i++) {
   s.event('hero','pointerdown',{pointerType});s.tick(64);
   s.event('window','pointerup',{pointerType});s.tick(64);
  }
  assert.equal(waveCount(s),3);
  s.tick(2600);assert.equal(waveCount(s),0);
 }
});
test('mouse and horizontal touch drag retain the initially pressed row',()=>{
 for(const pointerType of ['mouse','touch']) {
  const s=setup(); const before=position(s,2);
  s.event('hero','pointerdown',{pointerType});s.tick(320);
  s.event('hero','pointermove',{pointerType,clientX:550,clientY:270});s.tick(320);
  // Cross into a different row after the horizontal gesture is established.
  s.event('hero','pointermove',{pointerType,clientX:600,clientY:450});s.tick(320);
  const moved = ((position(s,2)-before+1600)%3200+3200)%3200-1600;
  assert.ok(Math.abs(moved-200)<2);
  assert.ok(s.captured());
  s.event('window','pointerup',{pointerType,clientX:600,clientY:450});s.tick(32);
  assert.ok(!s.captured());assert.equal(waveCount(s),0);
 }
});
test('vertical touch gesture releases capture for native page scrolling',()=>{
 const s=setup();s.event('hero','pointerdown',{pointerType:'touch'});
 s.event('hero','pointermove',{pointerType:'touch',clientX:402,clientY:300});s.tick(320);
 assert.ok(!s.captured());assert.ok(!s.classes.has('is-holding'));assert.equal(waveCount(s),0);
});

test('hover does not change any row position or velocity',()=>{
 const idle=setup(), hovered=setup();
 hovered.event('hero','pointermove',{clientX:950,clientY:250});
 idle.tick(800);hovered.tick(800);
 for(let row=0;row<10;row++) assert.equal(position(hovered,row),position(idle,row));
});
