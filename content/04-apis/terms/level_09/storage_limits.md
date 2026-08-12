# Storage Limits & Eviction

> **Level 9 — Browser APIs (Storage & State)**
> Quotas and when browsers purge cached/stored data.

---

## 1. Prerequisites
- [localStorage & sessionStorage](web_storage.md) — The lightweight key-value browser stores.
- [Cache API](cache_api.md) — The response caching mechanism.

---

## 2. Term Category

**Browser API / Networking (Browser-Specific: Governed by the local storage management engines of web browsers.)**: Storage Limits & Eviction is a fundamental concept in this technology stack. **Level 9 — Browser APIs (Storage & State)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Storage Quota & Usage Estimator

**Scenario:** An API storage manager uses `navigator.storage.estimate()` to inspect available quota and usage in bytes.

**Requirements:**
1. Write inspectStorageQuota(mockStorage).
2. Calculate usage and quota in MB.
3. Return percentage used.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function inspectStorageQuota(mockStorage) {
>   const storage = mockStorage || (globalThis.navigator ? globalThis.navigator.storage : null);
>
>   if (!storage || typeof storage.estimate !== "function") {
>     return { supported: false, usageMb: 0, quotaMb: 0, percentUsed: 0 };
>   }
>
>   const estimate = await storage.estimate();
>   const usageBytes = estimate.usage || 0;
>   const quotaBytes = estimate.quota || 1;
>
>   const usageMb = Number((usageBytes / (1024 * 1024)).toFixed(2));
>   const quotaMb = Number((quotaBytes / (1024 * 1024)).toFixed(2));
>   const percentUsed = Number(((usageBytes / quotaBytes) * 100).toFixed(2));
>
>   return {
>     supported: true,
>     usageMb,
>     quotaMb,
>     percentUsed
>   };
> }
>
> // Verification tests
> const mockStorage = {
>   estimate: async () => ({ usage: 50 * 1024 * 1024, quota: 500 * 1024 * 1024 })
> };
>
> inspectStorageQuota(mockStorage).then(res => {
>   console.assert(res.usageMb === 50, "Test 1 Failed: 50MB");
>   console.assert(res.quotaMb === 500, "Test 2 Failed: 500MB");
>   console.assert(res.percentUsed === 10, "Test 3 Failed: 10%");
> });
> ```
>
> #### Technical Explanation
>
> 1. **navigator.storage.estimate()**: Standard Web API returning usage and quota byte estimates for origin storage.
> 2. **Origin Storage Limits**: Browsers allocate dynamic origin quotas based on total free disk space (typically 10-20% of disk).
> 3. **Storage Overflow Risks**: Writing beyond quota throws QuotaExceededError exceptions.
> 
---

### Exercise 2: Persistent Storage Request Handler

**Scenario:** Requests persistent storage permission (`navigator.storage.persist()`) to prevent the browser from automatically evicting PWA data under low disk space.

**Requirements:**
1. Write requestPersistentStorage(mockStorage).
2. Check if already persisted.
3. Request persistence permission.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function requestPersistentStorage(mockStorage) {
>   const storage = mockStorage || (globalThis.navigator ? globalThis.navigator.storage : null);
>
>   if (!storage || typeof storage.persist !== "function") {
>     return { supported: false, isPersisted: false };
>   }
>
>   const alreadyPersisted = await storage.persisted();
>   if (alreadyPersisted) {
>     return { supported: true, isPersisted: true, newlyGranted: false };
>   }
>
>   const granted = await storage.persist();
>   return {
>     supported: true,
>     isPersisted: granted,
>     newlyGranted: granted
>   };
> }
>
> // Verification tests
> const mockStorage = {
>   persisted: async () => false,
>   persist: async () => true
> };
>
> requestPersistentStorage(mockStorage).then(res => {
>   console.assert(res.isPersisted === true && res.newlyGranted === true, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Best-Effort vs Persistent Storage**: By default, browser storage is Best-Effort and can be cleared during low disk space.
> 2. **navigator.storage.persist()**: Promotes origin storage to Persistent, preventing automatic browser eviction.
> 3. **User Prompt Criteria**: Browsers grant persistent storage based on PWA installability or explicit user interaction.
> 
---

### Exercise 3: Emergency Storage Eviction Guard

**Scenario:** An API storage guard detects when storage usage exceeds 90% quota, purging non-essential cached media to prevent QuotaExceededError.

**Requirements:**
1. Write auditAndEvictCache(mockStorage, purgeCacheFn).
2. If percentUsed > 90%, trigger purgeCacheFn.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function auditAndEvictCache(mockStorage, purgeCacheFn) {
>   const estimate = await mockStorage.estimate();
>   const percentUsed = (estimate.usage / estimate.quota) * 100;
>
>   if (percentUsed > 90) {
>     const bytesFreed = await purgeCacheFn();
>     return { evicted: true, bytesFreed, percentUsed };
>   }
>
>   return { evicted: false, bytesFreed: 0, percentUsed };
> }
>
> // Verification tests
> const mockStorage = { estimate: async () => ({ usage: 95, quota: 100 }) }; // 95% used
> let purged = false;
>
> auditAndEvictCache(mockStorage, async () => { purged = true; return 500; }).then(res => {
>   console.assert(res.evicted === true && purged === true, "Test 1 Failed: Must trigger emergency purge");
> });
> ```
>
> #### Technical Explanation
>
> 1. **QuotaExceededError DOMException**: Thrown when localStorage, IndexedDB, or Cache API exceeds allotted byte quota.
> 2. **Proactive Storage Guard**: Auditing usage before large downloads prevents abrupt runtime storage failures.
> 3. **LRU Eviction Strategy**: Emergency purges should delete oldest media assets while preserving user database state.
---

## 6. Related Terms
- [IndexedDB](indexeddb.md) — The browser-native transactional database.
- [Cache API](cache_api.md) — The network response storage API.

---

## 7. Key Takeaways
- Browsers enforce storage quotas and eviction policies to prevent disk space exhaustion.
- `localStorage` and `sessionStorage` have a strict, non-negotiable limit of 5MB per origin.
- IndexedDB and the Cache API share a dynamic pool of up to 50% of the device's free disk space.
- Browsers automatically evict temporary storage using an LRU (Least Recently Used) policy when disk space is low.
- Request persistent storage using `navigator.storage.persist()` to exempt data from auto-eviction.
- Never treat browser storage as a permanent database; synchronize data with a server.
