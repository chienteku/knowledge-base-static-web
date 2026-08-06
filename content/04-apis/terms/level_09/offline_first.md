# Offline-First / PWA

> **Level 9 — Browser APIs (Storage & State)**
> Designing apps that work without a network.

---

## 1. Prerequisites
- [Service Workers](service_workers.md) — The network interceptor threads.
- [Cache API](cache_api.md) — The storage for asset request states.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Browser-Specific**: Built on modern Progressive Web App (PWA) browser APIs.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Traditional web applications are "online-first." If a user loses internet connectivity, the browser displays a "No Connection" page, blocking access to the app's features.

In contrast, **Progressive Web Apps (PWAs)** implement an **Offline-First** architecture. The application is designed to function offline by default, treating the network as an enhancement rather than a dependency.

#### Core Pillars of Offline-First PWAs

1.  **The App Shell:** The minimal HTML, CSS, and JavaScript required to render the application's user interface shell (header, sidebar, loading state).
2.  **Service Worker Caching:** A Service Worker intercepts all network requests. During installation, it caches the App Shell assets in the browser's **Cache API**.
3.  **Cache-First Routing:** When the browser requests the page assets, the Service Worker serves them directly from the local cache. The UI loads instantly, even when offline.
4.  **Local Data Storage (IndexedDB):** Dynamic user actions (such as writing an email draft or logging a transaction offline) are stored locally in **IndexedDB**.
5.  **Background Sync:** Once the browser detects the device is back online, it triggers a background sync event to upload the stored changes to the server.

---

### (2) Routing Strategies

Different data types require different caching strategies:

```text
  Cache-First:            [ Request ] ───> [ Cache ] ──( Hit? )──> [ Return Asset ]
                                               │
                                            ( Miss ) ──> [ Network ]
                                            
  Network-First:          [ Request ] ───> [ Network ] ──( Fail? )──> [ Cache ]
```

*   **Cache-First (Static Assets):** Check the Cache first. If found, serve it. If not, fallback to the network. Best for images, CSS, and JS bundle files.
*   **Network-First (Dynamic Data):** Try the network first to get fresh data. If the connection fails, serve the cached version as a fallback. Best for user feeds and inbox listings.
*   **Stale-While-Revalidate (Hybrid):** Serve the cached version instantly (for speed), then fetch fresh data from the network in the background and update the cache for next time.

---

### (3) Reality Metaphor
Imagine cooking a meal at home.
- **Online-First** is like calling a chef on the phone for every instruction. You ask: *"What is step 1?"* They tell you. Then you call back: *"What is step 2?"* If your phone signal drops, you cannot cook.
- **Offline-First** is like opening a printed recipe book (**the Cache**) in your kitchen drawer. You read the steps directly from the book, regardless of phone reception. If you run out of sugar, you write it on a list (**IndexedDB**). When you get a signal later, you go to the store and buy it (**Background Sync**).

---

### (4) Service Worker Implementation Example

A basic Service Worker script demonstrating Cache-First routing for static assets:

```javascript
const CACHE_NAME = 'app-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/logo.png'
];

// 1. Install Event: Cache the App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching static App Shell assets...");
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 2. Fetch Event: Intercept network calls and apply Cache-First strategy
self.addEventListener('fetch', (event) => {
  // Only intercept requests for static files/origins
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached file if found; otherwise, fall back to the network
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Applying Cache-First routing to highly dynamic data

**The mistake:** Using a Cache-First routing strategy for dynamic content like `/api/stock-prices` or `/api/notifications`.

**Why it's wrong:** The browser will find a cache match from the first request and serve it indefinitely, preventing the app from querying the network. The user will see outdated stock prices or stale feeds, even when online.

*Fix:* Use **Network-First** or **Stale-While-Revalidate** strategies for volatile dynamic endpoints.

---

### Mistake 2: Failing to Provide Local Storage Queues for Offline Action Mutations

**The mistake:** Disabling user action buttons completely when device loses network connectivity.

**Why it's wrong:** Offline-First applications allow users to perform mutations offline, saving pending actions to IndexedDB / Service Worker background sync queues for replay when reconnected.

*Incorrect:*
```http
/* Disabling submit button completely when navigator.onLine is false */
```

*Fix:*
```http
/* Store offline mutations in IndexedDB and register Service Worker Background Sync */
```

---

### Mistake 3: Failing to Handle Optimistic UI Rollbacks on Server Rejection

**The mistake:** Updating local UI optimistically without handling server rejection errors when offline sync replays.

**Why it's wrong:** If an offline mutation fails server validation upon reconnect, the UI remains desynchronized unless the client handles rollbacks cleanly.

*Incorrect:*
```javascript
// Optimistic UI update without rollback state
setItems([...items, newItem]); // ❌ No rollback if server sync fails!
```

*Fix:*
```javascript
const prevItems = items;
setItems([...items, newItem]);
try { await syncServer(newItem); }
catch (err) { setItems(prevItems); } // Rollback to previous state on sync error
```


---

## 6. Practice Exercises

### Exercise 1: Strategy Selector

**Problem:** Choose the most appropriate routing strategy (**Cache-First**, **Network-First**, or **Stale-While-Revalidate**) for the following assets:

1.  A CSS stylesheet file `main.hash123.css` (renamed on compile when updated).
2.  A user's inbox email list widget.
3.  A weather widget showing current temperatures.

> [!check]- Answer
> - 1.  **Cache-First** (The file name changes when updated, so we can cache it indefinitely without risk of serving stale styles).
> - 2.  **Network-First** (Users expect to see new emails immediately if they have an active connection, with a fallback to cached emails when offline).
> - 3.  **Stale-While-Revalidate** (Provides an instant load state using cached weather data, then updates the temperature in the background once the network response resolves).
> 
> 
---

### Exercise 2: Service Worker Background Sync API

**Problem:** What is the role of the Service Worker `BackgroundSync` API in offline-first applications?

**Expected output:**
> [!check]- Answer
> ```text
> BackgroundSync allows web apps to defer tasks (e.g. sending a message) to the Service Worker, which automatically executes the network request when user regains connection.
> ```
> ```javascript
> // Register background sync task:
> const registration = await navigator.serviceWorker.ready;
> await registration.sync.register('send-offline-messages');
> ```
> - **Explanation:** `BackgroundSync` guarantees network delivery even if user closes the browser tab.
---

### Exercise 3: Network First vs Cache First Strategies

**Problem:** Which Service Worker caching strategy is preferred for static CSS/JS assets vs dynamic user feeds?

**Expected output:**
> [!check]- Answer
> ```text
> Static assets: Cache First (Fallback to Network)
> Dynamic feeds: Network First (Fallback to Cache)
> ```
> ```text
> Static assets (CSS/JS) -> Cache First, Network Fallback
> Dynamic feeds (API data) -> Network First, Cache Fallback
> ```
> - **Explanation:** Cache First maximizes asset speed; Network First ensures data freshness.
---

## 7. Related Terms
- [Service Workers](service_workers.md) — The background scripts that orchestrate PWA caching.
- [IndexedDB](indexeddb.md) — The browser-native database used for offline data storage.

---

## 8. Key Takeaways
- Offline-First applications remain functional without a network connection.
- PWAs cache their UI App Shell locally to enable offline loads.
- Cache-First routing serves local assets instantly, falling back to the network on cache misses.
- Network-First routing prioritizes fresh data, falling back to cached states when offline.
- Stale-While-Revalidate serves cached content instantly and updates it in the background.
- Store offline user actions in IndexedDB and synchronize them when the device reconnects.
