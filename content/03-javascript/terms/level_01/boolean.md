# Boolean

> **Level 1 — Foundations**
> A logical entity having two values: `true` or `false`.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Boolean is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Named after mathematician George Boole, the Boolean data type is the bedrock of computer logic. To allow a program to make decisions (branching), it needs a way to represent a binary state: yes/no, on/off, true/false. Without booleans, we wouldn't be able to write `if...else` statements or control the flow of an application based on conditions like "is the user logged in?"

### (2) Reality Metaphor
A boolean is like a simple light switch. The light is either ON (`true`) or OFF (`false`). There is no in-between state, no dimming. It's an absolute binary choice.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const isUserLoggedIn = true;
const hasPremiumSubscription = false;

console.log(typeof isUserLoggedIn); // "boolean"
```

#### Fuller Example
```javascript
const userAge = 20;
const requiredAge = 18;

// Comparison operators return a boolean value
const isOldEnough = userAge >= requiredAge;

if (isOldEnough) {
  console.log("Welcome to the site.");
} else {
  console.log("Access denied.");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing boolean strings with actual booleans

**The mistake:** Wrapping `true` or `false` in quotes, creating a String instead of a Boolean.

**Why it's wrong:** A non-empty string in JavaScript evaluates to a "truthy" value. So `"false"` is actually evaluated as `true` in a conditional statement!

*Incorrect:*
```javascript
const isReady = "false"; // This is a String!

if (isReady) {
  // This WILL run because a non-empty string is "truthy"
  console.log("We are ready!"); 
}
```

*Fix:*
```javascript
const isReady = false; // This is a proper Boolean

if (isReady) {
  // This will NOT run
  console.log("We are ready!");
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Boolean Callbacks

**The mistake:** Passing methods from Boolean instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "boolean",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "boolean",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Boolean Operations

**The mistake:** Executing asynchronous operations within Boolean without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/boolean"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/boolean");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in boolean: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Access Control Permission Evaluator

**Scenario:** An enterprise security gateway determines if a user is authorized to perform administrative actions based on role privileges, MFA verification status, and account suspension flags.

**Requirements:**
1. Write a function canPerformAdminAction(user).
2. Check if user.role === "admin".
3. Check if user.isMfaVerified is true.
4. Ensure user.isSuspended is false.
5. Return a strict boolean result (true or false).

> [!check]- Answer
> #### Implementation
> ```javascript
> function canPerformAdminAction(user) {
>   if (!user || typeof user !== "object") return false;
> const isAdmin = user.role === "admin";
>   const isMfaActive = Boolean(user.isMfaVerified);
>   const isNotSuspended = !user.isSuspended;
> return isAdmin && isMfaActive && isNotSuspended;
> }
> // Verification tests
> const adminUser = { role: "admin", isMfaVerified: 1, isSuspended: false };
> console.assert(canPerformAdminAction(adminUser) === true, "Test 1 Failed");
> const suspendedAdmin = { role: "admin", isMfaVerified: true, isSuspended: true };
> console.assert(canPerformAdminAction(suspendedAdmin) === false, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Boolean Primitive Values**: JavaScript booleans have exactly two literal values: true and false.
> 2. **Logical Operators**: The logical AND (&&) operator evaluates to true only if all operands are truthy.
> 3. **Boolean Coercion**: The Boolean() constructor function explicitly converts truthy/falsy values into primitive booleans.
> 
---

### Exercise 2: System Health Probe Aggregator

**Scenario:** A cloud microservice health check endpoint aggregates status checks from database, Redis, and message queue connections into a single boolean readiness flag.

**Requirements:**
1. Write a function isSystemHealthy(dbStatus, redisStatus, queueStatus).
2. Use double NOT (!!) to coerce connection status values into primitive booleans.
3. Return true only if all services are operational.

> [!check]- Answer
> #### Implementation
> ```javascript
> function isSystemHealthy(dbStatus, redisStatus, queueStatus) {
>   const isDbReady = !!dbStatus;
>   const isRedisReady = !!redisStatus;
>   const isQueueReady = !!queueStatus;
> return isDbReady && isRedisReady && isQueueReady;
> }
> // Verification tests
> console.assert(isSystemHealthy("CONNECTED", 1, true) === true, "Test 1 Failed");
> console.assert(isSystemHealthy("CONNECTED", 0, true) === false, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Double NOT Idiom (!!)**: The first ! flips a value to an inverted boolean; the second ! flips it back, producing an explicit boolean primitive.
> 2. **Truthy / Falsy Evaluation**: Truthy values coerce to true; falsy values (0, "", null, undefined, NaN, false) coerce to false.
> 3. **Type Strictness**: Using !! guarantees function return types are strictly boolean rather than original payload values.
> 
---

### Exercise 3: Form Input Validation State Engine

**Scenario:** A registration form validator evaluates user input constraints (username length, valid email pattern, terms agreement) and returns a validation summary object.

**Requirements:**
1. Validate username length (>= 3 characters).
2. Validate terms acceptance (agreedToTerms === true).
3. Return an object { isValid: boolean, usernameValid: boolean, termsValid: boolean }.

> [!check]- Answer
> #### Implementation
> ```javascript
> function validateForm(username, agreedToTerms) {
>   const usernameValid = typeof username === "string" && username.trim().length >= 3;
>   const termsValid = agreedToTerms === true;
>   const isValid = usernameValid && termsValid;
> return { isValid, usernameValid, termsValid };
> }
> // Verification tests
> const res1 = validateForm("alice", true);
> console.assert(res1.isValid === true, "Test 1 Failed");
> const res2 = validateForm("bo", true);
> console.assert(res2.isValid === false && res2.usernameValid === false, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Comparison Operators**: Relational and equality operators (===, >=) evaluate expressions and produce boolean primitives.
> 2. **Immutable Primitives**: Boolean values are primitive and immutable; boolean variable bindings can be reassigned but the underlying primitive values cannot be modified.
> 3. **Predictable Branching**: Expressing validation states as explicit booleans simplifies conditional rendering and form submission logic.
---

## 6. Related Terms
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Truthy / Falsy](../level_02/truthy_falsy.md) — Values that evaluate to true or false in a boolean context.

---

## 7. Key Takeaways
- Booleans only have two possible values: `true` and `false`.
- They are primarily used in conditional statements to control the flow of the program.
- Comparison operators (like `>`, `<`, `===`) always return a boolean value.
