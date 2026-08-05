# IndexedDB

> **Level 9 — Browser APIs (Storage & State)**
> A full-blown, low-level database built directly into the web browser, capable of storing massive amounts of complex data (like entire files and millions of records) for offline use.

---

## 1. Prerequisites
- [localStorage & sessionStorage](web_storage.md) — IndexedDB is the big brother to localStorage.
- [Promises (in the context of networks)](../level_05/promises.md) — Because IndexedDB reads from the hard drive, it is entirely asynchronous.
---

## 2. Term Category
- **Browser API / Client-Side Database**

---

## 3. Environment Context
- **Client-Side (Browser Only)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Which Storage?

**Problem:** For the following 3 scenarios, would you use `localStorage` or `IndexedDB`?
1. Saving a simple boolean `{"soundEnabled": false}`.
2. Saving 5,000 JSON records of a user's previous workouts so the app works on an airplane.
3. Saving a 10MB audio file recorded by the user.

**Expected output:**
> [!check]- Answer
> ```text
> 1. localStorage (It's tiny text).
> 2. IndexedDB (localStorage would crash trying to stringify and store 5,000 complex records, plus IndexedDB allows for fast searching/indexing).
> 3. IndexedDB (localStorage literally cannot store binary audio files).
> ```
> - Does it exceed 5MB? Is it a file?

---

### Exercise 2: IndexedDB vs Web Storage (LocalStorage)

**Problem:** Compare IndexedDB vs LocalStorage across:
1. Storage capacity limits
2. Asynchronous vs Synchronous
3. Binary & Indexed Object support

**Expected output:**
> [!check]- Answer
> ```text
> 1. LocalStorage: ~5MB limit; IndexedDB: Hundreds of MBs / GBs
> 2. LocalStorage: Synchronous (blocks UI); IndexedDB: Asynchronous
> 3. LocalStorage: Strings only; IndexedDB: Complex structured objects and binary Blobs
> ```
> ```text
> Capacity   -> LocalStorage: ~5MB, IndexedDB: Hundreds of MBs / GBs
> Execution  -> LocalStorage: Synchronous (UI blocking), IndexedDB: Asynchronous
> Data Types -> LocalStorage: Strings only, IndexedDB: Objects, Blobs, ArrayBuffers
> ```
> - **Explanation:** IndexedDB is a high-capacity asynchronous object database in the browser.
---

### Exercise 3: IndexedDB Schema Upgrade Event

**Problem:** Which event handler MUST be used to create Object Stores or Indexes when opening a new IndexedDB database version?

**Expected output:**
> [!check]- Answer
> ```text
> onupgradeneeded (or db.on('upgradeneeded'))
> ```
> ```javascript
> request.onupgradeneeded = (evt) => {
> const db = evt.target.result;
> db.createObjectStore('users', { keyPath: 'id' });
> };
> ```
> - **Explanation:** `onupgradeneeded` executes when database version numbers increment.
---

## 7. Related Terms
- [localStorage & sessionStorage](web_storage.md) — The lightweight, synchronous alternative.
- [Service Workers](service_workers.md) — The technology that uses IndexedDB to build Progressive Web Apps (PWAs) that work entirely offline.
- [Cache API](cache_api.md) — Related concept: Cache API.
- [Offline-First / PWA](offline_first.md) — Related concept: Offline-First / PWA.
- [Storage Limits & Eviction](storage_limits.md) — Related concept: Storage Limits & Eviction.
---

## 8. Key Takeaways
- **IndexedDB** is a massive, complex database built into the browser.
- It can store Objects, Arrays, and binary Files (unlike localStorage).
- It is entirely asynchronous (Promise/Event based) to prevent freezing the browser.
- It is primarily used to build "Offline-First" web apps that sync to the server later.
