# Service Workers

> **Level 9 — Browser APIs (Storage & State)**
> A powerful JavaScript script that runs in the background of the browser, acting as a programmable network proxy capable of intercepting HTTP requests and serving them from the Cache.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Service workers literally hijack this lifecycle before it hits the internet.

---

## 2. Term Category

**Browser API / Offline Architecture (Client-Side)**: Service Workers is a fundamental concept in this technology stack. **Level 9 — Browser APIs (Storage & State)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Historically, web apps were vastly inferior to native iOS/Android apps. If an iOS app lost Wi-Fi, it would still open; you could still tap around the UI. If a Web App lost Wi-Fi, you got the Chrome Dinosaur error page. 
Google and Microsoft wanted Web Apps to be able to work offline, send Push Notifications, and run background sync tasks, just like Native apps.
To do this, they invented the **Service Worker**. It is a separate JavaScript file that runs *outside* of your main web page, entirely in the background.

### (2) Reality Metaphor
Imagine your main JavaScript code (`app.js`) is the CEO of a company. When the CEO wants a file from the Server, they shout: `fetch('logo.png')`!
Usually, that request goes straight out the door to the internet. 
A **Service Worker** is an Executive Assistant you hire to stand at the front door. When the CEO shouts `fetch('logo.png')`, the Assistant intercepts it. The Assistant checks the filing cabinet ([Cache API](../level_09/cache_api.md)). If the logo is in the cabinet, the Assistant hands it back to the CEO instantly. The request never even leaves the building! If it's not in the cabinet, the Assistant goes out to the internet to get it.

### (3) The Core Features
Because they run in the background (even if the user closes the website tab!), Service Workers have three superpowers:
1. **Network Interception (Offline Mode):** They can intercept all `fetch` requests and serve cached HTML/CSS when the Wi-Fi is off. (This creates a "Progressive Web App" or PWA).
2. **Push Notifications:** They can listen for messages from the server and trigger native desktop/mobile push notifications even if the browser tab is closed.
3. **Background Sync:** If the user tries to send an email while in a tunnel, the Service Worker can pause the request and wait until the phone gets cell service back hours later, sending the email silently in the background.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Developing without HTTPS

**The mistake:** A developer writes a perfect Service Worker, but tests it on their staging server `http://my-staging-site.com`. The Service Worker refuses to install and throws errors.

**Why it's wrong:** Service Workers are incredibly dangerous. Because they can intercept and rewrite every single network request, a hacker could use one to steal passwords. Therefore, browsers strictly enforce that Service Workers will **ONLY run over HTTPS** (encrypted connections). 
*Note: The only exception is `http://localhost` for local development.*

---

### Mistake 2: Attempting to Access the Browser `window` or `document` DOM Objects Inside a Service Worker

**The mistake:** Writing `document.getElementById('app')` or `window.localStorage` inside `sw.js`.

**Why it's wrong:** Service Workers run in a separate background thread scope (`Self` / `WorkerGlobalScope`). They have NO access to the DOM (`window`, `document`). Use postMessage to talk to the page.

*Incorrect:*
```javascript
// Inside sw.js
document.title = 'Offline'; // ❌ ReferenceError: document is not defined!
```

*Fix:*
```javascript
// Inside sw.js - Send postMessage to window client:
const clientsList = await self.clients.matchAll();
clientsList.forEach(client => client.postMessage({ type: 'STATUS', msg: 'Offline' }));
```

---

### Mistake 3: Caching Service Worker Script (`sw.js`) with Long HTTP Cache TTL Header

**The mistake:** Serving `sw.js` with header `Cache-Control: max-age=31536000`.

**Why it's wrong:** Caching `sw.js` prevents browsers from detecting updates to the Service Worker script itself. Always serve `sw.js` with `Cache-Control: no-cache`.

*Incorrect:*
```http
/* HTTP response for sw.js */
Cache-Control: max-age=31536000 ; ❌ Browser never checks for Service Worker updates!
```

*Fix:*
```http
Cache-Control: no-cache, no-store
```


---

## 5. Practice Exercises

### Exercise 1: Service Worker Registration & Controller Helper

**Scenario:** A web application registers a Progressive Web App Service Worker script (`/sw.js`) and monitors registration lifecycle states.

