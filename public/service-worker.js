const FILES_TO_CACHE = [
	"/",
	"/index.html",
	"/assets/css/style.css",
	"/dist/app.bundle.js",
	"/dist/indexeddb.bundle.js",
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

// The activate handler takes care of cleaning up old caches.
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

	// if the request is not for the API, serve static assets using "offline-first" approach.
	// see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
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
