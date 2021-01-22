const FILES_TO_CACHE = [
	"/",
	"/index.html",
	"/assets/css/style.css",
	"/dist/manifest.json",
	// "/dist/indexeddb.bundle.js",
	// "/dist/app.bundle.js",
	"/service-worker.js",
	"/assets/js/index.js",
	"/assets/js/indexeddb.js",
	"/assets/icons/icon-192x192.png",
	// "/assets/icons/icon-512x512.png",
	// "/dist/assets/icons/icon_96x96.png",
	// "/dist/assets/icons/icon_128x128.png",
	// "/dist/assets/icons/icon_192x192.png",
	// "/dist/assets/icons/icon_256x256.png",
	// "/dist/assets/icons/icon_384x384.png",
	// "/dist/assets/icons/icon_512x512.png",
	"https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
	"https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
];

const PRECACHE = "precache-v1";
const RUNTIME = "runtime";

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(PRECACHE)
			.then((cache) => cache.addAll(FILES_TO_CACHE))
			.then(self.skipWaiting())
	);
});

self.addEventListener("activate", (event) => {
	const currentCaches = [PRECACHE, RUNTIME];
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return cacheNames.filter(
					(cacheName) => !currentCaches.includes(cacheName)
				);
			})
			.then((cachesToDelete) => {
				return Promise.all(
					cachesToDelete.map((cacheToDelete) => {
						return caches.delete(cacheToDelete);
					})
				);
			})
			.then(() => self.clients.claim())
	);
});

self.addEventListener("fetch", function (evt) {
	// cache successful requests to the API
	if (evt.request.url.includes("/api/")) {
		evt.respondWith(
			caches
				.open(RUNTIME)
				.then((cache) => {
					return fetch(evt.request)
						.then((response) => {
							// If the response was good, clone it and store it in the cache.
							if (response.status === 200) {
								cache.put(evt.request.url, response.clone());
							}

							return response;
						})
						.catch((err) => {
							// Network request failed, try to get it from the cache.
							return cache.match(evt.request);
						});
				})
				.catch((err) => console.log(err))
		);

		return;
	}

	evt.respondWith(
		caches.match(evt.request).then(function (response) {
			return response || fetch(evt.request);
		})
	);
});

// self.addEventListener("fetch", (event) => {
// 	if (event.request.url.startsWith(self.location.origin)) {
// 		event.respondWith(
// 			caches
// 				.match(event.request)
// 				.then((cachedResponse) => {
// 					if (cachedResponse) {
// 						return cachedResponse;
// 					}

// 					return caches.open(RUNTIME).then((cache) => {
// 						return fetch(event.request).then((response) => {
// 							return cache.put(event.request, response.clone()).then(() => {
// 								return response;
// 							});
// 						});
// 					});
// 				})
// 				.catch((err) => console.log(err))
// 		);
// 	}
// });
