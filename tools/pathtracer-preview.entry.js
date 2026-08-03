import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';

// The preview is a deliverable image, so convergence wins over a fast-but-grainy frame.
const DEFAULT_SAMPLES = 1024;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
}

function colorFromArray(value, fallback = [0.8, 0.8, 0.8]) {
    const source = Array.isArray(value) && value.length >= 3 ? value : fallback;
    return new THREE.Color(source[0], source[1], source[2]);
}

function makeMaterial(data = {}, map = null) {
    const opacity = data.opacity == null ? 1 : clamp(data.opacity, 0, 1);
    const transparent = Boolean(data.transparent) || opacity < 0.985;
    const emissive = Array.isArray(data.emissive) ? data.emissive : [0, 0, 0];
    const requestedTransmission = data.transmission == null ? 0 : data.transmission;
    const side = data.side === THREE.BackSide
        ? THREE.BackSide
        : data.side === THREE.DoubleSide
            ? THREE.DoubleSide
            : THREE.FrontSide;
    const emissiveStrength = Math.max(
        data.emissiveIntensity || 0,
        emissive[0] + emissive[1] + emissive[2] > 0.04 ? 1.6 : 0
    );

    // The preview scene intentionally uses a compact light rig instead of an HDRI.
    // Fully metallic PBR values therefore turn black because there is little to
    // reflect. Retain the metallic cue while keeping the selected finish visible.
    const requestedMetalness = clamp(data.metalness || 0, 0, 1);
    const previewMetalness = requestedMetalness > 0.04
        ? Math.min(0.42, requestedMetalness * 0.38)
        : 0;
    const material = new THREE.MeshPhysicalMaterial({
        color: colorFromArray(data.color),
        roughness: clamp(data.roughness == null ? 0.62 : data.roughness, 0.02, 1),
        metalness: previewMetalness,
        transmission: transparent ? clamp(requestedTransmission, 0, 0.28) : clamp(requestedTransmission, 0, 0.6),
        thickness: transparent ? 0.03 : 0,
        ior: clamp(data.ior || 1.45, 1, 2.4),
        clearcoat: clamp(data.clearcoat || 0, 0, 1),
        clearcoatRoughness: clamp(data.clearcoatRoughness || 0.22, 0, 1),
        emissive: colorFromArray(emissive, [0, 0, 0]),
        emissiveIntensity: emissiveStrength,
        opacity,
        transparent,
        side
    });
    if (map) {
        material.map = map;
        material.needsUpdate = true;
    }
    return material;
}

function makeGeometry(data) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.position, 3));
    if (data.normal?.length) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normal, 3));
    }
    if (data.uv?.length) {
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv, 2));
    }
    if (data.index?.length) {
        geometry.setIndex(data.index);
    }
    if (!geometry.getAttribute('normal')) {
        geometry.computeVertexNormals();
    }
    geometry.computeBoundingSphere();
    return geometry;
}

function addSoftLight(scene, roomWidth, roomLength) {
    const ceilingY = 2.42;
    const keyLight = new THREE.RectAreaLight(0xf7fbff, 6.2, Math.max(1.1, roomWidth * 0.52), 0.38);
    keyLight.position.set(0, ceilingY - 0.04, -roomLength * 0.18);
    keyLight.lookAt(0, 0.95, -roomLength * 0.08);
    scene.add(keyLight);

    const windowLight = new THREE.RectAreaLight(0xe7f2ff, 3.6, Math.max(1.15, roomLength * 0.58), 1.34);
    windowLight.position.set(-roomWidth / 2 - 0.08, 1.5, roomLength * 0.04);
    windowLight.lookAt(0, 1.02, -roomLength * 0.08);
    scene.add(windowLight);

    const panelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf7fbff,
        emissive: 0xf6fbff,
        emissiveIntensity: 1.6,
        roughness: 0.42,
        side: THREE.DoubleSide
    });

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.85, roomWidth * 0.4), 0.24), panelMaterial);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(0, ceilingY, -roomLength * 0.22);
    scene.add(panel);

    const windowMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xdcebff,
        emissive: 0xdcecff,
        emissiveIntensity: 0.46,
        roughness: 0.7,
        side: THREE.DoubleSide
    });
    const windowPanel = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(1.1, roomLength * 0.52), 1.16), windowMaterial);
    windowPanel.position.set(-roomWidth / 2 - 0.055, 1.5, roomLength * 0.04);
    windowPanel.rotation.y = Math.PI / 2;
    scene.add(windowPanel);
}

