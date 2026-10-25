const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:false,executablePath:process.env.PERF_CHROMIUM,args:['--use-angle=metal']});
 try {
  const page=await browser.newPage({viewport:{width:2560,height:1440},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.argv[2]||'http://localhost:3118');
  await page.waitForFunction(()=>window.__composer?.passes.length>1);
  await page.waitForTimeout(6000);
  const results=[];
  for(const [width,height] of [[2560,1440],[1440,1000],[2560,1440]]) {
   await page.setViewportSize({width,height});await page.waitForTimeout(1000);
   const result=await page.evaluate(()=>{
    const c=window.__composer,r=c.getRenderer(),gl=r.getContext(),rect=r.domElement.getBoundingClientRect();
    return {buffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],composer:[c.inputBuffer.width,c.inputBuffer.height],css:[rect.width,rect.height],viewport:[document.documentElement.clientWidth,innerHeight],effects:c.passes.find(p=>p.effects).effects.map(e=>e.name)};
   });
   console.log('BUFFER',JSON.stringify(result));
   assert.ok(result.buffer[0]*result.buffer[1]<=2073600);
   assert.deepEqual(result.buffer,result.composer);
   assert.deepEqual(result.css,result.viewport);
   assert.deepEqual(result.effects,['DepthOfFieldEffect','BloomEffect','BloomEffect']);
   if(width===1440)assert.deepEqual(result.buffer,result.css);
   results.push(result);
  }
  await page.mouse.move(800,400);await page.mouse.down();await page.waitForTimeout(200);await page.mouse.up();
  assert.deepEqual(errors,[]);
  fs.writeFileSync(process.argv[3]||'/tmp/portfolio-budget.json',JSON.stringify({results,errors},null,2));
  console.log('PASS',JSON.stringify(results));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
