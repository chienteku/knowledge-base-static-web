# `implements` Keyword

> **Level 10 — Classes & OOP in TypeScript**
> A keyword used on a Class to promise the TypeScript compiler: *"This class will perfectly match the shape defined by this Interface."* 

---

## 1. Prerequisites
- [Classes Overview](../level_10/classes.md) — The structure making the promise.
- [Interfaces](../level_03/interfaces.md) — The blueprint being promised.

---

## 2. Term Category
- **TypeScript OOP Architecture**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
You are building an app with multiple payment gateways (Stripe, PayPal, ApplePay).
You want to ensure that *every single* gateway class has a `pay()` method and a `refund()` method, so the rest of your app can interact with them interchangeably.
If you just build the classes normally, a developer might name the method `processPayment()` on Stripe, and `pay()` on PayPal, breaking your app.
The **`implements`** keyword solves this. You define a master Interface, and force all classes to `implement` it. The compiler acts as a strict auditor.

### (2) The Syntax
You use `implements` after the Class name, followed by the Interface name.

```typescript
// 1. The Blueprint
interface PaymentGateway {
  name: string;
  pay(amount: number): boolean;
}

// 2. The Implementation (The Promise)
class StripeGateway implements PaymentGateway {
  // ❌ ERROR! We promised to have a `name` and a `pay` method, but we forgot them!
}

// ✅ Valid: We fulfilled the promise
class PayPalGateway implements PaymentGateway {
  name = "PayPal";
  
  pay(amount: number) {
    console.log(`Processing ${amount} via ${this.name}`);
    return true;
  }
}
```

### (3) Implementing Multiple Interfaces
Unlike `extends` (where a class can only inherit from ONE parent class), a class can `implement` as many interfaces as it wants!

