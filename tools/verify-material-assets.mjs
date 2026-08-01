import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(rootDir, 'assets', 'textures', 'cc0', 'ambientcg-assets.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

async function sha256(filePath) {
    const hash = crypto.createHash('sha256');
    hash.update(await fs.readFile(filePath));
    return hash.digest('hex');
}

if (manifest.license !== 'CC0 1.0 Universal' || !Array.isArray(manifest.assets)) {
    throw new Error('Invalid ambientCG manifest header.');
}

let mapCount = 0;
for (const asset of manifest.assets) {
    if (!asset.folder || !asset.sourceUrl || asset.license !== 'CC0 1.0 Universal') {
        throw new Error(`Incomplete metadata for ${asset.assetId || 'unknown asset'}.`);
    }
    for (const required of ['diffuse', 'normal', 'roughness']) {
        if (!asset.mapFiles?.[required]) throw new Error(`Missing ${required} record for ${asset.assetId}.`);
    }
    for (const map of Object.values(asset.mapFiles)) {
        const source = path.join(rootDir, 'assets', 'textures', 'cc0', asset.folder, map.file);
        const mirror = path.join(rootDir, 'www', 'assets', 'textures', 'cc0', asset.folder, map.file);
        const [sourceStat, mirrorStat] = await Promise.all([fs.stat(source), fs.stat(mirror)]);
        if (sourceStat.size !== map.bytes || mirrorStat.size !== map.bytes) {
            throw new Error(`Size mismatch for ${asset.assetId}/${map.file}.`);
        }
        const [sourceHash, mirrorHash] = await Promise.all([sha256(source), sha256(mirror)]);
        if (sourceHash !== map.sha256 || mirrorHash !== map.sha256) {
            throw new Error(`SHA-256 mismatch for ${asset.assetId}/${map.file}.`);
        }
        mapCount += 1;
    }
    await Promise.all([
        fs.access(path.join(rootDir, 'assets', 'textures', 'cc0', asset.folder, 'license.txt')),
        fs.access(path.join(rootDir, 'www', 'assets', 'textures', 'cc0', asset.folder, 'license.txt'))
    ]);
}

console.log(`verified ${manifest.assets.length} ambientCG assets and ${mapCount} mirrored texture maps`);
