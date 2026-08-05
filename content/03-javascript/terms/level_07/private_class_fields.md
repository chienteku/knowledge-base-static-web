# Private Class Fields (#)

> **Level 7 — Objects & Prototypes**
> Truly private members inside a class.

---

## 1. Prerequisites
- [Class](class.md) — Syntactic sugar blueprint over prototypal inheritance.
- [Closure](../level_03/closure.md) — The function scope scope pattern that enables data encapsulation.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Standardized in ES2022. Supported in modern browsers and Node.js (v12+).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Create Secure Lock

**Problem:** Complete the `SecureLock` class by declaring a private field `#passcode`, and writing a method `unlock` that returns `true` if the passed argument matches `#passcode`, and `false` otherwise.

```javascript
class SecureLock {
  // 1. Declare private passcode field
  
  constructor(pass) {
    // 2. Set private field
  }

  unlock(testPass) {
    // 3. Compare testPass with private passcode
  }
}

const lock = new SecureLock("secret123");
console.log("Unlock wrong:", lock.unlock("wrong")); // false
console.log("Unlock correct:", lock.unlock("secret123")); // true
```

> [!check]- Answer
> - Declare `#passcode;` at the top of the class.
> - Inside the constructor, set `this.#passcode = pass;`.
> - Inside the `unlock` method, return `testPass === this.#passcode`.

---

### Exercise 2: Encapsulating Class State with `#private` Fields

**Problem:** Define `class BankAccount` with `#balance = 0;` and public methods `deposit(val)` and `getBalance()`.

**Expected output:**
> [!check]- Answer
> ```text
> 100
> ```
> ```javascript
> class BankAccount {
>   #balance = 0;
>   deposit(val) { this.#balance += val; }
>   getBalance() { return this.#balance; }
> }
> const acc = new BankAccount();
> acc.deposit(100);
> console.log(acc.getBalance());
> ```
>
> **Explanation:** Private class fields `#field` prevent unauthorized external access and mutation.

---

### Exercise 3: Private Methods and Getters

**Problem:** Define a private method `#secretCalc()` callable only inside class methods.

**Expected output:**
> [!check]- Answer
> ```text
> Secret: 42
> ```
> ```javascript
> class Vault {
>   #secretCalc() { return 42; }
>   getSecret() { return `Secret: ${this.#secretCalc()}`; }
> }
> console.log(new Vault().getSecret());
> ```
>
> **Explanation:** Private methods `#method()` encapsulate internal helper algorithms.

---

## 7. Related Terms
- [Getters & Setters](getters_setters.md) — Properties used to control private backing field reads and writes.
- [Symbol](../level_08/symbol.md) — Related concept: Symbol.
---

## 8. Key Takeaways
- Private class fields are prefixed with a hash symbol `#` and must be declared at the class top level.
- Private fields are completely inaccessible from outside the class body.
- Any attempt to access a private field from external code throws a compile-time `SyntaxError`.
- Private fields cannot be accessed dynamically via bracket notation.
- Encapsulate internal state inside private fields and expose validation methods to write secure, clean object interfaces.
