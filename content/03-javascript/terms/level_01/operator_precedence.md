# Operator Precedence & Associativity

> **Level 1 — Foundations**
> The order operators evaluate in an expression.

---

## 1. Prerequisites
- [Operator](operator.md) — Symbol that performs an operation on operands.
- [Expression](expression.md) — Any valid unit of code that resolves to a single value.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Operator Precedence & Associativity is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Compound Financial Interest Precedence Disambiguation

**Scenario:** A banking calculation engine computes final account balances using multi-operator mathematical formulas. Explicit parentheses must be added to override default operator precedence rules.

**Requirements:**
1. Write calculateCompoundInterest(principal, rate, years).
2. Enforce addition (1 + rate) to execute before exponentiation **.
3. Enforce exponentiation to execute before multiplication with principal.

> [!check]- Answer
> #### Implementation
> ```javascript
> function calculateCompoundInterest(principal, rate, years) {
>   const growthFactor = (1 + rate) ** years;
>   const finalBalance = principal * growthFactor;
>   return Number(finalBalance.toFixed(2));
> }
> // Verification tests
> const bal = calculateCompoundInterest(1000, 0.05, 2);
> console.assert(bal === 1102.50, "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Grouping Operator ()**: Parentheses () have the highest operator precedence (21), forcing inner expressions to evaluate first.
> 2. **Precedence Hierarchy**: Exponentiation ** (precedence 15) evaluates before multiplication * (precedence 14).
> 3. **Code Readability**: Explicit parentheses eliminate ambiguity, making complex equations self-documenting.
> 
---

### Exercise 2: Logical & Comparison Operator Order Disambiguation

**Scenario:** An authentication access gateway evaluates user access permissions. Logical AND (&&) has higher precedence than logical OR (||), which can cause security bypass bugs if unparenthesized.

**Requirements:**
1. Disambiguate condition: User can access if they are isAdmin OR (isVIP AND hasToken).
2. Use explicit grouping parentheses to ensure logical AND groups together.
3. Return access decision boolean.

> [!check]- Answer
> #### Implementation
> ```javascript
> function evaluateAccessRights(user) {
>   return Boolean(user.isAdmin || (user.isVIP && user.hasToken));
> }
> // Verification tests
> console.assert(evaluateAccessRights({ isAdmin: true, isVIP: false, hasToken: false }) === true, "Test 1 Failed");
> console.assert(evaluateAccessRights({ isAdmin: false, isVIP: true, hasToken: true }) === true, "Test 2 Failed");
> console.assert(evaluateAccessRights({ isAdmin: false, isVIP: true, hasToken: false }) === false, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Logical Precedence**: && (precedence 6) evaluates before || (precedence 5).
> 2. **Parenthetical Grouping**: Adding () around (isVIP && hasToken) ensures logical intent is preserved regardless of operator defaults.
> 3. **Precedence Bugs**: Omitting grouping in mixed logical expressions is a common source of authorization logic flaws.
> 
---

### Exercise 3: Right-Associativity Verification in Exponentiation & Assignment

**Scenario:** A game engine computes exponential damage scaling. Exponentiation ** and assignment = are right-associative, evaluating from right to left.

**Requirements:**
1. Demonstrate right-to-left evaluation of 2 ** 3 ** 2 (equals 2 ** (3 ** 2) = 512, NOT (2 ** 3) ** 2 = 64).
2. Demonstrate chained assignment a = b = 10.
3. Return calculated values.

> [!check]- Answer
> #### Implementation
> ```javascript
> function testRightAssociativity() {
>   const powerResult = 2 ** 3 ** 2;
>   let a, b;
>   a = b = 10;
>   return { powerResult, a, b };
> }
> // Verification tests
> const res = testRightAssociativity();
> console.assert(res.powerResult === 512, "Test 1 Failed: Should be 512, not 64");
> console.assert(res.a === 10 && res.b === 10, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Associativity Direction**: Most binary operators are left-associative, but exponentiation ** and assignment = are right-associative (evaluate right-to-left).
> 2. **Exponentiation Chaining**: a ** b ** c is parsed as a ** (b ** c).
> 3. **Chained Assignments**: a = b = c evaluates b = c first, returning the assigned value to be assigned to a.
---

## 6. Related Terms
- [Arithmetic Operators](arithmetic_operators.md) — Mathematical calculation symbols.
- [Logical Operators](../level_02/logical_operators.md) — Boolean logic symbols.
- [Expression](expression.md) — Any piece of code that yields a value.

---

## 7. Key Takeaways
- Operator Precedence determines which operations are evaluated first in a complex expression.
- Associativity determines the direction of evaluation (Left-to-Right or Right-to-Left) when operators have equal precedence.
- Grouping parentheses `()` have the highest precedence in JavaScript and should always be used to make complex logic explicit and readable.
