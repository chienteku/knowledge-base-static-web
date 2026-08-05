# Storage Limits & Eviction

> **Level 9 — Browser APIs (Storage & State)**
> Quotas and when browsers purge cached/stored data.

---

## 1. Prerequisites
- [localStorage & sessionStorage](web_storage.md) — The lightweight key-value browser stores.
- [Cache API](cache_api.md) — The response caching mechanism.

---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Browser-Specific**: Governed by the local storage management engines of web browsers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Web developers can store data directly on a user's device using browser APIs like `localStorage`, `IndexedDB`, and the `Cache API`. However, local disk space is finite. To prevent malicious websites from filling up the user's hard drive, browsers enforce **Storage Limits & Eviction Policies**:

#### 1. Storage Limits (Quotas)
- **`localStorage` & `sessionStorage`:** Enforce a strict, small limit of roughly **5MB per origin**. Exceeding this limit throws a `QuotaExceededError` exception, blocking further writes.
- **IndexedDB & Cache API:** Use a shared, dynamic pool. Modern browsers allow an origin to store up to **20% to 50% of the user's free disk space**. If a laptop has 100GB of free space, a single origin can cache up to 20GB of data in IndexedDB/Cache.

#### 2. Storage Eviction (Purging)
When a user's device runs low on storage space, the browser triggers **Storage Eviction** to free up room:
- **Best-Effort (Temporary) Storage:** By default, all web storage is temporary. The browser will automatically delete all data (IndexedDB, Cache API, Web Storage) of the **Least Recently Used (LRU)** origins to free up space.
- **Persistent Storage:** An application can request persistent storage using the Storage Manager API. If granted, the browser guarantees it will not evict that origin's data during low-disk cleanups.

---

### (2) Reality Metaphor
Imagine storing items in your home.
- **`localStorage`** is like a **small desk drawer**. It can hold exactly 5 folders (**5MB**). If you try to push folder #6 in, it gets jammed and throws a warning (**`QuotaExceededError`**). You must throw something out to make room.
- **IndexedDB & Cache API** are like a **large basement storage room**. You can stack boxes there, using a significant percentage of the house's capacity.
- **Eviction** is like a **self-cleaning service**. If the house becomes cluttered, a cleaner walks into the basement and throws out the oldest, dustiest boxes belonging to rooms you haven't visited in months (**LRU eviction**).
- **Persistent Storage** is placing a **"Do Not Discard" label** on your basement boxes. The cleaner will ignore those boxes during cleanups.

---

### (3) JavaScript Storage Manager API Example

You can query the available space and request persistence using `navigator.storage`:

