const CACHE_NAME = 'kitchen-designer-v23-mobile-release';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/cabinet.js',
    './js/editor2d.js',
    './js/scene3d.js',
    './js/app.js',
    './js/vendor/three.min.js',
    './js/vendor/OrbitControls.js',
    './js/vendor/GLTFLoader.js',
    './js/vendor/meshopt_decoder.js',
    './js/vendor/RGBELoader.js',
    './js/vendor/EffectComposer.js',
    './js/vendor/RenderPass.js',
    './js/vendor/ShaderPass.js',
    './js/vendor/CopyShader.js',
    './js/vendor/FXAAShader.js',
    './js/vendor/lucide.min.js',
    './js/polyhaven-assets.generated.js',
    './js/ambientcg-assets.generated.js',
    './js/incoming-assets.generated.js',
    './js/model-assets.js',
    './assets/hdris/studio_small_09_2k.hdr',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).then(response => {
            if (response.ok && new URL(event.request.url).origin === self.location.origin) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
        }).catch(() => {
            return caches.match(event.request).then(cached => {
                if (cached) return cached;
                if (event.request.mode === 'navigate') return caches.match('./index.html');
                return undefined;
            });
        })
    );
});
