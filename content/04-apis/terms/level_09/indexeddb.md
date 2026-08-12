# IndexedDB

> **Level 9 — Browser APIs (Storage & State)**
> A full-blown, low-level database built directly into the web browser, capable of storing massive amounts of complex data (like entire files and millions of records) for offline use.

---

## 1. Prerequisites
- [localStorage & sessionStorage](web_storage.md) — IndexedDB is the big brother to localStorage.
- [Promises (in the context of networks)](../level_05/promises.md) — Because IndexedDB reads from the hard drive, it is entirely asynchronous.

---

## 2. Term Category

**Browser API / Client-Side Database (Client-Side)**: IndexedDB is a fundamental concept in this technology stack. **Level 9 — Browser APIs (Storage & State)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you want to save a few strings of text in the browser, [localStorage](../level_09/web_storage.md) is great. But what if you are building an offline web app (like Google Docs) and need to save 500 Megabytes of documents, images, and user data so the app works without Wi-Fi?
`localStorage` will crash at 5MB, and it can only store strings. 
Enter **IndexedDB**. It is a massive NoSQL database living inside the browser. It allows you to store arrays, objects, files, and Blobs (binary data) with virtually no size limit.

### (2) Reality Metaphor
**localStorage:** A sticky note on your desk. You can jot down a quick password or a dark-mode setting. It's fast, but it holds almost nothing.
**IndexedDB:** A giant filing cabinet in your office. It takes a lot more effort to open the drawers, find the right folder, and retrieve the documents, but it can hold an entire company's worth of paperwork.

### (3) Why is it so hard to use?
IndexedDB is notoriously difficult to code from scratch. 
1. It is **Asynchronous**: Because retrieving 500MB of data takes time, every database operation relies on events and Promises to prevent the UI from freezing.
2. It uses **Transactions**: To ensure data doesn't corrupt if the browser crashes, you can't just say "save this." You have to "open a transaction, lock the table, execute the save, and close the transaction."
*Note: Because the native API is so painful, almost all developers use third-party wrapper libraries like `localForage` or `idb` to make it easier.*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not preparing for Data Wipes

**The mistake:** A developer builds a complex game and stores the player's 50-hour save file exclusively in IndexedDB. 

**Why it's wrong:** IndexedDB is a *Browser* database. The user has total control over it. If the user clicks "Clear Browsing History & Data" in Chrome, their entire 50-hour save file will be instantly and permanently deleted! Furthermore, if the hard drive gets full, Safari might silently delete the data to make room!
**Golden Rule:** IndexedDB is for *Caching* and *Offline Sync*. It is not a permanent source of truth. As soon as the user gets Wi-Fi, you must sync their save data to your actual Backend server!

---

### Mistake 2: Executing Read/Write Operations Outside an Active IndexedDB Transaction

**The mistake:** Attempting to call `objectStore.add(data)` without opening a transaction.

**Why it's wrong:** IndexedDB is strictly transaction-based. All object store reads and writes MUST occur within an active `db.transaction(['store'], 'readwrite')` scope.

*Incorrect:*
```javascript
const store = db.objectStore('users');
store.add({ id: 1 }); // ❌ Error: Transaction inactive or missing!
```

*Fix:*
```javascript
const tx = db.transaction('users', 'readwrite');
const store = tx.objectStore('users');
store.add({ id: 1 });
```

---

### Mistake 3: Using Raw Callback-Based `IDBRequest` API Instead of Promise Wrappers (`idb` library)

**The mistake:** Writing nested `request.onsuccess` and `request.onerror` callbacks for multi-step IndexedDB queries.

**Why it's wrong:** Raw IndexedDB event target APIs lead to deep callback hell and missing error propagation. Use promise wrapper libraries like `idb` (Jake Archibald).

*Incorrect:*
```http
/* Deeply nested XHR-style IDBRequest event handler callbacks */
```

*Fix:*
```javascript
import { openDB } from 'idb';
const db = await openDB('my-db', 1);
await db.put('users', { id: 1, name: 'Alice' }); // Clean async/await
```


---

## 5. Practice Exercises

### Exercise 1: IndexedDB Promisified ObjectStore Wrapper

**Scenario:** A client data layer wraps low-level asynchronous `IndexedDB` transaction requests into modern Promise-returning functions.

