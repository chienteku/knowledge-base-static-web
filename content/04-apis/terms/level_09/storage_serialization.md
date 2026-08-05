# Storage Serialization

> **Level 9 — Browser APIs (Storage & State)**
> Why Web Storage only holds strings (`JSON.stringify` round-trip).

---

## 1. Prerequisites
- [localStorage & sessionStorage](web_storage.md) — The browser storage engines.
- [Serialization & Deserialization](../level_07/serialization.md) — The data-flattening concepts.
---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Browser-Specific**: Governs the client-side interaction with browser-native Web Storage contexts.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
The browser Web Storage APIs (`localStorage` and `sessionStorage`) provide a simple key-value database. However, they were designed with a strict limitation: **both keys and values must be stored as strings**.

If a developer attempts to pass a non-string data structure (like an object, array, or boolean) directly into Web Storage, the browser automatically forces a string conversion on the payload, leading to bugs:

*   **Object Corruption:** Saving an object directly (e.g. `localStorage.setItem('user', { name: 'Bob' })`) causes the browser to call `.toString()`, saving the literal string `"[object Object]"` in memory. The actual user properties are lost forever.
*   **Boolean Truthy Trap:** Saving a boolean directly (e.g. `localStorage.setItem('active', false)`) saves the literal string `"false"`. When retrieved later, JavaScript evaluates any non-empty string as a truthy value:
    ```javascript
    const active = localStorage.getItem('active'); // Returns string "false"
    if (active) {
      // THIS CODE RUNS! Because the string "false" is truthy in JavaScript!
    }
    ```

To store complex data structures safely, developers implement **Storage Serialization**: converting objects to JSON strings before writing, and parsing them back into live structures upon retrieval.

---

### (2) Reality Metaphor
Imagine a narrow **cardboard archive tube** (**the storage**) meant only to hold rolled-up blueprint drawings (**strings**).
- **Naive Storage** is like trying to stuff a **fully assembled wooden chair** (**an object**) into the tube. The chair breaks and is crushed, leaving you with useless wood splinters (**the string `"[object Object]"`**).
- **Storage Serialization** is like dismantling the chair into flat parts and write-down layout rules (**`JSON.stringify`**), rolling up the instructions, and sliding the papers into the tube. When you need the chair, you pull out the sheets and rebuild it (**`JSON.parse`**).

---

### (3) JavaScript Implementation Helpers

Using safe wrapper helper functions avoids repetitive manual serialization:

```javascript
// 1. Safe Setter Helper
function setStorageItem(key, value) {
  try {
    // Convert any value (array, object, boolean) into a JSON string
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error("Storage Write Failed:", error);
  }
}

// 2. Safe Getter Helper
function getStorageItem(key, defaultValue = null) {
  const value = localStorage.getItem(key);
  
  if (value === null) {
    return defaultValue; // Return fallback if key doesn't exist
  }

  try {
    // Parse the JSON string back into a live JS object/type
    return JSON.parse(value);
  } catch (error) {
    // Fallback: If it's a plain string that isn't JSON, return the raw value
    return value; 
  }
}

// Usage:
setStorageItem('user_profile', { id: 101, username: 'Alice' });
setStorageItem('is_subscribed', false);

const profile = getStorageItem('user_profile'); // Returns live object
const isSubscribed = getStorageItem('is_subscribed'); // Returns literal boolean false

if (isSubscribed) {
  // This block will NOT run now, as the value is a boolean false!
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting Date objects to parse back into Date instances automatically

**The mistake:** Serializing a user session object containing a date and expecting the date methods to work after parsing:
```javascript
const session = { loggedInAt: new Date() };
localStorage.setItem('session', JSON.stringify(session));