function textureConfigKey(map) {
    return map?.url || '';
}

function loadTexture(url) {
    if (!url) return Promise.resolve(null);
    return new Promise(resolve => {
        new THREE.TextureLoader().load(
            url,
            texture => {
                texture.colorSpace = THREE.SRGBColorSpace;
                resolve(texture);
            },
            undefined,
            () => resolve(null)
        );
    });
}

function materialMap(baseTexture, map) {
    if (!baseTexture || !map) return null;
    const texture = baseTexture.clone();
    texture.wrapS = Number.isFinite(map.wrapS) ? map.wrapS : THREE.ClampToEdgeWrapping;
    texture.wrapT = Number.isFinite(map.wrapT) ? map.wrapT : THREE.ClampToEdgeWrapping;
    if (Array.isArray(map.repeat)) texture.repeat.fromArray(map.repeat);
    if (Array.isArray(map.offset)) texture.offset.fromArray(map.offset);
    texture.rotation = Number(map.rotation) || 0;
    texture.flipY = Boolean(map.flipY);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

async function buildScene(snapshot = {}) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7f8);
    scene.environment = null;

    const meshes = Array.isArray(snapshot.meshes) ? snapshot.meshes : [];
    const mapSources = new Map();
    meshes.forEach(mesh => {
        const map = mesh?.material?.map;
        const key = textureConfigKey(map);
        if (key && !mapSources.has(key)) mapSources.set(key, loadTexture(key));
    });
    const loadedMaps = new Map();
    await Promise.all(Array.from(mapSources.entries()).map(async ([key, source]) => {
        loadedMaps.set(key, await source);
    }));
    for (const meshData of meshes) {
        if (!meshData?.position?.length) continue;
        const geometry = makeGeometry(meshData);
        const map = meshData.material?.map;
        const texture = materialMap(loadedMaps.get(textureConfigKey(map)), map);
        const mesh = new THREE.Mesh(geometry, makeMaterial(meshData.material, texture));
        if (Array.isArray(meshData.matrix) && meshData.matrix.length === 16) {
            mesh.matrix.fromArray(meshData.matrix);
            mesh.matrixAutoUpdate = false;
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    }

    addSoftLight(scene, Number(snapshot.roomWidth) || 3, Number(snapshot.roomLength) || 2.5);
    scene.updateMatrixWorld(true);
    return scene;
}

function buildCamera(snapshot = {}, aspect = 16 / 9) {
    const cameraData = snapshot.previewCamera || snapshot.camera || {};
    const camera = new THREE.PerspectiveCamera(cameraData.fov || 46, aspect, 0.02, 80);
    const position = Array.isArray(cameraData.position) ? cameraData.position : [2.4, 2.1, 3.6];
    const target = Array.isArray(cameraData.target) ? cameraData.target : [0, 0.8, 0];
    camera.position.fromArray(position);
    camera.lookAt(new THREE.Vector3().fromArray(target));
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    return camera;
}

class PathTracerPreview {
    static isSupported() {
        const canvas = document.createElement('canvas');
        return Boolean(canvas.getContext('webgl2'));
    }

    constructor({ canvas, onUpdate } = {}) {
        this.canvas = canvas;
        this.onUpdate = typeof onUpdate === 'function' ? onUpdate : () => {};
        this.renderer = null;
        this.pathTracer = null;
        this.scene = null;
        this.camera = null;
        this.target = new THREE.Vector3(0, 0.9, 0);
        this.spherical = new THREE.Spherical();
        this.frame = 0;
        this.maxSamples = DEFAULT_SAMPLES;
        this.running = false;
        this.walkthroughEnabled = false;
        this.pointerId = null;
        this.dragging = false;
        this.activePointers = new Map();
        this.pinchDistance = 0;
        this.dragButton = 0;
        this.lastPointer = { x: 0, y: 0 };
        this.hasNavigation = false;
        this.navigationResumeTimer = 0;
        this.homeCameraPosition = null;
        this.homeTarget = null;
        this.yaw = 0;
        this.pitch = 0;
        this.viewDistance = 2.2;
        this.pathTraceVisible = false;
        this.finalDataUrl = null;
    }

