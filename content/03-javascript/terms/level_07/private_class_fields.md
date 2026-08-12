# Private Class Fields (#)

> **Level 7 — Objects & Prototypes**
> Truly private members inside a class.

---

## 1. Prerequisites
- [Class](class.md) — Syntactic sugar blueprint over prototypal inheritance.
- [Closure](../level_03/closure.md) — The function scope scope pattern that enables data encapsulation.

---

## 2. Term Category

**Language Core (Universal: Standardized in ES2022. Supported in modern browsers and Node.js .)**: Private Class Fields (#) is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Encapsulation is a core concept of object-oriented programming: hiding the internal state of an object and restricting direct access to prevent external code from corrupting it.

Historically, JavaScript had no built-in mechanism to enforce private properties in classes. Developers used convention, prefixing internal variables with an underscore (e.g., `this._balance = 100`). However, this was only a guideline; the property remained fully public, meaning external scripts could still read or modify it.

To solve this, ES2022 introduced **Private Class Fields**:
- Any field or method prefixed with a hash symbol **`#`** (e.g. `#balance`) is strictly private.
- Private fields **must be declared** at the top level of the class block before they are used.
- They are accessible **only** inside the body of the class.
- Attempting to read or modify a private field from outside the class (e.g. `account.#balance`) is caught by the parser and throws a compile-time `SyntaxError`.

### (2) Reality Metaphor
- A **public property** is like a bank brochure display stand in the lobby. Anyone walking in can read it or take one.
- An **underscore property (`_prop`)** is like a door in the lobby labeled "Employees Only." It relies on goodwill; nothing physically stops an aggressive customer from turning the handle and walking in.
- A **private field (`#prop`)** is like the **main steel bank vault**. It is physically locked. A customer in the lobby has no way to open it or look inside. Only the bank staff (methods inside the class) have the keys to open the vault and retrieve or add cash safely.

### (3) JavaScript Code Examples

#### Enforcing Encapsulation with Private Fields
```javascript
class BankAccount {
  // 1. Declare the private field at the top level of the class
  #balance;

  constructor(owner, initialDeposit) {
    this.owner = owner; // Public property
    this.#balance = initialDeposit; // Private property
  }

  // 2. Public method to access the private balance safely
  getBalance() {
    return this.#balance; 
  }

  // 3. Public method to validate updates to the private balance
  deposit(amount) {
    if (amount <= 0) {
      throw new Error("Deposit amount must be positive.");
    }
    this.#balance += amount;
    console.log(`Deposited $${amount}. New balance: $${this.#balance}`);
  }
}

const myAccount = new BankAccount("Alice", 500);

// Reading public properties
console.log("Account Owner:", myAccount.owner); // "Alice"

// Interacting via public methods
myAccount.deposit(150); // "Deposited $150. New balance: $650"
console.log("Verified Balance:", myAccount.getBalance()); // 650

// 4. PITFALL: Accessing private fields directly throws compile-time errors!
// console.log(myAccount.#balance); 
// SyntaxError: Private field '#balance' must be declared in an enclosing class
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Declare Private Fields at the Class Top-Level

**The mistake:** Assigning a private field in the constructor without declaring it first at the top of the class block.

**Why it's wrong:** The JavaScript parser must see private fields pre-declared at the class scope before it parses constructor or method bodies, otherwise it throws a SyntaxError.

*Incorrect:*
```javascript
class User {
  constructor(name) {
    this.#name = name; // SyntaxError: Private field '#name' must be declared in an enclosing class
  }
}
```

*Fix:*
```javascript
class User {
  #name; // Pre-declare private field

  constructor(name) {
    this.#name = name; // Correct!
  }
}
```

### Mistake 2: Losing Context Binding (`this`) in Private Class Fields Callbacks

**The mistake:** Passing methods from Private Class Fields instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "private_class_fields",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "private_class_fields",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Private Class Fields Operations

**The mistake:** Executing asynchronous operations within Private Class Fields without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/private_class_fields"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/private_class_fields");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in private_class_fields: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Hard Private State Encapsulation via #private Fields

**Scenario:** A security package uses ES2022 private class fields (#apiKey, #secret) to guarantee external code cannot inspect or modify sensitive state.

**Requirements:**
1. Define class SecureClient with #apiKey field.
2. Implement constructor and getMaskedKey() method.
3. Verify #apiKey throws SyntaxError/TypeError on external access.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class SecureClient {
>   #apiKey;
>
>   constructor(apiKey) {
>     this.#apiKey = apiKey;
>   }
>
>   getMaskedKey() {
>     return this.#apiKey.slice(0, 4) + "****";
>   }
> }
>
> // Verification tests
> const client = new SecureClient("SECRET_KEY_12345");
> console.assert(client.getMaskedKey() === "SECR****", "Test 1 Failed");
> // @ts-ignore
> console.assert(typeof client.#apiKey === "undefined", "Test 2 Failed: Private field exposed");
> ```
>
> #### Technical Explanation
>
> 1. **Private Class Fields (#)**: ES2022 private class fields (#field) enforce hard privacy enforced by JavaScript engine syntax.
> 2. **Syntax Enforcement**: Attempting to access #private fields outside class declaration bodies throws a syntax/runtime error.
> 3. **No Reflection Access**: Private fields cannot be inspected via Object.keys(), JSON.stringify(), or reflection APIs.
> 
---

### Exercise 2: Private Class Fields Advanced Context Handler

**Scenario:** A web application component processes private class fields data operations within enterprise workflows.

**Requirements:**
1. Write handlePrivateClassFieldsSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handlePrivateClassFieldsSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handlePrivateClassFieldsSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Private Class Fields Architecture**: Applying private class fields patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Private Class Fields Performance Optimization

**Scenario:** An application utility optimizes private class fields execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizePrivateClassFieldsTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizePrivateClassFieldsTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizePrivateClassFieldsTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Private Class Fields Optimization**: Optimizing private class fields improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Getters & Setters](getters_setters.md) — Properties used to control private backing field reads and writes.
- [Symbol](../level_08/symbol.md) — Related concept: Symbol.

---

## 7. Key Takeaways
- Private class fields are prefixed with a hash symbol `#` and must be declared at the class top level.
- Private fields are completely inaccessible from outside the class body.
- Any attempt to access a private field from external code throws a compile-time `SyntaxError`.
- Private fields cannot be accessed dynamically via bracket notation.
- Encapsulate internal state inside private fields and expose validation methods to write secure, clean object interfaces.
