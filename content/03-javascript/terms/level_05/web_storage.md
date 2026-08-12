# Web Storage (localStorage / sessionStorage)

> **Level 5 — DOM & Browser Environment**
> Persist key/value string data in the browser.

---

## 1. Prerequisites
- [window object / BOM](window_bom.md) — The browser global context hosting storage APIs.
- [JSON / JSON.stringify / JSON.parse](../level_07/json.md) — Text format used for data exchange and serialization.

---

## 2. Term Category

**Browser API / DOM (Browser-only: Only exists in web browsers.)**: Web Storage (localStorage / sessionStorage) is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
HTTP is a stateless protocol, and standard JavaScript variables are cleared from memory whenever a user refreshes their browser. To build smooth user experiences, web applications need a way to save data across page reloads (such as keeping a user's theme selection, shopping cart items, or form drafts). 

To solve this, browser vendors created the **Web Storage API**:
- **`window.localStorage`:** Stores data persistently. The data has no expiration date; it remains saved in the browser even if the computer is turned off or the browser is closed.
- **`window.sessionStorage`:** Stores data temporarily for a single browser tab session. As soon as the user closes that specific tab, the data is deleted.

Both APIs are origin-restricted (meaning a script running on `google.com` cannot read storage saved by `facebook.com`).

### (2) Critical Rule: Strings Only!
Web storage can **only** store keys and values as raw **Strings**. If you attempt to save an object or array directly, JavaScript will coerce it to a string representation, yielding useless values like `"[object Object]"` or `"1,2,3"`. To store structured objects or arrays, you must serialize them to a JSON string using `JSON.stringify()` before saving, and parse them back using `JSON.parse()` when reading.

### (3) Reality Metaphor
- **`localStorage`** is like a locker at a gym. You put your bag inside and lock it. It stays there overnight, through weekends, and is waiting for you when you return, until you manually empty it (`removeItem`).
- **`sessionStorage`** is like a coat check at a theater. You check your coat (data) when you arrive. As long as you stay in the theater (tab open), you can retrieve it. But once you exit the building (close the tab), your ticket is voided and the coat is gone.
- **Strings Only Constraint:** The locker has a slot shape that only accepts flat letters (strings). If you want to store a package (object), you must flatten it into a folded letter (JSON string) to fit it through the slot.

### (4) JavaScript Code Examples

#### Short Snippet
```javascript
// Saving a basic string preference to localStorage
localStorage.setItem("userTheme", "dark");

// Retrieving the preference
const activeTheme = localStorage.getItem("userTheme");
console.log(activeTheme); // "dark"
```

#### Fuller Example
```javascript
// Storing and retrieving a complex user profile object
const userProfile = {
  username: "BrendanEich",
  points: 150,
  roles: ["admin", "editor"]
};

function saveUserSession(profile) {
  if (typeof localStorage === "undefined") return;

  // 1. Serialize object to JSON string
  const serializedData = JSON.stringify(profile);
  
  // 2. Save string to localStorage
  localStorage.setItem("active_user", serializedData);
  console.log("Profile saved to storage.");
}

function loadUserSession() {
  if (typeof localStorage === "undefined") return null;

  // 3. Retrieve raw string from localStorage (returns null if key doesn't exist)
  const rawData = localStorage.getItem("active_user");
  
  if (!rawData) {
    console.log("No user session found.");
    return null;
  }

  // 4. Parse string back into a working JavaScript object
  const profile = JSON.parse(rawData);
  return profile;
}

saveUserSession(userProfile);
const loadedProfile = loadUserSession();
console.log("Loaded Profile Username:", loadedProfile.username); // "BrendanEich"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing Objects directly without JSON serialization

**The mistake:** Passing a raw object or array directly into `localStorage.setItem()`.

**Why it's wrong:** The API automatically runs `.toString()` coercion on the value. For objects, this converts the data into the generic string `"[object Object]"`, permanently destroying your data structure.

*Incorrect:*
```javascript
const config = { volume: 80 };
localStorage.setItem("settings", config); // Saves: "settings" -> "[object Object]"

const loaded = localStorage.getItem("settings");
console.log(loaded.volume); // undefined (cannot read property of string "[object Object]")
```

*Fix:*
```javascript
const config = { volume: 80 };
localStorage.setItem("settings", JSON.stringify(config)); // Correct

const loaded = JSON.parse(localStorage.getItem("settings"));
console.log(loaded.volume); // 80
```

### Mistake 2: Losing Context Binding (`this`) in Web Storage Callbacks

**The mistake:** Passing methods from Web Storage instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "web_storage",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "web_storage",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Web Storage Operations

**The mistake:** Executing asynchronous operations within Web Storage without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/web_storage"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/web_storage");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in web_storage: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Persistent User Theme Preference Manager

**Scenario:** A web application saves and retrieves user theme preferences in localStorage with JSON serialization safeguards.

**Requirements:**
1. Write saveThemePreference(themeObj).
2. Write loadThemePreference(defaultTheme).
3. Use localStorage.setItem() and localStorage.getItem().
4. Return active theme.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function saveThemePreference(themeObj) {
>   if (!globalThis.localStorage) return false;
>   localStorage.setItem("user_theme", JSON.stringify(themeObj));
>   return true;
> }
>
> function loadThemePreference(defaultTheme) {
>   if (!globalThis.localStorage) return defaultTheme;
>   const raw = localStorage.getItem("user_theme");
>   if (!raw) return defaultTheme;
>   try {
>     return JSON.parse(raw);
>   } catch (err) {
>     return defaultTheme;
>   }
> }
>
> // Verification tests
> const storageMap = {};
> globalThis.localStorage = {
>   setItem(k, v) { storageMap[k] = String(v); },
>   getItem(k) { return storageMap[k] || null; }
> };
>
> saveThemePreference({ mode: "dark" });
> const loaded = loadThemePreference({ mode: "light" });
> console.assert(loaded.mode === "dark", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **localStorage Persistence**: localStorage persists string data across browser sessions with no expiration time.
> 2. **String Storage Limit**: Web Storage stores string keys and string values; complex objects require JSON.stringify() and JSON.parse().
> 3. **Synchronous Storage API**: Web Storage operations are synchronous and block the main thread.
> 
---

### Exercise 2: Web Storage Advanced Context Handler

**Scenario:** A web application component processes web storage data operations within enterprise workflows.

**Requirements:**
1. Write handleWebStorageSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleWebStorageSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleWebStorageSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Web Storage Architecture**: Applying web storage patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Web Storage Performance Optimization

**Scenario:** An application utility optimizes web storage execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeWebStorageTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeWebStorageTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeWebStorageTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Web Storage Optimization**: Optimizing web storage improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [JSON / JSON.stringify / JSON.parse](../level_07/json.md) — The JavaScript Object Notation parser used for encoding/decoding objects to strings.
- [window object / BOM](window_bom.md) — Related concept: window object / BOM.

---

## 7. Key Takeaways
- `localStorage` stores key-value pairs persistently with no expiration time.
- `sessionStorage` stores data temporarily; it is cleared as soon as the browser tab is closed.
- Both storage engines can **only** store strings.
- Always use `JSON.stringify(obj)` when saving objects/arrays, and `JSON.parse(str)` when reading them.
- Do not store sensitive info (passwords, tokens) in web storage as it is vulnerable to XSS extraction.
