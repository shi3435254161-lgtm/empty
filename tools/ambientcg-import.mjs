import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const rootDir = path.resolve(import.meta.dirname, '..');
const textureRoot = path.join(rootDir, 'assets', 'textures', 'cc0');
const wwwTextureRoot = path.join(rootDir, 'www', 'assets', 'textures', 'cc0');
const manifestPath = path.join(textureRoot, 'ambientcg-assets.json');
const generatedPaths = [
    path.join(rootDir, 'js', 'ambientcg-assets.generated.js'),
    path.join(rootDir, 'www', 'js', 'ambientcg-assets.generated.js')
];

const curatedAssets = [
    {
        assetId: 'Tiles107',
        materialId: 'acg-tiles107',
        folder: 'acg_tiles107',
        name: '亮白大板砖',
        role: ['floor', 'wall'],
        resolution: '2K-JPG'
    },
    {
        assetId: 'Tiles036',
        materialId: 'acg-tiles036',
        folder: 'acg_tiles036',
        name: '亮白方砖',
        role: ['wall'],
        resolution: '2K-JPG'
    },
    {
        assetId: 'Marble021',
        materialId: 'acg-marble021',
        folder: 'acg_marble021',
        name: '冷白细纹石材',
        role: ['floor', 'wall', 'countertop'],
        resolution: '2K-JPG'
    },
    {
        assetId: 'Metal009',
        materialId: 'acg-metal009',
        folder: 'acg_metal009',
        name: '拉丝不锈钢',
        role: ['countertop', 'metal'],
        resolution: '1K-JPG'
    },
    {
        assetId: 'Wood049',
        materialId: 'acg-wood049',
        folder: 'acg_wood049',
        name: '浅橡木',
        role: ['cabinet', 'countertop'],
        resolution: '1K-JPG'
    }
];

const onlyArg = process.argv.find(arg => arg.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').filter(Boolean)) : null;

async function readJson(url) {
    let lastError;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
            return response.json();
        } catch (error) {
            lastError = error;
            if (attempt < 4) await new Promise(resolve => setTimeout(resolve, attempt * 1200));
        }
    }
    throw lastError;
}

async function download(url, target, expectedBytes) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    const existing = await fs.stat(target).catch(() => null);
    if (existing?.size === expectedBytes) return existing.size;
    if (existing) await fs.rm(target, { force: true });
    const partial = `${target}.part`;
    await fs.rm(partial, { force: true });
    const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';
    await execFileAsync(curl, [
        '-L', '--fail', '--retry', '4', '--retry-delay', '2', '--retry-all-errors',
        '--connect-timeout', '20', '--max-time', '900', '--silent', '--show-error',
        '--output', partial, url
    ]);
    const size = (await fs.stat(partial)).size;
    if (size !== expectedBytes) {
        await fs.rm(partial, { force: true });
        throw new Error(`size mismatch for ${path.basename(target)}: expected ${expectedBytes}, got ${size}`);
    }
    await fs.rename(partial, target);
    return size;
}

async function sha256(filePath) {
    const hash = crypto.createHash('sha256');
    const data = await fs.readFile(filePath);
    hash.update(data);
    return hash.digest('hex');
}

async function copyTree(source, target) {
    await fs.mkdir(target, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });
    await Promise.all(entries.map(async entry => {
        const from = path.join(source, entry.name);
        const to = path.join(target, entry.name);
        if (entry.isDirectory()) await copyTree(from, to);
        else await fs.copyFile(from, to);
    }));
}

function getZipDownload(asset, apiAsset) {
    const downloads = apiAsset?.downloadFolders?.default?.downloadFiletypeCategories?.zip?.downloads || [];
    const selected = downloads.find(item => item.attribute === asset.resolution);
    if (!selected?.fullDownloadPath || !selected.size) {
        throw new Error(`ambientCG has no ${asset.resolution} ZIP for ${asset.assetId}`);
    }
    return selected;
}

