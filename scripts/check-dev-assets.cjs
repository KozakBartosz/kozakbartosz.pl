// Run before and after `npm run build` while `npm run dev` is running.
// Missing dev chunks leave Next's hide-FOUC style active and the page blank.
const assert = require('node:assert/strict');

(async () => {
  const base = process.argv[2] || 'http://localhost:3000';
  const response = await fetch(base);
  assert.equal(response.status, 200, 'Home page must load');
  const html = await response.text();
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)]
    .map(match => match[1]).filter(src => src.startsWith('/_next/'));
  assert.ok(scripts.length > 0, 'Home page must reference Next.js scripts');
  for (const src of scripts) {
    const asset = await fetch(new URL(src.replace(/&amp;/g, '&'), base));
    assert.equal(asset.status, 200, `Missing script: ${src}`);
    assert.match(asset.headers.get('content-type') || '', /javascript/, src);
    await asset.arrayBuffer();
  }
  console.log(`PASS: home page and all ${scripts.length} Next.js scripts load`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
