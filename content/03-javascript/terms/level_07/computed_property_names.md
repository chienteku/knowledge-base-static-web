# Computed Property Names

> **Level 7 — Objects & Prototypes**
> Dynamic object keys via `{ [expr]: value }`.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Property Access (dot vs bracket notation)](../level_02/property_access.md) — Using bracket notation to read/write properties.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES6, if you wanted to declare a JavaScript object literal where one of the property keys was dynamic (such as a string stored in a variable or computed from a calculation), you could not write it inside the literal itself. You had to create a blank object structure first, and then assign the property afterwards using bracket notation.

*Legacy Approach:*
```javascript
const dynamicKey = "api_key";
const config = {};
config[dynamicKey] = "xyz123"; // Verbose, two-step declaration!
```

To allow clean, single-expression object declarations, ES6 introduced **Computed Property Names**. By wrapping a variable or expression in brackets **`[]`** inside the object literal, you tell the engine to evaluate the expression, convert the output to a String (or a Symbol), and use that resulting string as the property key.

*Modern Approach:*
```javascript
const dynamicKey = "api_key";
const config = {
  [dynamicKey]: "xyz123" // Single-step declaration!
};
```

### (2) Reality Metaphor
Imagine ordering a customized nameplate for an office desk.
- The **legacy approach** is like buying a blank wooden desk. You carry it home, get a piece of paper, write a colleague's name on it, and tape it onto the desk yourself.
- The **computed property approach** is like ordering the desk online. On the checkout form, you type a variable name in the custom field: `[colleagueName]`. The factory processes the string, carves the name directly into the wood, and ships the fully personalized desk to your office.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const suffix = "_count";
const userStats = {
  ["login" + suffix]: 12, // Evaluates to: login_count
  ["logout" + suffix]: 2  // Evaluates to: logout_count
};

console.log(userStats.login_count); // 12
```

#### Fuller Example
```javascript
// Setting up dynamic event handlers based on action types
const ACTION_PREVENT = "PREVENT";
const ACTION_ALLOW = "ALLOW";

function buildPermissionsMap(actionRole) {
  // We can build keys dynamically by evaluating variables directly
  const permissions = {
    [`USER_ROLE_${actionRole}`]: "verified",
    [ACTION_PREVENT]: ["delete_db", "clear_logs"],
    [ACTION_ALLOW]: ["read_data", "write_data"],
    // You can even compute values using functions in brackets:
    [Math.random().toString(36).substring(7)]: "session_token"
  };

  return permissions;
}

const adminPermissions = buildPermissionsMap("ADMIN");
console.log(adminPermissions.USER_ROLE_ADMIN); // "verified"
console.log(adminPermissions.PREVENT);         // [ 'delete_db', 'clear_logs' ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting Brackets when Using Variable Keys

**The mistake:** Writing the variable name directly in the key slot expecting it to resolve its value.

**Why it's wrong:** Without brackets `[]`, the engine interprets the text strictly as a literal identifier name. Instead of using the variable's value, it uses the literal variable name string as the key.

*Incorrect:*
```javascript
const keyName = "status";
const task = {
  keyName: "complete" // Missing brackets!
};

console.log(task.status);  // undefined
console.log(task.keyName); // "complete" (Key is literally "keyName"!)
```

*Fix:*
```javascript
const keyName = "status";
const task = {
  [keyName]: "complete" // Correct
};

console.log(task.status); // "complete"
```

---

### Mistake 2: Losing Context Binding (`this`) in Computed Property Names Callbacks

**The mistake:** Passing methods from Computed Property Names instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "computed_property_names",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "computed_property_names",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Computed Property Names Operations

**The mistake:** Executing asynchronous operations within Computed Property Names without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/computed_property_names"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/computed_property_names");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in computed_property_names: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Dynamic Dictionary Builder

**Problem:** Complete the code to construct the object `stats` using computed property names, creating the dynamic key `"active_users"` and setting its value to `450`.

```javascript
const prefix = "active";
const countKey = "users";

const stats = {
  // Declare key dynamically combining prefix and countKey
};

console.log("Active count:", stats.active_users);
```

**Expected output:**
> [!check]- Answer
> ```text
> Active count: 450
> ```
> - The key expression is `[`${prefix}_${countKey}`]`.
> 
---

### Exercise 2: Dynamic Key Object Construction

**Problem:** Construct object `{ [prefix + "_id"]: 42 }` where `prefix = "user"`.

**Expected output:**
> [!check]- Answer
> ```text
> {"user_id":42}
> ```
> ```javascript
> const prefix = "user";
> const obj = { [prefix + "_id"]: 42 };
> console.log(JSON.stringify(obj));
> ```
>
> **Explanation:** Computed property names `[expr]` evaluate dynamic expressions during object literal creation.
> 
---

### Exercise 3: Symbol Computed Property Keys

**Problem:** Use a symbol `const sym = Symbol("key")` as a computed property key `[sym]: "secret"`.

**Expected output:**
> [!check]- Answer
> ```text
> secret
> ```
> ```javascript
> const sym = Symbol("key");
> const obj = { [sym]: "secret" };
> console.log(obj[sym]);
> ```
>
> **Explanation:** Bracketed computed properties permit primitive Symbols as non-string object keys.
> 
> 
---

## 7. Related Terms
- [Symbol](../level_08/symbol.md) — Unique identifiers commonly declared as computed property keys.
- [Shorthand Properties & Methods](shorthand_properties_methods.md) — Structural object syntax updates.
- [Property Access (dot vs bracket notation)](../level_02/property_access.md) — Related concept: Property Access (dot vs bracket notation).
- [Getters & Setters](getters_setters.md) — Related concept: Getters & Setters.

---

## 8. Key Takeaways
- Computed Property Names allow dynamic, evaluated expressions to define object keys directly inside literals.
- Enclose the key expression inside square brackets `[]` (e.g. `{[myVar]: value}`).
- The expression inside `[]` can be variables, mathematical formulas, string concatenations, or functions.
- If you omit the brackets, the variable name is written literally as a static string key.
