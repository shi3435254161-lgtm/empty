// 3D场景

// Simplex-like 噪点 (2D)
class Noise2D {
    constructor(seed = 42) {
        this.p = new Uint8Array(512);
        const perm = new Uint8Array(256);
        for (let i = 0; i < 256; i++) perm[i] = i;
        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807 + 0) % 2147483647;
            const j = s % (i + 1);
            [perm[i], perm[j]] = [perm[j], perm[i]];
        }
        for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return a + t * (b - a); }
    grad(hash, x, y) {
        const h = hash & 3;
        return ((h & 1) === 0 ? x : -x) + ((h & 2) === 0 ? y : -y);
    }
    noise(x, y) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x), yf = y - Math.floor(y);
        const u = this.fade(xf), v = this.fade(yf);
        const p = this.p;
        const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
        const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
        return this.lerp(
            this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u),
            this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u),
            v
        );
    }
    fbm(x, y, octaves = 5, lacunarity = 2, persistence = 0.5) {
        let value = 0, amp = 1, freq = 1, max = 0;
        for (let i = 0; i < octaves; i++) {
            value += this.noise(x * freq, y * freq) * amp;
            max += amp;
            amp *= persistence;
            freq *= lacunarity;
        }
        return value / max;
    }
}

const _noise = new Noise2D(12345);

// PBR纹理套件：diffuse + normal + roughness
class TextureGenerator {
    static createCanvas(size = 1024) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        return canvas;
    }

    // 柏林噪点辅助
    static noiseAt(x, y, scale, octaves) {
        return _noise.fbm(x * scale, y * scale, octaves) * 0.5 + 0.5;
    }

    // ============ 木纹 PBR ============
    static woodPBR(color1 = '#deb887', color2 = '#a0522d', grainScale = 0.08) {
        const size = 1536;
        const diffuse = this.createCanvas(size);
        const normal = this.createCanvas(size);
        const roughness = this.createCanvas(size);
        const dCtx = diffuse.getContext('2d');
        const nCtx = normal.getContext('2d');
        const rCtx = roughness.getContext('2d');
        const w = size, h = size;

        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        // Diffuse
        const dImg = dCtx.createImageData(w, h);
        const nImg = nCtx.createImageData(w, h);
        const rImg = rCtx.createImageData(w, h);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const nx = x / w, ny = y / h;

                // 木纹主条纹
                const grain = this.noiseAt(nx * 0.5, ny * 8 + this.noiseAt(nx, ny, 2, 3) * 2, grainScale, 5);
                // 细纹理
                const fine = this.noiseAt(nx * 3, ny * 40, 0.15, 3);
                // 年轮
                const ring = Math.sin(ny * 60 + this.noiseAt(nx, ny, 3, 4) * 8) * 0.5 + 0.5;

                const blend = grain * 0.5 + ring * 0.3 + fine * 0.2;
                const t = Math.max(0, Math.min(1, blend));

                // Diffuse color
                dImg.data[idx]     = Math.round(c1.r + (c2.r - c1.r) * t);
                dImg.data[idx + 1] = Math.round(c1.g + (c2.g - c1.g) * t);
                dImg.data[idx + 2] = Math.round(c1.b + (c2.b - c1.b) * t);
                dImg.data[idx + 3] = 255;

                // Normal map (从高度图推导)
                const h0 = this.noiseAt((x - 1) / w, ny, grainScale, 5);
                const h1 = this.noiseAt((x + 1) / w, ny, grainScale, 5);
                const h2 = this.noiseAt(nx, (y - 1) / h, grainScale, 5);
                const h3 = this.noiseAt(nx, (y + 1) / h, grainScale, 5);
                const nx2 = (h0 - h1) * 2;
                const ny2 = (h2 - h3) * 2;
                const nz = 1.0;
                const len = Math.sqrt(nx2 * nx2 + ny2 * ny2 + nz * nz);
                nImg.data[idx]     = Math.round((nx2 / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 1] = Math.round((ny2 / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 2] = Math.round((nz / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 3] = 255;

                // Roughness map (木纹凹处粗糙度高)
                const rough = 0.45 + t * 0.25 + fine * 0.1;
                rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = Math.round(Math.max(0, Math.min(1, rough)) * 255);
                rImg.data[idx + 3] = 255;
            }
        }

        dCtx.putImageData(dImg, 0, 0);
        nCtx.putImageData(nImg, 0, 0);
        rCtx.putImageData(rImg, 0, 0);

        return this.createTextureSet(diffuse, normal, roughness);
    }

    // ============ 石英石 PBR ============
    static quartzPBR(baseColor = '#f0f0f0') {
        const size = 1536;
        const diffuse = this.createCanvas(size);
        const normal = this.createCanvas(size);
        const roughness = this.createCanvas(size);
        const dCtx = diffuse.getContext('2d');
        const nCtx = normal.getContext('2d');
        const rCtx = roughness.getContext('2d');
        const w = size, h = size;

        const base = this.hexToRgb(baseColor);
        const dImg = dCtx.createImageData(w, h);
        const nImg = nCtx.createImageData(w, h);
        const rImg = rCtx.createImageData(w, h);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const nx = x / w, ny = y / h;

                // 石英颗粒
                const grain = this.noiseAt(nx * 20, ny * 20, 0.5, 4);
                // 大颗粒
                const bigGrain = this.noiseAt(nx * 5, ny * 5, 0.3, 3);
                // 闪光点
                const sparkle = Math.pow(this.noiseAt(nx * 50, ny * 50, 0.8, 2), 8);

                const v = grain * 0.4 + bigGrain * 0.3 + sparkle * 0.3;
                const brightness = 0.85 + v * 0.15;

                dImg.data[idx]     = Math.round(Math.min(255, base.r * brightness));
                dImg.data[idx + 1] = Math.round(Math.min(255, base.g * brightness));
                dImg.data[idx + 2] = Math.round(Math.min(255, base.b * brightness));
                dImg.data[idx + 3] = 255;

                // Normal (微小凹凸)
                const h0 = this.noiseAt((x - 1) / w * 20, ny * 20, 0.5, 4);
                const h1 = this.noiseAt((x + 1) / w * 20, ny * 20, 0.5, 4);
                const h2 = this.noiseAt(nx * 20, (y - 1) / h * 20, 0.5, 4);
                const h3 = this.noiseAt(nx * 20, (y + 1) / h * 20, 0.5, 4);
                const nxN = (h0 - h1) * 1.5;
                const nyN = (h2 - h3) * 1.5;
                const nzN = 1.0;
                const len = Math.sqrt(nxN * nxN + nyN * nyN + nzN * nzN);
                nImg.data[idx]     = Math.round((nxN / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 1] = Math.round((nyN / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 2] = Math.round((nzN / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 3] = 255;

                // Roughness (石英石较光滑，闪光点处更光滑)
                const rough = 0.2 + bigGrain * 0.15 - sparkle * 0.1;
                rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = Math.round(Math.max(0.05, Math.min(1, rough)) * 255);
                rImg.data[idx + 3] = 255;
            }
        }

        dCtx.putImageData(dImg, 0, 0);
        nCtx.putImageData(nImg, 0, 0);
        rCtx.putImageData(rImg, 0, 0);

        return this.createTextureSet(diffuse, normal, roughness);
    }

    // ============ 大理石 PBR ============
    static marblePBR(baseColor = '#f5f5f0', veinColor = '#c0b8a8') {
        const size = 1536;
        const diffuse = this.createCanvas(size);
        const normal = this.createCanvas(size);
        const roughness = this.createCanvas(size);
        const dCtx = diffuse.getContext('2d');
        const nCtx = normal.getContext('2d');
        const rCtx = roughness.getContext('2d');
        const w = size, h = size;

        const base = this.hexToRgb(baseColor);
        const vein = this.hexToRgb(veinColor);
        const dImg = dCtx.createImageData(w, h);
        const nImg = nCtx.createImageData(w, h);
        const rImg = rCtx.createImageData(w, h);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const nx = x / w, ny = y / h;

                // 大理石纹理 - 多层扭曲噪点
                const n1 = this.noiseAt(nx * 2 + 0.5, ny * 2, 0.4, 4);
                const n2 = this.noiseAt(nx * 4 + n1 * 3, ny * 4 + n1 * 2, 0.3, 3);
                const n3 = this.noiseAt(nx * 8, ny * 8, 0.2, 2);
                const veinT = Math.pow(Math.sin(ny * 15 + n2 * 10) * 0.5 + 0.5, 3);
                const t = veinT * 0.6 + n3 * 0.2 + n1 * 0.2;

                dImg.data[idx]     = Math.round(base.r + (vein.r - base.r) * t);
                dImg.data[idx + 1] = Math.round(base.g + (vein.g - base.g) * t);
                dImg.data[idx + 2] = Math.round(base.b + (vein.b - base.b) * t);
                dImg.data[idx + 3] = 255;

                // Normal
                const h0 = this.noiseAt((x - 1) / w * 4 + n1 * 3, ny * 4, 0.3, 3);
                const h1 = this.noiseAt((x + 1) / w * 4 + n1 * 3, ny * 4, 0.3, 3);
                const h2 = this.noiseAt(nx * 4 + n1 * 3, (y - 1) / h * 4, 0.3, 3);
                const h3 = this.noiseAt(nx * 4 + n1 * 3, (y + 1) / h * 4, 0.3, 3);
                const nxN = (h0 - h1) * 2;
                const nyN = (h2 - h3) * 2;
                const nzN = 1.0;
                const len = Math.sqrt(nxN * nxN + nyN * nyN + nzN * nzN);
                nImg.data[idx]     = Math.round((nxN / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 1] = Math.round((nyN / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 2] = Math.round((nzN / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 3] = 255;

                // Roughness (大理石光滑，脉络处稍粗糙)
                const rough = 0.15 + veinT * 0.15;
                rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = Math.round(Math.max(0.05, Math.min(1, rough)) * 255);
                rImg.data[idx + 3] = 255;
            }
        }

        dCtx.putImageData(dImg, 0, 0);
        nCtx.putImageData(nImg, 0, 0);
        rCtx.putImageData(rImg, 0, 0);

        return this.createTextureSet(diffuse, normal, roughness);
    }

    // ============ 拉丝金属 PBR ============
    static brushedMetalPBR() {
        const size = 1536;
        const diffuse = this.createCanvas(size);
        const normal = this.createCanvas(size);
        const roughness = this.createCanvas(size);
        const dCtx = diffuse.getContext('2d');
        const nCtx = normal.getContext('2d');
        const rCtx = roughness.getContext('2d');
        const w = size, h = size;

        const dImg = dCtx.createImageData(w, h);
        const nImg = nCtx.createImageData(w, h);
        const rImg = rCtx.createImageData(w, h);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const nx = x / w, ny = y / h;

                // 拉丝线条（水平方向）
                const brush = this.noiseAt(nx * 100, ny * 0.5, 0.3, 2);
                const micro = this.noiseAt(nx * 40, ny * 40, 0.6, 3);
                const v = 0.7 + brush * 0.15 + micro * 0.1;

                dImg.data[idx]     = Math.round(Math.min(255, 192 * v));
                dImg.data[idx + 1] = Math.round(Math.min(255, 192 * v));
                dImg.data[idx + 2] = Math.round(Math.min(255, 200 * v));
                dImg.data[idx + 3] = 255;

                // Normal (拉丝方向的凹凸)
                const h0 = this.noiseAt((x - 1) / w * 100, ny * 0.5, 0.3, 2);
                const h1 = this.noiseAt((x + 1) / w * 100, ny * 0.5, 0.3, 2);
                const nxN = (h0 - h1) * 3;
                const nyN = 0;
                const nzN = 1.0;
                const len = Math.sqrt(nxN * nxN + nzN * nzN);
                nImg.data[idx]     = Math.round((nxN / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 1] = Math.round(128);
                nImg.data[idx + 2] = Math.round((nzN / len * 0.5 + 0.5) * 255);
                nImg.data[idx + 3] = 255;

                // Roughness (拉丝方向性粗糙度)
                const rough = 0.15 + (1 - Math.abs(brush - 0.5) * 2) * 0.2;
                rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = Math.round(Math.max(0.05, Math.min(1, rough)) * 255);
                rImg.data[idx + 3] = 255;
            }
        }

        dCtx.putImageData(dImg, 0, 0);
        nCtx.putImageData(nImg, 0, 0);
        rCtx.putImageData(rImg, 0, 0);

        return this.createTextureSet(diffuse, normal, roughness);
    }

    // ============ 瓷砖 PBR ============
    static tilePBR(tileSize = 128) {
        const size = 1536;
        const diffuse = this.createCanvas(size);
        const normal = this.createCanvas(size);
        const roughness = this.createCanvas(size);
        const dCtx = diffuse.getContext('2d');
        const nCtx = normal.getContext('2d');
        const rCtx = roughness.getContext('2d');
        const w = size, h = size;

        const dImg = dCtx.createImageData(w, h);
        const nImg = nCtx.createImageData(w, h);
        const rImg = rCtx.createImageData(w, h);

        const tilesX = Math.floor(w / tileSize);
        const tilesY = Math.floor(h / tileSize);
        const gap = 2;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const tx = x % tileSize, ty = y % tileSize;
                const isGap = tx < gap || ty < gap;

                if (isGap) {
                    // 缝隙
                    dImg.data[idx] = 190; dImg.data[idx + 1] = 185; dImg.data[idx + 2] = 178; dImg.data[idx + 3] = 255;
                    nImg.data[idx] = 128; nImg.data[idx + 1] = 128; nImg.data[idx + 2] = 255; nImg.data[idx + 3] = 255;
                    rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = 200; rImg.data[idx + 3] = 255;
                } else {
                    // 瓷砖面
                    const tileX = Math.floor(x / tileSize);
                    const tileY = Math.floor(y / tileSize);
                    const seed = (tileX * 7 + tileY * 13) & 255;
                    const variation = _noise.noise(tileX * 0.5, tileY * 0.5) * 0.05;

                    const baseR = 232 + variation * 100;
                    const baseG = 224 + variation * 80;
                    const baseB = 216 + variation * 60;

                    // 瓷砖表面微纹理
                    const nx2 = x / w, ny2 = y / h;
                    const micro = this.noiseAt(nx2 * 30, ny2 * 30, 0.5, 2) * 0.05;

                    dImg.data[idx]     = Math.round(Math.min(255, baseR + micro * 100));
                    dImg.data[idx + 1] = Math.round(Math.min(255, baseG + micro * 80));
                    dImg.data[idx + 2] = Math.round(Math.min(255, baseB + micro * 60));
                    dImg.data[idx + 3] = 255;

                    nImg.data[idx] = 128; nImg.data[idx + 1] = 128; nImg.data[idx + 2] = 255; nImg.data[idx + 3] = 255;

                    // 瓷砖光滑，边缘稍粗糙
                    const edgeDist = Math.min(tx - gap, ty - gap, tileSize - tx, tileSize - ty);
                    const edgeRough = edgeDist < 5 ? 0.15 : 0;
                    const rough = 0.25 + micro * 0.1 + edgeRough;
                    rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = Math.round(Math.max(0, Math.min(1, rough)) * 255);
                    rImg.data[idx + 3] = 255;
                }
            }
        }

        dCtx.putImageData(dImg, 0, 0);
        nCtx.putImageData(nImg, 0, 0);
        rCtx.putImageData(rImg, 0, 0);

        return this.createTextureSet(diffuse, normal, roughness);
    }

    // ============ 乳胶漆墙面 PBR ============
    static wallPaintPBR() {
        const size = 768;
        const diffuse = this.createCanvas(size);
        const normal = this.createCanvas(size);
        const roughness = this.createCanvas(size);
        const dCtx = diffuse.getContext('2d');
        const nCtx = normal.getContext('2d');
        const rCtx = roughness.getContext('2d');
        const w = size, h = size;

        const dImg = dCtx.createImageData(w, h);
        const nImg = nCtx.createImageData(w, h);
        const rImg = rCtx.createImageData(w, h);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const nx2 = x / w, ny2 = y / h;

                const micro = this.noiseAt(nx2 * 20, ny2 * 20, 0.8, 3);
                const v = 0.94 + micro * 0.06;

                dImg.data[idx]     = Math.round(245 * v);
                dImg.data[idx + 1] = Math.round(242 * v);
                dImg.data[idx + 2] = Math.round(237 * v);
                dImg.data[idx + 3] = 255;

                nImg.data[idx] = 128; nImg.data[idx + 1] = 128; nImg.data[idx + 2] = 255; nImg.data[idx + 3] = 255;

                const rough = 0.85 + micro * 0.1;
                rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = Math.round(Math.max(0, Math.min(1, rough)) * 255);
                rImg.data[idx + 3] = 255;
            }
        }

        dCtx.putImageData(dImg, 0, 0);
        nCtx.putImageData(nImg, 0, 0);
        rCtx.putImageData(rImg, 0, 0);

        return this.createTextureSet(diffuse, normal, roughness);
    }

    // ============ 木地板 PBR ============
    static floorWoodPBR() {
        const size = 1536;
        const diffuse = this.createCanvas(size);
        const normal = this.createCanvas(size);
        const roughness = this.createCanvas(size);
        const dCtx = diffuse.getContext('2d');
        const nCtx = normal.getContext('2d');
        const rCtx = roughness.getContext('2d');
        const w = size, h = size;

        const c1 = { r: 180, g: 145, b: 110 };
        const c2 = { r: 140, g: 105, b: 70 };

        const dImg = dCtx.createImageData(w, h);
        const nImg = nCtx.createImageData(w, h);
        const rImg = rCtx.createImageData(w, h);

        // 木地板条宽度
        const plankH = 128;
        const plankW = 256;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const nx2 = x / w, ny2 = y / h;

                // 木板接缝
                const plankRow = Math.floor(y / plankH);
                const offset = (plankRow % 2) * (plankW / 2);
                const plankCol = Math.floor((x + offset) / plankW);
                const seamX = (x + offset) % plankW;
                const seamY = y % plankH;
                const isSeam = seamX < 2 || seamY < 2;

                if (isSeam) {
                    dImg.data[idx] = 80; dImg.data[idx + 1] = 60; dImg.data[idx + 2] = 40; dImg.data[idx + 3] = 255;
                    nImg.data[idx] = 128; nImg.data[idx + 1] = 128; nImg.data[idx + 2] = 200; nImg.data[idx + 3] = 255;
                    rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = 220; rImg.data[idx + 3] = 255;
                } else {
                    const seed = plankRow * 17 + plankCol * 31;
                    const variation = _noise.noise(plankRow * 0.3, plankCol * 0.3) * 0.15;

                    const grain = this.noiseAt(nx2 * 0.5, ny2 * 15 + variation * 3, 0.06, 5);
                    const ring = Math.sin(ny2 * 80 + this.noiseAt(nx2, ny2, 2, 3) * 5) * 0.5 + 0.5;
                    const t = grain * 0.6 + ring * 0.4;

                    dImg.data[idx]     = Math.round(c1.r + (c2.r - c1.r) * t + variation * 100);
                    dImg.data[idx + 1] = Math.round(c1.g + (c2.g - c1.g) * t + variation * 80);
                    dImg.data[idx + 2] = Math.round(c1.b + (c2.b - c1.b) * t + variation * 60);
                    dImg.data[idx + 3] = 255;

                    const h0 = this.noiseAt((x - 1) / w * 15, ny2 * 15, 0.06, 5);
                    const h1 = this.noiseAt((x + 1) / w * 15, ny2 * 15, 0.06, 5);
                    const nxN = (h0 - h1) * 2;
                    const nzN = 1.0;
                    const len = Math.sqrt(nxN * nxN + nzN * nzN);
                    nImg.data[idx]     = Math.round((nxN / len * 0.5 + 0.5) * 255);
                    nImg.data[idx + 1] = 128;
                    nImg.data[idx + 2] = Math.round((nzN / len * 0.5 + 0.5) * 255);
                    nImg.data[idx + 3] = 255;

                    const rough = 0.55 + t * 0.2;
                    rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = Math.round(Math.max(0, Math.min(1, rough)) * 255);
                    rImg.data[idx + 3] = 255;
                }
            }
        }

        dCtx.putImageData(dImg, 0, 0);
        nCtx.putImageData(nImg, 0, 0);
        rCtx.putImageData(rImg, 0, 0);

        return this.createTextureSet(diffuse, normal, roughness);
    }

    // 辅助：创建 Three.js 纹理套件
    static createTextureSet(diffuseCanvas, normalCanvas, roughnessCanvas) {
        const diffuse = new THREE.CanvasTexture(diffuseCanvas);
        diffuse.wrapS = THREE.RepeatWrapping;
        diffuse.wrapT = THREE.RepeatWrapping;
        diffuse.encoding = THREE.sRGBEncoding;

        const normal = new THREE.CanvasTexture(normalCanvas);
        normal.wrapS = THREE.RepeatWrapping;
        normal.wrapT = THREE.RepeatWrapping;

        const roughness = new THREE.CanvasTexture(roughnessCanvas);
        roughness.wrapS = THREE.RepeatWrapping;
        roughness.wrapT = THREE.RepeatWrapping;

        return { map: diffuse, normalMap: normal, roughnessMap: roughness };
    }

    // Neutral laminate detail for coloured cabinet fronts. It adds only a
    // controlled micro-variation, so a selected colour remains the colour the
    // customer chose instead of turning into a noisy faux-wood surface.
    static matteLaminatePBR() {
        const size = 512;
        const diffuse = this.createCanvas(size);
        const normal = this.createCanvas(size);
        const roughness = this.createCanvas(size);
        const diffuseContext = diffuse.getContext('2d');
        const normalContext = normal.getContext('2d');
        const roughnessContext = roughness.getContext('2d');
        const diffuseImage = diffuseContext.createImageData(size, size);
        const normalImage = normalContext.createImageData(size, size);
        const roughnessImage = roughnessContext.createImageData(size, size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                const grain = this.noiseAt(x / size * 12, y / size * 12, 0.62, 3);
                const brushing = this.noiseAt(x / size * 2, y / size * 72, 0.08, 2);
                const variation = (grain - 0.5) * 7 + (brushing - 0.5) * 4;
                const normalX = Math.round(128 + (grain - 0.5) * 9);
                const normalY = Math.round(128 + (brushing - 0.5) * 6);
                const rough = Math.round(185 + (grain - 0.5) * 22);

                diffuseImage.data[index] = diffuseImage.data[index + 1] = diffuseImage.data[index + 2] = Math.round(250 + variation);
                diffuseImage.data[index + 3] = 255;
                normalImage.data[index] = normalX;
                normalImage.data[index + 1] = normalY;
                normalImage.data[index + 2] = 255;
                normalImage.data[index + 3] = 255;
                roughnessImage.data[index] = roughnessImage.data[index + 1] = roughnessImage.data[index + 2] = rough;
                roughnessImage.data[index + 3] = 255;
            }
        }

        diffuseContext.putImageData(diffuseImage, 0, 0);
        normalContext.putImageData(normalImage, 0, 0);
        roughnessContext.putImageData(roughnessImage, 0, 0);
        const textureSet = this.createTextureSet(diffuse, normal, roughness);
        textureSet.kind = 'matte-laminate';
        [textureSet.map, textureSet.normalMap, textureSet.roughnessMap].forEach(texture => texture.repeat.set(4, 4));
        return textureSet;
    }

    static hexToRgb(hex) {
        hex = hex.replace('#', '');
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }
}

