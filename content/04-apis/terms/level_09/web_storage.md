# localStorage & sessionStorage

> **Level 9 — Browser APIs (Storage & State)**
> The simplest key-value databases built directly into the web browser, allowing developers to save strings of text locally on the user's computer.

---

## 1. Prerequisites
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — Web Storage only stores strings, so you must use these methods to save Objects.

---

## 2. Term Category

**Browser API / Client-Side Storage (Client-Side  .)**: localStorage & sessionStorage is a fundamental concept in this technology stack. **Level 9 — Browser APIs (Storage & State)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Type-Safe LocalStorage & SessionStorage Manager

**Scenario:** A lightweight wrapper around `localStorage` / `sessionStorage` providing type-safe getters, setters, and TTL expiration support.

**Requirements:**
1. Write createTypedStorage(storageBackend).
2. Implement set(key, val, ttlMs).
3. Implement get(key).
4. Check TTL expiration.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createTypedStorage(storageBackend = globalThis.localStorage) {
>   return {
>     set(key, value, ttlMs) {
>       const item = {
>         value,
>         expiry: ttlMs ? Date.now() + ttlMs : null
>       };
>       storageBackend.setItem(key, JSON.stringify(item));
>     },
>     get(key) {
>       const raw = storageBackend.getItem(key);
>       if (!raw) return null;
>
>       try {
>         const item = JSON.parse(raw);
>         if (item.expiry && Date.now() > item.expiry) {
>           storageBackend.removeItem(key);
>           return null; // Expired!
>         }
>         return item.value;
>       } catch (e) {
>         return null;
>       }
>     },
>     remove(key) {
>       storageBackend.removeItem(key);
>     }
>   };
> }
>
> // Verification tests
> const mockStore = new Map();
> const mockBackend = {
>   setItem: (k, v) => mockStore.set(k, v),
>   getItem: (k) => mockStore.get(k) || null,
>   removeItem: (k) => mockStore.delete(k)
> };
>
> const storage = createTypedStorage(mockBackend);
> storage.set("token", "secret123", 100);
>
> console.assert(storage.get("token") === "secret123", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **LocalStorage Scope**: Synchronous key-value storage per origin, persisting indefinitely until explicitly cleared.
> 2. **SessionStorage Scope**: Synchronous key-value storage per origin tab; cleared when the browser tab closes.
> 3. **TTL Expiration Pattern**: Attaching expiration timestamps allows implementing cache eviction in Web Storage.
> 
---

### Exercise 2: Multi-Tab Synchronization via Storage Event Listener

**Scenario:** A frontend application listens to the `window.addEventListener('storage')` event to synchronize user authentication state across browser tabs.

**Requirements:**
1. Write listenToStorageSync(onSyncCallback, mockWindow).
2. Listen for 'storage' events.
3. Trigger callback on key change.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function listenToStorageSync(onSyncCallback, mockWindow) {
>   const win = mockWindow || globalThis;
>
>   const handleStorageEvent = (event) => {
>     // Note: storage event does NOT fire on the tab that initiated the change!
>     if (event.key) {
>       let oldValue = event.oldValue;
>       let newValue = event.newValue;
>       try { oldValue = JSON.parse(oldValue); } catch (e) {}
>       try { newValue = JSON.parse(newValue); } catch (e) {}
>
>       onSyncCallback({
>         key: event.key,
>         oldValue,
>         newValue,
>         url: event.url
>       });
>     }
>   };
>
>   if (win.addEventListener) {
>     win.addEventListener("storage", handleStorageEvent);
>   }
>
>   return () => {
>     if (win.removeEventListener) {
>       win.removeEventListener("storage", handleStorageEvent);
>     }
>   };
> }
>
> // Verification tests
> const events = [];
> const mockWin = {
>   listeners: {},
>   addEventListener(evt, fn) { this.listeners[evt] = fn; },
>   removeEventListener(evt) { delete this.listeners[evt]; }
> };
>
> listenToStorageSync((data) => events.push(data), mockWin);
>
> mockWin.listeners["storage"]({ key: "auth_token", oldValue: "old", newValue: "new", url: "http://app.com" });
> console.assert(events.length === 1 && events[0].key === "auth_token", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Storage Event Mechanics**: Fires on OTHER same-origin tabs when localStorage is updated or cleared.
> 2. **Multi-Tab Auth Sync**: Logs out all open tabs immediately when a user logs out in any single tab.
> 3. **No Same-Tab Notification**: The storage event is intentionally NOT dispatched to the window that initiated the mutation.
> 
---

### Exercise 3: SessionStorage Form Draft Saver & Restorer

**Scenario:** An un-saved form draft helper saves input text to `sessionStorage` on keystrokes and restores draft text on page refresh.

**Requirements:**
1. Write createFormDraftSaver(formId, mockStorage).
2. Save draft on input.
3. Restore draft on load.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createFormDraftSaver(formId, mockStorage = globalThis.sessionStorage) {
>   const storageKey = `draft_${formId}`;
>
>   return {
>     saveDraft(formDataObj) {
>       mockStorage.setItem(storageKey, JSON.stringify(formDataObj));
>     },
>     restoreDraft() {
>       const raw = mockStorage.getItem(storageKey);
>       if (!raw) return null;
>       try {
>         return JSON.parse(raw);
>       } catch (e) {
>         return null;
>       }
>     },
>     clearDraft() {
>       mockStorage.removeItem(storageKey);
>     }
>   };
> }
>
> // Verification tests
> const mockStore = new Map();
> const mockSession = {
>   setItem: (k, v) => mockStore.set(k, v),
>   getItem: (k) => mockStore.get(k) || null,
>   removeItem: (k) => mockStore.delete(k)
> };
>
> const saver = createFormDraftSaver("checkout", mockSession);
> saver.saveDraft({ email: "user@test.com" });
>
> const draft = saver.restoreDraft();
> console.assert(draft.email === "user@test.com", "Test 1 Failed");
>
> saver.clearDraft();
> console.assert(saver.restoreDraft() === null, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **SessionStorage Lifecycle**: Ideal for temporary session data (form drafts, multi-step wizards) that should not outlive tab close.
> 2. **Preventing Data Loss**: Saves draft inputs on keystrokes so accidental page refreshes do not erase user input.
> 3. **Form Cleanup**: Clearing draft storage after successful form submission prevents restoring stale drafts.
---

## 6. Related Terms
- [Cookies](cookies.md) — The older, server-facing alternative to localStorage.
- [IndexedDB](indexeddb.md) — A massive, complex alternative for storing Gigabytes of data, instead of localStorage's tiny 5MB limit.
- [Statelessness](../level_03/statelessness.md) — Related concept: Statelessness.
- [JWT (JSON Web Tokens)](../level_04/jwt.md) — Related concept: JWT (JSON Web Tokens).
- [Secrets & Environment Variables](../level_04/secrets_env.md) — Related concept: Secrets & Environment Variables.
- [XSS (Cross-Site Scripting)](../level_04/xss.md) — Related concept: XSS (Cross-Site Scripting).
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — Related concept: JSON Methods (parse / stringify).
- [Service Workers](service_workers.md) — Related concept: Service Workers.

---

## 7. Key Takeaways
- **`localStorage`** saves strings permanently in the browser.
- **`sessionStorage`** saves strings temporarily (deleted when the tab closes).
- Neither are sent to the server automatically.
- Both have a strict ~5MB limit.
- You MUST `JSON.stringify()` objects to save them, because Web Storage only accepts strings.
