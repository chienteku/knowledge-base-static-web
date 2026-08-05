# Type Coercion

> **Level 1 — Foundations**
> Automatic or implicit conversion of values from one data type to another by the JavaScript engine.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [String](string.md) — A sequence of characters.
- [Number](number.md) — Represents numerical values.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In early web development, users frequently typed numbers into HTML form fields. However, form inputs always returned Strings (e.g., `"42"` instead of `42`). If a developer tried to multiply `"42" * 10`, strongly typed languages would crash because you can't multiply a word by a number.

Brendan Eich designed JavaScript to be incredibly forgiving. Instead of crashing, the engine tries to be "helpful" by guessing what you meant. If it sees you trying to multiply a string by a number, it will implicitly convert (coerce) the string into a number on the fly. While this makes writing quick scripts easier, it creates a massive footgun for complex applications where hidden type conversions lead to bizarre bugs.

### (2) Reality Metaphor
Imagine handing a bartender a piece of paper with the word "Water" written on it. You didn't hand them actual liquid, but the bartender looks at the paper, realizes you meant the drink, and hands you a glass of water. The bartender *coerced* your note into the actual object. If you hand them a note that says "Dog" and ask for a drink, they'll get confused and hand you `NaN` (Not a Number).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
console.log('5' * 2); // 10 (String '5' is coerced to Number 5)
console.log('5' + 2); // "52" (Number 2 is coerced to String '2' because of the + operator)
```

#### Fuller Example
```javascript
function calculateTotal(price, taxRate) {
  // Even if an HTML input passes these as strings...
  // The '*' operator forces them into Numbers
  const total = price * taxRate; 
  
  // The '+' operator is tricky. If one operand is a String, 
  // it coerces the other to a String and concatenates!
  console.log("Your total is: $" + total); 
}

calculateTotal("10", "1.5"); // "Your total is: $15"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The Loose Equality Operator (`==`)

**The mistake:** Using `==` instead of `===` to compare values.

**Why it's wrong:** The `==` operator performs type coercion before comparing. This means it will forcibly convert the types to match, leading to bizarre logic where `0 == "0"` is true, but `0 == []` is also true. Strict equality (`===`) checks both value AND type.

*Incorrect:*
```javascript
if ("0" == false) {
  console.log("This actually runs. What a nightmare."); 
}
```

*Fix:*
```javascript
if ("0" === false) {
  // This will NOT run, because a String is not a Boolean.
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Type Coercion Callbacks

**The mistake:** Passing methods from Type Coercion instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "type_coercion",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "type_coercion",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Type Coercion Operations

**The mistake:** Executing asynchronous operations within Type Coercion without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/type_coercion"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/type_coercion");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in type_coercion: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Predicting Coercion

**Problem:** Predict the output of the following operations before logging them:
1. `true + 1`
2. `'10' - 5`
3. `'10' + 5`

**Expected output:**
> [!check]- Answer
> ```text
> 2 (true coerces to 1)
> 5 ('10' coerces to number 10)
> "105" (5 coerces to string '5')
> ```
> - The `+` operator prefers String concatenation if any operand is a string.
> - Math operators (`-`, `*`, `/`) force Strings to become Numbers.
> - Booleans coerce to `1` (true) and `0` (false) in math operations.

---

### Exercise 2: ToPrimitive Object Conversion Tracing

**Problem:** Create an object `{ toString() { return "5"; }, valueOf() { return 10; } }` and predict `obj + 2` and `String(obj)`.

**Expected output:**
> [!check]- Answer
> ```text
> 12
> 5
> ```
> ```javascript
> const obj = {
>   toString() { return "5"; },
>   valueOf() { return 10; }
> };
> console.log(obj + 2);     // 12 (prefers valueOf for math +)
> console.log(String(obj)); // "5" (prefers toString for String cast)
> ```
>
> **Explanation:** Object coercion invokes `Symbol.toPrimitive`, falling back to `valueOf()` for numeric hints and `toString()` for string hints.

---

### Exercise 3: Falsy Value Coercion Table

**Problem:** List all 8 falsy values in JavaScript.

**Expected output:**
> [!check]- Answer
> ```text
> false, 0, -0, 0n, "", null, undefined, NaN
> ```
> ```javascript
> const falsies = [false, 0, -0, 0n, "", null, undefined, NaN];
> console.log(falsies.every(v => !v));
> ```
>
> **Explanation:** There are exactly 8 falsy values in JavaScript that coerce to `false` in boolean contexts.


---

## 7. Related Terms
- [Number](number.md) — Represents numerical values.
- [String](string.md) — A sequence of characters representing text.
- [Arithmetic Operators](arithmetic_operators.md) — Related concept: Arithmetic Operators.
- [Dynamic & Weak Typing](dynamic_weak_typing.md) — Related concept: Dynamic & Weak Typing.
- [null](null.md) — Related concept: null.
- [Truthy / Falsy](../level_02/truthy_falsy.md) — Related concept: Truthy / Falsy.

---

## 8. Key Takeaways
- Type Coercion is JavaScript's attempt to automatically convert types to prevent crashes.
- The `+` operator strongly prefers creating Strings (concatenation).
- The `-`, `*`, and `/` operators strongly prefer creating Numbers.
- **Always** use strict equality (`===` and `!==`) to avoid the unpredictable bugs caused by coercion.