function assertSafeArchivePath(entry) {
    const normalized = entry.replaceAll('\\', '/');
    if (normalized.startsWith('/') || normalized.includes('../') || normalized.includes('/..')) {
        throw new Error(`unsafe path in archive: ${entry}`);
    }
}

async function extractMaps(zipPath, tempRoot, asset) {
    const listing = await execFileAsync('tar.exe', ['-tf', zipPath], { cwd: tempRoot });
    const entries = listing.stdout.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    entries.forEach(assertSafeArchivePath);
    await execFileAsync('tar.exe', ['-xf', zipPath, '-C', tempRoot], { cwd: tempRoot });

    const files = [];
    async function walk(directory) {
        const entriesInDirectory = await fs.readdir(directory, { withFileTypes: true });
        for (const entry of entriesInDirectory) {
            const itemPath = path.join(directory, entry.name);
            if (entry.isDirectory()) await walk(itemPath);
            else files.push(itemPath);
        }
    }
    await walk(tempRoot);

    const findMap = suffix => files.find(filePath => filePath.toLowerCase().endsWith(suffix.toLowerCase()));
    const maps = {
        diffuse: findMap(`${asset.assetId}_${asset.resolution}_Color.jpg`) || findMap('_Color.jpg'),
        normal: findMap(`${asset.assetId}_${asset.resolution}_NormalGL.jpg`) || findMap('_NormalGL.jpg'),
        roughness: findMap(`${asset.assetId}_${asset.resolution}_Roughness.jpg`) || findMap('_Roughness.jpg'),
        displacement: findMap('_Displacement.jpg'),
        ao: findMap('_AmbientOcclusion.jpg')
    };
    if (!maps.diffuse || !maps.normal || !maps.roughness) {
        throw new Error(`missing Color/NormalGL/Roughness maps in ${asset.assetId}`);
    }
    return maps;
}

