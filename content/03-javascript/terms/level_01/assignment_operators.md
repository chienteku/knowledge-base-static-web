# Assignment Operators

> **Level 1 — Foundations**
> `=`, `+=`, `-=`, `*=`, … store/update values.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Operator](../level_01/operator.md) — Symbol that performs an operation on operands.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Variables are storage containers, but they are useless without a way to put data into them. The **assignment operator** (`=`) is the mechanism used to store a value inside a variable. 

Additionally, programming frequently involves updating a variable's existing value based on itself (e.g., incrementing a score: `score = score + 10`). To make this common pattern cleaner and less repetitive, the TC39 committee introduced **compound assignment operators** (like `+=`, `-=`, `*=`, and `/=`). These serve as syntactic sugar, allowing developers to perform an arithmetic operation and reassign the result to the variable in a single, concise step.

### (2) Reality Metaphor
The basic assignment operator (`=`) is like writing a label and sticking it onto a storage box. The value on the right-hand side is placed inside the box, and the label on the left-hand side is the variable name. 

Compound assignment operators (like `+=`) are like adding items to a collection inside the box without needing to empty the box first. For example, if a piggy bank has $10, `+= 5` is the physical act of dropping 5 more dollars inside; the pig's internal total is updated in place.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
let score = 10; // Basic assignment (=): stores 10 in "score"

score += 5; // Addition assignment: equivalent to "score = score + 5" (now 15)
score *= 2; // Multiplication assignment: equivalent to "score = score * 2" (now 30)
score -= 10; // Subtraction assignment: equivalent to "score = score - 10" (now 20)

console.log(score); // 20
```

#### Fuller Example
```javascript
// A dynamic game state representation using compound assignments
let playerHealth = 100;
let levelXP = 0;

console.log("Initial state - Health:", playerHealth, "XP:", levelXP);

// Player takes damage (subtract from health)
const trapDamage = 15;
playerHealth -= trapDamage; // health is now 85

// Player defeats a monster (add to XP)
const monsterXP = 150;
levelXP += monsterXP; // XP is now 150

// Player drinks a healing potion that doubles remaining health (multiplication)
playerHealth *= 2; // health is now 170

console.log("Updated state - Health:", playerHealth, "XP:", levelXP);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `=` with `===` in Conditions

**The mistake:** Using a single equals sign (`=`) inside an `if` condition instead of a strict equality comparison (`===`).

**Why it's wrong:** A single equals sign assigns a value. It does not compare. Doing this inside an `if` statement reassigns the variable and evaluates the truthiness of the assigned value, which almost always results in a logic error.

*Incorrect:*
```javascript
let userStatus = "guest";

if (userStatus = "admin") { // Reassigns userStatus to "admin"!
  console.log("Welcome back, administrator."); // This ALWAYS prints
}
```

*Fix:*
```javascript
let userStatus = "guest";

if (userStatus === "admin") { // Correctly compares the values
  console.log("Welcome back, administrator."); 
}
```

### Mistake 2: Losing Context Binding (`this`) in Assignment Operators Callbacks

**The mistake:** Passing methods from Assignment Operators instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "assignment_operators",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "assignment_operators",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Assignment Operators Operations

**The mistake:** Executing asynchronous operations within Assignment Operators without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/assignment_operators"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/assignment_operators");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in assignment_operators: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Multi-Step Updates

**Problem:** Complete the code below using compound assignment operators to calculate the balance of a shopping cart. Start with `cartTotal` of 0, add 50, apply a 10% discount (multiply by 0.9), and add a 5 flat shipping fee.

```javascript
let cartTotal = 0;
// Add 50
// Apply 10% discount
// Add 5 shipping
```

**Expected output:**
```text
Final Total: 50
```

> [!check]- Answer
> - Add 50 using `+=`.
> - To apply a 10% discount, multiply the total by 0.9 using `*=`.
> - Add 5 using `+=`.

---

### Exercise 2: Logical Assignment Operators (`&&=`, `||=`, `??=`)

**Problem:** Use `??=` to assign default port `8080` to `config.port` only if `config.port` is `null` or `undefined`.

**Expected output:**
```text
8080
3000
```

> [!check]- Answer
> ```javascript
> let cfg1 = { port: undefined };
> cfg1.port ??= 8080;
> console.log(cfg1.port);
>
> let cfg2 = { port: 3000 };
> cfg2.port ??= 8080;
> console.log(cfg2.port);
> ```
>
> **Explanation:** `x ??= y` assigns `y` to `x` only if `x` is nullish (`null` or `undefined`).

### Exercise 3: Compound Addition Assignment Coercion

**Problem:** Predict what happens when executing `let str = "Count: "; str += 5; str += true;`.

**Expected output:**
```text
Count: 5true
```

> [!check]- Answer
> ```javascript
> let str = "Count: ";
> str += 5;
> str += true;
> console.log(str);
> ```
>
> **Explanation:** `+=` on strings coerces right-hand operands to strings and appends them.

---

## 7. Related Terms
- [`let`](../level_01/let.md) — Variable declaration that allows reassignment.
- [`const`](../level_01/const.md) — Variable declaration that forbids reassignment.
- [Arithmetic Operators](../level_01/arithmetic_operators.md) — Mathematical operations.

---

## 8. Key Takeaways
- The basic assignment operator (`=`) stores the value of the right-hand expression into the left-hand variable.
- Compound assignment operators (like `+=`, `-=`, `*=`) combine arithmetic operations with reassignment in a single shorthand.
- Only variables declared with `let` (or legacy `var`) can be reassigned; `const` variables will throw a `TypeError` on reassignment.