class Scene3D {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.cabinetMeshes = new Map();
        this.roomMesh = null;
        this.roomWidth = 3;
        this.roomLength = 2.5;
        this.roomHasCeiling = true;
        this.planWalls = [];
        this.surfaceMaterials = {
            floor: 'marble-white',
            wall: 'marble-white'
        };
        this.textures = {};
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedCabinetId = null;
        this.outlineMeshes = [];
        this.onCabinetSelect = null; // callback: (cabinetId | null) => void
        this.onCabinetMove = null; // callback: (cabinetId, newX_mm, newY_mm) => void
        this.isDragging3D = false;
        this.dragCabinetId = null;
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.dragOffset = new THREE.Vector3();
        this.isShowroomMode = false;
        this.showroomLightGroup = null;
        this.modelLoader = null;
        this.modelCache = new Map();
        this.modelRequests = new Map();
        this.renderQuality = 'balanced';
        this.lightingPreset = 'bright';
        this.lightRig = {};
        // Materials are created before the asynchronous HDRI finishes loading.
        // Keep this defined so Three.js does not receive an undefined envMap.
        this.envMap = null;

        this.init();
    }

    loadExternalTextureSet(assetName) {
        const loader = new THREE.TextureLoader();
        const basePath = `assets/textures/cc0/${assetName}`;
        const loadTexture = (file, isColor = false) => {
            const texture = loader.load(`${basePath}/${file}`);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 8;
            if (isColor) texture.encoding = THREE.sRGBEncoding;
            return texture;
        };
        return {
            map: loadTexture('diffuse.jpg', true),
            normalMap: loadTexture('normal.jpg'),
            roughnessMap: loadTexture('roughness.jpg')
        };
    }

    loadTextures() {
        const cc0 = {
            cc0MarbleTiles: this.loadExternalTextureSet('marble_tiles'),
            cc0Marble01: this.loadExternalTextureSet('marble_01'),
            cc0LargeGreyTiles: this.loadExternalTextureSet('large_grey_tiles'),
            cc0FloorTiles: this.loadExternalTextureSet('floor_tiles_06'),
            cc0InteriorTiles: this.loadExternalTextureSet('interior_tiles'),
            cc0LongWhiteTiles: this.loadExternalTextureSet('long_white_tiles'),
            cc0GreyTiles: this.loadExternalTextureSet('grey_tiles'),
            cc0KitchenWood: this.loadExternalTextureSet('kitchen_wood'),
            cc0MetalPlate: this.loadExternalTextureSet('metal_plate'),
            cc0MatteLaminate: TextureGenerator.matteLaminatePBR(),
            phConcreteTileFacade: this.loadExternalTextureSet('ph_concrete_tile_facade'),
            phBrownFloorTiles: this.loadExternalTextureSet('ph_brown_floor_tiles'),
            phDiagonalParquet: this.loadExternalTextureSet('ph_diagonal_parquet'),
            phDarkWood: this.loadExternalTextureSet('ph_dark_wood'),
            phFineGrainedWood: this.loadExternalTextureSet('ph_fine_grained_wood'),
            phMetalPlate02: this.loadExternalTextureSet('ph_metal_plate_02'),
            acgTiles107: this.loadExternalTextureSet('acg_tiles107'),
            acgTiles036: this.loadExternalTextureSet('acg_tiles036'),
            acgMarble021: this.loadExternalTextureSet('acg_marble021'),
            acgMetal009: this.loadExternalTextureSet('acg_metal009'),
            acgWood049: this.loadExternalTextureSet('acg_wood049')
        };
        this.textures = {
            ...cc0,
            woodOak: cc0.cc0KitchenWood,
            woodWalnut: cc0.cc0KitchenWood,
            woodMaple: cc0.cc0KitchenWood,
            woodCherry: cc0.cc0KitchenWood,
            woodWhiteAsh: cc0.cc0KitchenWood,
            marbleWhite: cc0.cc0MarbleTiles,
            marbleCream: cc0.cc0Marble01,
            quartzWhite: cc0.cc0MarbleTiles,
            quartzCream: cc0.cc0MarbleTiles,
            quartzGray: cc0.cc0LargeGreyTiles,
            metalBrushed: cc0.cc0MetalPlate,
            tileCeramic: cc0.cc0FloorTiles,
            wallPaint: cc0.cc0LongWhiteTiles,
            floorWood: cc0.cc0InteriorTiles
        };
    }

    init() {
        const size = this.getSize();

        if (THREE.GLTFLoader) {
            this.modelLoader = new THREE.GLTFLoader();
            if (window.MeshoptDecoder && typeof this.modelLoader.setMeshoptDecoder === 'function') {
                this.modelLoader.setMeshoptDecoder(window.MeshoptDecoder);
            }
        }

        // 加载纹理
        this.loadTextures();

        // 场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f8fa);

        // 相机
        this.camera = new THREE.PerspectiveCamera(
            55,
            size.width / size.height,
            0.1,
            100
        );
        this.camera.position.set(3, 3.5, 4.5);
        this.camera.lookAt(0, 0.8, 0);

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
            alpha: false
        });
        this.renderer.setSize(size.width, size.height);
        const compactDevice = window.matchMedia?.('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) <= 680;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compactDevice ? 1.5 : 2.75));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.86;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.autoClear = true;
        this.container.appendChild(this.renderer.domElement);

        // 生成环境贴图（用于反射）
        this.setupEnvironment();

        // 控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 1.2;
        this.controls.maxDistance = 15;
        this.controls.target.set(0, 0.8, 0);

        // 3D交互：点击选择 / 拖拽移动
        this.setup3DInteraction();

        // 灯光
        this.setupLights();

        // 地面
        this.setupGround();

        // 后处理
        this.setupPostProcessing();
        this.setRenderQuality(this.renderQuality);
        this.setLightingPreset(this.lightingPreset);

        // 窗口大小变化
        window.addEventListener('resize', () => this.resize());

        // 开始渲染
        this.animate();
    }

    async setupEnvironment() {
        // HDRI环境贴图URL（Poly Haven免费资源）
        // 使用室内场景的HDRI
        // Bundled CC0 studio light gives glass, metal, and stone a believable
        // reflection instead of relying only on the procedural fallback.
        const hdriUrls = ['assets/hdris/studio_small_09_2k.hdr'];

        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        // 尝试加载HDRI
        const loadHDRI = async (url) => {
            return new Promise((resolve, reject) => {
                if (!THREE.RGBELoader) {
                    reject(new Error('RGBELoader not available'));
                    return;
                }
                const loader = new THREE.RGBELoader();
                loader.load(
                    url,
                    (texture) => {
                        const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
                        texture.dispose();
                        resolve(envMap);
                    },
                    undefined,
                    (error) => reject(error)
                );
            });
        };

        // 依次尝试加载
        for (const url of hdriUrls) {
            try {
                this.envMap = await loadHDRI(url);
                this.scene.environment = this.envMap;
                this.applyEnvironmentMapToMaterials();
                console.log('HDRI loaded:', url);
                return;
            } catch (e) {
                console.warn('Failed to load HDRI:', url, e);
            }
        }

        // 如果HDRI都加载失败，使用程序化环境
        console.warn('Using fallback environment');
        this.setupFallbackEnvironment();
        this.applyEnvironmentMapToMaterials();
    }

    applyEnvironmentMapToMaterials(root = this.scene) {
        if (!this.envMap || !root?.traverse) return;
        root.traverse(child => {
            if (!child.isMesh || !child.material) return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach(material => {
                if (!('envMap' in material)) return;
                material.envMap = this.envMap;
                material.needsUpdate = true;
            });
        });
    }

    setupFallbackEnvironment() {
        // 程序化生成逼真厨房室内环境贴图
        const size = 512;
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(size, {
            format: THREE.RGBAFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter
        });
        const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);

        const envScene = new THREE.Scene();

        // 用一个大球体作为环境背景
        const envGeo = new THREE.SphereGeometry(40, 64, 32);
        const envMat = new THREE.ShaderMaterial({
            uniforms: {
                // 墙壁颜色（暖白乳胶漆）
                wallColor: { value: new THREE.Color(0xf6f7f7) },
                // 地板颜色（浅木纹）
                floorColor: { value: new THREE.Color(0xcfd5d7) },
                // 天花板颜色
                ceilingColor: { value: new THREE.Color(0xffffff) },
                // 窗户亮光（模拟日光）
                windowColor: { value: new THREE.Color(0xf7fbff) },
                // 环境渐变
                ambientTop: { value: new THREE.Color(0xeef2ff) },
                ambientBottom: { value: new THREE.Color(0xe8eff1) }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    vNormal = normalize(mat3(modelMatrix) * position);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 wallColor;
                uniform vec3 floorColor;
                uniform vec3 ceilingColor;
                uniform vec3 windowColor;
                uniform vec3 ambientTop;
                uniform vec3 ambientBottom;
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                void main() {
                    vec3 dir = normalize(vWorldPosition);
                    float y = dir.y;
                    float x = dir.x;
                    float z = dir.z;

                    // 基础环境渐变
                    vec3 base = mix(ambientBottom, ambientTop, max(y * 0.5 + 0.5, 0.0));

                    // 地板（下方）
                    float floorMask = smoothstep(-0.15, -0.4, y);
                    float floorDetail = sin(x * 12.0) * sin(z * 12.0) * 0.03 + 0.5;
                    vec3 floor = floorColor * (0.8 + floorDetail * 0.4);

                    // 天花板（上方）
                    float ceilMask = smoothstep(0.15, 0.4, y);
                    vec3 ceiling = ceilingColor;

                    // 墙壁（四周）
                    float wallMask = 1.0 - floorMask - ceilMask;

                    // 正面墙 - 模拟窗户亮光区域
                    float windowMask = smoothstep(0.7, 0.95, z) *
                                       smoothstep(-0.3, 0.0, y) * smoothstep(0.6, 0.3, y) *
                                       smoothstep(-0.4, -0.1, x) * smoothstep(0.4, 0.1, x);
                    // 窗框
                    float windowFrame = smoothstep(0.72, 0.74, z) *
                                        smoothstep(-0.28, -0.26, y) * smoothstep(0.58, 0.56, y) *
                                        smoothstep(-0.38, -0.36, x) * smoothstep(0.38, 0.36, x);
                    float isFrame = max(
                        smoothstep(0.01, 0.0, abs(y - (-0.28))) + smoothstep(0.01, 0.0, abs(y - 0.58)),
                        smoothstep(0.01, 0.0, abs(x - (-0.38))) + smoothstep(0.01, 0.0, abs(x - 0.38))
                    ) * smoothstep(0.72, 0.74, z);

                    // 墙面纹理微变化
                    float wallNoise = sin(x * 20.0 + z * 15.0) * sin(y * 18.0) * 0.015;
                    vec3 wall = wallColor * (1.0 + wallNoise);

                    // 组合
                    vec3 color = mix(base, wall, wallMask);
                    color = mix(color, floor, floorMask);
                    color = mix(color, ceiling, ceilMask);

                    // 窗户区域 - 更亮的天光
                    color = mix(color, windowColor * 1.8, windowMask * 0.7);
                    // 窗框用深色
                    color = mix(color, vec3(0.35, 0.32, 0.28), isFrame * windowFrame * 0.5);

                    // 添加环境光遮蔽感（角落变暗）
                    float cornerDark = smoothstep(0.0, 0.3, abs(x)) * smoothstep(0.0, 0.3, abs(z));
                    color *= 0.85 + cornerDark * 0.15;

                    // 模拟间接光照（墙壁反射的暖色光）
                    float indirectLight = smoothstep(-0.2, 0.3, y) * smoothstep(0.5, 0.0, abs(x));
                    color += vec3(0.02, 0.015, 0.008) * indirectLight;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        envScene.add(new THREE.Mesh(envGeo, envMat));

        // 添加几盏点光源模拟室内灯光
        const light1 = new THREE.PointLight(0xffffff, 2.4, 30);
        light1.position.set(0, 8, 0);
        envScene.add(light1);

        const light2 = new THREE.PointLight(0xf1f6ff, 1.8, 25);
        light2.position.set(-5, 6, 3);
        envScene.add(light2);

        // 窗户方向的强光
        const windowLight = new THREE.DirectionalLight(0xf8fbff, 3.2);
        windowLight.position.set(0, 3, 10);
        envScene.add(windowLight);

        cubeCamera.position.set(0, 1.2, 0);
        cubeCamera.update(this.renderer, envScene);

        this.envMap = cubeRenderTarget.texture;
        this.scene.environment = this.envMap;
    }

    setupPostProcessing() {
        // 检查后处理库是否可用
        if (!THREE.EffectComposer || !THREE.RenderPass) {
            console.warn('后处理库未加载，使用普通渲染');
            this.usePostProcessing = false;
            return;
        }

        this.usePostProcessing = true;

        // 创建合成器
        const size = this.getSize();
        this.composer = new THREE.EffectComposer(this.renderer);

        // 渲染通道
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom泛光效果 - 让高亮区域发光
        const bloomShader = {
            uniforms: {
                tDiffuse: { value: null },
                bloomStrength: { value: 0.08 },
                bloomRadius: { value: 0.22 },
                resolution: { value: new THREE.Vector2(size.width, size.height) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float bloomStrength;
                uniform float bloomRadius;
                uniform vec2 resolution;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    // 提取亮部
                    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
                    vec3 bright = color.rgb * smoothstep(0.6, 1.0, brightness);

                    // 简单高斯模糊采样
                    vec2 texelSize = vec2(1.0 / max(resolution.x, 1.0), 1.0 / max(resolution.y, 1.0)) * bloomRadius;
                    vec3 blur = vec3(0.0);
                    float total = 0.0;
                    for(float x = -3.0; x <= 3.0; x += 1.0) {
                        for(float y = -3.0; y <= 3.0; y += 1.0) {
                            float weight = 1.0 / (1.0 + x*x + y*y);
                            vec2 offset = vec2(x, y) * texelSize;
                            vec3 s = texture2D(tDiffuse, vUv + offset).rgb;
                            float b = dot(s, vec3(0.2126, 0.7152, 0.0722));
                            blur += s * smoothstep(0.5, 1.0, b) * weight;
                            total += weight;
                        }
                    }
                    blur /= total;

                    // 混合原始颜色和泛光
                    gl_FragColor = vec4(color.rgb + blur * bloomStrength, color.a);
                }
            `
        };
        const bloomPass = new THREE.ShaderPass(bloomShader);
        this.bloomPass = bloomPass;
        this.composer.addPass(bloomPass);

        // 暗角效果 - 边缘变暗，更像真实相机
        const vignetteShader = {
            uniforms: {
                tDiffuse: { value: null },
                darkness: { value: 0.18 },
                offset: { value: 1.12 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float darkness;
                uniform float offset;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
                    float vignette = 1.0 - dot(uv, uv);
                    color.rgb *= smoothstep(0.0, 1.0, vignette * (1.0 + darkness));
                    gl_FragColor = color;
                }
            `
        };
        const vignettePass = new THREE.ShaderPass(vignetteShader);
        this.vignettePass = vignettePass;
        this.composer.addPass(vignettePass);

        // FXAA抗锯齿
        if (THREE.FXAAShader) {
            const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
            fxaaPass.uniforms['resolution'].value.set(1 / size.width, 1 / size.height);
            this.fxaaPass = fxaaPass;
            this.composer.addPass(fxaaPass);
        }
    }

    setup3DInteraction() {
        const dom = this.renderer.domElement;
        let pointerDownPos = null;
        let pointerDownTime = 0;

        // 获取触摸/鼠标位置
        const getPointer = (event) => {
            const rect = dom.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;
            return {
                x: ((clientX - rect.left) / rect.width) * 2 - 1,
                y: -((clientY - rect.top) / rect.height) * 2 + 1
            };
        };

        // 射线检测点击了哪个柜体
        const raycastCabinet = (event) => {
            const pos = getPointer(event);
            this.mouse.set(pos.x, pos.y);
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // 收集所有柜体的mesh（递归）
            const allMeshes = [];
            this.cabinetMeshes.forEach((group, id) => {
                group.traverse(child => {
                    if (child.isMesh) {
                        child.userData.cabinetId = id;
                        allMeshes.push(child);
                    }
                });
            });

            const intersects = this.raycaster.intersectObjects(allMeshes, false);
            if (intersects.length > 0) {
                return intersects[0].object.userData.cabinetId;
            }
            return null;
        };

        // 鼠标/触摸按下
        const onPointerDown = (event) => {
            if (event.button === 2) return; // 右键不处理
            const pos = event.touches ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };
            pointerDownPos = pos;
            pointerDownTime = Date.now();
        };

        // 鼠标/触摸抬起 - 判断是点击还是拖拽
        const onPointerUp = (event) => {
            if (!pointerDownPos) return;
            const upPos = event.changedTouches ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY } : { x: event.clientX, y: event.clientY };
            const dx = upPos.x - pointerDownPos.x;
            const dy = upPos.y - pointerDownPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const elapsed = Date.now() - pointerDownTime;

            // 短按+小距离 = 点击
            if (dist < 15 && elapsed < 400) {
                const cabinetId = raycastCabinet(event.changedTouches ? event.changedTouches[0] : event);
                if (cabinetId) {
                    this.selectCabinet3D(cabinetId);
                } else {
                    this.selectCabinet3D(null);
                }
            }
            pointerDownPos = null;
            this.isDragging3D = false;
        };

        dom.addEventListener('mousedown', onPointerDown, { passive: true });
        dom.addEventListener('mouseup', onPointerUp, { passive: true });
        dom.addEventListener('touchstart', onPointerDown, { passive: true });
        dom.addEventListener('touchend', onPointerUp, { passive: true });
    }

    selectCabinet3D(cabinetId) {
        // 清除旧的高亮
        this.clearHighlight();

        this.selectedCabinetId = cabinetId;

        if (cabinetId) {
            // 添加高亮轮廓
            const group = this.cabinetMeshes.get(cabinetId);
            if (group) {
                this.addHighlight(group);
            }
        }

        // 通知app层
        if (this.onCabinetSelect) {
            this.onCabinetSelect(cabinetId);
        }
    }

    addHighlight(group) {
        const box = new THREE.Box3().setFromObject(group);
        if (box.isEmpty()) return;

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.46, 0.48, 72),
            new THREE.MeshBasicMaterial({
                color: 0xfcee09,
                transparent: true,
                opacity: 0.2,
                depthWrite: false
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(center.x, Math.max(0.014, box.min.y + 0.014), center.z);
        ring.scale.set(Math.max(0.7, size.x), Math.max(0.7, size.z), 1);
        this.scene.add(ring);
        this.outlineMeshes.push(ring);

        const edgeLines = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x + 0.018, size.y + 0.018, size.z + 0.018)),
            new THREE.LineBasicMaterial({
                color: 0xfcee09,
                transparent: true,
                opacity: 0.58,
                depthTest: true,
                depthWrite: false
            })
        );
        edgeLines.position.copy(center);
        this.scene.add(edgeLines);
        this.outlineMeshes.push(edgeLines);
    }

    clearHighlight() {
        this.outlineMeshes.forEach(mesh => {
            if (mesh.parent) mesh.parent.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        this.outlineMeshes = [];
    }

    // 根据cabinetId找到对应的cabinet数据（通过app回调或遍历）
    getCabinetIdByMesh(group) {
        for (const [id, mesh] of this.cabinetMeshes) {
            if (mesh === group) return id;
        }
        return null;
    }

    getSize() {
        const fallback = this.container.parentElement;
        const rect = this.container.getBoundingClientRect();
        const fallbackRect = fallback?.getBoundingClientRect ? fallback.getBoundingClientRect() : { width: 0, height: 0 };
        return {
            width: Math.max(320, Math.round(this.container.clientWidth || rect.width || fallback?.clientWidth || fallbackRect.width || 800)),
            height: Math.max(240, Math.round(this.container.clientHeight || rect.height || fallback?.clientHeight || fallbackRect.height || 600))
        };
    }

    setupLights() {
        // 环境光 - 柔和的环境光（模拟室内散射光）
        const ambient = new THREE.AmbientLight(0xf7fbff, 0.12);
        this.scene.add(ambient);

        // 半球光 - 天地色彩差异（天空蓝，地面暖黄）
        const hemisphere = new THREE.HemisphereLight(0xe9f4ff, 0x9baab1, 0.2);
        hemisphere.position.set(0, 10, 0);
        this.scene.add(hemisphere);

        // 主光 - 中性日光，保持厨卫白色材料不偏黄
        const sun = new THREE.DirectionalLight(0xffffff, 0.92);
        sun.position.set(3, 6, 4);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        sun.shadow.camera.near = 0.1;
        sun.shadow.camera.far = 20;
        sun.shadow.camera.left = -6;
        sun.shadow.camera.right = 6;
        sun.shadow.camera.top = 6;
        sun.shadow.camera.bottom = -6;
        sun.shadow.bias = -0.0002;
        sun.shadow.normalBias = 0.015;
        sun.shadow.radius = 4;
        this.scene.add(sun);

        // 补光 - 模拟对面墙壁反射的冷色光
        const fill = new THREE.DirectionalLight(0xd8e4f8, 0.22);
        fill.position.set(-4, 4, -2);
        this.scene.add(fill);

        // 顶部补光 - 模拟天花板反弹光
        const top = new THREE.DirectionalLight(0xf5faff, 0.08);
        top.position.set(0, 8, 0);
        this.scene.add(top);

        // 背光 - 增加深度感和轮廓
        const back = new THREE.DirectionalLight(0xe7f1f8, 0.12);
        back.position.set(-2, 3, -5);
        this.scene.add(back);

        // 窗户方向的强光（模拟天光）
        const windowLight = new THREE.DirectionalLight(0xf4fbff, 0.3);
        windowLight.position.set(0, 5, 8);
        this.scene.add(windowLight);

        this.lightRig = { ambient, hemisphere, sun, fill, top, back, windowLight };
    }

    setRenderQuality(mode = 'balanced') {
        this.renderQuality = ['draft', 'balanced', 'render'].includes(mode) ? mode : 'balanced';
        const dpr = window.devicePixelRatio || 1;
        const compactDevice = window.matchMedia?.('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) <= 680;
        const settings = {
            draft: { pixelRatio: 1, post: false, shadows: false, exposure: 0.78, shadowSize: 1024 },
            balanced: { pixelRatio: Math.min(dpr, compactDevice ? 1.5 : 1.75), post: true, shadows: true, exposure: 0.86, shadowSize: compactDevice ? 1536 : 2048 },
            render: { pixelRatio: Math.min(dpr, compactDevice ? 2 : 2.75), post: true, shadows: true, exposure: 0.94, shadowSize: compactDevice ? 2048 : 4096 }
        }[this.renderQuality];

        this.renderer.setPixelRatio(settings.pixelRatio);
        this.renderer.toneMappingExposure = settings.exposure;
        this.renderer.shadowMap.enabled = settings.shadows;
        this.usePostProcessing = settings.post && Boolean(this.composer);

        const sun = this.lightRig?.sun;
        if (sun?.shadow) {
            sun.castShadow = settings.shadows;
            sun.shadow.mapSize.width = settings.shadowSize;
            sun.shadow.mapSize.height = settings.shadowSize;
            sun.shadow.needsUpdate = true;
        }
        this.resize();
    }

    waitForNextFrames(count = 2) {
        const frames = Math.max(1, Number(count) || 1);
        return new Promise(resolve => {
            let remaining = frames;
            const step = () => {
                remaining -= 1;
                if (remaining <= 0) {
                    resolve();
                    return;
                }
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }

    async waitForAssetsIdle(timeoutMs = 4000) {
        const pending = Array.from(this.modelRequests.values());
        if (pending.length) {
            await Promise.race([
                Promise.allSettled(pending),
                new Promise(resolve => setTimeout(resolve, timeoutMs))
            ]);
        }
        await this.waitForNextFrames(2);
    }

    setLightingPreset(preset = 'natural') {
        this.lightingPreset = ['natural', 'bright', 'showroom', 'soft'].includes(preset) ? preset : 'bright';
        const presets = {
            natural: {
                background: 0xeef3f5,
                ambient: 0.32,
                hemisphere: 0.4,
                sun: 0.95,
                fill: 0.3,
                top: 0.18,
                back: 0.16,
                windowLight: 0.34
            },
            bright: {
                background: 0xf5f8fa,
                ambient: 0.38,
                hemisphere: 0.48,
                sun: 1.05,
                fill: 0.38,
                top: 0.24,
                back: 0.2,
                windowLight: 0.46
            },
            showroom: {
                background: 0xf6f8f9,
                ambient: 0.36,
                hemisphere: 0.46,
                sun: 1.02,
                fill: 0.46,
                top: 0.32,
                back: 0.28,
                windowLight: 0.48
            },
            soft: {
                background: 0xf1f0ec,
                ambient: 0.26,
                hemisphere: 0.34,
                sun: 0.72,
                fill: 0.25,
                top: 0.16,
                back: 0.12,
                windowLight: 0.28
            }
        }[this.lightingPreset];

        this.scene.background = new THREE.Color(presets.background);
        Object.entries(presets).forEach(([key, intensity]) => {
            if (key === 'background') return;
            if (this.lightRig[key]) this.lightRig[key].intensity = intensity;
        });
    }

    setupGround() {
        // Neutral exterior apron keeps the camera's foreground from tinting the room warm.
        const groundGeometry = new THREE.PlaneGeometry(20, 20, 1, 1);
        const groundMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xe2e8eb,
            roughness: 0.72,
            metalness: 0.0,
            clearcoat: 0.12,
            clearcoatRoughness: 0.5
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.name = 'environment-ground';
        ground.userData.pathTraceHidden = true;
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    resize() {
        const { width, height } = this.getSize();
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        if (this.composer) {
            this.composer.setSize(width, height);
        }
        if (this.fxaaPass) {
            this.fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();

        if (this.usePostProcessing && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // 设置房间
    setPlanElements({ walls = [], surfaceMaterials = {} } = {}) {
        this.planWalls = Array.isArray(walls) ? walls.map(wall => ({ ...wall })) : [];
        this.surfaceMaterials = {
            floor: 'marble-white',
            wall: 'marble-white',
            ...surfaceMaterials
        };
        this.setRoom(this.roomWidth, this.roomLength, {
            hasCeiling: this.roomHasCeiling,
            preserveCamera: true
        });
    }

    getSurfaceTextureSet(target, materialId) {
        const floorMap = {
            'stone-grey': this.textures.cc0LargeGreyTiles || this.textures.tileCeramic,
            'marble-white': this.textures.cc0MarbleTiles || this.textures.marbleWhite,
            'warm-tile': this.textures.cc0FloorTiles || this.textures.tileCeramic,
            'wood-oak': this.textures.cc0KitchenWood || this.textures.floorWood,
            'dark-slate': this.textures.cc0GreyTiles || this.textures.tileCeramic,
            'ph-concrete-tile': this.textures.phConcreteTileFacade || this.textures.tileCeramic,
            'ph-brown-floor': this.textures.phBrownFloorTiles || this.textures.tileCeramic,
            'ph-parquet': this.textures.phDiagonalParquet || this.textures.floorWood,
            'ph-dark-wood': this.textures.phDarkWood || this.textures.floorWood,
            'ph-fine-wood': this.textures.phFineGrainedWood || this.textures.floorWood,
            'ph-metal-plate': this.textures.phMetalPlate02 || this.textures.metalBrushed,
            'acg-tiles107': this.textures.acgTiles107,
            'acg-tiles036': this.textures.acgTiles036,
            'acg-marble021': this.textures.acgMarble021,
            'acg-metal009': this.textures.acgMetal009,
            'acg-wood049': this.textures.acgWood049
        };
        const wallMap = {
            'stone-grey': this.textures.cc0LargeGreyTiles || this.textures.wallPaint,
            'marble-white': this.textures.cc0Marble01 || this.textures.marbleWhite,
            'warm-tile': this.textures.cc0LongWhiteTiles || this.textures.wallPaint,
            'wood-oak': this.textures.cc0KitchenWood || this.textures.wallPaint,
            'dark-slate': this.textures.cc0GreyTiles || this.textures.wallPaint,
            'ph-concrete-tile': this.textures.phConcreteTileFacade || this.textures.wallPaint,
            'ph-brown-floor': this.textures.phBrownFloorTiles || this.textures.wallPaint,
            'ph-parquet': this.textures.phDiagonalParquet || this.textures.wallPaint,
            'ph-dark-wood': this.textures.phDarkWood || this.textures.wallPaint,
            'ph-fine-wood': this.textures.phFineGrainedWood || this.textures.wallPaint,
            'ph-metal-plate': this.textures.phMetalPlate02 || this.textures.wallPaint,
            'acg-tiles107': this.textures.acgTiles107,
            'acg-tiles036': this.textures.acgTiles036,
            'acg-marble021': this.textures.acgMarble021,
            'acg-metal009': this.textures.acgMetal009,
            'acg-wood049': this.textures.acgWood049
        };
        return (target === 'wall' ? wallMap : floorMap)[materialId] || this.textures.tileCeramic || this.textures.wallPaint;
    }

    createSurfaceMaterial(target) {
        const materialId = this.surfaceMaterials[target] || (target === 'floor' ? 'stone-grey' : 'marble-white');
        // The bundled "marble" download is beige in practice. A bright-white baseline
        // must remain color-accurate instead of inheriting a warm texture cast.
        // Keep the default room deliberately calm. The old source texture was a
        // small dark paver pattern that fought the furniture and read as a warm,
        // low-budget render from normal viewing distance.
        const textureSet = ['marble-white', 'stone-grey'].includes(materialId)
            ? null
            : this.getSurfaceTextureSet(target, materialId);
        const colors = {
            'stone-grey': 0xc5ced1,
            'marble-white': 0xf7faf9,
            'warm-tile': 0xd2c2a0,
            'wood-oak': 0xb88552,
            'dark-slate': 0x2a333b,
            'ph-concrete-tile': 0x8b9699,
            'ph-brown-floor': 0x8a6041,
            'ph-parquet': 0xb27a42,
            'ph-dark-wood': 0x3b2418,
            'ph-fine-wood': 0xc0935b,
            'ph-metal-plate': 0x697279,
            'acg-tiles107': 0xf5f7f6,
            'acg-tiles036': 0xf5f7f7,
            'acg-marble021': 0xf1f4f3,
            'acg-metal009': 0x9fa7a7,
            'acg-wood049': 0xb18a58
        };
        if (textureSet) {
            const materialScale = {
                'stone-grey': target === 'floor' ? 2.8 : 3.8,
                'marble-white': target === 'floor' ? 2.2 : 2.8,
                'warm-tile': target === 'floor' ? 3.2 : 5.4,
                'wood-oak': target === 'floor' ? 1.7 : 2.2,
                'dark-slate': target === 'floor' ? 2.7 : 3.4,
                'ph-concrete-tile': target === 'floor' ? 2.6 : 4.8,
                'ph-brown-floor': target === 'floor' ? 3.0 : 3.7,
                'ph-parquet': target === 'floor' ? 1.45 : 1.8,
                'ph-dark-wood': target === 'floor' ? 1.65 : 2.1,
                'ph-fine-wood': target === 'floor' ? 1.8 : 2.4,
                'ph-metal-plate': target === 'floor' ? 2.3 : 3.0,
                'acg-tiles107': target === 'floor' ? 0.35 : 0.55,
                'acg-tiles036': target === 'floor' ? 0.35 : 0.4,
                'acg-marble021': target === 'floor' ? 0.35 : 0.5,
                'acg-metal009': target === 'floor' ? 0.8 : 1.0,
                'acg-wood049': target === 'floor' ? 0.45 : 0.6
            }[materialId] || (target === 'floor' ? 2.4 : 3.6);
            const repeatX = Math.max(1, this.roomWidth * materialScale);
            const repeatY = Math.max(1, (target === 'floor' ? this.roomLength : 2.5) * materialScale);
            ['map', 'normalMap', 'roughnessMap'].forEach(key => {
                if (textureSet[key]) textureSet[key].repeat.set(repeatX, repeatY);
            });
        }
        return new THREE.MeshPhysicalMaterial({
            color: colors[materialId] || colors['stone-grey'],
            map: textureSet?.map || null,
            normalMap: textureSet?.normalMap || null,
            normalScale: new THREE.Vector2(target === 'floor' ? 0.22 : 0.14, target === 'floor' ? 0.22 : 0.14),
            roughnessMap: textureSet?.roughnessMap || null,
            roughness: ['ph-metal-plate', 'acg-metal009'].includes(materialId) ? 0.36 : ['marble-white', 'acg-marble021'].includes(materialId) ? (target === 'floor' ? 0.34 : 0.52) : target === 'floor' ? 0.46 : 0.76,
            metalness: ['ph-metal-plate', 'acg-metal009'].includes(materialId) ? 0.7 : 0,
            clearcoat: ['ph-metal-plate', 'acg-metal009'].includes(materialId) ? 0.24 : target === 'floor' ? 0.12 : 0.03,
            clearcoatRoughness: target === 'floor' ? 0.36 : 0.72,
            side: THREE.DoubleSide
        });
    }

    setRoom(width, length, options = {}) {
        this.roomWidth = width;
        this.roomLength = length;
        this.roomHasCeiling = options.hasCeiling !== false;

        // 删除旧房间
        if (this.roomMesh) {
            this.scene.remove(this.roomMesh);
            this.disposeObject(this.roomMesh);
        }

        // 创建房间组
        this.roomMesh = new THREE.Group();

        const wallHeight = 2.5;
        const wallThickness = 0.1;

        // 墙壁材质 - 乳胶漆质感 PBR
        const wallMaterial = this.createSurfaceMaterial('wall');
        const markPathTraceRole = (mesh, role, options = {}) => {
            mesh.name = role;
            mesh.userData.pathTraceRole = role;
            if (options.roomShell) mesh.userData.pathTraceRoomShell = true;
            return mesh;
        };

        // 后墙
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(width, wallHeight, wallThickness),
            wallMaterial
        );
        markPathTraceRole(backWall, 'room-back-wall', { roomShell: true });
        backWall.position.set(0, wallHeight / 2, -length / 2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.roomMesh.add(backWall);

        // 左墙
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, length),
            wallMaterial
        );
        markPathTraceRole(leftWall, 'room-left-wall', { roomShell: true });
        leftWall.position.set(-width / 2, wallHeight / 2, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.roomMesh.add(leftWall);

        // 右墙
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, length),
            wallMaterial
        );
        markPathTraceRole(rightWall, 'room-right-wall', { roomShell: true });
        rightWall.position.set(width / 2, wallHeight / 2, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.roomMesh.add(rightWall);

        // 地板 - PBR瓷砖/木地板效果
        const floorMaterial = this.createSurfaceMaterial('floor');
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(width, length),
            floorMaterial
        );
        markPathTraceRole(floor, 'room-floor', { roomShell: true });
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.roomMesh.add(floor);

        // Large-format porcelain joints give the floor a readable scale in a
        // customer-facing scene without adding a noisy texture overlay.
        if (this.referenceKitchenStage) {
            const floorJointMaterial = new THREE.MeshStandardMaterial({
                color: 0xb9c4c6,
                roughness: 0.92,
                metalness: 0
            });
            const tileSize = 0.62;
            for (let x = -width / 2 + tileSize; x < width / 2 - 0.02; x += tileSize) {
                const joint = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.002, length), floorJointMaterial);
                markPathTraceRole(joint, 'room-floor-joint', { roomShell: true });
                joint.position.set(x, 0.002, 0);
                this.roomMesh.add(joint);
            }
            for (let z = -length / 2 + tileSize; z < length / 2 - 0.02; z += tileSize) {
                const joint = new THREE.Mesh(new THREE.BoxGeometry(width, 0.002, 0.006), floorJointMaterial);
                markPathTraceRole(joint, 'room-floor-joint', { roomShell: true });
                joint.position.set(0, 0.002, z);
                this.roomMesh.add(joint);
            }
        }

        if (this.roomHasCeiling) {
            const ceilingMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xf7fafc,
                roughness: 0.82,
                metalness: 0,
                side: THREE.DoubleSide
            });
            const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, length), ceilingMaterial);
            markPathTraceRole(ceiling, 'room-ceiling', { roomShell: true });
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.y = wallHeight;
            ceiling.receiveShadow = true;
            this.roomMesh.add(ceiling);

            const coveMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xeaf0f3,
                roughness: 0.7
            });
            const coveFront = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, 0.08), coveMaterial);
            markPathTraceRole(coveFront, 'room-cove-front', { roomShell: true });
            coveFront.position.set(0, wallHeight - 0.04, -length / 2 + 0.06);
            this.roomMesh.add(coveFront);
            const coveLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, length), coveMaterial);
            markPathTraceRole(coveLeft, 'room-cove-left', { roomShell: true });
            coveLeft.position.set(-width / 2 + 0.06, wallHeight - 0.04, 0);
            this.roomMesh.add(coveLeft);
            const coveRight = coveLeft.clone();
            markPathTraceRole(coveRight, 'room-cove-right', { roomShell: true });
            coveRight.position.x = width / 2 - 0.06;
            this.roomMesh.add(coveRight);

            const lightMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                emissive: 0xf2f9ff,
                emissiveIntensity: 1.4,
                roughness: 0.18,
                metalness: 0.1
            });
            const trimMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xd7d7d2,
                roughness: 0.28,
                metalness: 0.45,
                envMap: this.envMap,
                envMapIntensity: 0.55
            });
            const lightPositions = [
                [-width * 0.28, -length * 0.22],
                [width * 0.28, -length * 0.22],
                [-width * 0.28, length * 0.22],
                [width * 0.28, length * 0.22]
            ];
            lightPositions.forEach(([lx, lz]) => {
                const trim = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 12, 36), trimMaterial);
                markPathTraceRole(trim, 'room-light-trim');
                trim.rotation.x = Math.PI / 2;
                trim.position.set(lx, wallHeight - 0.012, lz);
                this.roomMesh.add(trim);
                const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.055, 36), lightMaterial);
                markPathTraceRole(lamp, 'room-light-emitter');
                lamp.rotation.x = Math.PI / 2;
                lamp.position.set(lx, wallHeight - 0.014, lz);
                this.roomMesh.add(lamp);
                // Keep the practical fixtures neutral in the bright baseline; warm point
                // lights made otherwise white walls read yellow in the viewport.
                const point = new THREE.PointLight(0xf3f9ff, 0.2, 2.8);
                point.position.set(lx, wallHeight - 0.12, lz);
                this.roomMesh.add(point);
            });

            const strip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.62, 0.012, 0.018), lightMaterial);
            markPathTraceRole(strip, 'room-light-strip');
            strip.position.set(0, wallHeight - 0.018, -length / 2 + 0.18);
            this.roomMesh.add(strip);
        }

        // A bright painted/marble wall should stay visually quiet. The old always-on
        // grout overlay made the default room look like a yellow tiled bathroom.
        if (this.surfaceMaterials.wall !== 'marble-white') {
            const groutMaterial = new THREE.MeshStandardMaterial({ color: 0xbeb8ae, roughness: 0.88 });
            const tileH = 0.48;
            const tileW = 0.6;
            for (let gx = -width / 2 + tileW; gx < width / 2 - 0.02; gx += tileW) {
                const line = new THREE.Mesh(new THREE.BoxGeometry(0.006, wallHeight, 0.004), groutMaterial);
                markPathTraceRole(line, 'room-wall-grout');
                line.position.set(gx, wallHeight / 2, -length / 2 + wallThickness / 2 + 0.003);
                this.roomMesh.add(line);
            }
            for (let gy = tileH; gy < wallHeight - 0.02; gy += tileH) {
                const line = new THREE.Mesh(new THREE.BoxGeometry(width, 0.006, 0.004), groutMaterial);
                markPathTraceRole(line, 'room-wall-grout');
                line.position.set(0, gy, -length / 2 + wallThickness / 2 + 0.003);
                this.roomMesh.add(line);
            }
        }

        this.addPlanWalls(wallMaterial, wallHeight);

        if (this.referenceKitchenStage) {
            this.addReferenceKitchenBacksplash(width, length, wallHeight);
        }

        this.scene.add(this.roomMesh);

        if (!options.preserveCamera) this.setCameraView('perspective');
    }

    setReferenceKitchenStage(enabled) {
        const next = Boolean(enabled);
        if (this.referenceKitchenStage === next) return;
        this.referenceKitchenStage = next;
        this.setRoom(this.roomWidth, this.roomLength, {
            hasCeiling: this.roomHasCeiling,
            preserveCamera: true
        });
    }

    addReferenceKitchenBacksplash(width, length, wallHeight) {
        const panelHeight = 0.78;
        const panelWidth = Math.min(width - 0.76, 3.12);
        const panelCenterX = -0.36;
        const panelBottom = 0.79;
        const panelZ = -length / 2 + 0.057;
        const textureSet = this.textures.cc0LongWhiteTiles || this.textures.cc0Marble01;
        // Keep the stage neutral and readable in the live viewport. The
        // procedural seams below provide enough scale without risking a dark
        // texture fallback while the asset loader is still warming up.
        const stoneMap = null;
        const stoneNormal = null;
        const stoneRoughness = null;
        [stoneMap].filter(Boolean).forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2.4, 2.2);
            texture.needsUpdate = true;
        });
        const stone = new THREE.MeshPhysicalMaterial({
            color: 0xe6ecec,
            map: stoneMap,
            normalMap: stoneNormal,
            normalScale: new THREE.Vector2(0.12, 0.12),
            roughnessMap: stoneRoughness,
            roughness: 0.56,
            metalness: 0,
            clearcoat: 0.12,
            clearcoatRoughness: 0.42
        });
        const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x9eabad, roughness: 0.84 });
        const panel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, panelHeight, 0.014), stone);
        panel.position.set(panelCenterX, panelBottom + panelHeight / 2, panelZ);
        panel.receiveShadow = true;
        panel.name = 'reference-kitchen-backsplash';
        panel.userData.pathTraceRole = 'reference-kitchen-backsplash';
        this.roomMesh.add(panel);

        [-0.25, 0.25].forEach(offset => {
            const seam = new THREE.Mesh(new THREE.BoxGeometry(0.005, panelHeight - 0.03, 0.006), seamMaterial);
            seam.position.set(panelCenterX + panelWidth * offset, panelBottom + panelHeight / 2, panelZ + 0.012);
            this.roomMesh.add(seam);
        });

        const taskLightMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            emissive: 0xf1f7ff,
            emissiveIntensity: 1.35,
            roughness: 0.16
        });
        const taskLight = new THREE.Mesh(new THREE.BoxGeometry(panelWidth * 0.92, 0.012, 0.022), taskLightMaterial);
        taskLight.position.set(panelCenterX, 1.49, panelZ + 0.07);
        this.roomMesh.add(taskLight);
        const taskFill = new THREE.PointLight(0xf3f8ff, 0.12, 1.8);
        taskFill.position.set(panelCenterX, 1.42, -length / 2 + 0.38);
        this.roomMesh.add(taskFill);
    }

    // 更新橱柜
    addPlanWalls(wallMaterial, defaultHeight = 2.5) {
        this.planWalls.forEach(wall => {
            const x1 = wall.x1 / 1000 - this.roomWidth / 2;
            const z1 = wall.y1 / 1000 - this.roomLength / 2;
            const x2 = wall.x2 / 1000 - this.roomWidth / 2;
            const z2 = wall.y2 / 1000 - this.roomLength / 2;
            const wallLength = Math.hypot(x2 - x1, z2 - z1);
            if (wallLength < 0.2) return;
            const thickness = Math.max(0.06, (wall.thickness || 100) / 1000);
            const height = Math.max(1.2, (wall.height || 2500) / 1000 || defaultHeight);
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(wallLength, height, thickness),
                wallMaterial.clone()
            );
            mesh.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
            mesh.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.name = 'plan-wall';
            mesh.userData.pathTraceRole = 'plan-wall';
            mesh.userData.pathTraceRoomShell = true;
            this.roomMesh.add(mesh);

            const capMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x0d171b,
                roughness: 0.34,
                metalness: 0.1,
                clearcoat: 0.18,
                envMap: this.envMap,
                envMapIntensity: 0.35
            });
            const cap = new THREE.Mesh(new THREE.BoxGeometry(wallLength + 0.02, 0.035, thickness + 0.025), capMaterial);
            cap.position.copy(mesh.position);
            cap.position.y = height + 0.015;
            cap.rotation.y = mesh.rotation.y;
            cap.castShadow = true;
            cap.name = 'plan-wall-cap';
            cap.userData.pathTraceRole = 'plan-wall-cap';
            cap.userData.pathTraceRoomShell = true;
            this.roomMesh.add(cap);
        });
    }

    updateCabinets(cabinets) {
        // 删除旧的橱柜mesh
        this.cabinetMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            this.disposeObject(mesh);
        });
        this.cabinetMeshes.clear();

        // 创建新的
        cabinets.forEach(cab => {
            const mesh = this.createCabinetMesh(cab);
            if (mesh) {
                this.scene.add(mesh);
                this.cabinetMeshes.set(cab.id, mesh);
            }
        });
    }

    createCabinetMesh(cab) {
        const group = new THREE.Group();
        group.userData.cabinetId = cab.id;
        const moduleSpec = typeof findCabinetModule === 'function' ? findCabinetModule(cab.moduleId) : null;
        const spec = { ...(moduleSpec || {}), ...cab };

        // 尺寸转换 (mm -> m)
        const w = cab.width / 1000;
        const d = cab.depth / 1000;
        const h = cab.height / 1000;

        // 旋转后的占位中心需与 2D 平面保持一致
        const quarterTurn = Math.round((cab.rotation || 0) / 90) % 2 !== 0;
        const footprintWidth = quarterTurn ? d : w;
        const footprintDepth = quarterTurn ? w : d;
        const x = (cab.x / 1000) + footprintWidth / 2 - this.roomWidth / 2;
        const z = (cab.y / 1000) + footprintDepth / 2 - this.roomLength / 2;

        const defaultElevation = cab.mountType === 'wall' ? 1.5 : cab.mountType === 'counter' ? 0.72 : 0;
        const savedElevation = Number(cab.elevation);
        const elevation = Number.isFinite(savedElevation) ? savedElevation / 1000 : defaultElevation;
        const y = elevation + h / 2;

        // 根据moduleId创建不同的几何体
        const moduleId = cab.moduleId;

        if (moduleId === 'l-shape' || moduleId === 'u-shape' || moduleId === 'base-corner-l' || moduleId === 'base-corner-u') {
            this.createLayoutShape(group, w, d, h, moduleId, spec);
        } else if (spec.fixtureKind === 'water-heater') {
            this.createWaterHeater(group, w, d, h, spec);
        } else if (['plant', 'window', 'curtain', 'wall-art', 'mat', 'basket', 'vase', 'light', 'kitchen-prop'].includes(spec.fixtureKind)) {
            this.createDecorFixture(group, w, d, h, spec);
        } else if (moduleId.startsWith('bath-')) {
            this.createBathroomFixture(group, w, d, h, moduleId, spec);
        } else if (moduleId.includes('island')) {
            this.createIsland(group, w, d, h, spec.color, moduleId, spec.countertopColor, spec);
        } else if (moduleId.includes('sink')) {
            this.createSink(group, w, d, h, spec.countertopColor, spec);
        } else if (moduleId.includes('cooktop') || moduleId.includes('stove')) {
            this.createCooktop(group, w, d, h, moduleId, spec);
        } else if (moduleId.includes('hood') || moduleId.includes('range-hood')) {
            this.createRangeHood(group, w, d, h, moduleId, spec);
        } else if (moduleId.includes('fridge')) {
            this.createFridge(group, w, d, h, moduleId, spec);
        } else if (moduleId.includes('dishwasher')) {
            this.createDishwasher(group, w, d, h, spec);
        } else if (moduleId.includes('oven')) {
            this.createOven(group, w, d, h, spec);
        } else if (moduleId.includes('washer')) {
            this.createWasher(group, w, d, h, spec);
        } else if (moduleId.includes('countertop')) {
            this.createCountertop(group, w, d, h, spec.color, spec);
        } else {
            this.createGenericCabinet(group, w, d, h, spec.color, spec.mountType, spec.countertopColor, spec);
        }

        this.attachExternalModel(group, cab, spec, { width: w, depth: d, height: h });
        group.position.set(x, y, z);
        group.rotation.y = (cab.rotation * Math.PI) / 180;

        return group;
    }

    getExternalModelAsset(spec) {
        const assets = window.MODEL_ASSETS || {};
        const entry = assets[spec.modelVariantId] || assets[spec.moduleId] || assets[spec.id] || null;
        const isUsable = typeof window.isUsableModelAsset === 'function'
            ? window.isUsableModelAsset
            : asset => Boolean(asset && asset.ready !== false && asset.url && (asset.safe === true || asset.normalized === true));
        if (!entry) return null;
        if (Array.isArray(entry)) {
            return entry.find(item => item.id === spec.modelVariantId && isUsable(item))
                || entry.find(item => isUsable(item))
                || null;
        }
        return isUsable(entry) ? entry : null;
    }

    attachExternalModel(group, cab, spec, targetSize) {
        const asset = this.getExternalModelAsset(spec);
        if (!asset || !asset.url || !this.modelLoader) return;

        const requestKey = asset.id || asset.url;
        const currentCabinetId = cab.id;
        this.loadExternalModel(requestKey, asset)
            .then(source => {
                if (!source || group.userData.cabinetId !== currentCabinetId) return;

                const model = source.clone(true);
                this.prepareExternalModel(model, targetSize, asset, spec);

                const fallbackChildren = group.children.slice();
                fallbackChildren.forEach(child => {
                    group.remove(child);
                    this.disposeObject(child);
                });
                group.add(model);
                this.enableShadows(group);
            })
            .catch(error => {
                console.warn('外部模型加载失败，继续使用程序模型:', asset.url, error);
            });
    }

    loadExternalModel(requestKey, asset) {
        if (this.modelCache.has(requestKey)) {
            return Promise.resolve(this.modelCache.get(requestKey));
        }
        if (this.modelRequests.has(requestKey)) {
            return this.modelRequests.get(requestKey);
        }

        const request = new Promise((resolve, reject) => {
            this.modelLoader.load(
                asset.url,
                gltf => {
                    const source = gltf.scene || gltf.scenes?.[0];
                    if (!source) {
                        reject(new Error('GLB 没有可用场景'));
                        return;
                    }
                    this.modelCache.set(requestKey, source);
                    this.modelRequests.delete(requestKey);
                    resolve(source);
                },
                undefined,
                error => {
                    this.modelRequests.delete(requestKey);
                    reject(error);
                }
            );
        });

        this.modelRequests.set(requestKey, request);
        return request;
    }

    prepareExternalModel(model, targetSize, asset = {}, spec = {}) {
        const bounds = new THREE.Box3().setFromObject(model);
        const sourceSize = bounds.getSize(new THREE.Vector3());
        const sourceCenter = bounds.getCenter(new THREE.Vector3());
        const target = new THREE.Vector3(targetSize.width, targetSize.height, targetSize.depth);
        const fitByFootprint = asset.fitMode === 'footprint';
        const scale = Math.min(
            target.x / Math.max(sourceSize.x, 0.001),
            fitByFootprint ? Number.POSITIVE_INFINITY : target.y / Math.max(sourceSize.y, 0.001),
            target.z / Math.max(sourceSize.z, 0.001)
        );

        model.scale.setScalar(scale);
        model.position.set(
            -sourceCenter.x * scale,
            -bounds.min.y * scale - targetSize.height / 2,
            -sourceCenter.z * scale
        );

        if (asset.rotation) {
            model.rotation.y = THREE.MathUtils.degToRad(Number(asset.rotation) || 0);
        }

        model.traverse(child => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
                const materials = sourceMaterials.map(material => material.clone());
                materials.forEach(material => {
                    if (this.envMap && 'envMap' in material) material.envMap = this.envMap;
                    if ('envMapIntensity' in material) material.envMapIntensity = 0.75;
                    if (spec.customColor && material.color) {
                        // A material swatch is an explicit design decision. The
                        // original albedo map would otherwise multiply the chosen
                        // colour, leaving imported fixtures mottled and making the
                        // path-traced result disagree with the live viewport.
                        material.color.set(spec.color || '#f5f5f5');
                        material.map = null;
                        material.needsUpdate = true;
                    }
                });
                child.material = Array.isArray(child.material) ? materials : materials[0];
            }
        });
    }

    getCabinetTexture(color, spec = {}) {
        if (spec.materialKind === 'glass') return null;
        if (['oak', 'walnut', 'ash'].includes(spec.materialKind)) return this.textures.cc0KitchenWood;
        if (spec.materialKind === 'metal') return this.textures.cc0MetalPlate;
        const colorLower = color.toLowerCase();

        // 木纹系列
        if (colorLower === '#deb887' || colorLower === '#c8a882') return this.textures.cc0KitchenWood || this.textures.woodOak;
        if (colorLower === '#8b6914') return this.textures.cc0KitchenWood || this.textures.woodWalnut;
        if (colorLower === '#f5f5dc') return this.textures.woodMaple;
        if (colorLower === '#b8956a') return this.textures.cc0KitchenWood || this.textures.woodWhiteAsh;
        if (colorLower === '#a0522d') return this.textures.cc0KitchenWood || this.textures.woodCherry;
        if (colorLower === '#654321') return this.textures.cc0KitchenWood || this.textures.woodWalnut;
        if (colorLower === '#e8d5b7') return this.textures.cc0KitchenWood || this.textures.woodWhiteAsh;

        // Solid-colour cabinet fronts still need a restrained material response.
        // Without it dark graphite, blue, and white all look like the same flat
        // parameterised box in a high-resolution preview.
        return this.textures.cc0MatteLaminate || null;
    }

    getCountertopTexture(color) {
        const colorLower = color.toLowerCase();

        // Bright solid-surface worktops must stay bright. The bundled marble
        // texture contains warm grout and made a white quartz worktop appear
        // as a brown woven slab in the main presentation.
        if (['#ffffff', '#fafbf9', '#f8f9f7', '#f8f8f8', '#f7f8f7', '#f4f4f2'].includes(colorLower)) {
            return null;
        }

        // 石英石系列
        if (colorLower === '#f8f8f8' || colorLower === '#f0f0f0' || colorLower === '#f5deb3' ||
            colorLower === '#e8dcc8' || colorLower === '#d4c5a9' || colorLower === '#c8b896' ||
            colorLower === '#b0a080' || colorLower === '#a9a9a9' || colorLower === '#808080' ||
            colorLower === '#505050' || colorLower === '#404040') {
            // 深色石英石用灰色纹理
            if (colorLower === '#505050' || colorLower === '#404040') return this.textures.quartzGray;
            if (colorLower === '#a9a9a9' || colorLower === '#808080') return this.textures.quartzGray;
            return this.textures.quartzWhite;
        }

        // 大理石系列
        if (colorLower === '#f0e6d0' || colorLower === '#d8d0c0' || colorLower === '#c0b8a8') {
            return colorLower === '#c0b8a8' ? this.textures.marbleCream : this.textures.marbleWhite;
        }

        // 金属系列
        if (colorLower === '#c8c8c8' || colorLower === '#b0b0b0') return this.textures.metalBrushed;

        return this.textures.quartzWhite;
    }

    createLayoutShape(group, w, d, h, moduleId, spec = {}) {
        const runDepth = Math.min(0.6, d * 0.42);
        const color = spec.color || '#d7b889';
        const counter = spec.countertopColor || '#f0e6d0';
        const baseSpec = {
            ...spec,
            doorCount: 3,
            drawerCount: 0,
            openShelves: 0
        };

        const addSegment = (segW, segD, x, z, doors = 2) => {
            const segment = new THREE.Group();
            this.createGenericCabinet(segment, segW, segD, h, color, 'floor', counter, {
                ...baseSpec,
                doorCount: doors,
                drawerCount: segW > 1.2 ? 1 : 0
            });
            segment.position.set(x, 0, z);
            group.add(segment);
        };

        if (moduleId === 'base-corner-l') {
            const leg = Math.min(w, d);
            addSegment(w, runDepth, 0, -d / 2 + runDepth / 2, 2);
            addSegment(runDepth, leg, -w / 2 + runDepth / 2, -d / 2 + leg / 2, 1);
        } else if (moduleId === 'base-corner-u') {
            addSegment(w, runDepth, 0, -d / 2 + runDepth / 2, 2);
            addSegment(runDepth, d, -w / 2 + runDepth / 2, 0, 1);
            addSegment(runDepth, d, w / 2 - runDepth / 2, 0, 1);
        } else if (moduleId === 'u-shape') {
            addSegment(w, runDepth, 0, -d / 2 + runDepth / 2, 4);
            addSegment(runDepth, d, -w / 2 + runDepth / 2, 0, 2);
            addSegment(runDepth, d, w / 2 - runDepth / 2, 0, 2);
        } else {
            addSegment(w, runDepth, 0, -d / 2 + runDepth / 2, 4);
            addSegment(runDepth, d, -w / 2 + runDepth / 2, 0, 2);
        }

        this.enableShadows(group);
    }

    createWaterHeater(group, w, d, h, spec = {}) {
        const isSlimConcept = spec.heaterStyle === 'slim';
        const body = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(spec.color || '#f4f6f6'),
            roughness: 0.24,
            metalness: 0.16,
            clearcoat: 0.48,
            clearcoatRoughness: 0.12,
            envMap: this.envMap,
            envMapIntensity: 0.7
        });
        const dark = this.createBlackGlassMaterial(0x101719);
        const chrome = this.createChromeMaterial(0xc8cfce);

        if (spec.heaterStyle === 'tank') {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.45, h * 0.45, w * 0.88, 48), body);
            tank.rotation.z = Math.PI / 2;
            group.add(tank);
            const display = this.addRoundedBox(group, w * 0.2, h * 0.1, 0.025, 0, -h * 0.12, d / 2 + 0.014, dark, 0.012, 8);
            display.rotation.x = -0.03;
        } else {
            const bodyW = isSlimConcept ? w * 0.88 : w;
            const bodyH = isSlimConcept ? h * 0.96 : h;
            this.addRoundedBox(group, bodyW, bodyH, d, 0, 0, 0, body, Math.min(isSlimConcept ? 0.075 : 0.045, w * 0.08), 14);
            this.addRoundedBox(group, w * (isSlimConcept ? 0.34 : 0.54), h * (isSlimConcept ? 0.14 : 0.11), 0.026, 0, -h * 0.28, d / 2 + 0.018, dark, 0.014, 8);
            const ventCount = isSlimConcept ? 5 : 9;
            for (let i = 0; i < ventCount; i += 1) {
                const offset = i - (ventCount - 1) / 2;
                this.addBox(group, w * (isSlimConcept ? 0.07 : 0.055), 0.008, 0.014, offset * w * (isSlimConcept ? 0.1 : 0.085), h * 0.37, d / 2 + 0.018, chrome);
            }
            if (isSlimConcept) {
                this.addRoundedBox(group, w * 0.07, h * 0.34, 0.018, -w * 0.32, 0, d / 2 + 0.016, chrome, 0.01, 6);
                this.addRoundedBox(group, w * 0.07, h * 0.34, 0.018, w * 0.32, 0, d / 2 + 0.016, chrome, 0.01, 6);
            }
        }

        [-0.2, 0.2].forEach((offset, index) => {
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, Math.max(0.12, h * 0.24), 18), index ? chrome : new THREE.MeshStandardMaterial({ color: 0xb55b42, metalness: 0.65, roughness: 0.24 }));
            pipe.position.set(w * offset, -h * 0.59, 0);
            group.add(pipe);
        });
        this.enableShadows(group);
    }

    createDecorFixture(group, w, d, h, spec = {}) {
        const color = new THREE.Color(spec.color || '#d9ddd9');
        const material = new THREE.MeshPhysicalMaterial({
            color,
            roughness: spec.fixtureKind === 'window' ? 0.18 : 0.52,
            metalness: spec.fixtureKind === 'window' ? 0.32 : 0.02,
            clearcoat: spec.fixtureKind === 'vase' ? 0.55 : 0.12,
            envMap: this.envMap,
            envMapIntensity: 0.5
        });
        const dark = new THREE.MeshStandardMaterial({ color: color.clone().offsetHSL(0, 0, -0.28), roughness: 0.7 });

        if (spec.fixtureKind === 'plant') {
            const potHeight = h * 0.3;
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.27, w * 0.34, potHeight, 36, 1, false), new THREE.MeshPhysicalMaterial({ color: 0xe8e4dc, roughness: 0.4, clearcoat: 0.25 }));
            pot.position.y = -h / 2 + potHeight / 2;
            group.add(pot);
            const soil = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.255, w * 0.255, 0.018, 32), new THREE.MeshStandardMaterial({ color: 0x30251d, roughness: 1 }));
            soil.position.y = -h / 2 + potHeight;
            group.add(soil);
            const leafMaterial = new THREE.MeshPhysicalMaterial({ color, roughness: 0.58, side: THREE.DoubleSide });
            for (let i = 0; i < 11; i += 1) {
                const angle = (i / 11) * Math.PI * 2;
                const stemHeight = h * (0.35 + (i % 4) * 0.08);
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, stemHeight, 10), dark);
                stem.position.set(Math.cos(angle) * w * 0.07, -h * 0.2 + stemHeight / 2, Math.sin(angle) * d * 0.07);
                stem.rotation.z = Math.cos(angle) * 0.14;
                group.add(stem);
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.17, 20, 12), leafMaterial);
                leaf.scale.set(0.52, 1.15, 0.22);
                leaf.rotation.z = angle;
                leaf.position.set(Math.cos(angle) * w * 0.22, -h * 0.05 + stemHeight * 0.55, Math.sin(angle) * d * 0.16);
                group.add(leaf);
            }
        } else if (spec.fixtureKind === 'window') {
            const frame = Math.max(0.035, Math.min(w, h) * 0.055);
            const glass = new THREE.MeshPhysicalMaterial({ color: 0xcbe4ef, transparent: true, opacity: 0.32, roughness: 0.04, clearcoat: 1, envMap: this.envMap, envMapIntensity: 0.8 });
            this.addBox(group, w, h, Math.max(0.012, d * 0.15), 0, 0, 0, glass);
            this.addBox(group, w, frame, d, 0, h / 2 - frame / 2, 0, dark);
            this.addBox(group, w, frame, d, 0, -h / 2 + frame / 2, 0, dark);
            this.addBox(group, frame, h, d, -w / 2 + frame / 2, 0, 0, dark);
            this.addBox(group, frame, h, d, w / 2 - frame / 2, 0, 0, dark);
            this.addBox(group, frame * 0.72, h - frame * 2, d * 0.8, 0, 0, 0, dark);
            this.addBox(group, w - frame * 2, frame * 0.72, d * 0.8, 0, 0, 0, dark);
        } else if (spec.fixtureKind === 'curtain') {
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, w * 1.04, 18), this.createChromeMaterial(0xbec4c3));
            rod.rotation.z = Math.PI / 2;
            rod.position.y = h / 2 - 0.03;
            group.add(rod);
            const folds = 12;
            for (let i = 0; i < folds; i += 1) {
                const foldW = w / folds;
                const fold = this.addRoundedBox(group, foldW * 0.82, h * 0.94, d * 0.38, -w / 2 + foldW * (i + 0.5), -h * 0.02, (i % 2 ? 1 : -1) * d * 0.16, material, Math.min(0.018, foldW * 0.18), 6);
                fold.rotation.y = (i % 2 ? 1 : -1) * 0.08;
            }
        } else if (spec.fixtureKind === 'wall-art') {
            const frame = Math.max(0.025, Math.min(w, h) * 0.06);
            this.addBox(group, w, h, d, 0, 0, 0, dark);
            this.addBox(group, w - frame * 2, h - frame * 2, d * 0.48, 0, 0, d * 0.3, material);
            this.addBox(group, w * 0.7, h * 0.012, 0.01, 0, -h * 0.1, d * 0.58, new THREE.MeshStandardMaterial({ color: 0x6f8e95 }));
        } else if (spec.fixtureKind === 'mat') {
            this.addRoundedBox(group, w, h, d, 0, 0, 0, material, Math.min(0.08, Math.min(w, d) * 0.08), 16);
        } else if (spec.fixtureKind === 'basket') {
            this.addRoundedBox(group, w, h, d, 0, 0, 0, material, Math.min(0.05, w * 0.08), 10);
            for (let i = -3; i <= 3; i += 1) this.addBox(group, w * 0.035, h * 0.82, d * 1.02, i * w * 0.12, 0, 0, dark);
            for (let i = -2; i <= 2; i += 1) this.addBox(group, w * 1.02, h * 0.035, d * 1.02, 0, i * h * 0.15, 0, dark);
        } else if (spec.fixtureKind === 'vase') {
            const points = [
                new THREE.Vector2(w * 0.12, 0),
                new THREE.Vector2(w * 0.34, h * 0.16),
                new THREE.Vector2(w * 0.38, h * 0.5),
                new THREE.Vector2(w * 0.22, h * 0.78),
                new THREE.Vector2(w * 0.17, h)
            ];
            const vase = new THREE.Mesh(new THREE.LatheGeometry(points, 48), material);
            vase.position.y = -h / 2;
            group.add(vase);
        } else if (spec.fixtureKind === 'light') {
            const shade = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.46, w * 0.34, h * 0.72, 48, 1, false), material);
            group.add(shade);
            const glow = new THREE.Mesh(new THREE.CircleGeometry(w * 0.3, 48), new THREE.MeshBasicMaterial({ color: 0xfff4cf }));
            glow.rotation.x = Math.PI / 2;
            glow.position.y = -h * 0.37;
            group.add(glow);
        } else {
            if (String(spec.moduleId).includes('cutting-board')) {
                this.addRoundedBox(group, w, h, d, 0, 0, 0, material, 0.025, 10);
                const hole = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.07, 0.008, 10, 32), dark);
                hole.rotation.x = Math.PI / 2;
                hole.position.set(w * 0.32, h / 2 + 0.01, 0);
                group.add(hole);
            } else {
                const tray = this.addRoundedBox(group, w, h * 0.12, d, 0, -h * 0.42, 0, dark, 0.025, 10);
                tray.rotation.y = 0.02;
                for (let i = -2; i <= 2; i += 1) {
                    const cup = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.07, w * 0.055, h * 0.36, 28), material);
                    cup.position.set(i * w * 0.16, -h * 0.2, 0);
                    group.add(cup);
                }
            }
        }
        this.enableShadows(group);
    }

    createBathroomFixture(group, w, d, h, moduleId, spec = {}) {
        const ceramic = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(spec.color || '#f7f7f4'),
            roughness: 0.18,
            metalness: 0,
            clearcoat: 0.85,
            clearcoatRoughness: 0.08,
            envMap: this.envMap,
            envMapIntensity: 0.65
        });
        const chrome = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(spec.customColor ? spec.color : '#f2f5f2'),
            roughness: 0.08,
            metalness: 0.58,
            clearcoat: 0.85,
            clearcoatRoughness: 0.04,
            envMap: this.envMap,
            envMapIntensity: 1.45
        });
        const glass = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(spec.customColor ? spec.color : '#b8d0d6'),
            roughness: 0.04,
            metalness: 0,
            transparent: true,
            opacity: 0.42,
            clearcoat: 1,
            envMap: this.envMap,
            envMapIntensity: 0.9
        });

        if (spec.fixtureKind === 'toilet' || moduleId.includes('toilet')) {
            const isWallHungConcept = spec.toiletStyle === 'wall-hung';
            const water = new THREE.MeshPhysicalMaterial({
                color: 0xd7edf1,
                roughness: 0.02,
                transparent: true,
                opacity: 0.64,
                clearcoat: 1,
                envMap: this.envMap,
                envMapIntensity: 0.8
            });
            const shadow = new THREE.MeshStandardMaterial({ color: 0xb9b5ad, roughness: 0.82 });
            if (isWallHungConcept) {
                this.addRoundedBox(group, w * 0.62, h * 0.16, d * 0.12, 0, h * 0.28, -d * 0.4, ceramic, 0.035, 12);
                this.addRoundedBox(group, w * 0.28, h * 0.06, 0.018, 0, h * 0.29, -d * 0.33, chrome, 0.01, 8);
            } else {
                const tank = this.addRoundedBox(group, w * 0.82, h * 0.24, d * 0.18, 0, h * 0.22, -d * 0.34, ceramic, 0.035, 12);
                tank.rotation.x = -0.03;
                this.addRoundedBox(group, w * 0.52, h * 0.035, d * 0.055, 0, h * 0.36, -d * 0.34, chrome, 0.012, 8);
                this.addBox(group, w * 0.16, h * 0.1, d * 0.12, 0, h * 0.04, -d * 0.24, ceramic);
            }
            this.addRoundedBox(group, w * 0.32, h * 0.32, d * 0.18, 0, -h * 0.08, -d * 0.18, ceramic, 0.026, 10);
            if (!isWallHungConcept) this.addBox(group, w * 0.48, h * 0.055, d * 0.15, 0, -h * 0.43, -d * 0.02, ceramic);

            if (!isWallHungConcept) {
                const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.18, w * 0.24, h * 0.34, 44), ceramic);
                pedestal.scale.z = 0.72;
                pedestal.position.set(0, -h * 0.28, d * 0.04);
                group.add(pedestal);
            }

            const bowl = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.36, 56, 28), ceramic);
            bowl.scale.set(0.78, 0.28, 1.08);
            bowl.position.set(0, -h * 0.14, d * 0.08);
            group.add(bowl);

            const frontLip = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.235, 0.026, 18, 64), ceramic);
            frontLip.rotation.x = Math.PI / 2;
            frontLip.scale.z = 1.28;
            frontLip.position.set(0, -h * 0.03, d * 0.1);
            group.add(frontLip);

            const seat = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.22, 0.018, 18, 64), new THREE.MeshPhysicalMaterial({
                color: 0xf8f8f4,
                roughness: 0.22,
                clearcoat: 0.72,
                envMap: this.envMap,
                envMapIntensity: 0.5
            }));
            seat.rotation.x = Math.PI / 2;
            seat.scale.z = 1.25;
            seat.position.set(0, h * 0.005, d * 0.1);
            group.add(seat);

            const waterPool = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, d) * 0.145, 42), water);
            waterPool.rotation.x = -Math.PI / 2;
            waterPool.scale.z = 1.18;
            waterPool.position.set(0, -h * 0.035, d * 0.1);
            group.add(waterPool);

            if (!isWallHungConcept) {
                const baseShadow = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.25, w * 0.27, 0.012, 44), shadow);
                baseShadow.scale.z = 0.62;
                baseShadow.position.set(0, -h * 0.485, d * 0.05);
                group.add(baseShadow);
            }
        } else if (spec.fixtureKind === 'vanity' || moduleId.includes('vanity') || moduleId.includes('basin')) {
            const vanityMountType = spec.vanityStyle === 'floating' ? 'wall' : (spec.mountType || 'floor');
            this.createGenericCabinet(group, w, d, h * 0.82, spec.color || '#8da596', vanityMountType, spec.countertopColor || '#f4f1ea', {
                ...spec,
                doorCount: 2,
                drawerCount: 1,
                skipCountertop: true
            });
            this.createInsetSink(group, w, d, h * 0.43, spec.countertopColor || '#f4f1ea', {
                basinMaterial: ceramic,
                faucetMaterial: chrome,
                basinColor: spec.customColor ? spec.color : 0xffffff,
                compact: true,
                style: 'bath'
            });
        } else if (spec.fixtureKind === 'mirror' || moduleId.includes('mirror')) {
            const frame = this.addRoundedBox(group, w, h, d, 0, 0, 0, this.createCabinetMaterial('#dfe5e5', null, spec), 0.02, 8);
            const mirror = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, h * 0.88, 0.012), new THREE.MeshPhysicalMaterial({
                color: 0xc9dce1,
                roughness: 0.02,
                metalness: 0.45,
                clearcoat: 1,
                envMap: this.envMap,
                envMapIntensity: 1.2
            }));
            mirror.position.z = d / 2 + 0.01;
            group.add(mirror);
            this.addBox(group, w * 0.86, h * 0.008, 0.016, 0, -h * 0.1, d / 2 + 0.02, chrome);
            this.addBox(group, w * 0.78, h * 0.04, 0.018, 0, -h * 0.42, d / 2 + 0.025, chrome);
        } else if (spec.fixtureKind === 'shower' || moduleId.includes('shower-set') || moduleId.includes('faucet')) {
            const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h * 0.82, 18), chrome);
            group.add(rail);
            const head = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.22, w * 0.22, 0.035, 48), chrome);
            head.rotation.x = Math.PI / 2;
            head.position.set(0, h * 0.42, d * 0.05);
            group.add(head);
            for (let i = -2; i <= 2; i += 1) {
                for (let j = -1; j <= 1; j += 1) {
                    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.006, 10), new THREE.MeshStandardMaterial({ color: 0x343838 }));
                    hole.rotation.x = Math.PI / 2;
                    hole.position.set(i * w * 0.045, h * 0.42 + j * w * 0.04, d * 0.071);
                    group.add(hole);
                }
            }
            const mixer = this.addRoundedBox(group, w * 0.55, h * 0.06, d * 0.24, 0, -h * 0.3, d * 0.04, chrome, 0.015, 8);
            mixer.position.set(0, -h * 0.3, d * 0.04);
            const hosePath = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-w * 0.16, -h * 0.28, d * 0.08),
                new THREE.Vector3(-w * 0.23, -h * 0.08, d * 0.09),
                new THREE.Vector3(-w * 0.13, h * 0.08, d * 0.1),
                new THREE.Vector3(w * 0.12, h * 0.15, d * 0.1)
            ]);
            group.add(new THREE.Mesh(new THREE.TubeGeometry(hosePath, 36, 0.005, 10), chrome));
            const hand = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, h * 0.18, 18), chrome);
            hand.rotation.z = -0.35;
            hand.position.set(w * 0.18, h * 0.11, d * 0.1);
            group.add(hand);
        } else if (moduleId.includes('glass-partition')) {
            const panelThickness = Math.max(0.018, Math.min(0.04, d * 0.42));
            const glassPanel = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, panelThickness),
                glass
            );
            glassPanel.position.set(0, 0, 0);
            glassPanel.castShadow = true;
            glassPanel.receiveShadow = true;
            group.add(glassPanel);

            const frameMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x2d3437,
                roughness: 0.2,
                metalness: 0.72,
                clearcoat: 0.45,
                envMap: this.envMap,
                envMapIntensity: 0.9
            });
            const railY = h / 2 - 0.018;
            this.addBox(group, w + 0.035, 0.032, panelThickness * 1.8, 0, railY, 0, frameMaterial);
            this.addBox(group, w + 0.035, 0.026, panelThickness * 1.8, 0, -h / 2 + 0.018, 0, frameMaterial);
            this.addBox(group, 0.026, h, panelThickness * 1.8, -w / 2, 0, 0, frameMaterial);
            this.addBox(group, 0.026, h, panelThickness * 1.8, w / 2, 0, 0, frameMaterial);

            const frosted = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, h * 0.28, panelThickness * 1.08), new THREE.MeshPhysicalMaterial({
                color: 0xc9e5ea,
                roughness: 0.24,
                transparent: true,
                opacity: 0.3,
                clearcoat: 0.85,
                envMap: this.envMap,
                envMapIntensity: 0.55
            }));
            frosted.position.set(0, -h * 0.26, panelThickness * 0.1);
            group.add(frosted);
        } else if (spec.fixtureKind === 'shower-room' || moduleId.includes('shower-room')) {
            const base = this.addRoundedBox(group, w, 0.052, d, 0, -h / 2 + 0.026, 0, ceramic, 0.035, 10);
            base.position.y = -h / 2 + 0.02;
            const panelA = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.025), glass);
            panelA.position.set(0, 0, d / 2);
            group.add(panelA);
            const panelB = new THREE.Mesh(new THREE.BoxGeometry(0.025, h, d), glass);
            panelB.position.set(w / 2, 0, 0);
            group.add(panelB);
            const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.035, 0.035), chrome);
            rail.position.set(0, h / 2, d / 2 + 0.02);
            group.add(rail);
            this.addBox(group, 0.018, h * 0.92, 0.024, -w * 0.18, 0, d / 2 + 0.028, chrome);
            this.addBox(group, 0.018, h * 0.92, 0.024, w * 0.18, 0, d / 2 + 0.028, chrome);
            this.addBox(group, w * 0.18, 0.018, 0.026, w * 0.3, -h * 0.06, d / 2 + 0.044, chrome);
            this.addBox(group, w * 0.18, 0.018, 0.026, -w * 0.3, -h * 0.06, d / 2 + 0.044, chrome);
        } else if (moduleId.includes('tub-shower-combo')) {
            const tubH = Math.min(0.58, h * 0.32);
            const tubY = -h / 2 + tubH * 0.52;
            this.addRoundedBox(group, w, tubH * 0.74, d, 0, tubY, 0, ceramic, 0.08, 14);
            this.addBox(group, w * 0.78, tubH * 0.08, d * 0.08, 0, tubY + tubH * 0.34, -d * 0.34, ceramic);
            this.addBox(group, w * 0.78, tubH * 0.08, d * 0.08, 0, tubY + tubH * 0.34, d * 0.34, ceramic);
            this.addBox(group, w * 0.06, tubH * 0.08, d * 0.62, -w * 0.42, tubY + tubH * 0.34, 0, ceramic);
            this.addBox(group, w * 0.06, tubH * 0.08, d * 0.62, w * 0.42, tubY + tubH * 0.34, 0, ceramic);
            const basin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.025, d * 0.54), new THREE.MeshPhysicalMaterial({
                color: 0xd8edf1,
                roughness: 0.02,
                transparent: true,
                opacity: 0.58,
                clearcoat: 1,
                envMap: this.envMap,
                envMapIntensity: 0.65
            }));
            basin.position.set(0, tubY + tubH * 0.36, 0);
            group.add(basin);
            const railHeight = h * 0.72;
            const railY = -h / 2 + tubH + railHeight / 2;
            const railZ = -d * 0.42;
            const railX = -w * 0.42;
            const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, railHeight, 18), chrome);
            rail.position.set(railX, railY, railZ);
            group.add(rail);
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, w * 0.18, 16), chrome);
            arm.rotation.z = Math.PI / 2;
            arm.position.set(railX + w * 0.09, railY + railHeight * 0.42, railZ);
            group.add(arm);
            const head = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.07, w * 0.07, 0.026, 42), chrome);
            head.rotation.x = Math.PI / 2;
            head.position.set(railX + w * 0.18, railY + railHeight * 0.42, railZ + 0.02);
            group.add(head);
            const mixer = this.addRoundedBox(group, w * 0.18, 0.075, 0.052, railX, tubY + tubH * 0.48, railZ + 0.04, chrome, 0.014, 8);
            mixer.position.set(railX, tubY + tubH * 0.48, railZ + 0.04);
        } else if (spec.fixtureKind === 'bathtub' || moduleId.includes('tub')) {
            this.addRoundedBox(group, w, h * 0.5, d, 0, -h * 0.08, 0, ceramic, 0.08, 14);
            this.addBox(group, w * 0.78, h * 0.055, d * 0.08, 0, h * 0.18, -d * 0.34, ceramic);
            this.addBox(group, w * 0.78, h * 0.055, d * 0.08, 0, h * 0.18, d * 0.34, ceramic);
            this.addBox(group, w * 0.06, h * 0.055, d * 0.62, -w * 0.42, h * 0.18, 0, ceramic);
            this.addBox(group, w * 0.06, h * 0.055, d * 0.62, w * 0.42, h * 0.18, 0, ceramic);
            const basin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.74, h * 0.05, d * 0.56), new THREE.MeshPhysicalMaterial({
                color: 0xd8edf1,
                roughness: 0.02,
                transparent: true,
                opacity: 0.58,
                clearcoat: 1,
                envMap: this.envMap,
                envMapIntensity: 0.65
            }));
            basin.position.y = h * 0.18;
            group.add(basin);
            this.addRealisticFaucet(group, w * 0.28, h * 0.22, -d * 0.28, 0.55, chrome);
        } else if (spec.fixtureKind === 'towel-rack' || moduleId.includes('rack')) {
            for (let i = 0; i < 3; i += 1) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, w, 16), chrome);
                bar.rotation.z = Math.PI / 2;
                bar.position.y = h * (0.25 - i * 0.22);
                group.add(bar);
            }
            [-1, 1].forEach(side => {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, h * 0.78, 16), chrome);
                post.position.set(side * w * 0.42, 0, 0);
                group.add(post);
                const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.014, 24), chrome);
                mount.rotation.x = Math.PI / 2;
                mount.position.set(side * w * 0.42, h * 0.36, -d * 0.42);
                group.add(mount);
            });
        } else if (spec.fixtureKind === 'floor-drain' || moduleId.includes('drain')) {
            this.addRoundedBox(group, w, h, d, 0, 0, 0, chrome, 0.018, 8);
            const dark = new THREE.MeshStandardMaterial({ color: 0x2e3430, roughness: 0.8 });
            for (let i = -3; i <= 3; i += 1) {
                const slot = new THREE.Mesh(new THREE.BoxGeometry(w * 0.05, h * 1.45, d * 0.76), dark);
                slot.position.x = i * w * 0.105;
                slot.position.y = h * 0.2;
                group.add(slot);
            }
            const ring = new THREE.Mesh(new THREE.TorusGeometry(w * 0.34, 0.006, 10, 44), dark);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = h * 0.72;
            group.add(ring);
        } else {
            this.createGenericCabinet(group, w, d, h, spec.color || '#eef1f1', spec.mountType || 'floor', spec.countertopColor || '#f4f4f2', spec);
        }

        this.enableShadows(group);
    }

    createGenericCabinet(group, w, d, h, color, mountType, countertopColor, spec = {}) {
        const cabTexSet = this.getCabinetTexture(color, spec);
        const bodyMaterial = this.createCabinetMaterial(color, cabTexSet, spec);
        const isFloor = mountType === 'floor';
        const shellThickness = 0.018;

        const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, shellThickness, d), bodyMaterial);
        bottom.position.y = -h / 2;
        group.add(bottom);

        const side = new THREE.Mesh(new THREE.BoxGeometry(shellThickness, h - 0.02, d), bodyMaterial);
        side.position.set(-w / 2 + shellThickness / 2, 0, 0);
        group.add(side);
        const side2 = side.clone();
        side2.position.x = w / 2 - shellThickness / 2;
        group.add(side2);

        const backMaterial = bodyMaterial.clone();
        backMaterial.color = new THREE.Color(color).offsetHSL(0, 0, -0.1);
        const back = new THREE.Mesh(new THREE.BoxGeometry(w - shellThickness * 2, h - 0.04, 0.008), backMaterial);
        back.position.z = -d / 2 + 0.004;
        group.add(back);

        const topMaterial = isFloor ? this.createCountertopMaterial(countertopColor || '#e8e0d8') : bodyMaterial;
        const topOverhang = isFloor ? 0.035 : 0.004;
        if (!spec.skipCountertop) {
            const top = new THREE.Mesh(new THREE.BoxGeometry(w + topOverhang, isFloor ? 0.04 : shellThickness, d + topOverhang), topMaterial);
            top.position.y = h / 2 + (isFloor ? 0.018 : 0);
            group.add(top);
        }

        if (isFloor && !spec.skipCountertop) {
            this.addCountertopEdges(group, w, d, h, topOverhang, topMaterial, countertopColor || '#e8e0d8');
        }

        const faceW = w - 0.05;
        const faceH = h - 0.07;
        const faceY = -0.005;
        const frontZ = d / 2 + 0.012;
        const doorCount = Math.max(0, spec.doorCount || 0);
        const drawerCount = Math.max(0, spec.drawerCount || 0);
        const openShelves = Math.max(0, spec.openShelves || 0);
        const useSlabFronts = spec.doorStyle === 'slab';

        if (openShelves) {
            this.addOpenShelves(group, faceW, faceH, frontZ, faceY, openShelves, bodyMaterial, spec);
        } else if (drawerCount && !doorCount) {
            if (useSlabFronts) this.addSlabDrawerStack(group, faceW, faceH, frontZ, faceY, drawerCount, color, spec);
            else this.addDrawerStack(group, faceW, faceH, frontZ, faceY, drawerCount, color, spec);
        } else if (drawerCount && doorCount) {
            if (useSlabFronts) {
                this.addSlabDoorRun(group, faceW, faceH * 0.62, frontZ, faceY - faceH * 0.12, doorCount, color, spec);
                this.addSlabDrawerStack(group, faceW, faceH * 0.34, frontZ + 0.002, faceY + faceH * 0.33, 2, color, spec);
            } else {
                this.addDoorRun(group, faceW, faceH * 0.62, frontZ, faceY - faceH * 0.12, doorCount, color, spec);
                this.addDrawerStack(group, faceW, faceH * 0.34, frontZ + 0.002, faceY + faceH * 0.33, 2, color, spec);
            }
        } else {
            const resolvedDoorCount = Math.max(1, doorCount || (w > 0.65 ? 2 : 1));
            if (useSlabFronts) this.addSlabDoorRun(group, faceW, faceH, frontZ, faceY, resolvedDoorCount, color, spec);
            else this.addDoorRun(group, faceW, faceH, frontZ, faceY, resolvedDoorCount, color, spec);
        }

        if (mountType === 'wall') this.addWallHanger(group, w, h, d);
        if (isFloor) this.addToeKick(group, w, d, h, color);
        this.enableShadows(group);
    }

    createCabinetMaterial(color, textureSet, spec = {}) {
        const isMetal = spec.materialKind === 'metal';
        const isGlass = spec.materialKind === 'glass';
        const isMatte = spec.materialKind === 'matte' || textureSet?.kind === 'matte-laminate';
        const parameters = {
            color: new THREE.Color(color),
            map: textureSet ? textureSet.map : null,
            normalMap: textureSet ? textureSet.normalMap : null,
            roughnessMap: textureSet ? textureSet.roughnessMap : null,
            roughness: isGlass ? 0.16 : isMetal ? 0.28 : isMatte ? 0.62 : 0.5,
            metalness: isMetal ? 0.72 : 0,
            clearcoat: isGlass ? 0.85 : isMatte ? 0.12 : 0.24,
            clearcoatRoughness: isGlass ? 0.08 : isMatte ? 0.36 : 0.26,
            envMap: this.envMap,
            envMapIntensity: isGlass || isMetal ? 0.95 : isMatte ? 0.56 : 0.38
        };
        if (textureSet) parameters.normalScale = new THREE.Vector2(isMatte ? 0.12 : 0.38, isMatte ? 0.12 : 0.38);
        return new THREE.MeshPhysicalMaterial(parameters);
    }

    createCountertopMaterial(color) {
        const counterTexSet = this.getCountertopTexture(color || '#f0f0f0');
        const lower = String(color || '').toLowerCase();
        const isMetal = lower === '#c8c8c8' || lower === '#b0b0b0';
        const parameters = {
            color: new THREE.Color(color || '#f0f0f0'),
            map: counterTexSet ? counterTexSet.map : null,
            normalMap: counterTexSet ? counterTexSet.normalMap : null,
            roughnessMap: counterTexSet ? counterTexSet.roughnessMap : null,
            roughness: isMetal ? 0.18 : 0.22,
            metalness: isMetal ? 0.85 : 0,
            clearcoat: 0.55,
            clearcoatRoughness: 0.12,
            envMap: this.envMap,
            envMapIntensity: isMetal ? 1.0 : 0.55
        };
        if (counterTexSet) parameters.normalScale = new THREE.Vector2(0.2, 0.2);
        return new THREE.MeshPhysicalMaterial(parameters);
    }

    addCountertopEdges(group, w, d, h, overhang, material, color) {
        const edgeMaterial = material.clone();
        edgeMaterial.color = new THREE.Color(color).offsetHSL(0, 0, -0.07);
        const edgeY = h / 2 - 0.006;
        [
            [w + overhang, 0.045, 0.012, 0, edgeY, d / 2 + overhang / 2 + 0.006],
            [w + overhang, 0.045, 0.012, 0, edgeY, -d / 2 - overhang / 2 - 0.006],
            [0.012, 0.045, d + overhang, -w / 2 - overhang / 2 - 0.006, edgeY, 0],
            [0.012, 0.045, d + overhang, w / 2 + overhang / 2 + 0.006, edgeY, 0]
        ].forEach(([ew, eh, ed, x, y, z]) => {
            const edge = new THREE.Mesh(new THREE.BoxGeometry(ew, eh, ed), edgeMaterial);
            edge.position.set(x, y, z);
            group.add(edge);
        });
    }

    addDoorRun(group, width, height, z, y, count, color, spec) {
        const gap = 0.012;
        const panelW = (width - gap * (count - 1)) / count;
        for (let i = 0; i < count; i += 1) {
            const px = -width / 2 + panelW / 2 + i * (panelW + gap);
            this.addDoorPanel(group, panelW, height, z, px, y, color, spec, i, count);
        }
    }

    addSlabDoorRun(group, width, height, z, y, count, color, spec = {}) {
        const gap = 0.004;
        const panelWidth = (width - gap * (count - 1)) / count;
        const panelMaterial = this.createCabinetMaterial(color, this.getCabinetTexture(color, spec), spec);
        const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x101517, roughness: 0.76 });

        for (let index = 0; index < count; index += 1) {
            const x = -width / 2 + panelWidth / 2 + index * (panelWidth + gap);
            const panel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, height, 0.019), panelMaterial.clone());
            panel.position.set(x, y, z + 0.006);
            group.add(panel);

            if (spec.handleStyle === 'gola') {
                const gola = new THREE.Mesh(new THREE.BoxGeometry(panelWidth * 0.94, 0.011, 0.008), seamMaterial);
                gola.position.set(x, y + height / 2 - 0.018, z + 0.018);
                group.add(gola);
            } else {
                const handleX = count === 1 ? x + panelWidth * 0.34 : x + (index % 2 === 0 ? panelWidth * 0.32 : -panelWidth * 0.32);
                this.addHandle(group, handleX, y, z + 0.025, Math.min(0.16, height * 0.45), spec);
            }
        }
    }

    addSlabDrawerStack(group, width, height, z, y, count, color, spec = {}) {
        const gap = 0.005;
        const drawerHeight = (height - gap * (count - 1)) / count;
        const panelMaterial = this.createCabinetMaterial(color, this.getCabinetTexture(color, spec), spec);
        const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x101517, roughness: 0.76 });

        for (let index = 0; index < count; index += 1) {
            const drawerY = y + height / 2 - drawerHeight / 2 - index * (drawerHeight + gap);
            const panel = new THREE.Mesh(new THREE.BoxGeometry(width, drawerHeight, 0.019), panelMaterial.clone());
            panel.position.set(0, drawerY, z + 0.006);
            group.add(panel);

            if (spec.handleStyle === 'gola') {
                const gola = new THREE.Mesh(new THREE.BoxGeometry(width * 0.94, 0.009, 0.008), seamMaterial);
                gola.position.set(0, drawerY + drawerHeight / 2 - 0.016, z + 0.018);
                group.add(gola);
            } else {
                this.addHandle(group, 0, drawerY, z + 0.028, Math.min(width * 0.45, 0.26), { ...spec, horizontalHandle: true });
            }
        }
    }

    addDoorPanel(group, width, height, z, x, y, color, spec, index, count) {
        const doorColor = new THREE.Color(color).offsetHSL(0, 0, spec.glass ? 0.03 : -0.025);
        const material = spec.glass
            ? new THREE.MeshPhysicalMaterial({
                color: 0xa8c5cc,
                roughness: 0.08,
                metalness: 0,
                transmission: 0.25,
                transparent: true,
                opacity: 0.5,
                clearcoat: 1,
                envMap: this.envMap,
                envMapIntensity: 0.9
            })
            : this.createCabinetMaterial(`#${doorColor.getHexString()}`, this.getCabinetTexture(color, spec), spec);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.018), material);
        panel.position.set(x, y, z);
        group.add(panel);

        const frameColor = new THREE.Color(spec.accentColor || color);
        const frameMaterial = new THREE.MeshPhysicalMaterial({
            color: frameColor.offsetHSL(0, 0, 0.015),
            roughness: 0.32,
            metalness: 0.04,
            clearcoat: 0.26,
            clearcoatRoughness: 0.18,
            envMap: this.envMap,
            envMapIntensity: 0.42
        });
        const grooveMaterial = new THREE.MeshStandardMaterial({ color: 0x23211d, roughness: 0.92 });
        const insetMaterial = material.clone();
        insetMaterial.color = doorColor.clone().offsetHSL(0, -0.02, -0.06);
        const rail = Math.max(0.018, Math.min(width, height) * 0.07);
        const insetW = Math.max(width - rail * 3.2, width * 0.56);
        const insetH = Math.max(height - rail * 3.6, height * 0.56);

        const inset = new THREE.Mesh(new THREE.BoxGeometry(insetW, insetH, 0.008), insetMaterial);
        inset.position.set(x, y, z + 0.012);
        group.add(inset);

        const groove = 0.006;
        [
            [insetW + groove * 2, groove, 0.004, x, y + insetH / 2 + groove / 2, z + 0.02],
            [insetW + groove * 2, groove, 0.004, x, y - insetH / 2 - groove / 2, z + 0.02],
            [groove, insetH + groove * 2, 0.004, x - insetW / 2 - groove / 2, y, z + 0.02],
            [groove, insetH + groove * 2, 0.004, x + insetW / 2 + groove / 2, y, z + 0.02]
        ].forEach(([gw, gh, gd, gx, gy, gz]) => {
            const shadow = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), grooveMaterial);
            shadow.position.set(gx, gy, gz);
            group.add(shadow);
        });

        [
            [width, rail, 0.012, x, y + height / 2 - rail / 2, z + 0.026],
            [width, rail, 0.012, x, y - height / 2 + rail / 2, z + 0.026],
            [rail, height, 0.012, x - width / 2 + rail / 2, y, z + 0.026],
            [rail, height, 0.012, x + width / 2 - rail / 2, y, z + 0.026],
            [rail * 0.45, insetH, 0.01, x - insetW / 2 + rail * 0.22, y, z + 0.028],
            [rail * 0.45, insetH, 0.01, x + insetW / 2 - rail * 0.22, y, z + 0.028]
        ].forEach(([fw, fh, fd, fx, fy, fz]) => {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, fd), frameMaterial);
            frame.position.set(fx, fy, fz);
            group.add(frame);
        });

        const handleX = count === 1 ? x + width * 0.34 : x + (index % 2 === 0 ? width * 0.32 : -width * 0.32);
        this.addHandle(group, handleX, y, z + 0.02, Math.min(0.16, height * 0.45), spec);
    }

    addDrawerStack(group, width, height, z, y, count, color, spec) {
        const gap = 0.012;
        const drawerH = (height - gap * (count - 1)) / count;
        for (let i = 0; i < count; i += 1) {
            const py = y + height / 2 - drawerH / 2 - i * (drawerH + gap);
            const material = this.createCabinetMaterial(color, this.getCabinetTexture(color, spec), spec);
            const drawer = new THREE.Mesh(new THREE.BoxGeometry(width, drawerH, 0.018), material);
            drawer.position.set(0, py, z);
            group.add(drawer);

            const grooveMaterial = new THREE.MeshStandardMaterial({ color: 0x23211d, roughness: 0.9 });
            const insetMaterial = material.clone();
            insetMaterial.color = new THREE.Color(color).offsetHSL(0, -0.015, -0.055);
            const insetW = width * 0.86;
            const insetH = drawerH * 0.52;
            const inset = new THREE.Mesh(new THREE.BoxGeometry(insetW, insetH, 0.007), insetMaterial);
            inset.position.set(0, py, z + 0.012);
            group.add(inset);

            const groove = 0.005;
            [
                [insetW, groove, 0.004, 0, py + insetH / 2, z + 0.021],
                [insetW, groove, 0.004, 0, py - insetH / 2, z + 0.021],
                [groove, insetH, 0.004, -insetW / 2, py, z + 0.021],
                [groove, insetH, 0.004, insetW / 2, py, z + 0.021]
            ].forEach(([gw, gh, gd, gx, gy, gz]) => {
                const shadow = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), grooveMaterial);
                shadow.position.set(gx, gy, gz);
                group.add(shadow);
            });

            const lipMaterial = material.clone();
            lipMaterial.color = new THREE.Color(color).offsetHSL(0, 0, 0.035);
            const lip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.01, 0.009), lipMaterial);
            lip.position.set(0, py + drawerH * 0.36, z + 0.026);
            group.add(lip);
            this.addHandle(group, 0, py, z + 0.034, Math.min(width * 0.45, 0.26), { ...spec, horizontalHandle: true });
        }
    }

    addOpenShelves(group, width, height, z, y, shelfCount, material, spec) {
        const bayMaterial = material.clone();
        bayMaterial.color = new THREE.Color(spec.accentColor || '#d7b889').offsetHSL(0, 0, 0.03);
        const backPanel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.01), bayMaterial);
        backPanel.position.set(0, y, z - 0.03);
        group.add(backPanel);
        for (let i = 0; i <= shelfCount; i += 1) {
            const shelfY = y - height / 2 + (height / shelfCount) * i;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(width, 0.018, 0.18), material);
            shelf.position.set(0, shelfY, z + 0.01);
            group.add(shelf);
        }
        const divider = new THREE.Mesh(new THREE.BoxGeometry(0.018, height, 0.18), material);
        divider.position.set(0, y, z + 0.01);
        group.add(divider);
    }

    addHandle(group, x, y, z, length, spec = {}) {
        const handleMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(spec.accentColor || '#c0c0c0'),
            roughness: 0.14,
            metalness: 0.9,
            clearcoat: 0.55,
            clearcoatRoughness: 0.08,
            envMap: this.envMap,
            envMapIntensity: 1.0
        });
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, length, 18), handleMaterial);
        if (spec.horizontalHandle) {
            handle.rotation.z = Math.PI / 2;
            handle.position.set(x, y, z);
        } else {
            handle.position.set(x, y, z);
        }
        group.add(handle);
    }

    addWallHanger(group, w, h, d) {
        const hookMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
        [-0.28, 0.28].forEach(offset => {
            const hook = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, 0.025, 0.015), hookMaterial);
            hook.position.set(w * offset, h / 2 + 0.012, -d / 2 + 0.008);
            group.add(hook);
        });
    }

    addToeKick(group, w, d, h, color) {
        const kickMaterial = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color).offsetHSL(0, 0, -0.16), roughness: 0.55 });
        const kick = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.08, 0.035), kickMaterial);
        kick.position.set(0, -h / 2 - 0.04, d / 2 - 0.02);
        group.add(kick);
    }

    enableShadows(group) {
        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    addBox(group, width, height, depth, x, y, z, material) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
        mesh.position.set(x, y, z);
        group.add(mesh);
        return mesh;
    }

    createChromeMaterial(color = 0xf2f5f2) {
        return new THREE.MeshPhysicalMaterial({
            color,
            metalness: 0.58,
            roughness: 0.08,
            clearcoat: 0.85,
            clearcoatRoughness: 0.04,
            envMap: this.envMap,
            envMapIntensity: 1.45
        });
    }

    createBlackGlassMaterial(color = 0x080b0d) {
        return new THREE.MeshPhysicalMaterial({
            color,
            metalness: 0.08,
            roughness: 0.04,
            clearcoat: 1,
            clearcoatRoughness: 0.03,
            envMap: this.envMap,
            envMapIntensity: 1.2
        });
    }

    createRoundedBoxGeometry(width, height, depth, radius = 0.02, segments = 6) {
        const r = Math.min(radius, width / 2, height / 2);
        const x = -width / 2;
        const y = -height / 2;
        const shape = new THREE.Shape();
        shape.moveTo(x + r, y);
        shape.lineTo(x + width - r, y);
        shape.quadraticCurveTo(x + width, y, x + width, y + r);
        shape.lineTo(x + width, y + height - r);
        shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        shape.lineTo(x + r, y + height);
        shape.quadraticCurveTo(x, y + height, x, y + height - r);
        shape.lineTo(x, y + r);
        shape.quadraticCurveTo(x, y, x + r, y);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: true,
            bevelThickness: Math.min(depth * 0.22, r * 0.45),
            bevelSize: Math.min(r * 0.35, depth * 0.18),
            bevelSegments: Math.max(2, Math.floor(segments / 2)),
            curveSegments: segments
        });
        geometry.translate(0, 0, -depth / 2);
        return geometry;
    }

    addRoundedBox(group, width, height, depth, x, y, z, material, radius = 0.02, segments = 8) {
        const mesh = new THREE.Mesh(this.createRoundedBoxGeometry(width, height, depth, radius, segments), material);
        mesh.position.set(x, y, z);
        group.add(mesh);
        return mesh;
    }

    addRealisticFaucet(group, x, topY, z, scale = 1, material = null) {
        const faucetMaterial = material || new THREE.MeshPhysicalMaterial({
            color: 0xf2f5f2,
            metalness: 0.58,
            roughness: 0.08,
            clearcoat: 0.85,
            clearcoatRoughness: 0.06,
            envMap: this.envMap,
            envMapIntensity: 1.45
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.034 * scale, 0.04 * scale, 0.028 * scale, 32), faucetMaterial);
        base.position.set(x, topY + 0.024 * scale, z);
        group.add(base);

        const neckPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(x, topY + 0.035 * scale, z),
            new THREE.Vector3(x, topY + 0.18 * scale, z),
            new THREE.Vector3(x, topY + 0.275 * scale, z + 0.055 * scale),
            new THREE.Vector3(x, topY + 0.268 * scale, z + 0.155 * scale),
            new THREE.Vector3(x, topY + 0.205 * scale, z + 0.205 * scale)
        ]);
        const neck = new THREE.Mesh(new THREE.TubeGeometry(neckPath, 44, 0.012 * scale, 18, false), faucetMaterial);
        group.add(neck);

        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016 * scale, 0.013 * scale, 0.055 * scale, 22), faucetMaterial);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(x, topY + 0.197 * scale, z + 0.225 * scale);
        group.add(nozzle);

        const aerator = new THREE.Mesh(new THREE.CylinderGeometry(0.011 * scale, 0.011 * scale, 0.008 * scale, 20), new THREE.MeshStandardMaterial({ color: 0x2f3334, roughness: 0.55 }));
        aerator.rotation.x = Math.PI / 2;
        aerator.position.set(x, topY + 0.197 * scale, z + 0.256 * scale);
        group.add(aerator);

        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.02 * scale, 0.085 * scale, 0.012 * scale), faucetMaterial);
        lever.rotation.z = -0.32;
        lever.position.set(x + 0.048 * scale, topY + 0.19 * scale, z - 0.012 * scale);
        group.add(lever);

        [-1, 1].forEach(side => {
            const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * scale, 0.018 * scale, 0.058 * scale, 22), faucetMaterial);
            knob.rotation.z = Math.PI / 2;
            knob.position.set(x + side * 0.072 * scale, topY + 0.055 * scale, z + 0.005 * scale);
            group.add(knob);
        });
    }

    createInsetSink(group, w, d, topY, countertopColor, options = {}) {
        const countertopMaterial = this.createCountertopMaterial(countertopColor || '#f0f0f0');
        const sinkMaterial = options.basinMaterial || new THREE.MeshPhysicalMaterial({
            color: options.basinColor || 0xbcc7c8,
            metalness: options.style === 'bath' ? 0.02 : 0.72,
            roughness: options.style === 'bath' ? 0.16 : 0.18,
            clearcoat: 0.68,
            clearcoatRoughness: 0.08,
            envMap: this.envMap,
            envMapIntensity: options.style === 'bath' ? 0.72 : 1.0
        });
        const shadowMaterial = new THREE.MeshStandardMaterial({ color: 0x161716, roughness: 0.95 });
        const waterMaterial = new THREE.MeshPhysicalMaterial({
            color: options.style === 'bath' ? 0xcfe7ec : 0x7fa7ad,
            roughness: 0.02,
            metalness: 0,
            transparent: true,
            opacity: 0.46,
            clearcoat: 1,
            clearcoatRoughness: 0.02,
            envMap: this.envMap,
            envMapIntensity: 0.75
        });

        const overhang = 0.045;
        const topW = w + overhang;
        const topD = d + overhang;
        const openW = Math.min(w * (options.compact ? 0.52 : 0.62), w - 0.16);
        const openD = Math.min(d * (options.compact ? 0.43 : 0.5), d - 0.14);
        const openZ = d * 0.035;
        const slabH = 0.046;
        const sideW = Math.max(0.018, (topW - openW) / 2);
        const sideD = Math.max(0.018, (topD - openD) / 2);

        this.addBox(group, sideW, slabH, topD, -openW / 2 - sideW / 2, topY, 0, countertopMaterial);
        this.addBox(group, sideW, slabH, topD, openW / 2 + sideW / 2, topY, 0, countertopMaterial);
        this.addBox(group, openW, slabH, sideD, 0, topY, openZ - openD / 2 - sideD / 2, countertopMaterial);
        this.addBox(group, openW, slabH, sideD, 0, topY, openZ + openD / 2 + sideD / 2, countertopMaterial);

        const rimH = 0.022;
        const rimW = Math.max(0.024, openW * 0.075);
        const rimD = Math.max(0.022, openD * 0.075);
        this.addBox(group, openW + rimW * 2, rimH, rimD, 0, topY + 0.034, openZ - openD / 2 - rimD / 2, sinkMaterial);
        this.addBox(group, openW + rimW * 2, rimH, rimD, 0, topY + 0.034, openZ + openD / 2 + rimD / 2, sinkMaterial);
        this.addBox(group, rimW, rimH, openD, -openW / 2 - rimW / 2, topY + 0.034, openZ, sinkMaterial);
        this.addBox(group, rimW, rimH, openD, openW / 2 + rimW / 2, topY + 0.034, openZ, sinkMaterial);

        const basinDepth = options.compact ? 0.105 : 0.15;
        const wallT = 0.018;
        this.addBox(group, openW, basinDepth, wallT, 0, topY - basinDepth / 2 + 0.012, openZ - openD / 2, sinkMaterial);
        this.addBox(group, openW, basinDepth, wallT, 0, topY - basinDepth / 2 + 0.012, openZ + openD / 2, sinkMaterial);
        this.addBox(group, wallT, basinDepth, openD, -openW / 2, topY - basinDepth / 2 + 0.012, openZ, sinkMaterial);
        this.addBox(group, wallT, basinDepth, openD, openW / 2, topY - basinDepth / 2 + 0.012, openZ, sinkMaterial);
        this.addBox(group, openW - wallT * 2, 0.022, openD - wallT * 2, 0, topY - basinDepth + 0.012, openZ, sinkMaterial);

        const innerShadow = new THREE.Mesh(
            new THREE.BoxGeometry(openW - wallT * 2.4, 0.004, openD - wallT * 2.4),
            shadowMaterial
        );
        innerShadow.position.set(0, topY - 0.018, openZ);
        group.add(innerShadow);

        const water = new THREE.Mesh(new THREE.BoxGeometry(openW * 0.72, 0.004, openD * 0.58), waterMaterial);
        water.position.set(0, topY - basinDepth * 0.54, openZ + openD * 0.02);
        group.add(water);

        const drainMaterial = options.faucetMaterial || new THREE.MeshPhysicalMaterial({
            color: 0xf1f3ef,
            metalness: 0.55,
            roughness: 0.08,
            clearcoat: 0.82,
            envMap: this.envMap,
            envMapIntensity: 1.35
        });
        const drain = new THREE.Mesh(new THREE.TorusGeometry(Math.min(openW, openD) * 0.055, 0.0045, 10, 28), drainMaterial);
        drain.rotation.x = Math.PI / 2;
        drain.position.set(0, topY - basinDepth + 0.028, openZ + openD * 0.09);
        group.add(drain);
        for (let i = -2; i <= 2; i += 1) {
            const slot = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.003, Math.min(openW, openD) * 0.07), shadowMaterial);
            slot.position.set(i * 0.012, topY - basinDepth + 0.031, openZ + openD * 0.09);
            group.add(slot);
        }

        this.addRealisticFaucet(group, 0, topY + 0.01, openZ - openD * 0.62, options.compact ? 0.72 : 1, options.faucetMaterial || null);
    }

    createSink(group, w, d, h, countertopColor, spec = {}) {
        const isBaseSink = spec.moduleId === 'base-sink';
        if (isBaseSink) {
            this.createGenericCabinet(group, w, d, h, spec.color || '#8da596', 'floor', countertopColor || '#f0f0f0', {
                ...spec,
                hasSink: false,
                doorCount: spec.doorCount || 2,
                skipCountertop: true
            });
        }

        const topY = isBaseSink ? h / 2 + 0.045 : h / 2;
        this.createInsetSink(group, w, d, topY, countertopColor || '#f0f0f0', {
            style: 'kitchen',
            basinColor: spec.customColor ? spec.color : 0xbcc7c8
        });
        this.enableShadows(group);
    }

    createCooktop(group, w, d, h, moduleId) {
        const isInduction = moduleId.includes('induction');
        const surfaceMaterial = new THREE.MeshStandardMaterial({
            color: isInduction ? 0x222222 : 0x333333,
            roughness: 0.3
        });
        const surface = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            surfaceMaterial
        );
        group.add(surface);

        // 灶眼
        const burnerMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.5
        });

        const burner1 = new THREE.Mesh(
            new THREE.TorusGeometry(0.08, 0.01, 8, 20),
            burnerMaterial
        );
        burner1.rotation.x = -Math.PI / 2;
        burner1.position.set(-w * 0.25, h / 2 + 0.01, 0);
        group.add(burner1);

        const burner2 = new THREE.Mesh(
            new THREE.TorusGeometry(0.08, 0.01, 8, 20),
            burnerMaterial
        );
        burner2.rotation.x = -Math.PI / 2;
        burner2.position.set(w * 0.25, h / 2 + 0.01, 0);
        group.add(burner2);

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    createRangeHood(group, w, d, h, moduleId) {
        const isSide = moduleId.includes('side');

        // 主体
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.6,
            roughness: 0.3
        });

        if (isSide) {
            // 侧吸式
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(w, h * 0.8, d * 0.4),
                bodyMaterial
            );
            body.position.y = -h * 0.1;
            group.add(body);

            // 玻璃面板
            const glassMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.2,
                metalness: 0.3
            });
            const glass = new THREE.Mesh(
                new THREE.BoxGeometry(w * 0.9, h * 0.6, 0.02),
                glassMaterial
            );
            glass.position.set(0, -h * 0.15, d * 0.2);
            group.add(glass);
        } else {
            // 顶吸式
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(w, h * 0.7, d * 0.5),
                bodyMaterial
            );
            body.position.y = -h * 0.15;
            group.add(body);

            // 挡板
            const baffle = new THREE.Mesh(
                new THREE.BoxGeometry(w * 0.9, h * 0.25, 0.02),
                bodyMaterial
            );
            baffle.position.set(0, -h * 0.35, d * 0.25);
            group.add(baffle);
        }

        // 烟管
        const pipeMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.7,
            roughness: 0.2
        });
        const pipe = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, h * 0.5),
            pipeMaterial
        );
        pipe.position.y = h * 0.25;
        group.add(pipe);

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    createFridge(group, w, d, h, moduleId) {
        const isBig = moduleId.includes('big');

        // 主体
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,
            roughness: 0.5
        });
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            bodyMaterial
        );
        group.add(body);

        if (isBig) {
            // 双开门
            const doorMaterial = new THREE.MeshStandardMaterial({
                color: 0xd8d8d8,
                roughness: 0.4
            });

            const leftDoor = new THREE.Mesh(
                new THREE.BoxGeometry(w / 2 - 0.01, h - 0.02, 0.02),
                doorMaterial
            );
            leftDoor.position.set(-w / 4, 0, d / 2 + 0.01);
            group.add(leftDoor);

            const rightDoor = new THREE.Mesh(
                new THREE.BoxGeometry(w / 2 - 0.01, h - 0.02, 0.02),
                doorMaterial
            );
            rightDoor.position.set(w / 4, 0, d / 2 + 0.01);
            group.add(rightDoor);

            // 把手
            const handleMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.8,
                roughness: 0.2
            });
            const handle1 = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.12, 0.03),
                handleMaterial
            );
            handle1.position.set(-w / 4, h * 0.1, d / 2 + 0.03);
            group.add(handle1);

            const handle2 = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.12, 0.03),
                handleMaterial
            );
            handle2.position.set(w / 4, h * 0.1, d / 2 + 0.03);
            group.add(handle2);
        } else {
            // 单开门（上下）
            const doorMaterial = new THREE.MeshStandardMaterial({
                color: 0xd8d8d8,
                roughness: 0.4
            });
            const topDoor = new THREE.Mesh(
                new THREE.BoxGeometry(w - 0.02, h * 0.4, 0.02),
                doorMaterial
            );
            topDoor.position.set(0, h * 0.3, d / 2 + 0.01);
            group.add(topDoor);

            const bottomDoor = new THREE.Mesh(
                new THREE.BoxGeometry(w - 0.02, h * 0.55, 0.02),
                doorMaterial
            );
            bottomDoor.position.set(0, -h * 0.2, d / 2 + 0.01);
            group.add(bottomDoor);

            // 把手
            const handleMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.8,
                roughness: 0.2
            });
            const handle1 = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.12, 0.03),
                handleMaterial
            );
            handle1.position.set(w / 2 - 0.08, h * 0.3, d / 2 + 0.03);
            group.add(handle1);

            const handle2 = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.12, 0.03),
                handleMaterial
            );
            handle2.position.set(w / 2 - 0.08, -h * 0.2, d / 2 + 0.03);
            group.add(handle2);
        }

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    createDishwasher(group, w, d, h) {
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,
            roughness: 0.5
        });
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            bodyMaterial
        );
        group.add(body);

        // 门
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0xd8d8d8,
            roughness: 0.4
        });
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(w - 0.02, h - 0.02, 0.02),
            doorMaterial
        );
        door.position.z = d / 2 + 0.01;
        group.add(door);

        // 把手
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
        });
        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.6, 0.02, 0.03),
            handleMaterial
        );
        handle.position.set(0, h * 0.4, d / 2 + 0.03);
        group.add(handle);

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    createOven(group, w, d, h) {
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4
        });
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            bodyMaterial
        );
        group.add(body);

        // 玻璃门
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.2,
            metalness: 0.3
        });
        const glass = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.85, h * 0.65, 0.02),
            glassMaterial
        );
        glass.position.set(0, -h * 0.1, d / 2 + 0.01);
        group.add(glass);

        // 控制面板
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.3
        });
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.85, h * 0.1, 0.02),
            panelMaterial
        );
        panel.position.set(0, h * 0.4, d / 2 + 0.01);
        group.add(panel);

        // 旋钮
        const knobMaterial = new THREE.MeshStandardMaterial({
            color: 0x999999,
            metalness: 0.8,
            roughness: 0.2
        });
        const knob1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.01),
            knobMaterial
        );
        knob1.position.set(-w * 0.25, h * 0.4, d / 2 + 0.02);
        group.add(knob1);

        const knob2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.01),
            knobMaterial
        );
        knob2.position.set(w * 0.25, h * 0.4, d / 2 + 0.02);
        group.add(knob2);

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    createWasher(group, w, d, h) {
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,
            roughness: 0.5
        });
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            bodyMaterial
        );
        group.add(body);

        // 圆形门
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.3
        });
        const door = new THREE.Mesh(
            new THREE.CylinderGeometry(Math.min(w, d) * 0.35, Math.min(w, d) * 0.35, 0.02),
            doorMaterial
        );
        door.position.set(0, -h * 0.05, d / 2 + 0.01);
        door.rotation.x = Math.PI / 2;
        group.add(door);

        // 控制面板
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0xd0d0d0,
            roughness: 0.3
        });
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.9, h * 0.12, 0.02),
            panelMaterial
        );
        panel.position.set(0, h * 0.4, d / 2 + 0.01);
        group.add(panel);

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    createCountertop(group, w, d, h, color, spec = {}) {
        const material = this.createCountertopMaterial(color || spec.countertopColor || '#f0f0f0');
        const countertop = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            material
        );
        group.add(countertop);

        this.enableShadows(group);
    }

    createIsland(group, w, d, h, color, moduleId, countertopColor, spec = {}) {
        const bodyMaterial = this.createCabinetMaterial(color, this.getCabinetTexture(color), spec);

        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMaterial);
        group.add(body);

        const countertopMaterial = this.createCountertopMaterial(countertopColor || '#f0f0f0');
        const countertop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.05, d + 0.08), countertopMaterial);
        countertop.position.y = h / 2 + 0.02;
        group.add(countertop);

        this.addCountertopEdges(group, w, d, h, 0.08, countertopMaterial, countertopColor || '#f0f0f0');
        this.addDoorRun(group, w * 0.92, h * 0.5, d / 2 + 0.014, -h * 0.08, 3, color, { ...spec, doorCount: 3 });
        this.addDrawerStack(group, w * 0.76, h * 0.24, d / 2 + 0.016, h * 0.26, 2, color, spec);

        // 如果是带水槽的岛台
        if (moduleId.includes('sink')) {
            const sinkMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xc0c0c0,
                metalness: 0.75,
                roughness: 0.2,
                clearcoat: 0.45,
                envMap: this.envMap,
                envMapIntensity: 0.85
            });
            const sink = new THREE.Mesh(
                new THREE.BoxGeometry(w * 0.3, 0.1, d * 0.3),
                sinkMaterial
            );
            sink.position.set(0, h / 2 - 0.03, 0);
            group.add(sink);

            // 水龙头
            const faucetMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xcccccc,
                metalness: 0.9,
                roughness: 0.08,
                clearcoat: 0.5,
                envMap: this.envMap,
                envMapIntensity: 1
            });
            const faucet = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.01, 0.25),
                faucetMaterial
            );
            faucet.position.set(0, h / 2 + 0.15, -d * 0.2);
            group.add(faucet);
        }

        this.enableShadows(group);
    }

    createCooktop(group, w, d, h, moduleId, spec = {}) {
        const isInduction = moduleId.includes('induction');
        const glass = this.createBlackGlassMaterial(new THREE.Color(spec.color || (isInduction ? '#06080a' : '#080a0b')).getHex());
        const metal = this.createChromeMaterial(0xd5d8d4);
        const darkMetal = new THREE.MeshPhysicalMaterial({
            color: 0x151719,
            metalness: 0.72,
            roughness: 0.18,
            clearcoat: 0.35,
            envMap: this.envMap,
            envMapIntensity: 0.9
        });
        this.addRoundedBox(group, w, h, d, 0, 0, 0, glass, 0.045, 14);
        this.addBox(group, w * 0.94, h * 0.28, 0.012, 0, h * 0.58, -d * 0.45, metal);
        this.addBox(group, w * 0.94, h * 0.28, 0.012, 0, h * 0.58, d * 0.45, metal);
        this.addBox(group, 0.012, h * 0.28, d * 0.84, -w * 0.47, h * 0.58, 0, metal);
        this.addBox(group, 0.012, h * 0.28, d * 0.84, w * 0.47, h * 0.58, 0, metal);

        if (isInduction) {
            [-0.24, 0.24].forEach((offset, index) => {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(w * (index ? 0.13 : 0.16), 0.0035, 10, 64),
                    new THREE.MeshBasicMaterial({ color: index ? 0x5aa0b5 : 0x9bc4d0, transparent: true, opacity: 0.72 })
                );
                ring.rotation.x = -Math.PI / 2;
                ring.position.set(w * offset, h / 2 + 0.009, 0);
                group.add(ring);
            });
            for (let i = 0; i < 4; i += 1) {
                const dot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshBasicMaterial({ color: 0x86c9dd }));
                dot.rotation.x = -Math.PI / 2;
                dot.position.set(-w * 0.12 + i * 0.04, h / 2 + 0.011, d * 0.36);
                group.add(dot);
            }
        } else {
            const burnerCount = Math.max(2, Math.min(5, Number(spec.burnerCount) || 2));
            const burnerPositions = burnerCount === 3
                ? [[-0.28, -0.08], [0.28, -0.08], [0, 0.24]]
                : burnerCount === 4
                    ? [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.2], [0.25, 0.2]]
                    : burnerCount === 5
                        ? [[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22], [0, 0]]
                        : [[-0.25, 0], [0.25, 0]];
            burnerPositions.forEach(([offsetX, offsetZ], index) => {
                const burnerScale = burnerCount === 3 && index === 2 ? 0.82 : 1;
                const burner = new THREE.Mesh(new THREE.TorusGeometry(w * 0.11, 0.009, 16, 48), darkMetal);
                burner.rotation.x = -Math.PI / 2;
                burner.scale.setScalar(burnerScale);
                burner.position.set(w * offsetX, h / 2 + 0.026, d * offsetZ);
                group.add(burner);
                for (let i = 0; i < 4; i += 1) {
                    const grate = new THREE.Mesh(new THREE.BoxGeometry(w * 0.18, 0.014, 0.022), darkMetal);
                    grate.rotation.y = i * Math.PI / 4;
                    grate.scale.setScalar(burnerScale);
                    grate.position.set(w * offsetX, h / 2 + 0.044, d * offsetZ);
                    group.add(grate);
                }
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.04, w * 0.04, 0.018, 32), darkMetal);
                cap.scale.setScalar(burnerScale);
                cap.position.set(w * offsetX, h / 2 + 0.052, d * offsetZ);
                group.add(cap);
            });
            [-0.08, 0.08].forEach(offset => {
                const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.018, 28), metal);
                knob.rotation.x = Math.PI / 2;
                knob.position.set(offset, h / 2 + 0.028, d * 0.36);
                group.add(knob);
            });
        }

        this.enableShadows(group);
    }

    createRangeHood(group, w, d, h, moduleId, spec = {}) {
        const isSide = moduleId.includes('side');
        const isIslandConcept = spec.hoodStyle === 'island';
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(spec.color || (isSide ? '#282d30' : '#303337')),
            metalness: 0.58,
            roughness: 0.2,
            clearcoat: 0.45,
            envMap: this.envMap,
            envMapIntensity: 0.95
        });
        const glassMaterial = this.createBlackGlassMaterial(0x0a0d0d);
        const metal = this.createChromeMaterial(0xd4d7d4);

        if (isIslandConcept) {
            this.addRoundedBox(group, w, h * 0.16, d * 0.76, 0, -h * 0.24, 0, bodyMaterial, 0.055, 14);
            this.addRoundedBox(group, w * 0.82, h * 0.08, d * 0.62, 0, -h * 0.34, 0, glassMaterial, 0.035, 12);
            [-0.36, 0.36].forEach(offsetX => {
                [-0.28, 0.28].forEach(offsetZ => {
                    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, h * 0.42, 14), metal);
                    cable.position.set(w * offsetX, h * 0.02, d * offsetZ);
                    group.add(cable);
                });
            });
        } else if (isSide) {
            this.addRoundedBox(group, w, h * 0.48, d * 0.22, 0, h * 0.08, -d * 0.02, bodyMaterial, 0.025, 10);
            const panel = this.addRoundedBox(group, w * 0.92, h * 0.46, 0.026, 0, -h * 0.14, d * 0.17, glassMaterial, 0.018, 8);
            panel.rotation.x = -0.22;
            this.addBox(group, w * 0.82, 0.018, 0.028, 0, -h * 0.42, d * 0.22, metal);
        } else {
            this.addRoundedBox(group, w, h * 0.22, d * 0.72, 0, h * 0.1, 0, bodyMaterial, 0.025, 10);
            this.addRoundedBox(group, w * 0.86, h * 0.2, d * 0.54, 0, -h * 0.2, d * 0.05, glassMaterial, 0.018, 8);
            this.addBox(group, w * 0.92, 0.018, d * 0.58, 0, -h * 0.33, d * 0.02, metal);
        }

        if (!isIslandConcept) {
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, h * 0.42, 32), bodyMaterial);
            pipe.position.y = h * 0.36;
            group.add(pipe);
        }
        this.addBox(group, w * 0.42, 0.014, 0.018, 0, -h * 0.38, isIslandConcept ? 0 : d * 0.22, new THREE.MeshBasicMaterial({ color: 0xfff3d5 }));
        this.enableShadows(group);
    }

    createFridge(group, w, d, h, moduleId, spec = {}) {
        const isBig = moduleId.includes('big');
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(spec.color || '#d9dee2'),
            metalness: 0.36,
            roughness: 0.24,
            clearcoat: 0.5,
            envMap: this.envMap,
            envMapIntensity: 0.75
        });
        const trim = this.createChromeMaterial(0xbec6c8);
        this.addRoundedBox(group, w, h, d, 0, 0, 0, bodyMaterial, 0.035, 10);
        const frontZ = d / 2 + 0.018;
        if (isBig) {
            [-0.25, 0.25].forEach(side => {
                this.addRoundedBox(group, w * 0.48, h * 0.94, 0.024, side * w * 0.25, 0, frontZ, bodyMaterial, 0.018, 8);
                this.addBox(group, 0.018, h * 0.52, 0.026, side * w * 0.08, h * 0.02, frontZ + 0.018, trim);
            });
            this.addBox(group, 0.01, h * 0.94, 0.02, 0, 0, frontZ + 0.012, new THREE.MeshStandardMaterial({ color: 0x778084, roughness: 0.6 }));
        } else {
            this.addRoundedBox(group, w * 0.94, h * 0.34, 0.024, 0, h * 0.29, frontZ, bodyMaterial, 0.018, 8);
            this.addRoundedBox(group, w * 0.94, h * 0.56, 0.024, 0, -h * 0.18, frontZ, bodyMaterial, 0.018, 8);
            this.addBox(group, w * 0.88, 0.01, 0.018, 0, h * 0.08, frontZ + 0.012, new THREE.MeshStandardMaterial({ color: 0x778084, roughness: 0.6 }));
            this.addBox(group, 0.018, h * 0.36, 0.026, w * 0.38, -h * 0.13, frontZ + 0.02, trim);
            this.addBox(group, 0.018, h * 0.2, 0.026, w * 0.38, h * 0.31, frontZ + 0.02, trim);
        }
        this.enableShadows(group);
    }

    createDishwasher(group, w, d, h, spec = {}) {
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(spec.color || '#1b2021'),
            metalness: 0.28,
            roughness: 0.2,
            clearcoat: 0.65,
            envMap: this.envMap,
            envMapIntensity: 0.75
        });
        const face = this.createBlackGlassMaterial(0x07100d);
        const trim = this.createChromeMaterial(0xb4bab7);
        this.addRoundedBox(group, w, h, d, 0, 0, 0, bodyMaterial, 0.02, 8);
        this.addRoundedBox(group, w * 0.9, h * 0.88, 0.024, 0, -h * 0.02, d / 2 + 0.018, face, 0.016, 8);
        this.addBox(group, w * 0.72, 0.018, 0.026, 0, h * 0.38, d / 2 + 0.04, trim);
        this.addBox(group, w * 0.78, 0.01, 0.018, 0, -h * 0.42, d / 2 + 0.038, trim);
        this.enableShadows(group);
    }

    createOven(group, w, d, h, spec = {}) {
        const body = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(spec.color || '#181b1d'), metalness: 0.35, roughness: 0.18, clearcoat: 0.5, envMap: this.envMap, envMapIntensity: 0.8 });
        const glass = this.createBlackGlassMaterial(0x070909);
        const chrome = this.createChromeMaterial(0xc9cbc7);
        this.addRoundedBox(group, w, h, d, 0, 0, 0, body, 0.018, 8);
        this.addRoundedBox(group, w * 0.86, h * 0.58, 0.028, 0, -h * 0.08, d / 2 + 0.02, glass, 0.018, 8);
        this.addBox(group, w * 0.86, h * 0.12, 0.026, 0, h * 0.4, d / 2 + 0.018, new THREE.MeshPhysicalMaterial({ color: 0x34383b, roughness: 0.18, clearcoat: 0.55 }));
        this.addBox(group, w * 0.55, 0.016, 0.03, 0, h * 0.25, d / 2 + 0.045, chrome);
        [-0.27, -0.16, 0.16, 0.27].forEach(offset => {
            const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.016, 28), chrome);
            knob.rotation.x = Math.PI / 2;
            knob.position.set(w * offset, h * 0.4, d / 2 + 0.04);
            group.add(knob);
        });
        this.addBox(group, w * 0.62, 0.01, 0.012, 0, -h * 0.22, d / 2 + 0.046, new THREE.MeshBasicMaterial({ color: 0xffd28d }));
        this.enableShadows(group);
    }

    createWasher(group, w, d, h, spec = {}) {
        const body = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(spec.color || '#e7ecec'), metalness: 0.18, roughness: 0.28, clearcoat: 0.35, envMap: this.envMap, envMapIntensity: 0.55 });
        const glass = new THREE.MeshPhysicalMaterial({ color: 0x1f2f37, roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.72, envMap: this.envMap, envMapIntensity: 0.85 });
        const chrome = this.createChromeMaterial(0xc7ccca);
        this.addRoundedBox(group, w, h, d, 0, 0, 0, body, 0.025, 10);
        this.addRoundedBox(group, w * 0.9, h * 0.12, 0.024, 0, h * 0.4, d / 2 + 0.018, new THREE.MeshPhysicalMaterial({ color: 0xd1d7d7, roughness: 0.22, clearcoat: 0.35 }), 0.014, 8);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.22, 0.026, 18, 72), chrome);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, -h * 0.08, d / 2 + 0.036);
        group.add(ring);
        const window = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, d) * 0.18, 56), glass);
        window.position.set(0, -h * 0.08, d / 2 + 0.041);
        group.add(window);
        [-0.32, 0.32].forEach(offset => {
            const button = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 24), chrome);
            button.rotation.x = Math.PI / 2;
            button.position.set(w * offset, h * 0.4, d / 2 + 0.04);
            group.add(button);
        });
        this.enableShadows(group);
    }

    createIsland(group, w, d, h, color, moduleId, countertopColor, spec = {}) {
        this.createGenericCabinet(group, w, d, h, color, 'floor', countertopColor || '#f0f0f0', { ...spec, doorCount: 3, drawerCount: 2, skipCountertop: moduleId.includes('sink') });
        if (moduleId.includes('sink')) {
            this.createInsetSink(group, w, d, h / 2 + 0.045, countertopColor || '#f0f0f0', { style: 'kitchen', compact: true });
        }
        this.enableShadows(group);
    }

    attributeToPlainArray(attribute) {
        if (!attribute) return null;
        const result = [];
        const itemSize = attribute.itemSize || 1;
        for (let i = 0; i < attribute.count; i++) {
            if (itemSize >= 1) result.push(attribute.getX(i));
            if (itemSize >= 2) result.push(attribute.getY(i));
            if (itemSize >= 3) result.push(attribute.getZ(i));
            if (itemSize >= 4) result.push(attribute.getW(i));
        }
        return result;
    }

    colorToArray(color, fallback = [0.8, 0.8, 0.8]) {
        if (!color) return fallback;
        return [color.r ?? fallback[0], color.g ?? fallback[1], color.b ?? fallback[2]];
    }

    serializePathTraceMap(texture) {
        const image = texture?.image;
        const url = image?.currentSrc || image?.src || '';
        if (!url) return null;
        return {
            url,
            wrapS: Number(texture.wrapS),
            wrapT: Number(texture.wrapT),
            repeat: texture.repeat ? [texture.repeat.x, texture.repeat.y] : [1, 1],
            offset: texture.offset ? [texture.offset.x, texture.offset.y] : [0, 0],
            rotation: Number(texture.rotation) || 0,
            flipY: Boolean(texture.flipY)
        };
    }

    serializePathTraceMaterial(material) {
        const source = Array.isArray(material) ? material[0] : material;
        if (!source) {
            return {
                color: [0.8, 0.8, 0.8],
                roughness: 0.65,
                metalness: 0
            };
        }
        return {
            name: source.name || '',
            type: source.type || '',
            color: this.colorToArray(source.color),
            emissive: this.colorToArray(source.emissive, [0, 0, 0]),
            emissiveIntensity: Number(source.emissiveIntensity) || 0,
            roughness: source.roughness == null ? 0.62 : Number(source.roughness),
            metalness: Number(source.metalness) || 0,
            clearcoat: Number(source.clearcoat) || 0,
            clearcoatRoughness: Number(source.clearcoatRoughness) || 0,
            transmission: Number(source.transmission) || 0,
            ior: Number(source.ior) || 1.45,
            opacity: source.opacity == null ? 1 : Number(source.opacity),
            transparent: Boolean(source.transparent),
            side: Number(source.side) || THREE.FrontSide,
            map: this.serializePathTraceMap(source.map)
        };
    }

    createPathTracingSnapshot() {
        const ignored = new Set(this.outlineMeshes || []);
        const meshes = [];
        this.scene.updateMatrixWorld(true);

        this.scene.traverse(object => {
            if (!object?.isMesh || !object.geometry || !object.visible || ignored.has(object)) return;
            const role = object.userData?.pathTraceRole || '';
            if (object.userData?.pathTraceHidden) return;
            const position = this.attributeToPlainArray(object.geometry.getAttribute('position'));
            if (!position?.length) return;
            const normal = this.attributeToPlainArray(object.geometry.getAttribute('normal'));
            const uv = this.attributeToPlainArray(object.geometry.getAttribute('uv'));
            const index = object.geometry.index ? Array.from(object.geometry.index.array) : null;
            const material = this.serializePathTraceMaterial(object.material);
            if (material.opacity < 0.035) return;
            meshes.push({
                name: object.name || '',
                role,
                roomShell: Boolean(object.userData?.pathTraceRoomShell),
                type: object.type,
                position,
                normal,
                uv,
                index,
                matrix: object.matrixWorld.toArray(),
                material
            });
        });

        const maxDimension = Math.max(this.roomWidth, this.roomLength, 2.5);
        const subjectBounds = new THREE.Box3();
        const subjectBox = new THREE.Box3();
        let subjectCount = 0;
        this.cabinetMeshes.forEach(group => {
            if (!group?.visible) return;
            subjectBox.setFromObject(group);
            if (subjectBox.isEmpty()) return;
            subjectBounds.union(subjectBox);
            subjectCount += 1;
        });

        let previewCameraPosition;
        let previewCameraTarget;
        let previewCameraFov = 52;
        if (subjectCount && !subjectBounds.isEmpty()) {
            const center = subjectBounds.getCenter(new THREE.Vector3());
            const size = subjectBounds.getSize(new THREE.Vector3());
            const targetY = THREE.MathUtils.clamp(center.y + size.y * 0.18, 0.65, 1.04);
            // Composition follows the placed work rather than the empty room. This
            // keeps a compact basin, toilet or appliance above the lower frame edge.
            previewCameraTarget = [center.x, targetY, center.z];
            previewCameraPosition = [
                center.x + this.roomWidth * 0.26,
                Math.max(1.42, targetY + Math.min(0.84, maxDimension * 0.31)),
                this.roomLength / 2 + Math.min(0.38, this.roomLength * 0.13)
            ];
            previewCameraFov = size.length() < 1.4 ? 47 : 50;
        } else {
            previewCameraPosition = [
                this.roomWidth * 0.26,
                Math.min(1.68, Math.max(1.53, maxDimension * 0.43)),
                this.roomLength / 2 + Math.min(0.46, this.roomLength * 0.15)
            ];
            previewCameraTarget = [-this.roomWidth * 0.1, 1.03, -this.roomLength * 0.26];
        }

        return {
            version: 1,
            roomWidth: this.roomWidth,
            roomLength: this.roomLength,
            meshCount: meshes.length,
            camera: {
                fov: this.camera.fov,
                position: this.camera.position.toArray(),
                target: this.controls?.target ? this.controls.target.toArray() : [0, 0.8, 0]
            },
            previewCamera: {
                fov: previewCameraFov,
                position: previewCameraPosition,
                target: previewCameraTarget
            },
            meshes
        };
    }

    // 截图
    takeScreenshot() {
        this.renderer.clear();
        if (this.usePostProcessing && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        return this.renderer.domElement.toDataURL('image/png');
    }

    takePreviewScreenshot(options = {}) {
        const size = this.getSize();
        const originalPixelRatio = this.renderer.getPixelRatio();
        const originalWidth = this.renderer.domElement.width;
        const originalHeight = this.renderer.domElement.height;
        const originalCameraPosition = this.camera.position.clone();
        const originalTarget = this.controls.target.clone();
        const originalAspect = this.camera.aspect;
        const originalFov = this.camera.fov;
        const originalExposure = this.renderer.toneMappingExposure;
        const originalBloomEnabled = this.bloomPass?.enabled;
        const originalVignetteEnabled = this.vignettePass?.enabled;
        const targetAspect = Number(options.targetAspect) > 0
            ? Number(options.targetAspect)
            : size.width / Math.max(1, size.height);
        let exportWidth = Math.min(2560, Math.max(2160, Math.round(size.width * 2)));
        let exportHeight = Math.round(exportWidth / targetAspect);
        if (exportHeight > 1800) {
            exportHeight = 1800;
            exportWidth = Math.round(exportHeight * targetAspect);
        } else if (exportHeight < 900) {
            exportHeight = 900;
            exportWidth = Math.round(exportHeight * targetAspect);
        }
        const maxDimension = Math.max(this.roomWidth, this.roomLength, 2.5);

        this.renderer.setPixelRatio(1);
        this.renderer.setSize(exportWidth, exportHeight, false);
        if (this.composer) this.composer.setSize(exportWidth, exportHeight);
        if (this.bloomPass?.uniforms?.resolution?.value) {
            this.bloomPass.uniforms.resolution.value.set(exportWidth, exportHeight);
        }
        if (this.fxaaPass) this.fxaaPass.uniforms['resolution'].value.set(1 / exportWidth, 1 / exportHeight);

        this.camera.aspect = exportWidth / exportHeight;
        const previewCamera = options.camera && typeof options.camera === 'object'
            ? options.camera
            : null;
        this.camera.fov = Number(previewCamera?.fov) > 0 ? Number(previewCamera.fov) : 46;
        this.camera.updateProjectionMatrix();
        if (Array.isArray(previewCamera?.position) && previewCamera.position.length >= 3) {
            this.camera.position.fromArray(previewCamera.position);
        } else {
            this.camera.position.set(maxDimension * 0.72, Math.max(1.95, maxDimension * 0.72), maxDimension * 1.05);
        }
        if (Array.isArray(previewCamera?.target) && previewCamera.target.length >= 3) {
            this.controls.target.fromArray(previewCamera.target);
        } else {
            this.controls.target.set(0, 0.86, 0);
        }
        this.camera.lookAt(this.controls.target);
        this.controls.update();
        // The editor can retain its atmosphere, but a customer-facing scene
        // image must not bake a dark vignette or soft bloom into the product.
        if (this.bloomPass) this.bloomPass.enabled = false;
        if (this.vignettePass) this.vignettePass.enabled = false;
        this.renderer.toneMappingExposure = 0.98;

        this.renderer.clear();
        if (this.usePostProcessing && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        const dataUrl = this.renderer.domElement.toDataURL('image/png');

        this.camera.position.copy(originalCameraPosition);
        this.controls.target.copy(originalTarget);
        this.camera.aspect = originalAspect;
        this.camera.fov = originalFov;
        this.camera.updateProjectionMatrix();
        this.controls.update();
        this.renderer.toneMappingExposure = originalExposure;
        if (this.bloomPass) this.bloomPass.enabled = originalBloomEnabled;
        if (this.vignettePass) this.vignettePass.enabled = originalVignetteEnabled;
        this.renderer.setPixelRatio(originalPixelRatio);
        this.renderer.setSize(size.width, size.height, false);
        if (this.composer) this.composer.setSize(size.width, size.height);
        if (this.bloomPass?.uniforms?.resolution?.value) {
            this.bloomPass.uniforms.resolution.value.set(size.width, size.height);
        }
        if (this.fxaaPass) this.fxaaPass.uniforms['resolution'].value.set(1 / size.width, 1 / size.height);
        if (originalWidth && originalHeight) {
            this.renderer.domElement.width = originalWidth;
            this.renderer.domElement.height = originalHeight;
        }

        return dataUrl;
    }

    setShowroomMode(enabled) {
        this.isShowroomMode = enabled;
        this.scene.background = new THREE.Color(enabled ? 0xf5f8fa : 0xf1f5f6);
        this.renderer.toneMappingExposure = enabled ? 0.98 : 0.9;
        if (enabled) {
            this.selectedCabinetId = null;
            this.clearHighlight();
        }
        this.controls.enablePan = true;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = enabled ? 0.72 : 1.2;
        this.controls.maxDistance = enabled ? 9 : 15;

        if (!this.showroomLightGroup) {
            this.showroomLightGroup = new THREE.Group();
            const key = new THREE.DirectionalLight(0xffffff, 1.28);
            key.position.set(this.roomWidth / 2 + 0.7, 3.5, 0.4);
            key.castShadow = true;
            key.shadow.mapSize.width = 2048;
            key.shadow.mapSize.height = 2048;
            key.shadow.camera.left = -5;
            key.shadow.camera.right = 5;
            key.shadow.camera.top = 5;
            key.shadow.camera.bottom = -2;
            key.shadow.bias = -0.0002;
            key.shadow.normalBias = 0.02;
            key.shadow.radius = 2;
            this.showroomLightGroup.add(key);

            const fill = new THREE.DirectionalLight(0xd8e8ff, 0.42);
            fill.position.set(-2.5, 2.2, 1.2);
            this.showroomLightGroup.add(fill);

            const rim = new THREE.DirectionalLight(0xffffff, 0.32);
            rim.position.set(0, 2.8, -this.roomLength / 2 + 0.2);
            this.showroomLightGroup.add(rim);

            const soft = new THREE.HemisphereLight(0xffffff, 0xe3eaec, 0.32);
            soft.position.set(0, 3, 0);
            this.showroomLightGroup.add(soft);
            this.scene.add(this.showroomLightGroup);
        }
        this.showroomLightGroup.visible = enabled;
        if (enabled) this.setShowroomView('front');
    }

    setShowroomView(view) {
        const w = this.roomWidth;
        const d = this.roomLength;
        const maxDimension = Math.max(w, d, 2.8);
        const target = new THREE.Vector3(0, 0.92, -d * 0.16);
        const views = {
            front: {
                position: new THREE.Vector3(0, 1.55, d * 0.98),
                target
            },
            angle: {
                position: new THREE.Vector3(w * 0.34, 1.85, d * 0.92),
                target: new THREE.Vector3(0, 0.92, -d * 0.12)
            },
            walk: {
                position: new THREE.Vector3(w * 0.12, 1.48, d * 0.36),
                target: new THREE.Vector3(-w * 0.04, 1.18, -d * 0.32)
            },
            top: {
                position: new THREE.Vector3(0.001, maxDimension * 1.75, 0.001),
                target: new THREE.Vector3(0, 0.65, 0)
            },
            vanity: {
                position: new THREE.Vector3(-w * 0.22, 1.32, d * 0.42),
                target: new THREE.Vector3(-w * 0.18, 0.82, -d * 0.32)
            },
            shower: {
                position: new THREE.Vector3(w * 0.28, 1.38, d * 0.36),
                target: new THREE.Vector3(w * 0.22, 0.95, d * 0.05)
            }
        };
        const preset = views[view] || views.front;
        this.camera.position.copy(preset.position);
        this.controls.target.copy(preset.target);
        this.camera.lookAt(this.controls.target);
        this.controls.update();
    }

    setReferenceKitchenCamera() {
        // A tighter eye-level composition for the bundled U-shaped reference
        // layout. It leaves normal designer camera controls unchanged.
        this.camera.fov = 60;
        this.camera.position.set(this.roomWidth * 0.28, 1.62, this.roomLength / 2 + 0.62);
        this.controls.target.set(-this.roomWidth * 0.12, 0.94, -this.roomLength * 0.23);
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(this.controls.target);
        this.controls.update();
    }

    setCameraView(view) {
        const maxDimension = Math.max(this.roomWidth, this.roomLength, 2.5);
        const distance = maxDimension * 1.15;
        if (view === 'front') {
            this.camera.fov = 45;
            this.camera.position.set(0, 1.25, distance);
            this.controls.target.set(0, 1.1, 0);
        } else if (view === 'top') {
            this.camera.fov = 45;
            this.camera.position.set(0.001, maxDimension * 1.55, 0.001);
            this.controls.target.set(0, 0, 0);
        } else {
            // “透视” looks in from the room entrance at eye level, so the whole layout stays legible.
            this.camera.fov = 72;
            this.camera.position.set(0, 1.65, this.roomLength / 2 + 1.2);
            this.controls.target.set(0, 0.9, -this.roomLength * 0.2);
        }
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(this.controls.target);
        this.controls.update();
    }

    disposeObject(object) {
        object.traverse(child => {
            if (!child.isMesh) return;
            if (child.geometry) child.geometry.dispose();
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach(material => material.dispose());
        });
    }

    // 设置房间尺寸（用于位置计算）
    setRoomDimensions(width, length) {
        this.roomWidth = width;
        this.roomLength = length;
    }
}