```javascript
async function manageLocalStorage() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      // 1. Query current storage usage and quota limits
      const estimate = await navigator.storage.estimate();
      const usageMb = (estimate.usage / (1024 * 1024)).toFixed(2);
      const quotaMb = (estimate.quota / (1024 * 1024)).toFixed(2);
      
      console.log(`Storage Used: ${usageMb} MB / ${quotaMb} MB`);
    } catch (err) {
      console.error("Failed to fetch storage estimate:", err);
    }
  }

  if (navigator.storage && navigator.storage.persist) {
    // 2. Request persistent storage status
    const isPersisted = await navigator.storage.persisted();
    
    if (!isPersisted) {
      console.log("Requesting storage persistence...");
      const granted = await navigator.storage.persist();
      if (granted) {
        console.log("Persistent storage GRANTED. Data will not be auto-evicted.");
      } else {
        console.warn("Persistent storage DENIED. Data may be evicted under low disk space.");
      }
    } else {
      console.log("Storage is already persisted.");
    }
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating local browser storage as a permanent database

**The mistake:** Storing user-generated data (like drafts or offline game saves) in `localStorage` or `IndexedDB` and assuming it will remain on the device forever.

**Why it's wrong:** Browser storage is temporary by default. If the user clears their browser history, or if the device runs out of disk space, the browser will automatically purge this data.

*Fix:* Treat client-side storage as a cache or offline draft store. Always synchronize critical user data with a secure backend database (the source of truth) whenever a connection is available.

---

### Mistake 2: Assuming Web Storage Quotas Are Infinite Across Mobile Browsers

**The mistake:** Attempting to store 50MB of images inside browser `localStorage`.

**Why it's wrong:** `localStorage` has a hard 5MB origin limit. Exceeding quota throws a `QuotaExceededError` DOMException.

*Incorrect:*
```javascript
localStorage.setItem('largeFile', fiftyMegabyteString); // ❌ Throws QuotaExceededError!
```

*Fix:*
```javascript
// Use IndexedDB or Cache API for multi-megabyte storage
await idb.put('files', { id: 1, blob: fileBlob });
```

---

### Mistake 3: Failing to Check Storage Quota via `navigator.storage.estimate()` Before Large Writes

**The mistake:** Downloading 500MB offline assets without estimating available origin disk quota.

**Why it's wrong:** Mobile Safari / Chrome evict temporary origin storage when device disk space runs low unless persistent storage is granted.

*Incorrect:*
```http
/* Downloading large offline bundles without checking storage quota */
```

*Fix:*
```javascript
const { quota, usage } = await navigator.storage.estimate();
const remainingMB = (quota - usage) / (1024 * 1024);
console.log(`Available quota: ${remainingMB} MB`);
```


---

## 6. Practice Exercises

### Exercise 1: Quota Trap

**Problem:** You are building a logging utility that appends lines to `localStorage`. After running fine for days, the script suddenly throws:
`DOMException: Failed to execute 'setItem' on 'Storage': Setting the value of 'logs' exceeded the quota.`
Explain why this happened and how to handle it.

> [!check]- Answer
> - The log size crossed the `5MB` storage limit, triggering a `QuotaExceededError`. The write was blocked. To handle this, implement a cleanup rotation (e.g. keeping only the latest 100 logs), catch the exception, and prune old entries when the quota is exceeded.


---

### Exercise 2: Browser Storage Capacity Matrix

**Problem:** Estimate standard maximum storage capacity limits for:
1. Cookies
2. LocalStorage / SessionStorage
3. IndexedDB

**Expected output:**
> [!check]- Answer
> ```text
> 1. Cookies: 4 KB per cookie
> 2. LocalStorage: ~5 MB per origin
> 3. IndexedDB: Hundreds of MBs up to 60%+ of available disk space
> ```
> ```text
> Cookies                  -> ~4 KB
> LocalStorage/Session     -> ~5 MB
> IndexedDB / Cache API    -> Hundreds of MBs / GBs (Percentage of free disk)
> ```
> - **Explanation:** Storage mechanisms vary drastically in capacity limits.
---

### Exercise 3: Persistent Storage Request

**Problem:** Which Web API method requests browser permission to prevent automatic storage eviction under disk pressure?

**Expected output:**
> [!check]- Answer
> ```text
> navigator.storage.persist()
> ```
> ```javascript
> if (navigator.storage && navigator.storage.persist) {
> const isPersisted = await navigator.storage.persist();
> console.log(`Persistent storage granted: ${isPersisted}`);
> }
> ```
> - **Explanation:** `navigator.storage.persist()` requests immune status from eviction.
---

## 7. Related Terms
- [IndexedDB](indexeddb.md) — The browser-native transactional database.
- [Cache API](cache_api.md) — The network response storage API.

---

## 8. Key Takeaways
- Browsers enforce storage quotas and eviction policies to prevent disk space exhaustion.
- `localStorage` and `sessionStorage` have a strict, non-negotiable limit of 5MB per origin.
- IndexedDB and the Cache API share a dynamic pool of up to 50% of the device's free disk space.
- Browsers automatically evict temporary storage using an LRU (Least Recently Used) policy when disk space is low.
- Request persistent storage using `navigator.storage.persist()` to exempt data from auto-eviction.
- Never treat browser storage as a permanent database; synchronize data with a server.
