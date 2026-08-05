# localStorage & sessionStorage

> **Level 9 — Browser APIs (Storage & State)**
> The simplest key-value databases built directly into the web browser, allowing developers to save strings of text locally on the user's computer.

---

## 1. Prerequisites
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — Web Storage only stores strings, so you must use these methods to save Objects.
---

## 2. Term Category
- **Browser API / Client-Side Storage**

---

## 3. Environment Context
- **Client-Side (Browser Only)** (Does not exist in Node.js!).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before 2014, if you wanted to save a user's "Dark Mode" preference so it would survive a page refresh, you only had one tool: [Cookies](../level_09/cookies.md). But Cookies are messy, tiny, and sent to the server on every request.
HTML5 introduced the **Web Storage API**. It gives developers a dedicated 5 Megabyte database inside the browser to save data. It is completely private to the user's browser and is never automatically sent to the server.

### (2) `localStorage` (The Permanent Vault)
Data saved in `localStorage` never expires. If the user closes the browser, turns off their computer, and comes back 5 years later, the data will still be there (unless they explicitly clear their browser history).
**Use cases:** 
- Saving UI themes (Light/Dark mode).
- Saving a Shopping Cart for guest users.
- Caching API data so the app loads instantly next time.

### (3) `sessionStorage` (The Temporary Vault)
Data saved in `sessionStorage` is strictly tied to the specific browser *Tab*. If the user duplicates the tab, or closes the tab, the data is instantly deleted. 
**Use cases:**
- Saving the scroll position of a page.
- Temporarily holding data for a multi-step form (e.g., a 3-page checkout process) before final submission.

### (4) The API Syntax
The API is identical for both, using a simple Key-Value pair system.
```javascript
// 1. Saving Data
localStorage.setItem('theme', 'dark');

// 2. Reading Data
const myTheme = localStorage.getItem('theme'); // Returns "dark"

// 3. Deleting Data
localStorage.removeItem('theme');

// 4. Deleting EVERYTHING for this domain
localStorage.clear(); 
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to save Arrays or Objects

**The mistake:** 
```javascript
const user = { name: "Bob", age: 25 };
localStorage.setItem('userProfile', user);

const saved = localStorage.getItem('userProfile');
console.log(saved.name); // undefined!
```

**Why it's wrong:** Web Storage is incredibly dumb. It **only accepts Strings**. If you try to pass it an Object, it forcefully calls `.toString()`, converting it to `"[object Object]"`. 
**Golden Rule:** You MUST `JSON.stringify()` your objects before saving them, and `JSON.parse()` them after reading them!

---

### Mistake 2: Confusing `localStorage` (Persistent) with `sessionStorage` (Tab Session Lifespan)

**The mistake:** Storing multi-tab shopping cart items inside `sessionStorage`.

**Why it's wrong:** `sessionStorage` data is isolated to a single browser tab session and deleted when the tab closes. Opening a new tab creates a fresh empty `sessionStorage` bucket.

*Incorrect:*
```http
/* Storing cart items in sessionStorage expecting persistence across browser tabs */
```

*Fix:*
```http
/* Use localStorage for multi-tab persistent state; use sessionStorage for single-tab state */
```

---

### Mistake 3: Executing Synchronous `localStorage` Access inside Performance-Critical Animation Loops

**The mistake:** Reading `localStorage.getItem()` inside a 60fps `requestAnimationFrame` render loop.

**Why it's wrong:** `localStorage` operations execute synchronously on the browser main thread. Synchronous disk reads during rendering cause frame drops (jank).

*Incorrect:*
```javascript
function render() {
  const theme = localStorage.getItem('theme'); // ❌ Synchronous disk read in 60fps loop!
  requestAnimationFrame(render);
}
```

*Fix:*
```javascript
// Read storage once into JS variable memory during initialization:
const theme = localStorage.getItem('theme');
function render() { useTheme(theme); requestAnimationFrame(render); }
```


---

## 6. Practice Exercises

### Exercise 1: Finding the Data

**Problem:** You wrote `localStorage.setItem('highScore', '99')`. Where can you physically see this data without writing any `console.log` code?

**Expected output:**
> [!check]- Answer
> ```text
> In Chrome DevTools!
> Open DevTools (F12) -> Click the "Application" tab -> Look under the "Storage" sidebar. You will see a beautiful table displaying all the keys and values currently saved in localStorage for that specific website. You can even manually edit or delete them there!
> ```
> - Is there a specific tab in Chrome DevTools designed for this?

---

### Exercise 2: LocalStorage vs SessionStorage Lifespan Matrix

**Problem:** Compare `localStorage` vs `sessionStorage` across:
1. Expiration lifespan
2. Tab isolation scope

**Expected output:**
> [!check]- Answer
> ```text
> 1. localStorage persists permanently until cleared; sessionStorage expires when browser tab closes
> 2. localStorage shared across all same-origin tabs; sessionStorage isolated to single tab
> ```
> ```text
> 1. Lifespan -> LocalStorage: Permanent until explicitly deleted.
> SessionStorage: Deleted when tab closes.
> 2. Scope    -> LocalStorage: Shared across all same-origin tabs.
> SessionStorage: Isolated per individual tab.
> ```
> - **Explanation:** `sessionStorage` restricts data scope to a single active browser tab.
---

### Exercise 3: Storage Event Listener

**Problem:** Which DOM event allows a browser tab to listen for changes made to `localStorage` in ANOTHER same-origin browser tab?

**Expected output:**
> [!check]- Answer
> ```text
> window.addEventListener('storage', (event) => { console.log(event.key, event.newValue); });
> ```
> ```javascript
> window.addEventListener('storage', (event) => {
> console.log(`Key ${event.key} changed to ${event.newValue}`);
> });
> ```
> - **Explanation:** The `storage` event fires across same-origin tabs when `localStorage` updates.
---

## 7. Related Terms
- [Cookies](cookies.md) — The older, server-facing alternative to localStorage.
- [IndexedDB](indexeddb.md) — A massive, complex alternative for storing Gigabytes of data, instead of localStorage's tiny 5MB limit.
- [Statelessness](../level_03/statelessness.md) — Related concept: Statelessness.
- [JWT (JSON Web Tokens)](../level_04/jwt.md) — Related concept: JWT (JSON Web Tokens).
- [Secrets & Environment Variables](../level_04/secrets_env.md) — Related concept: Secrets & Environment Variables.
- [XSS (Cross-Site Scripting)](../level_04/xss.md) — Related concept: XSS (Cross-Site Scripting).
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — Related concept: JSON Methods (parse / stringify).
- [Service Workers](service_workers.md) — Related concept: Service Workers.
---

## 8. Key Takeaways
- **`localStorage`** saves strings permanently in the browser.
- **`sessionStorage`** saves strings temporarily (deleted when the tab closes).
- Neither are sent to the server automatically.
- Both have a strict ~5MB limit.
- You MUST `JSON.stringify()` objects to save them, because Web Storage only accepts strings.