    dispose() {
        this.stop();
        if (this.navigationResumeTimer) clearTimeout(this.navigationResumeTimer);
        if (this.pathTracer?.dispose) this.pathTracer.dispose();
        if (this.renderer) this.renderer.dispose();
        this.pathTracer = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.finalDataUrl = null;
        this.activePointers.clear();
        this.pinchDistance = 0;
        this.hideStableRaster();
    }

    stop() {
        this.running = false;
        if (this.frame) cancelAnimationFrame(this.frame);
        this.frame = 0;
    }

    installNavigation() {
        if (!this.canvas || this.hasNavigation) return;
        this.hasNavigation = true;
        this.canvas.addEventListener('pointerdown', event => this.onPointerDown(event));
        window.addEventListener('pointermove', event => this.onPointerMove(event));
        window.addEventListener('pointerup', event => this.onPointerUp(event));
        window.addEventListener('pointercancel', event => this.onPointerUp(event));
        this.canvas.addEventListener('wheel', event => this.onWheel(event), { passive: false });
        this.canvas.addEventListener('dblclick', () => this.resetView());
        this.canvas.addEventListener('contextmenu', event => {
            if (this.walkthroughEnabled) event.preventDefault();
        });
    }

    enableWalkthrough(enabled = true) {
        this.walkthroughEnabled = Boolean(enabled);
        this.installNavigation();
        if (this.walkthroughEnabled) {
            this.hideStableRaster();
            this.syncSphericalFromCamera();
            this.renderRasterPreview();
        }
        if (this.canvas) {
            this.canvas.classList.toggle('is-walkthrough', this.walkthroughEnabled);
            this.canvas.title = this.walkthroughEnabled
                ? '高清漫游：拖拽转方向，滚轮推进/后退，双击重置视角'
                : '';
        }
        this.onUpdate({
            state: this.walkthroughEnabled ? 'walkthrough' : 'stable',
            samples: this.pathTracer?.samples || 0,
            maxSamples: this.maxSamples,
            progress: 100,
            zoom: this.getZoomPercent()
        });
        return this.walkthroughEnabled;
    }

