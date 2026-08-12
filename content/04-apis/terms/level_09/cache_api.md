# Cache API

> **Level 9 — Browser APIs (Storage & State)**
> A specialized browser database designed exclusively to intercept, store, and retrieve massive HTTP `Response` objects (like images, CSS, and HTML files) for offline use.

---

## 1. Prerequisites
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — The exact object this API is designed to store.
- [Service Workers](service_workers.md) — The primary technology that controls the Cache API.

---

## 2. Term Category

**Browser API / Offline Architecture (Client-Side)**: Cache API is a fundamental concept in this technology stack. **Level 9 — Browser APIs (Storage & State)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
We have [localStorage](../level_09/web_storage.md) for small text, and [IndexedDB](../level_09/indexeddb.md) for big JSON data. But what happens if the user has no Wi-Fi and tries to load your website? 
Even if you have the JSON data saved in IndexedDB, the browser can't even load the `index.html`, `styles.css`, or `logo.png` to show the UI! The screen will just be a blank dinosaur error page.
The **Cache API** was created to store entire HTTP network responses (the actual physical files of your website). By saving the HTML, CSS, and JS files in the Cache API, the browser can load the complete website UI instantly, even in airplane mode!

### (2) Reality Metaphor
Imagine a restaurant (the Server). 
**IndexedDB** is buying the raw ingredients (Data) and bringing them home to cook later.
**Cache API** is buying the finished, cooked meal (HTML/CSS files) and putting it in your freezer. When you are hungry (offline), you just pull the exact meal out of the freezer and eat it immediately without going to the restaurant.

### (3) How it differs from standard HTTP Caching
In Level 6, we learned about `Cache-Control` headers. That is the *Browser's* automatic, hidden cache. Developers have very little control over it.
The **Cache API** is a completely manual, developer-controlled database. You use JavaScript to explicitly say: "Download `logo.png` and put it in a vault named `v1-assets`." You can open the vault, delete specific files, or update them exactly when you want to.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not versioning your Cache names

**The mistake:** A developer names their cache vault `my-website-cache`. They push a massive CSS update to the server. The users complain that the website still looks like the old version!

**Why it's wrong:** The developer's JavaScript code intercepted the network request and said "If `styles.css` is in `my-website-cache`, serve the cached copy instead of asking the server." Because the old CSS file is sitting in that vault, the user will *never* see the new CSS!
**Golden Rule:** Always version your cache names (e.g., `v1-assets`, `v2-assets`). When you deploy an update, change the name to `v2-assets`, write code to delete the old `v1-assets` vault, and download the fresh CSS!

---

### Mistake 2: Caching Non-GET Requests inside the Cache API

**The mistake:** Attempting to cache `POST` or `PUT` HTTP requests using `cache.put(request, response)`.

**Why it's wrong:** The Cache API (`window.caches`) supports caching ONLY `GET` requests according to the Service Worker specification. Passing `POST` requests throws a TypeError.

*Incorrect:*
```javascript
const req = new Request('/api/orders', { method: 'POST' });
await cache.put(req, res); // ❌ TypeError: Request method POST not supported!
```

*Fix:*
```javascript
const req = new Request('/api/orders'); // Default GET method
await cache.put(req, res);
```

---

### Mistake 3: Forgetting to Version Cache Names Leading to Stale Asset Storage

**The mistake:** Using a fixed static cache name `const CACHE_NAME = 'my-cache'` across app deployments.

**Why it's wrong:** Updating static asset files without changing the cache version name forces clients to serve stale old bundle files indefinitely. Increment cache names (e.g. `'v2'`) and delete old caches in `activate` events.

*Incorrect:*
```javascript
const CACHE_NAME = 'app-cache'; // ❌ Never updates cached assets across deployments!
```

*Fix:*
```javascript
const CACHE_NAME = 'app-cache-v2'; // Versioned cache name for invalidation
```


---

## 5. Practice Exercises

### Exercise 1: Service Worker Cache-First Fetch Strategy

**Scenario:** A Progressive Web App (PWA) uses the `CacheStorage` API to implement a Cache-First strategy for static CSS and JavaScript assets.

