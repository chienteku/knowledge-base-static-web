# Logical Assignment (??=, ||=, &&=)

> **Level 8 — Modern JavaScript (ES6+)**
> Combine logical ops with assignment.

---

## 1. Prerequisites
- [Nullish Coalescing (??)](nullish_coalescing.md) — The logical operator checking for nullish states.
- [Logical Operators](../level_02/logical_operators.md) — Core operators (`&&`, `||`, `!`).

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Standardized in ES2021. Supported in modern browsers and Node.js (v15+).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, we frequently assign fallback default values to variables only if they don't already possess a valid value. Historically, developers wrote verbose conditional branches or duplicated variable names to accomplish this:

*Legacy Approaches:*
```javascript
// Approach A:
if (!config.timeout) {
  config.timeout = 5000;
}

// Approach B (shorthand but runs a write operation every time):
config.timeout = config.timeout || 5000; 
```

To streamline these operations, ES2021 introduced **Logical Assignment Operators**. These combine logical checks (`||`, `&&`, `??`) with the assignment operator (`=`) in a single step. Crucially, they employ **short-circuit evaluation**—meaning they only write a value to the variable if the logical condition is met:

- **`x ||= y` (Logical OR Assignment):** Assigns `y` to `x` only if `x` is **falsy** (`false`, `0`, `""`, `null`, `undefined`, `NaN`).
- **`x &&= y` (Logical AND Assignment):** Assigns `y` to `x` only if `x` is **truthy**.
- **`x ??= y` (Nullish Assignment):** Assigns `y` to `x` only if `x` is **nullish** (`null` or `undefined`). This is highly useful because it preserves valid falsy values like the number `0` or empty strings `""`.

### (2) Reality Metaphor
Imagine a vault shelf slot (`x`) in a warehouse.
- **`x ||= y` (OR)** is a rule for the warehouse manager: "Check the shelf. If the slot is completely empty, or holds a broken, useless, or dusty prototype (falsy), replace it with item `y`."
- **`x ??= y` (Nullish)** is a stricter rule: "Only touch the shelf if it is explicitly empty (nullish). If it contains a box labeled `0` or a folder containing an empty sheet `""`, leave it alone; those are valid records."

### (3) JavaScript Code Examples

#### Configuring User Profile Options
```javascript
const userSession = {
  username: "Brendan",
  profileVisits: 0,
  theme: null,
  activeToken: "token-99"
};

// 1. Logical OR Assignment (||=)
// Checks theme: null is falsy, so it assigns "dark"
userSession.theme ||= "dark"; 
console.log(userSession.theme); // "dark"

// 2. The pitfall of ||= with numeric 0
// Visits is 0 (falsy), so ||= overwrites it!
userSession.profileVisits ||= 1; 
console.log(userSession.profileVisits); // 1 (Incorrectly overwritten!)

// 3. Nullish Assignment (??=) to the rescue
const userSession2 = { profileVisits: 0, theme: null };
// profileVisits is 0 (not nullish!), so ??= leaves it untouched!
userSession2.profileVisits ??= 1;
userSession2.theme ??= "dark";

console.log(userSession2.profileVisits); // 0 (Preserved successfully!)
console.log(userSession2.theme);         // "dark" (Assigned successfully)

// 4. Logical AND Assignment (&&=)
// activeToken is truthy, so it gets updated to the return value of cleanToken
let activeToken = "  my-secret-token  ";
activeToken &&= activeToken.trim();
console.log(activeToken); // "my-secret-token"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `||=` when `??=` is required

**The mistake:** Using `||=` to apply default configurations containing boolean flags or numbers.

**Why it's wrong:** `||=` checks for any falsy value. If a user sets a volume to `0` or toggles a feature to `false`, `||=` treats them as falsy and overwrites them with your default values. Use `??=` to only apply defaults to `null` or `undefined` properties.

*Incorrect:*
```javascript
const config = { volume: 0, verbose: false };

config.volume ||= 50;   // Overwrites 0 to 50!
config.verbose ||= true; // Overwrites false to true!
```

*Fix:*
```javascript
const config = { volume: 0, verbose: false };

config.volume ??= 50;   // Remains 0 (Safe!)
config.verbose ??= true; // Remains false (Safe!)
```

---

### Mistake 2: Losing Context Binding (`this`) in Logical Assignment Callbacks

**The mistake:** Passing methods from Logical Assignment instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "logical_assignment",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "logical_assignment",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Logical Assignment Operations

**The mistake:** Executing asynchronous operations within Logical Assignment without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/logical_assignment"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/logical_assignment");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in logical_assignment: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: State Initializer

**Problem:** Complete the code to initialize `settings` parameters. Ensure `theme` defaults to `"light"` and `scale` defaults to `1` using the safest logical assignment operators.

```javascript
const settings = {
  theme: undefined,
  scale: 0,
  font: "serif"
};

// Set defaults for theme and scale using logical assignment
// Write code here

console.log("theme:", settings.theme); // should be "light"
console.log("scale:", settings.scale); // should remain 0
```

> [!check]- Answer
> - Use the nullish assignment operator `??=` on both properties.

---

### Exercise 2: Logical AND Assignment (`&&=`)

**Problem:** Demonstrate `user.name &&= user.name.toUpperCase()` updating `name` only if defined.

**Expected output:**
> [!check]- Answer
> ```text
> ALICE
> undefined
> ```
> ```javascript
> const u1 = { name: "Alice" };
> u1.name &&= u1.name.toUpperCase();
> console.log(u1.name);
> const u2 = { name: undefined };
> u2.name &&= "BOB";
> console.log(u2.name);
> ```
>
> **Explanation:** `x &&= y` evaluates and assigns `y` to `x` only if `x` is currently truthy.

---

### Exercise 3: Nullish Coalescing Assignment (`??=`)

**Problem:** Set default port `cfg.port ??= 3000` when `cfg.port` is `0`.

**Expected output:**
> [!check]- Answer
> ```text
> 0
> ```
> ```javascript
> const cfg = { port: 0 };
> cfg.port ??= 3000;
> console.log(cfg.port);
> ```
>
> **Explanation:** `??=` retains falsy non-nullish values like `0` without overriding them with defaults.


---

## 7. Related Terms
- [Nullish Coalescing (??)](nullish_coalescing.md) — The logical operator checking for nullish states.

---

## 8. Key Takeaways
- Logical Assignment Operators combine conditional short-circuit checks and value assignments in a single expression.
- `x ||= y` assigns `y` to `x` only if `x` is falsy.
- `x ??= y` assigns `y` to `x` only if `x` is nullish (`null` or `undefined`).
- `x &&= y` assigns `y` to `x` only if `x` is truthy.
- Prefer `??=` over `||=` when handling configurations that accept numeric `0`, empty strings `""`, or boolean `false` as valid values.
- These operators only execute a write assignment if the conditional check is met, avoiding redundant memory access.
