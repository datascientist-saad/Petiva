#!/usr/bin/env node
/**
 * Generates simple Petiva PWA icons as PNG files.
 * Uses only Node.js built-ins (zlib + fs).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(size) {
  const bg = { r: 0x6b, g: 0x8f, b: 0x71 };
  const accent = { r: 0xfa, g: 0xf7, b: 0xf2 };
  const raw = Buffer.alloc((size * 4 + 1) * size);

  const cx = size / 2;
  const cy = size / 2;
  const pawRadius = size * 0.18;
  const toeRadius = size * 0.09;
  const toes = [
    { x: cx - size * 0.2, y: cy - size * 0.12 },
    { x: cx - size * 0.07, y: cy - size * 0.22 },
    { x: cx + size * 0.07, y: cy - size * 0.22 },
    { x: cx + size * 0.2, y: cy - size * 0.12 },
  ];

  function insideCircle(x, y, cx2, cy2, r) {
    const dx = x - cx2;
    const dy = y - cy2;
    return dx * dx + dy * dy <= r * r;
  }

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const i = rowStart + 1 + x * 4;
      let color = bg;
      if (
        insideCircle(x, y, cx, cy + size * 0.08, pawRadius) ||
        toes.some((toe) => insideCircle(x, y, toe.x, toe.y, toeRadius))
      ) {
        color = accent;
      }
      raw[i] = color.r;
      raw[i + 1] = color.g;
      raw[i + 2] = color.b;
      raw[i + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "icon-192.png"), createPng(192));
fs.writeFileSync(path.join(outDir, "icon-512.png"), createPng(512));
console.log("Generated icon-192.png and icon-512.png");