async function importAsset(asset) {
    const apiUrl = new URL('https://ambientcg.com/api/v2/full_json');
    apiUrl.searchParams.set('type', 'Material');
    apiUrl.searchParams.set('id', asset.assetId);
    apiUrl.searchParams.set('limit', '1');
    apiUrl.searchParams.set('include', 'downloadData,displayData,tagData,imageData');
    const response = await readJson(apiUrl);
    const apiAsset = response.foundAssets?.[0];
    if (!apiAsset || apiAsset.assetId !== asset.assetId) throw new Error(`asset not found: ${asset.assetId}`);
    const downloadInfo = getZipDownload(asset, apiAsset);
    const target = path.join(textureRoot, asset.folder);
    const wwwTarget = path.join(wwwTextureRoot, asset.folder);
    const existingMeta = await fs.readFile(path.join(target, 'asset.json'), 'utf8').then(JSON.parse).catch(() => null);
    const existingMaps = await Promise.all(['diffuse.jpg', 'normal.jpg', 'roughness.jpg'].map(file => fs.access(path.join(target, file)).then(() => true).catch(() => false)));
    if (existingMeta?.assetId === asset.assetId && existingMeta.resolution === asset.resolution && existingMaps.every(Boolean)) {
        const normalizedMeta = {
            ...existingMeta,
            folder: asset.folder,
            maps: Object.fromEntries(Object.entries(existingMeta.maps || {}).map(([key, value]) => [key, value ? path.basename(value) : value]))
        };
        await fs.writeFile(path.join(target, 'asset.json'), `${JSON.stringify(normalizedMeta, null, 2)}\n`, 'utf8');
        await fs.rm(wwwTarget, { recursive: true, force: true });
        await copyTree(target, wwwTarget);
        return normalizedMeta;
    }
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), `ambientcg-${asset.assetId}-`));
    const archivePath = path.join(tempRoot, downloadInfo.fileName);
    try {
        await fs.rm(target, { recursive: true, force: true });
        await fs.rm(wwwTarget, { recursive: true, force: true });
        await download(downloadInfo.fullDownloadPath, archivePath, Number(downloadInfo.size));
        const archiveHash = await sha256(archivePath);
        const maps = await extractMaps(archivePath, tempRoot, asset);
        await fs.mkdir(target, { recursive: true });
        const mapFiles = {};
        for (const [mapName, source] of Object.entries(maps)) {
            if (!source) continue;
            const outputName = {
                diffuse: 'diffuse.jpg',
                normal: 'normal.jpg',
                roughness: 'roughness.jpg',
                displacement: 'displacement.jpg',
                ao: 'ao.jpg'
            }[mapName];
            const output = path.join(target, outputName);
            await fs.copyFile(source, output);
            mapFiles[mapName] = {
                file: outputName,
                bytes: (await fs.stat(output)).size,
                sha256: await sha256(output)
            };
        }
        const metadata = {
            materialId: asset.materialId,
            assetId: asset.assetId,
            folder: asset.folder,
            name: asset.name,
            sourceUrl: apiAsset.shortLink || `https://ambientcg.com/a/${asset.assetId}`,
            provider: 'ambientCG',
            license: 'CC0 1.0 Universal',
            licenseUrl: 'https://ambientcg.com/license',
            resolution: asset.resolution,
            roles: asset.role,
            tags: apiAsset.tags || [],
            archive: { file: downloadInfo.fileName, bytes: Number(downloadInfo.size), sha256: archiveHash },
            maps: Object.fromEntries(Object.entries(maps).map(([key, value]) => [key, value ? path.basename(value) : value])),
            mapFiles,
            importedAt: new Date().toISOString()
        };
        await fs.writeFile(path.join(target, 'asset.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
        await fs.writeFile(path.join(target, 'license.txt'), [
            asset.name,
            `Source: ${metadata.sourceUrl}`,
            'License: CC0 1.0 Universal',
            `License URL: ${metadata.licenseUrl}`,
            `Resolution: ${asset.resolution}`,
            `Archive SHA-256: ${archiveHash}`
        ].join('\n') + '\n', 'utf8');
        await copyTree(target, wwwTarget);
        return metadata;
    } finally {
        await fs.rm(tempRoot, { recursive: true, force: true });
    }
}

const assetsToImport = curatedAssets.filter(asset => !only || only.has(asset.assetId));
if (!assetsToImport.length) throw new Error('No matching assets. Use --only=Tiles107,Tiles036.');

const records = [];
for (const asset of assetsToImport) {
    const result = await importAsset(asset);
    records.push(result);
    console.log(`imported ${asset.assetId} (${asset.resolution})`);
}

const previous = await fs.readFile(manifestPath, 'utf8').then(JSON.parse).catch(() => ({ assets: [] }));
const importedIds = new Set(records.map(item => item.assetId));
const merged = [
    ...(previous.assets || []).filter(item => !importedIds.has(item.assetId)),
    ...records
].sort((a, b) => a.assetId.localeCompare(b.assetId));
const manifest = {
    generatedAt: new Date().toISOString(),
    provider: 'ambientCG',
    license: 'CC0 1.0 Universal',
    assets: merged
};
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const registry = Object.fromEntries(merged.map(asset => [asset.materialId, {
    id: asset.materialId,
    name: asset.name,
    folder: `assets/textures/cc0/${asset.folder || curatedAssets.find(item => item.materialId === asset.materialId)?.folder || asset.assetId}`,
    sourceUrl: asset.sourceUrl,
    license: asset.license,
    resolution: asset.resolution,
    roles: asset.roles,
    maps: asset.mapFiles
}]));
const generated = `// Generated by tools/ambientcg-import.mjs.\nwindow.AMBIENTCG_TEXTURE_ASSETS = ${JSON.stringify(registry, null, 2)};\n`;
await Promise.all(generatedPaths.map(filePath => fs.writeFile(filePath, generated, 'utf8')));
console.log(`wrote ${merged.length} ambientCG texture records`);
