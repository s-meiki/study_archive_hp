#!/usr/bin/env node
// Download original YouTube thumbnail bytes. Default mode only prints the plan.
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'public/images/archives');
const manifestPath = path.join(root, 'content/archive-thumbnails.json');

function jpegDimensions(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Not a JPEG');
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('Invalid JPEG marker');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  throw new Error('JPEG dimensions not found');
}

function videoIdFromUrl(value) {
  try {
    const url = new URL(value);
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1)
      : ['youtube.com', 'www.youtube.com'].includes(url.hostname) ? url.searchParams.get('v') : null;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--write', '--dry-run'].includes(arg)) || (args.includes('--write') && args.includes('--dry-run'))) {
    throw new Error('Usage: node scripts/refresh_archive_thumbnails.js [--write | --dry-run]');
  }
  const write = args.includes('--write');
  const context = { window: {} };
  vm.runInNewContext(await fs.readFile(path.join(root, 'public/data/site-content.js'), 'utf8'), context, { timeout: 1000 });
  const targets = context.window.STUDY_ARCHIVE_DATA.archives.flatMap((archive) => {
    const videoId = videoIdFromUrl(archive.links?.recording);
    if (!videoId) return [];
    if (!/^[a-zA-Z0-9_-]+$/.test(archive.id)) throw new Error(`Unsafe archive id: ${archive.id}`);
    return [{ archiveId: archive.id, videoId, title: archive.title }];
  });
  if (!write) {
    for (const target of targets) console.log(`[dry-run] ${target.archiveId}: https://i.ytimg.com/vi/${target.videoId}/hqdefault.jpg (${target.title})`);
    console.log(`${targets.length} thumbnails planned; no network requests or files written.`);
    return;
  }
  await fs.mkdir(outputDir, { recursive: true });
  let previous = {};
  try { previous = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const manifest = {};
  let failures = 0;
  for (const { archiveId, videoId } of targets) {
    const sourceUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const src = `/images/archives/${archiveId}.jpg`;
    const destination = path.join(root, 'public', src);
    try {
      const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const { width, height } = jpegDimensions(bytes);
      // YouTube's unavailable-video placeholder is 120 x 90; never publish it.
      if (width < 480 || height < 360) throw new Error(`Thumbnail too small: ${width}x${height}`);
      await fs.writeFile(`${destination}.tmp`, bytes);
      await fs.rename(`${destination}.tmp`, destination);
      manifest[archiveId] = { src, sourceUrl, videoId };
      console.log(`${archiveId}: ${width}x${height}, ${bytes.length} bytes`);
    } catch (error) {
      failures++;
      console.error(`${archiveId}: ${error.message}`);
      if (previous[archiveId]?.videoId === videoId && previous[archiveId]?.src === src) {
        try {
          const { width, height } = jpegDimensions(await fs.readFile(destination));
          if (width >= 480 && height >= 360) manifest[archiveId] = previous[archiveId];
        } catch { /* Missing or invalid old images must not appear in the manifest. */ }
      }
    }
  }
  await fs.writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.rename(`${manifestPath}.tmp`, manifestPath);
  if (failures) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
