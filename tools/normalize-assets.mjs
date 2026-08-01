import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'assets', 'models', 'models.json');
const outputRoot = path.join(root, 'assets', 'models', 'normalized');
const tempRoot = path.join(root, '.codex-model-normalize');
const reportPath = path.join(outputRoot, 'normalization-report.json');

const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1]) || 1) : Infinity;

function rel(filePath) {
    return path.relative(root, filePath).replace(/\\/g, '/');
}

function runNpx(args) {
    const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
    const commandArgs = process.platform === 'win32' ? ['/c', 'npx', ...args] : args;
    execFileSync(command, commandArgs, {
        cwd: root,
        stdio: ['ignore', 'pipe', 'pipe']
    });
}

function sizeOf(filePath) {
    return existsSync(filePath) ? statSync(filePath).size : 0;
}

function runGltfpack(input, output) {
    const baseArgs = [
        'gltfpack',
        '-i',
        input,
        '-o',
        output,
        '-cc',
        '-kn',
        '-km'
    ];
    try {
        runNpx([...baseArgs, '-tc', '-tl', '1024']);
        return 'gltfpack-meshopt-basisu';
    } catch (error) {
        if (!String(error.message).includes('BasisU')) throw error;
        runNpx(baseArgs);
        return 'gltfpack-meshopt-webp';
    }
}

if (!existsSync(manifestPath)) {
    throw new Error('Missing assets/models/models.json');
}

rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });
mkdirSync(outputRoot, { recursive: true });

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const report = [];
let processed = 0;

for (const item of manifest) {
    if (processed >= limit) break;
    const input = path.join(root, item.modelUrl || '');
    if (!item.id || !existsSync(input)) {
        report.push({ id: item.id || 'unknown', status: 'missing-input', input: item.modelUrl || '' });
        continue;
    }

    const modelOutDir = path.join(outputRoot, item.id);
    const centered = path.join(tempRoot, item.id + '-centered.glb');
    const optimized = path.join(tempRoot, item.id + '-optimized.glb');
    const output = path.join(modelOutDir, 'model.glb');

    try {
        mkdirSync(modelOutDir, { recursive: true });
        runNpx(['gltf-transform', 'center', input, centered, '--pivot', 'below']);
        runNpx([
            'gltf-transform',
            'optimize',
            centered,
            optimized,
            '--compress',
            'meshopt',
            '--texture-compress',
            'webp',
            '--texture-size',
            '1024',
            '--simplify',
            'false'
        ]);
        const compression = runGltfpack(optimized, output);

        report.push({
            id: item.id,
            name: item.name,
            status: 'normalized',
            source: item.modelUrl,
            output: rel(output),
            sourceBytes: sizeOf(input),
            outputBytes: sizeOf(output),
            compression,
            widthMm: item.w,
            depthMm: item.d,
            heightMm: item.h,
            license: item.license,
            requiresAttribution: Boolean(item.requiresAttribution),
            attribution: item.attribution || ''
        });
        processed += 1;
    } catch (error) {
        report.push({
            id: item.id,
            name: item.name,
            status: 'failed',
            source: item.modelUrl,
            error: error.message
        });
    }
}

writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    inputManifest: rel(manifestPath),
    outputRoot: rel(outputRoot),
    processed,
    items: report
}, null, 2), 'utf8');

rmSync(tempRoot, { recursive: true, force: true });
console.log('Wrote ' + rel(reportPath));
