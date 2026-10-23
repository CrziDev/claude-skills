#!/usr/bin/env node
// Checks framed output without rendering anything: every input has a valid PNG of the
// expected size. Usage: node verify-frames.mjs <input image|folder> <framed dir> [--resolution standard|high|max]
// Exit 1 if anything is missing or invalid. It does not judge visual quality; look at the images.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

const SIZES = { standard: 1920, high: 2560, max: 3840 };
const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IMAGE = /\.(png|jpe?g|webp)$/i;

const argv = process.argv.slice(2);
const flag = argv.indexOf('--resolution');
const preset = flag < 0 ? 'max' : argv.splice(flag, 2)[1];
const [input, framed] = argv;
if (!input || !framed || !SIZES[preset]) {
  console.error('Usage: verify-frames.mjs <input image|folder> <framed dir> [--resolution standard|high|max]');
  process.exit(2);
}

const stem = (f) => basename(f, extname(f));
const inputs = statSync(input).isDirectory()
  ? readdirSync(input).filter((f) => !f.startsWith('.') && IMAGE.test(f)).sort()
  : [basename(input)];
const width = SIZES[preset];
const height = width * 0.625;
const problems = [];

function check(file, label) {
  if (!existsSync(file)) return problems.push(`${label}: missing ${file}`);
  const buf = readFileSync(file);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(SIGNATURE)) return problems.push(`${label}: not a PNG`);
  if (!buf.includes('IEND')) return problems.push(`${label}: truncated PNG`);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (w !== width || h !== height) problems.push(`${label}: ${w}x${h}, expected ${width}x${height}`);
}

for (const f of inputs) check(join(resolve(framed), `${stem(f)}.png`), f);
const cover = join(resolve(framed), '00-cover.png');
if (existsSync(cover)) check(cover, '00-cover.png');

console.log(`${inputs.length} input(s), expected ${width}x${height}${existsSync(cover) ? ', cover present' : ', no cover'}`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('OK (files valid; inspect them for visual quality)');
