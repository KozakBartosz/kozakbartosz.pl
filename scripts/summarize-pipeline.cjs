const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = process.argv[2];
const data = JSON.parse(fs.readFileSync(path.join(root,'timings.json'),'utf8'));
const average = values => values.reduce((a,b)=>a+b,0)/values.length;
const summarize = rows => ({trials:rows.length,frameMean:average(rows.map(r=>r.frame.mean)),frameP95Mean:average(rows.map(r=>r.frame.p95)),gpuElapsedMean:rows[0]?.gpu.count?average(rows.map(r=>r.gpu.mean)):null,over25:rows.reduce((n,r)=>n+r.over25,0)});
const results = [...new Set(data.results.map(r=>r.variant))].map(variant=>({variant,baseline:summarize(data.results.filter(r=>r.variant===variant&&r.name==='baseline')),candidate:summarize(data.results.filter(r=>r.variant===variant&&r.name===variant))}));
fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify(results,null,2));
let table='| Variant | Baseline mean / p95 (ms) | Candidate mean / p95 (ms) | Baseline / candidate GPU elapsed mean (ms) |\n| --- | ---: | ---: | ---: |\n';
for(const r of results){const fmt=s=>`${s.frameMean.toFixed(2)} / ${s.frameP95Mean.toFixed(2)}`;table+=`| ${r.variant} | ${fmt(r.baseline)} | ${fmt(r.candidate)} | ${r.baseline.gpuElapsedMean?.toFixed(2)||'n/a'} / ${r.candidate.gpuElapsedMean?.toFixed(2)||'n/a'} |\n`;}
fs.writeFileSync(path.join(root,'summary.md'),table);
const traces=[];
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('-trace.json.gz'))){
    const events=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,name)))).traceEvents;
    const present=events.filter(e=>e.name==='AnimationFrame::Presentation');
    const drops=events.filter(e=>e.name==='DroppedFrame');
    const seen=new Set();const unique=present.filter(e=>{const key=`${e.pid}:${e.args.begin_frame_id?.sequence_number}`;if(seen.has(key))return false;seen.add(key);return true;});
    const times=unique.map(e=>e.ts).sort((a,b)=>a-b);const intervals=times.slice(1).map((t,i)=>(t-times[i])/1000).sort((a,b)=>a-b);
    traces.push({variant:name.replace('-trace.json.gz',''),animationPresentations:unique.length,chromeDroppedFrameEvents:drops.length,partialUpdates:drops.filter(e=>e.args.hasPartialUpdate).length,fullDroppedFrameEvents:drops.filter(e=>!e.args.hasPartialUpdate).length,coreAnimationCommits:events.filter(e=>e.name==='CommitPresentedFrameToCA').length,presentationIntervalP95:intervals[Math.floor(intervals.length*.95)],presentationSpanMs:(times.at(-1)-times[0])/1000,note:'Single ~3 second Chrome trace per variant; compositor events are not physical display photometry. DroppedFrame includes partial updates; separate counts retained.'});
}
if(traces.length)fs.writeFileSync(path.join(root,'presentation-summary.json'),JSON.stringify(traces,null,2));
console.log(table);
