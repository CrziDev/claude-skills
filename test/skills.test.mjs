// Run: node --test test/*.test.mjs   (capture tests need frame-kit with Chromium; set FRAME_KIT_DIR or keep it at ../frame-kit)
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { capturePages } from '../generate-project-frames/scripts/capture.mjs';

const frameKit = resolve(process.env.FRAME_KIT_DIR ?? new URL('../../frame-kit', import.meta.url).pathname);
const cli = join(frameKit, 'cli.mjs');
const ready = existsSync(cli) && existsSync(join(frameKit, 'node_modules'));
const opts = { skip: !ready && 'frame-kit not found or not installed' };
const verify = new URL('../generate-frame/scripts/verify-frames.mjs', import.meta.url).pathname;
const png = (w, h) => { const b = Buffer.alloc(33); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return Buffer.concat([b, Buffer.from('IEND')]); };

let dir, server, base;
before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'skills-'));
  server = createServer((req, res) => {
    if (req.url === '/gone') { res.statusCode = 404; return res.end('nope'); }
    res.setHeader('content-type', 'text/html');
    res.end(req.url === '/bad'
      ? '<h1>Bad</h1><img src="/missing.png" width=50 height=50><div class="spinner">…</div><div role="dialog">Cookies</div><script>console.error("boom")</script>'
      : '<h1>Dashboard</h1><p>Ready</p>');
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

describe('verify-frames', () => {
  const run = (...a) => spawnSync(process.execPath, [verify, ...a], { encoding: 'utf8' });
  test('passes valid output, flags missing, wrong size and bad PNG', () => {
    const raw = join(dir, 'raw'); const out = join(dir, 'framed');
    mkdirSync(raw); mkdirSync(out);
    for (const n of ['01-a', '02-b', '03-c', '04-d']) writeFileSync(join(raw, `${n}.png`), 'x');
    writeFileSync(join(out, '01-a.png'), png(3840, 2400));
    writeFileSync(join(out, '02-b.png'), png(1920, 1200));
    writeFileSync(join(out, '03-c.png'), 'junk');
    const r = run(raw, out);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /02-b\.png: 1920x1200, expected 3840x2400/);
    assert.match(r.stderr, /03-c\.png: not a PNG/);
    assert.match(r.stderr, /04-d\.png: missing/);
    assert.doesNotMatch(r.stderr, /01-a/);
  });
  test('honours --resolution and checks the cover', () => {
    const raw = join(dir, 'raw2'); const out = join(dir, 'framed2');
    mkdirSync(raw); mkdirSync(out);
    writeFileSync(join(raw, '01-a.png'), 'x');
    writeFileSync(join(out, '01-a.png'), png(1920, 1200));
    writeFileSync(join(out, '00-cover.png'), png(3840, 2400));
    const r = run(raw, out, '--resolution', 'standard');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /00-cover\.png: 3840x2400, expected 1920x1200/);
  });
});

describe('capturePages', opts, () => {
  test('clean page: no issues, 2880x1800 PNG', async () => {
    const [r] = await capturePages({ frameKit, outDir: join(dir, 'cap'), pages: [{ name: '01-ok', url: `${base}/ok` }] });
    assert.deepEqual(r.issues, []);
    const b = readFileSync(r.file);
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [2880, 1800]);
  });
  test('reports broken image, spinner, overlay, console error; batch continues past a 404', async () => {
    const res = await capturePages({ frameKit, outDir: join(dir, 'cap2'), pages: [
      { name: '01-bad', url: `${base}/bad` }, { name: '02-gone', url: `${base}/gone` }, { name: '03-ok', url: `${base}/ok` },
    ] });
    const text = res[0].issues.join('\n');
    for (const re of [/broken image/, /loading indicator visible: \.spinner/, /overlay visible: \[role="dialog"\]/, /console error: .*boom/]) assert.match(text, re);
    assert.match(res[1].issues.join('\n'), /HTTP 404/);
    assert.deepEqual(res[2].issues, []);
  });
  test('flags a redirect away from the requested page', async () => {
    const s = createServer((q, p) => { if (q.url === '/admin') { p.statusCode = 302; p.setHeader('location', '/login'); return p.end(); } p.setHeader('content-type', 'text/html'); p.end('login'); });
    await new Promise((r) => s.listen(0, r));
    try {
      const [r] = await capturePages({ frameKit, outDir: join(dir, 'cap3'), pages: [{ name: '01-admin', url: `http://localhost:${s.address().port}/admin` }] });
      assert.match(r.issues.join('\n'), /redirected to .*\/login/);
    } finally { s.close(); }
  });
  test('output works with frame-kit end to end, framed apart from raw', () => {
    const raw = join(dir, 'cap'); const framed = join(dir, 'framed-cap');
    const r = spawnSync(process.execPath, [cli, 'single', raw, '--out', framed, '--resolution', 'standard'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const v = spawnSync(process.execPath, [verify, raw, framed, '--resolution', 'standard'], { encoding: 'utf8' });
    assert.equal(v.status, 0, v.stderr);
    assert.ok(!existsSync(join(raw, 'framed')));
  });
});
