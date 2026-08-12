# Offline-First / PWA

> **Level 9 — Browser APIs (Storage & State)**
> Designing apps that work without a network.

---

## 1. Prerequisites
- [Service Workers](service_workers.md) — The network interceptor threads.
- [Cache API](cache_api.md) — The storage for asset request states.

---

## 2. Term Category

**Architecture / Design (Browser-Specific: Built on modern Progressive Web App  browser APIs.)**: Offline-First / PWA is a fundamental concept in this technology stack. **Level 9 — Browser APIs (Storage & State)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Offline Mutation Sync Queue Manager

**Scenario:** An offline-first PWA queues API mutations (POST/PUT) in IndexedDB when offline, automatically flushing them when network connectivity is restored.

**Requirements:**
1. Write createOfflineQueue(apiSyncFn).
2. Queue mutations when offline.
3. Flush queue on network reconnect.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createOfflineQueue(apiSyncFn) {
>   const queue = [];
>   let isOnline = false;
>
>   return {
>     setOnlineStatus(status) {
>       isOnline = status;
>     },
>     async enqueueMutation(mutation) {
>       if (isOnline) {
>         return await apiSyncFn(mutation);
>       }
>       queue.push(mutation);
>       return { queued: true, queueLength: queue.length };
>     },
>     async flushQueue() {
>       if (!isOnline || queue.length === 0) return [];
>       const pending = [...queue];
>       queue.length = 0;
>
>       const results = [];
>       for (const item of pending) {
>         try {
>           const res = await apiSyncFn(item);
>           results.push({ item, success: true, res });
>         } catch (e) {
>           queue.push(item); // Re-queue failed item
>           results.push({ item, success: false, error: e.message });
>         }
>       }
>       return results;
>     }
>   };
> }
>
> // Verification tests
> const mockSync = async (m) => ({ synced: true, action: m.action });
> const offQueue = createOfflineQueue(mockSync);
>
> offQueue.setOnlineStatus(false);
> offQueue.enqueueMutation({ action: "UPDATE_PROFILE" }).then(res => {
>   console.assert(res.queued === true, "Test 1 Failed");
>
>   offQueue.setOnlineStatus(true);
>   return offQueue.flushQueue().then(flushed => {
>     console.assert(flushed.length === 1 && flushed[0].success === true, "Test 2 Failed");
>   });
> });
> ```
>
> #### Technical Explanation
>
> 1. **Offline-First Philosophy**: Architectural pattern where apps function seamlessly without network, using local storage as source of truth.
> 2. **Background Re-Sync**: Queues mutations offline and syncs them automatically when network connection is restored.
> 3. **Optimistic UI Updates**: Updates UI state immediately in local storage before backend synchronization confirms.
> 
---

### Exercise 2: Network Availability Listener & Guard

**Scenario:** Monitors browser online/offline status using `navigator.onLine` and `window.addEventListener('online'/'offline')`.

**Requirements:**
1. Write monitorNetworkStatus(onStatusChangeFn, mockWindow).
2. Emit current status.
3. Listen for online and offline window events.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function monitorNetworkStatus(onStatusChangeFn, mockWindow) {
>   const win = mockWindow || globalThis;
>   const isOnline = () => win.navigator ? win.navigator.onLine : true;
>
>   const handleOnline = () => onStatusChangeFn({ online: true });
>   const handleOffline = () => onStatusChangeFn({ online: false });
>
>   if (win.addEventListener) {
>     win.addEventListener("online", handleOnline);
>     win.addEventListener("offline", handleOffline);
>   }
>
>   return {
>     getCurrentStatus: () => isOnline(),
>     cleanup: () => {
>       if (win.removeEventListener) {
>         win.removeEventListener("online", handleOnline);
>         win.removeEventListener("offline", handleOffline);
>       }
>     }
>   };
> }
>
> // Verification tests
> const events = [];
> const mockWin = {
>   navigator: { onLine: false },
>   listeners: {},
>   addEventListener(evt, fn) { this.listeners[evt] = fn; },
>   removeEventListener(evt) { delete this.listeners[evt]; }
> };
>
> const monitor = monitorNetworkStatus((status) => events.push(status), mockWin);
> console.assert(monitor.getCurrentStatus() === false, "Test 1 Failed");
>
> mockWin.listeners["online"]();
> console.assert(events.length === 1 && events[0].online === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **navigator.onLine Property**: Boolean indicating whether browser is connected to a network interface.
> 2. **Online/Offline Window Events**: Fires when browser transitions between connected and disconnected network states.
> 3. **Network Edge Cases**: navigator.onLine = true indicates connection to a router, but does NOT guarantee internet access (captive portals).
> 
---

### Exercise 3: Last-Write-Wins Conflict Resolution Engine

**Scenario:** Resolves offline data sync conflicts between local offline mutations and server data using Last-Write-Wins (LWW) timestamp evaluation.

**Requirements:**
1. Write resolveLwwConflict(localRecord, serverRecord).
2. Compare updatedTimestamp.
3. Return record with newest timestamp.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveLwwConflict(localRecord, serverRecord) {
>   if (!localRecord) return serverRecord;
>   if (!serverRecord) return localRecord;
>
>   const localTime = new Date(localRecord.updatedTimestamp || 0).getTime();
>   const serverTime = new Date(serverRecord.updatedTimestamp || 0).getTime();
>
>   if (localTime >= serverTime) {
>     return { ...localRecord, conflictResolved: true, winner: "LOCAL" };
>   }
>
>   return { ...serverRecord, conflictResolved: true, winner: "SERVER" };
> }
>
> // Verification tests
> const local = { id: 1, name: "Alice Offline", updatedTimestamp: "2026-08-12T10:05:00Z" };
> const server = { id: 1, name: "Alice Server", updatedTimestamp: "2026-08-12T10:00:00Z" };
>
> const winner = resolveLwwConflict(local, server);
> console.assert(winner.winner === "LOCAL" && winner.name === "Alice Offline", "Test 1 Failed: Local record is newer");
> ```
>
> #### Technical Explanation
>
> 1. **Sync Conflict Problem**: Occurs when data is modified offline on the client and simultaneously updated on the server.
> 2. **Last-Write-Wins (LWW) Strategy**: Simple deterministic strategy choosing the record with the most recent timestamp.
> 3. **CRDTs & Vector Clocks**: Advanced alternatives for multi-user offline collaboration without data loss.
---

## 6. Related Terms
- [Service Workers](service_workers.md) — The background scripts that orchestrate PWA caching.
- [IndexedDB](indexeddb.md) — The browser-native database used for offline data storage.

---

## 7. Key Takeaways
- Offline-First applications remain functional without a network connection.
- PWAs cache their UI App Shell locally to enable offline loads.
- Cache-First routing serves local assets instantly, falling back to the network on cache misses.
- Network-First routing prioritizes fresh data, falling back to cached states when offline.
- Stale-While-Revalidate serves cached content instantly and updates it in the background.
- Store offline user actions in IndexedDB and synchronize them when the device reconnects.
