# Service Workers

> **Level 9 — Browser APIs (Storage & State)**
> A powerful JavaScript script that runs in the background of the browser, acting as a programmable network proxy capable of intercepting HTTP requests and serving them from the Cache.

---

## 1. Prerequisites
- [Cache API](../level_09/cache_api.md) — Service workers use this database to make offline apps possible.
- [Request & Response Lifecycle](../level_01/request_response.md) — Service workers literally hijack this lifecycle before it hits the internet.

---

## 2. Term Category
- **Browser API / Offline Architecture**

---

## 3. Environment Context
- **Client-Side (Browser Background)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Zombie Website

**Problem:** You deploy an update to your website. You change the background color from Blue to Red. A user visits the site, but the background is still Blue! You tell them to refresh. Still Blue! You tell them to clear their browser cache. *Still Blue!* What is causing this?

**Expected output:**
> [!check]- Answer
> ```text
> A rogue Service Worker!
> Even if the user clears the standard browser cache, the Service Worker might still be alive in the background, aggressively intercepting the request for `styles.css` and serving the old Blue version from its private Cache API vault. Service Workers have a complex "Lifecycle" and must be explicitly told to update and delete old caches.
> ```
> - Who is standing at the door, intercepting the request before the internet?

---

### Exercise 2: Service Worker 3-Stage Life Cycle

**Problem:** Identify the 3 sequential lifecycle stages of a Service Worker script.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Registration
> 2. Installation (install event)
> 3. Activation (activate event)
> ```
> ```text
> 1. Registration -> Browser registers sw.js script URL.
> 2. Installation -> self.addEventListener('install') fires (cache pre-fetching).
> 3. Activation   -> self.addEventListener('activate') fires (old cache cleanup).
> ```
> - **Explanation:** Service Worker lifecycle events manage installation and cache updates.
---

### Exercise 3: Service Worker Fetch Interception

**Problem:** Write Service Worker event listener intercepting outbound HTTP requests (`fetch` event).

**Expected output:**
> [!check]- Answer
> ```text
> self.addEventListener('fetch', (event) => { event.respondWith(caches.match(event.request)); });
> ```
> ```javascript
> self.addEventListener('fetch', (event) => {
> event.respondWith(
> caches.match(event.request).then(cached => cached || fetch(event.request))
> );
> });
> ```
> - **Explanation:** `event.respondWith()` intercepts network requests to serve cached assets.
---

## 7. Related Terms
- [Cache API](../level_09/cache_api.md) — The database the Service Worker uses to store the offline files.
- [IndexedDB](../level_09/indexeddb.md) — The database the Service Worker uses to store the offline JSON data.

---

## 8. Key Takeaways
- A **Service Worker** is a background script that acts as a middleman between your app and the internet.
- It can intercept `fetch()` requests and serve files from the Cache API, allowing the app to work entirely **Offline**.
- It is the engine behind Push Notifications and Background Syncing.
- It will ONLY run on secure **HTTPS** connections.
