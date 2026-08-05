# Cache API

> **Level 9 — Browser APIs (Storage & State)**
> A specialized browser database designed exclusively to intercept, store, and retrieve massive HTTP `Response` objects (like images, CSS, and HTML files) for offline use.

---

## 1. Prerequisites
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — The exact object this API is designed to store.
- [Service Workers](service_workers.md) — The primary technology that controls the Cache API.
---

## 2. Term Category
- **Browser API / Offline Architecture**

---

## 3. Environment Context
- **Client-Side (Browser Only)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: IndexedDB vs Cache API

**Problem:** You are building an offline Spotify clone. 
1. Where should you store the list of the user's favorite song titles (JSON)?
2. Where should you store the actual `.mp3` audio files and the `.css` file for the dark theme?

**Expected output:**
> [!check]- Answer
> ```text
> 1. IndexedDB. It is perfect for structured JSON data and querying lists.
> 2. Cache API. It is perfectly optimized for storing large, raw HTTP File responses (like MP3s, Images, and CSS).
> ```
> - Which one stores Data? Which one stores Files?

---

### Exercise 2: Cache API Match & Add Pattern

**Problem:** Write JS snippet opening cache `v1` and matching requested URL `/api/data`.

**Expected output:**
> [!check]- Answer
> ```text
> const cache = await caches.open('v1'); const res = await cache.match('/api/data');
> ```
> ```javascript
> const cache = await caches.open('v1');
> const response = await cache.match('/api/data');
> if (response) {
> const data = await response.json();
> }
> ```
> - **Explanation:** `caches.open()` and `cache.match()` provide programmatic HTTP caching.
---

### Exercise 3: Cache Storage Scope

**Problem:** Is Cache API accessible from both main browser window JavaScript AND Service Worker scripts? (Yes/No).

**Expected output:**
> [!check]- Answer
> ```text
> Yes. Cache API is available in window, web workers, and service workers.
> ```
> ```text
> Yes. Cache API is exposed globally in window and worker contexts.
> ```
> - **Explanation:** `caches` is available across main threads and worker scopes.
---

## 7. Related Terms
- [Service Workers](service_workers.md) — The scripts that actively use the Cache API to intercept network requests.
- [IndexedDB](indexeddb.md) — The complementary database used for JSON, while the Cache API handles Files.
- [Storage Limits & Eviction](storage_limits.md) — Related concept: Storage Limits & Eviction.
---

## 8. Key Takeaways
- The **Cache API** is a browser database used to store raw HTTP `Response` objects (HTML, CSS, JS, Images).
- It allows websites to load instantly and function completely offline.
- Unlike automatic HTTP caching, the Cache API is manually controlled via JavaScript.
- You must carefully manage and delete old caches when you deploy new versions of your app!
