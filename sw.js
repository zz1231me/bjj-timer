var CACHE_NAME = 'bjj-timer-v3';
var ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/timer.js',
    './js/settings.js',
    './js/sound.js',
    './js/bridge.js',
    './manifest.json'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(ASSETS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (n) { return n !== CACHE_NAME; })
                    .map(function (n) { return caches.delete(n); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.match(e.request).then(function (cached) {
                var fetched = fetch(e.request).then(function (response) {
                    if (response && response.status === 200 && response.type === 'basic') {
                        cache.put(e.request, response.clone());
                    }
                    return response;
                }).catch(function () {
                    return cached;
                });

                return cached || fetched;
            });
        })
    );
});

self.addEventListener('message', function (e) {
    if (e.data === 'skipWaiting') {
        self.skipWaiting();
    }
    if (e.data === 'refreshCache') {
        caches.open(CACHE_NAME).then(function (cache) {
            ASSETS.forEach(function (url) {
                fetch(url, { cache: 'no-cache' }).then(function (resp) {
                    if (resp && resp.status === 200) {
                        cache.put(url, resp);
                    }
                }).catch(function () {});
            });
        });
    }
});