// Later:
const restored = JSON.parse(localStorage.getItem('session'));
restored.loggedInAt.toISOString(); // CRASH! "toISOString is not a function"
```

**Why it's wrong:** JSON does not support a native Date data type. During `JSON.stringify()`, Date objects are serialized into standard ISO string representations (e.g. `"2026-07-17T12:00:00.000Z"`). Upon `JSON.parse()`, the value remains a plain text string.

*Fix:* Manually instantiate a new Date object from the parsed string:
```javascript
restored.loggedInAt = new Date(restored.loggedInAt);
```

---

### Mistake 2: Attempting to Pass Complex JS Objects Directly to `localStorage.setItem()`

**The mistake:** Writing `localStorage.setItem('user', { id: 1, name: 'Alice' })`.

**Why it's wrong:** `localStorage` stores strings exclusively. Passing an object implicitly calls `.toString()`, storing the useless literal string `"[object Object]"`.

*Incorrect:*
```javascript
localStorage.setItem('user', { id: 1 }); // ❌ Stores "[object Object]" string!
```

*Fix:*
```javascript
localStorage.setItem('user', JSON.stringify({ id: 1 })); // Serialize to JSON string first
```

---

### Mistake 3: Forgetting `try / catch` Around `JSON.parse()` When Reading Web Storage

**The mistake:** Writing `const user = JSON.parse(localStorage.getItem('user'))` without error checking.

**Why it's wrong:** If `localStorage` data is corrupted, empty, or un-parseable, `JSON.parse()` throws a SyntaxError, crashing page execution.

*Incorrect:*
```javascript
const user = JSON.parse(localStorage.getItem('user')); // ❌ Throws SyntaxError on invalid JSON!
```

*Fix:*
```javascript
let user = null;
try {
  const raw = localStorage.getItem('user');
  user = raw ? JSON.parse(raw) : null;
} catch (err) {
  console.error('Failed to parse stored user JSON:', err);
}
```


---

## 6. Practice Exercises

### Exercise 1: Storage Debugger

**Problem:** Complete the code to safely retrieve a shopping cart array from `localStorage` under the key `'cart'`. If the cart key does not exist, return an empty array `[]` as a default fallback:

```javascript
function getCart() {
  const rawCart = localStorage.getItem('cart');
  if (!rawCart) {
    return [];
  }
  try {
    return JSON.parse(rawCart);
  } catch (err) {
    return [];
  }
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Safe LocalStorage Wrapper Helper

**Problem:** Write `getStorageItem(key, defaultValue)` helper reading and deserializing JSON from `localStorage` safely.

**Expected output:**
> [!check]- Answer
> ```text
> function getStorageItem(key, defaultValue) { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; } catch (e) { return defaultValue; } }
> ```
> ```javascript
> function getStorageItem(key, defaultValue) {
> try {
> const item = localStorage.getItem(key);
> return item ? JSON.parse(item) : defaultValue;
> } catch (err) {
> return defaultValue;
> }
> }
> ```
> - **Explanation:** Safe storage wrappers handle missing keys and JSON parsing exceptions.
---

### Exercise 3: Structured Clone Algorithm in IndexedDB

**Problem:** Why can IndexedDB store native `Date` objects and `ArrayBuffer` instances without calling `JSON.stringify()`?

**Expected output:**
> [!check]- Answer
> ```text
> IndexedDB uses the browser HTML Structured Clone Algorithm internally, which natively supports serializing complex types like Date, RegExp, Blob, and ArrayBuffer.
> ```
> ```text
> IndexedDB uses the browser HTML Structured Clone Algorithm internally, which natively supports serializing complex types like Date, RegExp, Blob, and ArrayBuffer.
> ```
> - **Explanation:** The Structured Clone Algorithm handles rich JS object serialization natively.
---

## 7. Related Terms
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — The core utilities executing JavaScript storage serialization.
- [Cookies](cookies.md) — The header-based storage strings that also require custom parsing mechanisms.
---

## 8. Key Takeaways
- Browser Web Storage (`localStorage` / `sessionStorage`) only stores keys and values as strings.
- Passing non-string objects directly leads to value corruption or truthy evaluation bugs.
- Serialize data using `JSON.stringify` before storing, and decode it using `JSON.parse` on retrieval.
- Date objects are converted to strings during serialization and must be manually re-instantiated.
- Wrap deserialization calls in `try/catch` to handle corrupted storage values safely.
