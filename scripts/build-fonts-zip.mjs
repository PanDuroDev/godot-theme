// Builds dist/godot-theme-fonts.zip from fonts/*.woff2 + OFL licenses.
// Stored (no compression), deterministic, stdlib only. Verifies itself after writing.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'dist', 'godot-theme-fonts.zip');

const CRC = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zipStore(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const TIME = (0 << 11) | (0 << 5) | 0;
  const DATE = ((2026 - 1980) << 9) | (10 << 5) | 6;
  for (const f of files) {
    const name = Buffer.from(enc.encode(f.name));
    const crc = crc32(f.data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(0, 8);
    lh.writeUInt16LE(TIME, 10);
    lh.writeUInt16LE(DATE, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(f.data.length, 18);
    lh.writeUInt32LE(f.data.length, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);
    parts.push(lh, name, f.data);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(TIME, 12);
    ch.writeUInt16LE(DATE, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(f.data.length, 20);
    ch.writeUInt32LE(f.data.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, name);
    offset += 30 + name.length + f.data.length;
  }
  const centralStart = offset;
  const centralBuf = Buffer.concat(central);
  offset += centralBuf.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, centralBuf, end]);
}

function verifyZip(buf, files) {
  // Walk the central directory and re-check every entry.
  const n = buf.readUInt16LE(buf.length - 22 + 8);
  if (n !== files.length) throw new Error(`count ${n} != ${files.length}`);
  let p = buf.readUInt32LE(buf.length - 22 + 16);
  for (const f of files) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central signature');
    const nameLen = buf.readUInt16LE(p + 28);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    if (name !== f.name) throw new Error(`name ${name} != ${f.name}`);
    if (buf.readUInt32LE(p + 16) !== crc32(f.data)) throw new Error(`crc ${name}`);
    p += 46 + nameLen;
  }
}

const dir = join(root, 'fonts');
const names = readdirSync(dir).filter((f) => f.endsWith('.woff2') || f.startsWith('LICENSE.')).sort();
if (!names.length) throw new Error('no font files');
const files = names.map((n) => ({ name: 'godot-theme-fonts/' + n, data: readFileSync(join(dir, n)) }));
mkdirSync(join(root, 'dist'), { recursive: true });
const zip = zipStore(files);
verifyZip(zip, files);
writeFileSync(OUT, zip);
console.log(`fonts zip OK — ${files.length} files, ${(zip.length / 1024).toFixed(1)} KB`);
for (const f of files) console.log('  ' + f.name);
