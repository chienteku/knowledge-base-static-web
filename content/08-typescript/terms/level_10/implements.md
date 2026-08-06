# `implements` Keyword

> **Level 10 — Classes & OOP in TypeScript**
> A keyword used on a Class to promise the TypeScript compiler: *"This class will perfectly match the shape defined by this Interface."* 

---

## 1. Prerequisites
- [Classes Overview](classes.md) — The structure making the promise.
- [Interfaces](../level_03/interfaces.md) — The blueprint being promised.

---

## 2. Term Category

**Object-Oriented Programming** (Interface Contract Realization): The `implements` clause verifies that a class satisfies the structural contract of one or more interfaces.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Realizing Interface Contracts with `implements`

**Scenario:**
Create an `Authenticatable` interface and implement it inside a `UserSession` class.

**Requirements:**
1. Use `implements Authenticatable` on `UserSession` class.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Authenticatable {
>   token: string;
>   authenticate(): boolean;
> }
> 
> class UserSession implements Authenticatable {
>   constructor(public token: string) {}
> 
>   authenticate(): boolean {
>     return this.token.length > 0;
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. `implements Interface` verifies that the class satisfies the structural interface contract.
> 2. `implements` is checked strictly at compile time; completely erased in output JavaScript code.
> 3. Ensures that class instances can be safely passed to functions expecting `Authenticatable`.
> 
---

### Exercise 2: Implementing Multiple Interfaces

**Scenario:**
Create a class `DocumentProcessor` implementing both `Printable` and `Serializable` interfaces.

**Requirements:**
1. Use `implements Printable, Serializable`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Printable { print(): void; }
> interface Serializable { serialize(): string; }
> 
> class DocumentProcessor implements Printable, Serializable {
>   print(): void {
>     console.log("Printing document...");
>   }
> 
>   serialize(): string {
>     return JSON.stringify({ status: "printed" });
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. Classes can implement multiple comma-separated interfaces (`implements A, B`).
> 2. Bypasses single class inheritance limitations by composing multiple interface capabilities.
> 3. Standard object-oriented contract composition pattern.
> 
---

### Exercise 3: Auditing `implements` Type Inference Limitations

**Scenario:**
Explain why `implements Interface` does NOT automatically infer parameter types on class methods.

**Requirements:**
1. Show why method parameters in `implements` classes must still be explicitly typed.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Calculator {
>   add(a: number, b: number): number;
> }
> 
> class FastCalc implements Calculator {
>   // ❌ FAILS with noImplicitAny if parameters are un-typed:
>   // add(a, b) { return a + b; }
> 
>   // ✅ CORRECT (Must explicitly annotate method parameters):
>   add(a: number, b: number): number {
>     return a + b;
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. `implements` checks that method implementations match the interface; it does NOT automatically infer method parameter types.
> 2. Method parameters must still be annotated explicitly when `noImplicitAny` is enabled.
> 3. Common misconception when working with `implements`.
> 
---



## 6. Related Terms
- [Abstract Classes](abstract_classes.md) — The alternative way to mandate class structure (using `extends` instead of `implements`).
- [Interfaces](../level_03/interfaces.md) — What is being implemented.
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — The type assignment paradigm that permits this behavior.
- [Classes Overview](classes.md) — Related concept: Classes Overview.

---

## 7. Key Takeaways
- The **`implements`** keyword forces a Class to adhere to the shape of an Interface.
- If the Class is missing any properties or methods defined in the Interface, the compiler throws an error.
- A class can `implement` infinite interfaces (separated by commas).
- `implements` provides ZERO code reuse/inheritance. It only provides structural auditing. Use `extends` for code inheritance.