**Requirements:**
1. Write registerSwScript(swPath, mockNavigator).
2. Verify ServiceWorker support.
3. Register SW and return registration promise.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function registerSwScript(swPath = "/sw.js", mockNavigator) {
>   const nav = mockNavigator || globalThis.navigator;
>
>   if (!nav || !("serviceWorker" in nav)) {
>     return { supported: false, registration: null, message: "Service Workers not supported" };
>   }
>
>   try {
>     const registration = await nav.serviceWorker.register(swPath, { scope: "/" });
>     return { supported: true, registration };
>   } catch (err) {
>     return { supported: true, registration: null, error: err.message };
>   }
> }
>
> // Verification tests
> const mockNav = {
>   serviceWorker: {
>     register: async (path, opts) => ({ scope: opts.scope, active: true })
>   }
> };
>
> registerSwScript("/sw.js", mockNav).then(res => {
>   console.assert(res.supported === true && res.registration.active === true, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Service Worker Concept**: Event-driven background worker running independently of web pages, acting as a programmable network proxy.
> 2. **HTTPS Requirement**: Service Workers require secure HTTPS origins (or localhost for development) due to powerful proxy capabilities.
> 3. **Scope Property**: Defines path directory hierarchy controlled by the Service Worker (e.g. scope: '/').
> 
---

### Exercise 2: Network-First with Cache Fallback SW Fetch Interceptor

**Scenario:** Implements a Network-First fetch interceptor strategy ideal for dynamic API data endpoints.

**Requirements:**
1. Write networkFirstFetch(requestUrl, cacheName, mockCaches, mockFetch).
2. Attempt network fetch first.
3. Cache response on success.
4. Fall back to cache on network failure.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function networkFirstFetch(requestUrl, cacheName = "dynamic-api-v1", mockCaches, mockFetch) {
>   const cacheStorage = mockCaches || globalThis.caches;
>   const fetchFn = mockFetch || globalThis.fetch;
>
>   try {
>     const networkResponse = await fetchFn(requestUrl);
>     if (networkResponse.ok) {
>       const cache = await cacheStorage.open(cacheName);
>       await cache.put(requestUrl, networkResponse.clone());
>     }
>     return { source: "NETWORK", response: networkResponse };
>   } catch (netErr) {
>     const cache = await cacheStorage.open(cacheName);
>     const cachedResponse = await cache.match(requestUrl);
>
>     if (cachedResponse) {
>       return { source: "CACHE_FALLBACK", response: cachedResponse };
>     }
>     throw new Error(`Both network and cache failed for ${requestUrl}`);
>   }
> }
>
> // Verification tests
> const mockCache = new Map();
> const mockCaches = {
>   open: async () => ({
>     put: async (u, r) => mockCache.set(u, r),
>     match: async (u) => mockCache.get(u) || null
>   })
> };
>
> const failingFetch = async () => { throw new Error("Offline"); };
> mockCache.set("https://api.com/feed", { ok: true, status: 200 });
>
> networkFirstFetch("https://api.com/feed", "v1", mockCaches, failingFetch).then(res => {
>   console.assert(res.source === "CACHE_FALLBACK", "Test 1 Failed: Must return fallback cache when offline");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Network-First Strategy**: Prefers fresh network data, falling back to cached responses when offline.
> 2. **API Caching Pattern**: Optimal for dynamic content (news feeds, dashboards) where freshness is preferred over speed.
> 3. **Graceful Degradation**: Ensures application displays cached data when user enters airplane mode.
> 
---

### Exercise 3: Service Worker SkipWaiting & Clients Claim Automation

**Scenario:** Accelerates Service Worker activation and immediate page control using `self.skipWaiting()` and `clients.claim()`.

**Requirements:**
1. Write handleSwActivation(mockSelf).
2. Call skipWaiting().
3. Call clients.claim().

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function handleSwActivation(mockSelf) {
>   const actions = [];
>
>   if (mockSelf.skipWaiting) {
>     await mockSelf.skipWaiting();
>     actions.push("SKIP_WAITING");
>   }
>
>   if (mockSelf.clients && mockSelf.clients.claim) {
>     await mockSelf.clients.claim();
>     actions.push("CLIENTS_CLAIM");
>   }
>
>   return actions;
> }
>
> // Verification tests
> const mockSelf = {
>   skipWaiting: async () => {},
>   clients: { claim: async () => {} }
> };
>
> handleSwActivation(mockSelf).then(actions => {
>   console.assert(actions.length === 2, "Test 1 Failed");
>   console.assert(actions.includes("SKIP_WAITING") && actions.includes("CLIENTS_CLAIM"), "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **skipWaiting() Method**: Forces newly installed Service Worker to activate immediately without waiting for existing tabs to close.
> 2. **clients.claim() Method**: Allows activated Service Worker to take immediate control of un-controlled open page clients.
> 3. **Instant SW Updates**: Ensures user receives new SW features instantly without requiring full browser restart.
---

## 6. Related Terms
- [Cache API](cache_api.md) — The database the Service Worker uses to store the offline files.
- [IndexedDB](indexeddb.md) — The database the Service Worker uses to store the offline JSON data.
- [Offline-First / PWA](offline_first.md) — Related concept: Offline-First / PWA.
- [localStorage & sessionStorage](web_storage.md) — Web Storage.

---

## 7. Key Takeaways
- A **Service Worker** is a background script that acts as a middleman between your app and the internet.
- It can intercept `fetch()` requests and serve files from the Cache API, allowing the app to work entirely **Offline**.
- It is the engine behind Push Notifications and Background Syncing.
- It will ONLY run on secure **HTTPS** connections.
