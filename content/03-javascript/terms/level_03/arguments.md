# Arguments

> **Level 3 — Functions & Scope**
> The actual values passed to the function when it is invoked.

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.
- [Parameters](parameters.md) — The named variables listed in the function definition.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If parameters are the blank spaces on a form, arguments are the actual ink written into those spaces. When a developer invokes a function, they need to supply the concrete data that the function will operate on. This data is referred to as "arguments".

JavaScript is very forgiving with arguments. If a function asks for 2 parameters and you pass 3 arguments, it won't crash—it just ignores the third one. If you pass 1 argument, the second parameter simply becomes `undefined`.

### (2) Reality Metaphor
If a coffee machine has a slot labeled `[Insert Pod Here]` (the **Parameter**), the actual physical vanilla coffee pod you push into the slot is the **Argument**.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
function add(a, b) { // 'a' and 'b' are parameters
  return a + b;
}

// 5 and 10 are ARGUMENTS
console.log(add(5, 10)); 
```

#### Fuller Example
```javascript
function registerUser(username, age) {
  console.log(`Registering ${username}, age ${age}`);
}

// Passing exactly the right amount of arguments
registerUser("Alice", 28); 

// Passing too FEW arguments
// Result: age parameter becomes undefined
registerUser("Bob"); 

// Passing too MANY arguments
// Result: "Admin" is completely ignored by the function parameters
registerUser("Charlie", 35, "Admin"); 
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on order instead of clarity

**The mistake:** Creating a function with 5 or 6 parameters and trying to remember the exact order of arguments when calling it.

**Why it's wrong:** It is extremely easy to pass arguments in the wrong order, causing massive bugs (e.g., passing the password into the username parameter). If a function requires more than 3 arguments, it is a best practice to pass a single Object as the argument instead.

*Incorrect:*
```javascript
function createUser(name, age, email, role, active) { ... }

// Did I put email or role first?
createUser("Alice", 28, "admin", "alice@test.com", true); // Bug!
```

*Fix:*
```javascript
// Destructure an object parameter
function createUser({ name, age, email, role, active }) { ... }

// Now the order doesn't matter, and it's highly readable!
createUser({
  name: "Alice",
  email: "alice@test.com",
  age: 28,
  role: "admin",
  active: true
});
```

---

### Mistake 2: Losing Context Binding (`this`) in Arguments Callbacks

**The mistake:** Passing methods from Arguments instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "arguments",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "arguments",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Arguments Operations

**The mistake:** Executing asynchronous operations within Arguments without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/arguments"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/arguments");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in arguments: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Argument counting

**Problem:** Call a function `multiply(a, b)` and pass it three arguments: `5`, `10`, and `15`. What happens?

**Expected output:**
> [!check]- Answer
> ```text
> 50
> ```
> - The function will map `5` to `a`, `10` to `b`, and completely ignore the `15`.

---

### Exercise 2: Converting `arguments` to Array

**Problem:** Convert `arguments` to a real array using `Array.from(arguments)` and call `.reduce()` to sum inputs `add(10, 20, 30)`.

**Expected output:**
> [!check]- Answer
> ```text
> 60
> ```
> ```javascript
> function sumAll() {
>   const args = Array.from(arguments);
>   return args.reduce((acc, n) => acc + n, 0);
> }
> console.log(sumAll(10, 20, 30));
> ```
>
> **Explanation:** `Array.from()` creates a true `Array` instance from array-like objects.

---

### Exercise 3: Rest Parameters vs `arguments`

**Problem:** Rewrite a function using modern ES6 rest parameters `function multiply(factor, ...numbers)`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 10, 20, 30 ]
> ```
> ```javascript
> function multiply(factor, ...numbers) {
>   return numbers.map(n => n * factor);
> }
> console.log(multiply(10, 1, 2, 3));
> ```
>
> **Explanation:** Rest parameters (`...args`) gather excess arguments into genuine `Array` instances.

---

## 7. Related Terms
- [Parameters](parameters.md) — The placeholders in the function definition.
- [Function](function.md) — The block of code being executed.

---

## 8. Key Takeaways
- Arguments are the concrete values you put inside the parentheses when you *call* a function.
- In JavaScript, passing too many or too few arguments does not crash the program.
- If you pass too few, the missing parameters become `undefined`.
- If a function requires many arguments, consider passing a single Object instead.