**Requirements:**
1. Write putIndexedDbItem(mockDb, storeName, key, value).
2. Open readwrite transaction.
3. Put item and resolve promise.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function putIndexedDbItem(mockDb, storeName, key, value) {
>   return new Promise((resolve, reject) => {
>     const tx = mockDb.transaction(storeName, "readwrite");
>     const store = tx.objectStore(storeName);
>     const request = store.put(value, key);
>
>     request.onsuccess = () => resolve(true);
>     request.onerror = (e) => reject(request.error || new Error("IndexedDB Put Failed"));
>   });
> }
>
> // Verification tests
> const mockStore = new Map();
> const mockDb = {
>   transaction: () => ({
>     objectStore: () => ({
>       put: (val, k) => {
>         mockStore.set(k, val);
>         const req = {};
>         setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 5);
>         return req;
>       }
>     })
>   })
> };
>
> putIndexedDbItem(mockDb, "users", "u1", { name: "Alice" }).then(res => {
>   console.assert(res === true, "Test 1 Failed");
>   console.assert(mockStore.get("u1").name === "Alice", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **IndexedDB Purpose**: Low-level browser NoSQL database for storing large amounts of structured data (blobs, objects, files).
> 2. **Event Request Architecture**: IndexedDB operations are asynchronous and return IDBRequest objects with onsuccess/onerror callbacks.
> 3. **Transaction Scoping**: All data mutations must occur inside explicit readwrite or readonly transactions.
> 
---

### Exercise 2: IndexedDB Schema Upgrade & Migration Handler

**Scenario:** Implements an `onupgradeneeded` handler to create ObjectStores and index definitions during database schema version upgrades.

**Requirements:**
1. Write handleDbUpgrade(db, oldVersion, newVersion).
2. Create ObjectStore 'orders' with keyPath 'id'.
3. Create index 'userId'.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleDbUpgrade(db, oldVersion, newVersion) {
>   const createdStores = [];
>
>   if (oldVersion < 1) {
>     const orderStore = db.createObjectStore("orders", { keyPath: "id" });
>     orderStore.createIndex("userId", "userId", { unique: false });
>     createdStores.push("orders");
>   }
>
>   if (oldVersion < 2) {
>     db.createObjectStore("logs", { autoIncrement: true });
>     createdStores.push("logs");
>   }
>
>   return createdStores;
> }
>
> // Verification tests
> const mockDb = {
>   createObjectStore: (name, opts) => {
>     return { createIndex: () => {} };
>   }
> };
>
> const stores = handleDbUpgrade(mockDb, 0, 2);
> console.assert(stores.length === 2 && stores.includes("orders") && stores.includes("logs"), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **onupgradeneeded Lifecycle Event**: Fires ONLY when opening a database with a higher version number than currently exists.
> 2. **ObjectStore Creation Scope**: ObjectStores and indexes can ONLY be created or deleted inside onupgradeneeded event handlers.
> 3. **Schema Version Management**: Enables graceful database migrations across client PWA updates.
> 
---

### Exercise 3: IndexedDB Cursor Index Query Filter

**Scenario:** Queries an IndexedDB index using a cursor iterator to filter records matching specific criteria.

**Requirements:**
1. Write queryIndexByCursor(mockIndex, targetValue).
2. Iterate cursor.
3. Return matching records array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function queryIndexByCursor(mockIndex, targetValue) {
>   return new Promise((resolve) => {
>     const matches = [];
>     const request = mockIndex.openCursor();
>
>     request.onsuccess = (event) => {
>       const cursor = event.target.result;
>       if (cursor) {
>         if (cursor.value.category === targetValue) {
>           matches.push(cursor.value);
>         }
>         cursor.continue();
>       } else {
>         resolve(matches); // Cursor iteration finished
>       }
>     };
>   });
> }
>
> // Verification tests
> const mockItems = [
>   { id: 1, category: "books" },
>   { id: 2, category: "tech" }
> ];
>
> let idx = 0;
> const mockIndex = {
>   openCursor: () => {
>     const req = { target: {} };
>     req.target.result = null;
>     const iterate = () => {
>       if (idx < mockItems.length) {
>         const item = mockItems[idx++];
>         req.target.result = {
>           value: item,
>           continue: iterate
>         };
>       } else {
>         req.target.result = null;
>       }
>       if (req.onsuccess) req.onsuccess(req);
>     };
>     setTimeout(iterate, 5);
>     return req;
>   }
> };
>
> queryIndexByCursor(mockIndex, "books").then(results => {
>   console.assert(results.length === 1 && results[0].id === 1, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **IndexedDB Cursors**: Iterates through rows in an ObjectStore or Index without loading the entire dataset into memory.
> 2. **cursor.continue() Mechanics**: Advances the cursor pointer to the next record, re-triggering the onsuccess callback.
> 3. **Indexed Search Performance**: Index cursors provide high-speed lookups over millions of client-side records.
---

## 6. Related Terms
- [localStorage & sessionStorage](web_storage.md) — The lightweight, synchronous alternative.
- [Service Workers](service_workers.md) — The technology that uses IndexedDB to build Progressive Web Apps (PWAs) that work entirely offline.
- [Cache API](cache_api.md) — Related concept: Cache API.
- [Offline-First / PWA](offline_first.md) — Related concept: Offline-First / PWA.
- [Storage Limits & Eviction](storage_limits.md) — Related concept: Storage Limits & Eviction.

---

## 7. Key Takeaways
- **IndexedDB** is a massive, complex database built into the browser.
- It can store Objects, Arrays, and binary Files (unlike localStorage).
- It is entirely asynchronous (Promise/Event based) to prevent freezing the browser.
- It is primarily used to build "Offline-First" web apps that sync to the server later.