    syncSphericalFromCamera() {
        if (!this.camera) return;
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        this.spherical.setFromVector3(offset);
        this.spherical.radius = clamp(this.spherical.radius, 0.35, 12);
        this.spherical.phi = clamp(this.spherical.phi, 0.18, Math.PI - 0.18);
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction).normalize();
        this.viewDistance = clamp(this.camera.position.distanceTo(this.target) || this.spherical.radius || 2.2, 0.55, 12);
        this.yaw = Math.atan2(direction.x, direction.z);
        this.pitch = Math.asin(clamp(direction.y, -0.92, 0.92));
    }

    updateLookTarget() {
        if (!this.camera) return;
        const horizontal = Math.cos(this.pitch);
        const direction = new THREE.Vector3(
            Math.sin(this.yaw) * horizontal,
            Math.sin(this.pitch),
            Math.cos(this.yaw) * horizontal
        ).normalize();
        this.target.copy(this.camera.position).addScaledVector(direction, this.viewDistance);
        this.camera.lookAt(this.target);
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld(true);
    }

    renderRasterPreview() {
        if (!this.renderer || !this.scene || !this.camera) return;
        const raster = document.getElementById('path-preview-raster');
        if (raster) raster.hidden = true;
        if (this.canvas) this.canvas.hidden = false;
        this.renderer.setRenderTarget(null);
        this.renderer.clear(true, true, true);
        this.renderer.render(this.scene, this.camera);
    }

    hideStableRaster() {
        const raster = document.getElementById('path-preview-raster');
        if (raster) raster.hidden = true;
        if (this.canvas) this.canvas.hidden = false;
    }

    async showStableRaster(dataUrl) {
        if (!dataUrl) return false;
        const raster = document.getElementById('path-preview-raster');
        if (!raster) return false;
        await new Promise((resolve, reject) => {
            raster.onload = () => resolve();
            raster.onerror = reject;
            raster.src = dataUrl;
        });
        raster.hidden = false;
        if (this.canvas) this.canvas.hidden = true;
        return true;
    }

    restartPathTracing() {
        if (!this.pathTracer || !this.camera) return;
        if (!this.pathTraceVisible) {
            this.renderRasterPreview();
            this.onUpdate({ state: this.walkthroughEnabled ? 'walkthrough' : 'stable', samples: 0, maxSamples: this.maxSamples, progress: 100, zoom: this.getZoomPercent() });
            return;
        }
        if (this.frame) cancelAnimationFrame(this.frame);
        this.frame = 0;
        this.pathTracer.camera = this.camera;
        this.pathTracer.updateCamera?.();
        this.pathTracer.reset?.();
        this.running = true;
        this.onUpdate({ state: 'walkthrough', samples: 0, maxSamples: this.maxSamples, progress: 100, zoom: this.getZoomPercent() });
        this.tick();
    }

    queuePathTraceRestart(delay = 120) {
        if (!this.pathTracer) return;
        if (this.navigationResumeTimer) clearTimeout(this.navigationResumeTimer);
        this.navigationResumeTimer = setTimeout(() => {
            this.navigationResumeTimer = 0;
            this.restartPathTracing();
        }, delay);
    }

    applyCameraMove({ immediate = false, restartDelay = 120 } = {}) {
        if (!this.camera) return;
        this.updateLookTarget();
        if (this.pathTracer) {
            this.pathTracer.camera = this.camera;
            this.pathTracer.updateCamera?.();
        }
        this.renderRasterPreview();
        this.onUpdate({ state: 'walkthrough', samples: 0, maxSamples: this.maxSamples, progress: 100, zoom: this.getZoomPercent() });
        if (immediate) {
            this.restartPathTracing();
        } else {
            this.queuePathTraceRestart(restartDelay);
        }
    }

    onPointerDown(event) {
        if (!this.walkthroughEnabled || !this.camera) return;
        event.preventDefault();
        this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.activePointers.size >= 2) {
            const points = [...this.activePointers.values()].slice(0, 2);
            this.pinchDistance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
            this.dragging = false;
            this.pointerId = null;
            this.stop();
            return;
        }
        this.dragging = true;
        this.dragButton = event.button || 0;
        this.pointerId = event.pointerId;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        if (this.navigationResumeTimer) clearTimeout(this.navigationResumeTimer);
        this.navigationResumeTimer = 0;
        this.stop();
        this.canvas?.setPointerCapture?.(event.pointerId);
    }

    onPointerMove(event) {
        if (!this.walkthroughEnabled || !this.camera) return;
        if (this.activePointers.has(event.pointerId)) {
            this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }
        if (this.activePointers.size >= 2) {
            event.preventDefault();
            const points = [...this.activePointers.values()].slice(0, 2);
            const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
            if (this.pinchDistance > 0 && distance > 0) {
                this.zoomBy(Math.pow(distance / this.pinchDistance, 0.72));
            }
            this.pinchDistance = distance;
            return;
        }
        if (!this.dragging || this.pointerId !== event.pointerId) return;
        event.preventDefault();
        const dx = event.clientX - this.lastPointer.x;
        const dy = event.clientY - this.lastPointer.y;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        if (Math.abs(dx) + Math.abs(dy) < 0.1) return;

        if (this.dragButton === 2 || event.buttons === 2 || event.shiftKey) {
            const panScale = Math.max(0.0015, this.viewDistance * 0.0014);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            this.camera.position.addScaledVector(right, -dx * panScale);
            this.camera.position.addScaledVector(up, dy * panScale);
        } else {
            this.yaw -= dx * 0.0048;
            this.pitch = clamp(this.pitch - dy * 0.0038, -1.08, 1.08);
        }
        this.applyCameraMove({ restartDelay: 180 });
    }

    onPointerUp(event) {
        this.activePointers.delete(event.pointerId);
        if (this.activePointers.size < 2) this.pinchDistance = 0;
        if (!this.dragging || this.pointerId !== event.pointerId) return;
        this.canvas?.releasePointerCapture?.(event.pointerId);
        this.dragging = false;
        this.pointerId = null;
        this.applyCameraMove({ immediate: true });
    }

    onWheel(event) {
        if (!this.walkthroughEnabled || !this.camera) return;
        event.preventDefault();
        this.zoomBy(Math.exp(-event.deltaY * 0.0015));
    }

    resetView() {
        if (!this.camera || !this.homeCameraPosition || !this.homeTarget) return;
        this.stop();
        this.camera.position.copy(this.homeCameraPosition);
        this.camera.zoom = 1;
        this.target.copy(this.homeTarget);
        this.syncSphericalFromCamera();
        this.applyCameraMove({ immediate: true });
    }

    getZoomPercent() {
        return Math.round((this.camera?.zoom || 1) * 100);
    }

    zoomBy(factor = 1) {
        if (!this.walkthroughEnabled || !this.camera || !Number.isFinite(factor) || factor <= 0) return this.getZoomPercent();
        this.stop();
        this.camera.zoom = clamp((this.camera.zoom || 1) * factor, 0.55, 3.2);
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld(true);
        if (this.pathTracer) {
            this.pathTracer.camera = this.camera;
            this.pathTracer.updateCamera?.();
        }
        this.renderRasterPreview();
        this.onUpdate({
            state: 'walkthrough',
            samples: 0,
            maxSamples: this.maxSamples,
            progress: 100,
            zoom: this.getZoomPercent()
        });
        this.queuePathTraceRestart(180);
        return this.getZoomPercent();
    }

    ensureRenderer(renderScale = 1, outputWidth = 1280) {
        if (!this.canvas) throw new Error('Preview canvas not found');
        if (!this.renderer) {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: false,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            });
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 0.98;
            this.installCompileGuard();
        }

        const rect = this.canvas.getBoundingClientRect();
        const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 16 / 9;
        const minimumWidth = clamp(outputWidth || 1280, 640, 1920);
        const width = Math.max(minimumWidth, Math.round(rect.width || minimumWidth));
        const height = Math.max(Math.round(minimumWidth / (16 / 9)), Math.round(width / aspect));
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(width, height, false);
        if (this.pathTracer) {
            this.pathTracer.renderScale = renderScale;
        }
        return { width, height };
    }

    installCompileGuard() {
        if (!this.renderer || this.renderer.__pathPreviewCompileGuard) return;
        const nativeCompileAsync = typeof this.renderer.compileAsync === 'function'
            ? this.renderer.compileAsync.bind(this.renderer)
            : null;
        const nativeCompile = typeof this.renderer.compile === 'function'
            ? this.renderer.compile.bind(this.renderer)
            : null;

        this.renderer.compileAsync = (...args) => {
            const syncCompile = () => {
                if (!nativeCompile) return;
                try {
                    nativeCompile(...args);
                } catch (error) {
                    // Some three.js versions require a full scene/camera pair here.
                }
            };
            if (!nativeCompileAsync) {
                syncCompile();
                return Promise.resolve();
            }
            const timeout = new Promise(resolve => {
                setTimeout(() => {
                    syncCompile();
                    resolve();
                }, 900);
            });
            return Promise.race([
                nativeCompileAsync(...args).catch(() => undefined),
                timeout
            ]).then(() => undefined);
        };
        this.renderer.__pathPreviewCompileGuard = true;
    }

    async waitForCompilation(timeoutMs = 1600) {
        const start = performance.now();
        while (this.pathTracer?.isCompiling && performance.now() - start < timeoutMs) {
            this.onUpdate({
                state: 'compiling',
                samples: 0,
                maxSamples: this.maxSamples,
                progress: Math.min(95, Math.round((performance.now() - start) / timeoutMs * 100))
            });
            await new Promise(resolve => setTimeout(resolve, 80));
        }

        if (this.pathTracer?.isCompiling) {
            const full = this.pathTracer._pathTracer;
            const low = this.pathTracer._lowResPathTracer;
            if (full) full._compilePromise = null;
            if (low) low._compilePromise = null;
            this.onUpdate({ state: 'rendering', samples: 0, maxSamples: this.maxSamples, progress: 100 });
        }
    }

    async render(snapshot, options = {}) {
        this.stop();
        this.finalDataUrl = null;
        const renderScale = clamp(options.renderScale == null ? 1 : options.renderScale, 0.65, 1);
        const { width, height } = this.ensureRenderer(renderScale, options.outputWidth);
        this.maxSamples = Math.max(8, Math.round(options.samples || DEFAULT_SAMPLES));
        this.scene = await buildScene(snapshot);
        this.camera = buildCamera(snapshot, width / height);
        const cameraData = snapshot.previewCamera || snapshot.camera || {};
        const target = Array.isArray(cameraData.target) ? cameraData.target : [0, 0.9, 0];
        this.target.fromArray(target);
        this.homeCameraPosition = this.camera.position.clone();
        this.homeTarget = this.target.clone();
        this.syncSphericalFromCamera();
        this.installNavigation();

        if (this.pathTracer?.dispose) this.pathTracer.dispose();
        this.pathTracer = new WebGLPathTracer(this.renderer);
        this.pathTracer.tiles.set(1, 1);
        this.pathTracer.bounces = Math.max(4, Math.round(options.bounces || 8));
        this.pathTracer.transmissiveBounces = Math.max(1, Math.round(options.transmissiveBounces || 4));
        // Keep glossy reflections physically intact. A strong firefly clamp makes
        // chrome, glass and glazed ceramic look flat even after convergence.
        this.pathTracer.filterGlossyFactor = 0.2;
        this.pathTracer.renderScale = renderScale;
        this.pathTracer.minSamples = 1;
        this.pathTracer.fadeDuration = 60;
        this.pathTracer.dynamicLowRes = false;
        this.pathTracer.lowResScale = 0.45;
        const textureSize = clamp(options.textureSize || 2048, 512, 2048);
        this.pathTracer.textureSize.set(textureSize, textureSize);

        this.onUpdate({ state: 'building', samples: 0, maxSamples: this.maxSamples, progress: 0 });
        this.pathTracer.setScene(this.scene, this.camera);
        await this.waitForCompilation();

        this.hideStableRaster();
        this.pathTraceVisible = true;
        this.running = true;
        this.onUpdate({ state: 'rendering', samples: 0, maxSamples: this.maxSamples, progress: 100 });
        this.tick();
    }

    tick() {
        if (!this.running || !this.pathTracer) return;
        this.pathTracer.renderSample();
        const samples = this.pathTracer.samples || 0;
        this.onUpdate({ state: 'rendering', samples, maxSamples: this.maxSamples, progress: 100 });
        if (samples >= this.maxSamples) {
            this.running = false;
            this.onUpdate({ state: 'done', samples, maxSamples: this.maxSamples, progress: 100 });
            this.finalDataUrl = this.createPresentationDataURL();
            if (this.finalDataUrl) {
                this.showStableRaster(this.finalDataUrl).then(() => {
                    this.onUpdate({ state: 'stable', samples, maxSamples: this.maxSamples, progress: 100 });
                }).catch(() => undefined);
            }
            return;
        }
        this.frame = requestAnimationFrame(() => this.tick());
    }

    createPresentationDataURL() {
        // Export the converged path-tracer frame byte-for-byte. The previous
        // browser-canvas median pass erased fine material and fixture detail,
        // producing an artificially softened final image.
        return this.canvas ? this.canvas.toDataURL('image/png') : null;
    }

    toDataURL() {
        if (!this.canvas) throw new Error('Preview canvas not found');
        return this.finalDataUrl || this.canvas.toDataURL('image/png');
    }
}

window.PathTracerPreview = PathTracerPreview;
window.PathTracerPreviewRevision = {
    three: THREE.REVISION,
    samples: DEFAULT_SAMPLES
};
