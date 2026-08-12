# Storage Serialization

> **Level 9 — Browser APIs (Storage & State)**
> Why Web Storage only holds strings (`JSON.stringify` round-trip).

---

## 1. Prerequisites
- [localStorage & sessionStorage](web_storage.md) — The browser storage engines.
- [Serialization & Deserialization](../level_07/serialization.md) — The data-flattening concepts.

---

## 2. Term Category

**Data Format (Browser-Specific: Governs the client-side interaction with browser-native Web Storage contexts.)**: Storage Serialization is a fundamental concept in this technology stack. **Level 9 — Browser APIs (Storage & State)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Structured Clone Algorithm vs JSON Serialization Benchmark

**Scenario:** Measures and compares deep copying complex object trees using `structuredClone()` vs `JSON.parse(JSON.stringify())`.

**Requirements:**
1. Write compareCloningMethods(targetObj).
2. Clone with structuredClone.
3. Clone with JSON.
4. Compare supported data types.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function compareCloningMethods(targetObj) {
>   const structuredCopy = structuredClone(targetObj);
>
>   let jsonCopy = null;
>   let jsonSupported = true;
>
>   try {
>     jsonCopy = JSON.parse(JSON.stringify(targetObj));
>   } catch (e) {
>     jsonSupported = false;
>   }
>
>   const preservesDate = targetObj.date instanceof Date && structuredCopy.date instanceof Date;
>   const preservesSet = targetObj.set instanceof Set && structuredCopy.set instanceof Set;
>
>   return {
>     structuredCopy,
>     jsonCopy,
>     jsonSupported,
>     preservesDate,
>     preservesSet
>   };
> }
>
> // Verification tests
> const complexObj = {
>   name: "Test",
>   date: new Date(),
>   set: new Set([1, 2])
> };
>
> const res = compareCloningMethods(complexObj);
> console.assert(res.preservesDate === true, "Test 1 Failed: structuredClone preserves Date instances");
> console.assert(res.preservesSet === true, "Test 2 Failed: structuredClone preserves Set instances");
> ```
>
> #### Technical Explanation
>
> 1. **structuredClone() Web API**: Modern native JS API for deep-cloning object graphs using the Structured Clone algorithm.
> 2. **Structured Clone Strengths**: Handles Map, Set, Date, ArrayBuffer, RegExp, and circular references losslessly.
> 3. **JSON Serialization Defects**: JSON.stringify converts Dates to strings, drops Sets/Maps, and crashes on circular references.
> 
---

### Exercise 2: Custom Web Storage Serialization Adapter

**Scenario:** An API storage wrapper serializes non-JSON data types (Dates, RegExps, BigInts) into string payloads for `localStorage`.

**Requirements:**
1. Write serializeForStorage(data).
2. Write deserializeFromStorage(str).
3. Ensure full roundtrip.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function serializeForStorage(data) {
>   return JSON.stringify(data, (key, value) => {
>     if (value instanceof Date) {
>       return { _type: "Date", val: value.toISOString() };
>     }
>     if (typeof value === "bigint") {
>       return { _type: "BigInt", val: value.toString() };
>     }
>     return value;
>   });
> }
>
> function deserializeFromStorage(storageStr) {
>   if (!storageStr) return null;
>   return JSON.parse(storageStr, (key, value) => {
>     if (value && typeof value === "object" && value._type) {
>       if (value._type === "Date") return new Date(value.val);
>       if (value._type === "BigInt") return BigInt(value.val);
>     }
>     return value;
>   });
> }
>
> // Verification tests
> const original = { created: new Date("2026-08-12T00:00:00Z"), amount: 100n };
> const serialized = serializeForStorage(original);
> const deserialized = deserializeFromStorage(serialized);
>
> console.assert(deserialized.created instanceof Date, "Test 1 Failed");
> console.assert(typeof deserialized.amount === "bigint", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Web Storage String Limitation**: localStorage and sessionStorage ONLY store DOMString text key-value pairs.
> 2. **Implicit String Conversion**: Passing non-strings to localStorage.setItem() implicitly invokes .toString() (e.g. [object Object]).
> 3. **Type Hydration Pattern**: Custom revivers preserve non-primitive types during storage serialization.
> 
---

### Exercise 3: Circular Reference Safe Web Storage Serializer

**Scenario:** Adapts storage serialization to safely handle objects with circular references without throwing JSON parse exceptions.

**Requirements:**
1. Write safeStorageSerialize(obj).
2. Use WeakSet to catch circular references.
3. Return clean JSON string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safeStorageSerialize(obj) {
>   const seen = new WeakSet();
>
>   return JSON.stringify(obj, (key, value) => {
>     if (typeof value === "object" && value !== null) {
>       if (seen.has(value)) {
>         return "[Circular]";
>       }
>       seen.add(value);
>     }
>     return value;
>   });
> }
>
> // Verification tests
> const node = { id: 1 };
> node.self = node; // Circular!
>
> const json = safeStorageSerialize(node);
> console.assert(json.includes('"self":"[Circular]"'), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Circular Object Trees**: DOM node references and graph structures often contain circular references.
> 2. **WeakSet Tracking**: WeakSet keeps track of visited objects during recursive serialization traversal.
> 3. **Safe Fallback Representation**: Replaces circular nodes with text markers ('[Circular]') to allow successful storage serialization.
---

## 6. Related Terms
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — The core utilities executing JavaScript storage serialization.
- [Cookies](cookies.md) — The header-based storage strings that also require custom parsing mechanisms.

---

## 7. Key Takeaways
- Browser Web Storage (`localStorage` / `sessionStorage`) only stores keys and values as strings.
- Passing non-string objects directly leads to value corruption or truthy evaluation bugs.
- Serialize data using `JSON.stringify` before storing, and decode it using `JSON.parse` on retrieval.
- Date objects are converted to strings during serialization and must be manually re-instantiated.
- Wrap deserialization calls in `try/catch` to handle corrupted storage values safely.
