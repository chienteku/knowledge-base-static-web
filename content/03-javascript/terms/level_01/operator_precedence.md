# Operator Precedence & Associativity

> **Level 1 — Foundations**
> The order operators evaluate in an expression.

---

## 1. Prerequisites
- [Operator](operator.md) — Symbol that performs an operation on operands.
- [Expression](expression.md) — Any valid unit of code that resolves to a single value.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing software, we often combine multiple operations in a single line of code (e.g., `const result = 5 + 3 * 2;`). If the parser evaluated this purely from left to right, it would calculate `(5 + 3) * 2 = 16`. However, standard mathematics dictates that multiplication happens before addition, yielding `5 + (3 * 2) = 11`. 

To resolve this ambiguity, the JavaScript engine uses a set of rules called **Operator Precedence**. Each operator is assigned a numeric priority level. 

Furthermore, if two operators have the *same* precedence level (e.g., in `10 - 5 - 2`), the engine uses **Associativity** to determine the direction of evaluation: either Left-to-Right (associative to the left) or Right-to-Left (associative to the right). Without these strict parser specifications, complex expressions would evaluate differently on different systems, leading to absolute chaos.

### (2) Reality Metaphor
Operator precedence is like the standard rules of grammar in language, or traffic priority rules at an intersection. In language, punctuation tells you how to group clauses. At a four-way stop, emergency vehicles have the highest precedence, followed by cars going straight, then turning cars. If two cars have equal priority, the rule of "give way to the vehicle on the right" (associativity) determines who goes first.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Multiplication has higher precedence (13) than addition (11)
const mathResult = 2 + 3 * 4; // Evaluates: 2 + (3 * 4) = 14

// Grouping operators () have the highest precedence (19) and override defaults
const groupedResult = (2 + 3) * 4; // Evaluates: 5 * 4 = 20

console.log(mathResult, groupedResult); // 14 20
```

#### Fuller Example
```javascript
// A validation check mixing logical operators, arithmetic, and comparison
const userAge = 20;
const hasId = true;
const isVip = false;

// Precedence rank for this expression:
// 1. Relational comparison (>=) -> rank 9
// 2. Logical AND (&&) -> rank 4
// 3. Logical OR (||) -> rank 3
// 4. Assignment (=) -> rank 2

const canEnter = userAge >= 18 && hasId || isVip;
// Step 1: userAge >= 18 evaluates to true
// Step 2: true && hasId (true) evaluates to true
// Step 3: true || isVip (false) evaluates to true

console.log("Access status:", canEnter); // Access status: true

// Right-to-Left Associativity in Assignment Operators
let x, y, z;
x = y = z = 5; 
// Evaluates right-to-left: 
// 1. z = 5 (returns 5)
// 2. y = z (which is 5, returns 5)
// 3. x = y (which is 5)
console.log(x, y, z); // 5 5 5
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming Logical AND (`&&`) and Logical OR (`||`) Have Equal Priority

**The mistake:** Mixing `&&` and `||` in a single statement without parentheses, thinking they evaluate left-to-right.

**Why it's wrong:** Logical AND (`&&`) has higher precedence than Logical OR (`||`). This means `&&` is always grouped and evaluated before `||`, which can lead to severe security bugs or incorrect conditional branching.

*Incorrect:*
```javascript
const isAdmin = false;
const hasSubscription = true;
const isPromoDay = false;

// Goal: Allow if it's admin, OR if they have subscription AND it's promo day
const accessGranted = isAdmin || hasSubscription && isPromoDay;
// Evaluates: isAdmin || (hasSubscription && isPromoDay)
//            false   || (true && false)
//            false   || false -> false (correct here, but let's change inputs...)

const isAdmin2 = true;
const hasSubscription2 = false;
const isPromoDay2 = false;
// Goal: Allow if it's admin (true), OR if (subscription && promo)
// Evaluates: true || (false && false) -> true || false -> true (correct)

// What if: Allow if (admin OR subscription) AND it's promo day?
const accessGranted2 = isAdmin2 || hasSubscription2 && isPromoDay2;
// Evaluates: true || (false && false) -> true (Security bug! Evaluated even though it's NOT promo day!)
```

*Fix:*
```javascript
const isAdmin = true;
const hasSubscription = false;
const isPromoDay = false;

// Always use parentheses () to group conditions explicitly and override precedence
const accessGranted = (isAdmin || hasSubscription) && isPromoDay;
console.log(accessGranted); // false (Correct! It is not a promo day)
```

---

### Mistake 2: Losing Context Binding (`this`) in Operator Precedence Callbacks

**The mistake:** Passing methods from Operator Precedence instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "operator_precedence",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "operator_precedence",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Operator Precedence Operations

**The mistake:** Executing asynchronous operations within Operator Precedence without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/operator_precedence"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/operator_precedence");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in operator_precedence: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Evaluate the Precedence

**Problem:** Predict the result of the following expression: `const calc = 10 + 5 * 2 ** 3;`

**Expected output:**
> [!check]- Answer
> ```text
> Result: 50
> ```
> - Precedence order: Exponentiation (`**`) > Multiplication (`*`) > Addition (`+`).
> - Calculate `2 ** 3` first (8).
> - Multiply the result by `5` (40).
> - Add `10` (50).
> 
---

### Exercise 2: Operator Precedence Trace

**Problem:** Predict the result of `3 + 4 * 5`, `(3 + 4) * 5`, and `!true || true && false`.

**Expected output:**
> [!check]- Answer
> ```text
> 23
> 35
> false
> ```
> ```javascript
> console.log(3 + 4 * 5); // 23 (* has higher precedence than +)
> console.log((3 + 4) * 5); // 35 (parentheses override precedence)
> console.log(!true || true && false); // false (&& has higher precedence than ||)
> ```
>
> **Explanation:** Multiplication `*` and logical AND `&&` have higher operator precedence than addition `+` and logical OR `||`.
> 
---

### Exercise 3: Exponentiation Operator Precedence

**Problem:** Evaluate `2 ** 3 ** 2` and explain why right-associativity yields `512` instead of `64`.

**Expected output:**
> [!check]- Answer
> ```text
> 512
> ```
> ```javascript
> console.log(2 ** 3 ** 2); // 512 (evaluated as 2 ** (3 ** 2) = 2 ** 9)
> ```
>
> **Explanation:** Exponentiation `**` is right-associative, evaluating `3 ** 2` first to get `9`, then `2 ** 9 = 512`.
> 
> 
---

## 7. Related Terms
- [Arithmetic Operators](arithmetic_operators.md) — Mathematical calculation symbols.
- [Logical Operators](../level_02/logical_operators.md) — Boolean logic symbols.
- [Expression](expression.md) — Any piece of code that yields a value.

---

## 8. Key Takeaways
- Operator Precedence determines which operations are evaluated first in a complex expression.
- Associativity determines the direction of evaluation (Left-to-Right or Right-to-Left) when operators have equal precedence.
- Grouping parentheses `()` have the highest precedence in JavaScript and should always be used to make complex logic explicit and readable.
