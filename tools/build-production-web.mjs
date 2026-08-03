import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const requestedTarget = process.argv[2] || 'dist/web';
const targetRoot = path.resolve(projectRoot, requestedTarget);
const allowedTargets = [
    path.resolve(projectRoot, 'dist', 'web'),
    path.resolve(projectRoot, 'www-mobile')
];

if (!allowedTargets.includes(targetRoot)) {
    throw new Error(`Refusing to build outside approved targets: ${requestedTarget}`);
}

const approvedModelDirectories = [
    'assets/models/normalized/sf-kitchen-sink-504248ed',
    'assets/models/normalized/sf-shower-cabin-e2c6a8dd',
    'assets/models/normalized/sf-toilet-132a8ee2',
    'assets/models/normalized/sf-fridge-french-door-ebe62ed6',
    'assets/models/normalized/sf-oven-electrolux-69b8e036',
    'assets/models/normalized/sf-oven-bosch-wall-2c46c166',
    'assets/models/normalized/sf-dishwasher-compact-8d47d7a0',
    'assets/models/normalized/sf-induction-caple-339e5aa2',
    'assets/models/normalized/sf-sink-kohler-double-8bc381a2',
    'assets/models/normalized/sf-vanity-ada-f0b5d133',
    'assets/models/normalized/sf-shower-like-83938a58',
    'assets/models/normalized/sf-gas-cooktop-productviz-3791a4e3',
    'assets/models/normalized/sf-sink-fiesta-fbe874f7',
    'assets/models/normalized/sf-towel-rack-02-ceb7ac69',
    'assets/models/normalized/sf-towel-rack-01-6c3cff31',
    'assets/models/normalized/sf-beauty-mirror-3379e018',
    'assets/models/polyhaven/ph-potted-plant-02',
    'assets/models/polyhaven/ph-potted-plant-04',
    'assets/models/polyhaven/ph-wicker-basket-02',
    'assets/models/polyhaven/ph-cutting-board',
    'assets/models/polyhaven/ph-ceramic-vase-01',
    'assets/models/polyhaven/ph-ceramic-vase-03',
    'assets/models/polyhaven/ph-ceramic-vase-04',
    'assets/models/polyhaven/ph-ceiling-lamp-01'
];

const productionEntries = [
    'index.html',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'sw.js',
    'css',
    'js',
    'assets/hdris',
    'assets/textures',
    ...approvedModelDirectories
];

async function copyEntry(relativePath) {
    const source = path.join(projectRoot, relativePath);
    const destination = path.join(targetRoot, relativePath);
    const sourceStat = await stat(source);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: sourceStat.isDirectory(), force: true });
}

async function summarize(directory) {
    let files = 0;
    let bytes = 0;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            const child = await summarize(absolutePath);
            files += child.files;
            bytes += child.bytes;
        } else {
            files += 1;
            bytes += (await stat(absolutePath)).size;
        }
    }
    return { files, bytes };
}

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });

for (const entry of productionEntries) {
    await copyEntry(entry);
}

const summary = await summarize(targetRoot);
console.log(`Production web build: ${path.relative(projectRoot, targetRoot)}`);
console.log(`Files: ${summary.files}`);
console.log(`Size: ${(summary.bytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`Approved model groups: ${approvedModelDirectories.length}`);