**Requirements:**
1. Write cacheFirstFetch(requestUrl, cacheName, mockCaches, mockFetch).
2. Check cache for match.
3. If found, return cached response.
4. Else fetch network, cache response, and return.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function cacheFirstFetch(requestUrl, cacheName = "v1-assets", mockCaches, mockFetch) {
>   const cacheStorage = mockCaches || globalThis.caches;
>   const fetchFn = mockFetch || globalThis.fetch;
>
>   const cache = await cacheStorage.open(cacheName);
>   const cachedResponse = await cache.match(requestUrl);
>
>   if (cachedResponse) {
>     return { source: "CACHE", response: cachedResponse };
>   }
>
>   try {
>     const networkResponse = await fetchFn(requestUrl);
>     if (networkResponse.ok) {
>       await cache.put(requestUrl, networkResponse.clone());
>     }
>     return { source: "NETWORK", response: networkResponse };
>   } catch (err) {
>     throw new Error(`Network and cache failed for ${requestUrl}`);
>   }
> }
>
> // Verification tests
> const mockCache = {
>   store: new Map(),
>   async match(url) { return this.store.get(url) || null; },
>   async put(url, res) { this.store.set(url, res); }
> };
> const mockCaches = { open: async () => mockCache };
> const mockFetch = async (url) => ({ ok: true, status: 200, clone() { return this; } });
>
> cacheFirstFetch("https://app.com/styles.css", "v1", mockCaches, mockFetch).then(r1 => {
>   console.assert(r1.source === "NETWORK", "Test 1 Failed: First fetch reads network");
>   return cacheFirstFetch("https://app.com/styles.css", "v1", mockCaches, mockFetch).then(r2 => {
>     console.assert(r2.source === "CACHE", "Test 2 Failed: Second fetch reads cache");
>   });
> });
> ```
>
> #### Technical Explanation
>
> 1. **Cache Storage API**: Modern Web API storing Request/Response objects directly in browser memory for offline capability.
> 2. **Cache-First Strategy**: Serves resources instantly from cache, falling back to network only when missing.
> 3. **Cloning Response Streams**: Must call response.clone() before passing to cache.put() because Response bodies are single-use streams.
> 
---

### Exercise 2: Static Asset Pre-Caching Module

**Scenario:** During Service Worker installation, a PWA pre-caches critical app shell assets (`index.html`, `app.js`, `styles.css`) in bulk.

**Requirements:**
1. Write precacheAppShell(cacheName, assetsArray, mockCaches).
2. Open cache.
3. Add all assets using cache.addAll().

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function precacheAppShell(cacheName = "app-shell-v1", assetsArray = [], mockCaches) {
>   if (!Array.isArray(assetsArray) || assetsArray.length === 0) return 0;
>
>   const cacheStorage = mockCaches || globalThis.caches;
>   const cache = await cacheStorage.open(cacheName);
>
>   if (typeof cache.addAll === "function") {
>     await cache.addAll(assetsArray);
>     return assetsArray.length;
>   }
>
>   let count = 0;
>   for (const asset of assetsArray) {
>     await cache.put(asset, { ok: true, status: 200 });
>     count++;
>   }
>   return count;
> }
>
> // Verification tests
> const mockStore = new Map();
> const mockCaches = {
>   open: async () => ({
>     addAll: async (assets) => assets.forEach(a => mockStore.set(a, true))
>   })
> };
>
> precacheAppShell("v1", ["/index.html", "/app.js"], mockCaches).then(count => {
>   console.assert(count === 2, "Test 1 Failed");
>   console.assert(mockStore.has("/app.js") === true, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Pre-Caching on Install**: Ensures essential UI assets are downloaded and cached before the user goes offline.
> 2. **cache.addAll() Method**: Atomically fetches and caches an array of URLs; if any single request fails, installation fails.
> 3. **App Shell Architecture**: Caches minimal HTML/CSS/JS shell to provide instant UI loads on repeat visits.
> 
---

### Exercise 3: Stale Cache Cleaner Manager

**Scenario:** During Service Worker activation, an asset manager purges outdated cache buckets while preserving active versions.

**Requirements:**
1. Write purgeOldCaches(currentCacheName, mockCaches).
2. List cache names.
3. Delete caches not matching currentCacheName.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function purgeOldCaches(currentCacheName, mockCaches) {
>   const cacheStorage = mockCaches || globalThis.caches;
>   const allCacheNames = await cacheStorage.keys();
>
>   const deletedCaches = [];
>
>   for (const cacheName of allCacheNames) {
>     if (cacheName !== currentCacheName) {
>       await cacheStorage.delete(cacheName);
>       deletedCaches.push(cacheName);
>     }
>   }
>
>   return { deletedCaches, activeCache: currentCacheName };
> }
>
> // Verification tests
> const cacheKeys = ["static-v1", "static-v2", "static-v3"];
> const mockCaches = {
>   keys: async () => [...cacheKeys],
>   delete: async (name) => {
>     const idx = cacheKeys.indexOf(name);
>     if (idx !== -1) cacheKeys.splice(idx, 1);
>   }
> };
>
> purgeOldCaches("static-v3", mockCaches).then(res => {
>   console.assert(res.deletedCaches.length === 2, "Test 1 Failed: Must delete v1 and v2");
>   console.assert(cacheKeys.length === 1 && cacheKeys[0] === "static-v3", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Cache Storage Cleanup**: Prevents browser storage quota exhaustion by deleting obsolete cache versions.
> 2. **Service Worker Activation Phase**: The activate event is the standard lifecycle stage for purging old caches.
> 3. **Atomic Bucket Rotation**: Switching cache bucket names (v1 -> v2) guarantees clean cache transitions.
---

## 6. Related Terms
- [Service Workers](service_workers.md) — The scripts that actively use the Cache API to intercept network requests.
- [IndexedDB](indexeddb.md) — The complementary database used for JSON, while the Cache API handles Files.
- [Storage Limits & Eviction](storage_limits.md) — Related concept: Storage Limits & Eviction.

---

## 7. Key Takeaways
- The **Cache API** is a browser database used to store raw HTTP `Response` objects (HTML, CSS, JS, Images).
- It allows websites to load instantly and function completely offline.
- Unlike automatic HTTP caching, the Cache API is manually controlled via JavaScript.
- You must carefully manage and delete old caches when you deploy new versions of your app!
