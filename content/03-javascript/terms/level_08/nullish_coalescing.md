# Nullish Coalescing (??)

> **Level 8 — Modern JavaScript (ES6+)**
> Logical operator returning the right-hand operand when the left-hand is exactly `null` or `undefined`.

---

## 1. Prerequisites
- [Null](../level_01/null.md) / [Undefined](../level_01/undefined.md) — The specific "Nullish" values this operator looks for.
- [Logical Operators](../level_02/logical_operators.md) — The older `||` operator this often replaces.

---

## 2. Term Category
- **Syntax Feature / Operator** *(Introduced in ES11 / 2020)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
For years, JavaScript developers used the Logical OR operator (`||`) to provide default values. (e.g., `const volume = userVolume || 100;`). 
However, `||` checks for *any* "Falsy" value. If a user intentionally set their volume to `0` (which is Falsy), the `||` operator would see `0`, reject it, and force the volume back up to `100`! This caused massive bugs when working with zeros or empty strings.

The TC39 committee introduced the **Nullish Coalescing Operator (`??`)** to solve this. `??` is much stricter than `||`. It *only* falls back to the default value if the left side is exactly `null` or `undefined`. If the left side is `0`, `""`, or `false`, it says: "These are valid values, let them pass!"

### (2) Reality Metaphor
Imagine a bouncer at an exclusive club.
The **Logical OR (`||`) Bouncer** is incredibly strict. If you show up with $0, or a blank name tag (`""`), or wearing a fake mustache (`false`), he kicks you out and gives your spot to the default guest.
The **Nullish Coalescing (`??`) Bouncer** is much more understanding. He only kicks you out if you literally *do not exist* (`undefined`) or if you are a confirmed ghost (`null`). If you show up with $0, he says, "Hey, $0 is still a real number, come on in!"

### (3) JavaScript Code Examples

#### Short Snippet: `??` vs `||`
```javascript
const userSpeed = 0; // The user intentionally set speed to zero!

// The Old Way (Logical OR)
// It sees 0 as falsy, and incorrectly overwrites it with 50!
const badSpeed = userSpeed || 50; 
console.log(badSpeed); // 50 (BUG!)

// The New Way (Nullish Coalescing)
// It sees 0 as valid, and correctly keeps it!
const goodSpeed = userSpeed ?? 50;
console.log(goodSpeed); // 0 (Correct!)
```

#### Fuller Example: Default Configurations
```javascript
function initializeGame(config) {
  // If the user didn't provide a config, we safely use Optional Chaining
  // combined with Nullish Coalescing to provide defaults!
  
  const difficulty = config?.difficulty ?? "Normal";
  const startMoney = config?.money ?? 1000;
  const isHardcore = config?.hardcore ?? false;

  console.log(`Game started: ${difficulty}, $${startMoney}, Hardcore: ${isHardcore}`);
}

// User explicitly wants 0 money and false hardcore mode!
initializeGame({ difficulty: "Expert", money: 0, hardcore: false });
// Output: "Game started: Expert, $0, Hardcore: false"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Nullish Coalescing Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Nullish Coalescing blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "nullish_coalescing";
```

*Fix:*
```javascript
let value = "nullish_coalescing";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Nullish Coalescing Callbacks

**The mistake:** Passing methods from Nullish Coalescing instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "nullish_coalescing",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "nullish_coalescing",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Nullish Coalescing Operations

**The mistake:** Executing asynchronous operations within Nullish Coalescing without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/nullish_coalescing"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/nullish_coalescing");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in nullish_coalescing: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Evaluating the outcome

**Problem:** What will the following values evaluate to?
1. `"" ?? "Default"`
2. `false ?? true`
3. `undefined ?? "Default"`

**Expected output:**
```text
1. `""` (Empty string is not null/undefined!)
2. `false` (False is not null/undefined!)
3. `"Default"` (Undefined triggers the fallback!)
```

> [!check]- Answer
> - `??` only cares about two specific values. Nothing else matters.

---

### Exercise 2: Nullish Coalescing with Falsy Values

**Problem:** Evaluate `0 ?? 100`, `"" ?? "default"`, `false ?? true`, `null ?? "fallback"`.

**Expected output:**
```text
0
""
false
fallback
```

> [!check]- Answer
> ```javascript
> console.log(0 ?? 100);
> console.log("" ?? "default");
> console.log(false ?? true);
> console.log(null ?? "fallback");
> ```
>
> **Explanation:** `??` returns right-hand operand ONLY if left-hand operand is `null` or `undefined`.

### Exercise 3: Chaining Nullish Coalescing Operators

**Problem:** Chain `undefined ?? null ?? "first valid"`.

**Expected output:**
```text
first valid
```

> [!check]- Answer
> ```javascript
> console.log(undefined ?? null ?? "first valid");
> ```
>
> **Explanation:** Chained `??` operators evaluate left-to-right until encountering the first non-nullish value.

---

---

## 7. Related Terms
- [Optional Chaining (`?.`)](./optional_chaining.md) — Usually chained directly into `??`.
- [Logical Operators](../level_02/logical_operators.md) — The `||` operator that `??` improves upon.

---

## 8. Key Takeaways
- The Nullish Coalescing operator (`??`) provides a fallback (default) value.
- It ONLY triggers if the left operand is strictly `null` or `undefined`.
- It completely fixes the bugs caused by `||` when working with valid falsy values like `0`, `""`, and `false`.
- You cannot mix it with `&&` or `||` without wrapping them in parentheses.