```typescript
interface Logger { log(msg: string): void; }
interface Pingable { ping(): void; }

// We must satisfy both blueprints!
class Server implements Logger, Pingable {
  log(msg: string) {}
  ping() {}
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting `implements` to inherit logic

**The mistake:** A developer defines `interface Database { connect() { return true; } }`. They try to `implements Database` hoping to inherit the `connect` logic.

**Why it's wrong:** Interfaces contain ZERO logic. They are just empty shapes. `implements` does not inherit any code; it only audits the code you write inside the class.
**Golden Rule:** 
- If you want to inherit logic/code, use `extends` (with standard or abstract classes).
- If you want to enforce a structural shape contract, use `implements` (with interfaces).

---



### Mistake 2: Expecting `implements` to Automatically Infer Class Parameter Types

**The mistake:** Writing `class User implements Printable { print(msg) {} }` expecting `msg` parameter type to be inferred.

**Why it's wrong:** The `implements` clause checks contract compatibility; it does NOT infer or annotate constructor or method parameter types automatically!

*Incorrect:*
```typescript
interface Printable { print(msg: string): void }
// class User implements Printable { print(msg) {} } // ❌ Parameter 'msg' implicitly has an 'any' type
```

*Fix:*
```typescript
interface Printable { print(msg: string): void }
class User implements Printable { print(msg: string): void {} } // Explicit parameter types required
```

### Mistake 3: Confusing Class Inheritance `extends` with Contract Implementation `implements`

**The mistake:** Using `implements` expecting to inherit method implementation code from parent class.

**Why it's wrong:** `implements` checks type shape contracts ONLY, inheriting ZERO runtime implementation code. Use `extends` to inherit code.

*Incorrect:*
```typescript
class Base { greet() { return "hi"; } }
class Child implements Base {
    // greet is NOT inherited! Must re-declare implementation!
}
```

*Fix:*
```typescript
class Base { greet() { return "hi"; } }
class Child extends Base {} // Inherits runtime code implementation
```



### Mistake 4: Expecting `implements` to Automatically Infer Class Parameter Types

**The mistake:** Writing `class User implements Printable { print(msg) {} }` expecting `msg` parameter type to be inferred.

**Why it's wrong:** The `implements` clause checks contract compatibility; it does NOT infer or annotate constructor or method parameter types automatically!

*Incorrect:*
```typescript
interface Printable { print(msg: string): void }
// class User implements Printable { print(msg) {} } // ❌ Parameter 'msg' implicitly has an 'any' type
```

*Fix:*
```typescript
interface Printable { print(msg: string): void }
class User implements Printable { print(msg: string): void {} } // Explicit parameter types required
```

### Mistake 5: Confusing Class Inheritance `extends` with Contract Implementation `implements`

**The mistake:** Using `implements` expecting to inherit method implementation code from parent class.

**Why it's wrong:** `implements` checks type shape contracts ONLY, inheriting ZERO runtime implementation code. Use `extends` to inherit code.

*Incorrect:*
```typescript
class Base { greet() { return "hi"; } }
class Child implements Base {
    // greet is NOT inherited! Must re-declare implementation!
}
```

*Fix:*
```typescript
class Base { greet() { return "hi"; } }
class Child extends Base {} // Inherits runtime code implementation
```

## 6. Practice Exercises

### Exercise 1: Structural Typing vs Nominal Typing

**Problem:** You have `interface Logger { log(): void }`. You write `class MyLogger { log() { console.log("hi"); } }`. You completely forgot to write `implements Logger` on the class. 
Can you still pass `new MyLogger()` into a function `function run(logger: Logger)`?

**Expected output:**
> [!check]- Answer
> ```text
> Yes, you absolutely can!
> Because TypeScript is Structurally Typed (Duck Typing), it checks if the class instance has a `log()` method. It does! So it accepts it.
> The `implements` keyword is purely a developer tool to catch errors *early* while writing the class. It does not magically change the identity of the class at runtime.
> ```
> - Remember the Duck Test from earlier levels!

---



### Exercise 2: Implementing Multiple Interfaces

**Problem:** Implement `class Service implements Loggable, Serializable`.

**Expected output:**
> [!check]- Answer
> ```text
> Class implements multiple interfaces
> ```
> ```typescript
> interface Loggable { log(): void }
> interface Serializable { serialize(): string }
> class Service implements Loggable, Serializable {
>   log() {}
>   serialize() { return "{}"; }
> }
> console.log("Class implements multiple interfaces");
> ```
>
> **Explanation:** Classes can implement multiple interface contracts separated by commas.

---

### Exercise 3: `implements` Runtime Code Emission

**Problem:** State how many lines of JavaScript code the `implements` clause emits during `tsc` compilation (Zero lines).

**Expected output:**
> [!check]- Answer
> ```text
> Zero lines emitted; implements is compile-time only
> ```
> ```typescript
> console.log("Zero lines emitted; implements is compile-time only");
> ```
>
> **Explanation:** `implements` is a compile-time check erased during JavaScript output generation.

---

### Exercise 4: Implementing Multiple Interfaces

**Problem:** Implement `class Service implements Loggable, Serializable`.

**Expected output:**
> [!check]- Answer
> ```text
> Class implements multiple interfaces
> ```
> ```typescript
> interface Loggable { log(): void }
> interface Serializable { serialize(): string }
> class Service implements Loggable, Serializable {
>   log() {}
>   serialize() { return "{}"; }
> }
> console.log("Class implements multiple interfaces");
> ```
>
> **Explanation:** Classes can implement multiple interface contracts separated by commas.

---

### Exercise 5: `implements` Runtime Code Emission

**Problem:** State how many lines of JavaScript code the `implements` clause emits during `tsc` compilation (Zero lines).

**Expected output:**
> [!check]- Answer
> ```text
> Zero lines emitted; implements is compile-time only
> ```
> ```typescript
> console.log("Zero lines emitted; implements is compile-time only");
> ```
>
> **Explanation:** `implements` is a compile-time check erased during JavaScript output generation.

## 7. Related Terms
- [Abstract Classes](../level_10/abstract_classes.md) — The alternative way to mandate class structure (using `extends` instead of `implements`).
- [Interfaces](../level_03/interfaces.md) — What is being implemented.
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — The type assignment paradigm that permits this behavior.

---

## 8. Key Takeaways
- The **`implements`** keyword forces a Class to adhere to the shape of an Interface.
- If the Class is missing any properties or methods defined in the Interface, the compiler throws an error.
- A class can `implement` infinite interfaces (separated by commas).
- `implements` provides ZERO code reuse/inheritance. It only provides structural auditing. Use `extends` for code inheritance.
