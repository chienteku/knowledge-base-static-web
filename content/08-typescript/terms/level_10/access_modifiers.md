# Access Modifiers (`public`, `private`, `protected`)

> **Level 10 — Classes & OOP in TypeScript**
> Keywords that control which parts of your code are allowed to read or modify a specific property or method inside a Class.

---

## 1. Prerequisites
- [Classes Overview](classes.md) — The structure these modifiers attach to.
- [Class](../../../03-javascript/terms/level_07/class.md) — The runtime equivalent of `private`.

---

## 2. Term Category

**Object-Oriented Programming** (Encapsulation Visibility Modifiers): Access modifiers (`public`, `private`, `protected`) enforce compile-time visibility encapsulation for class members.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
In Object-Oriented Programming, "Encapsulation" is a core principle. You don't want external code messing with the internal, delicate state of your class.
If you have a `BankAccount` class, you don't want someone doing `account.balance = 9999999`. You want them to use the `deposit()` method so you can run validation checks.
**Access Modifiers** allow you to hide internal properties and methods from the outside world.

### (2) The Three Modifiers
TypeScript provides three levels of visibility:

1. **`public` (Default)**: The property/method can be accessed from *anywhere*.
2. **`private`**: The property/method can ONLY be accessed from *inside* the exact class it was defined in.
3. **`protected`**: The property/method can be accessed from inside the class, AND from inside any class that *inherits* from it (via `extends`).

```typescript
class BankAccount {
  public owner: string;       // Anyone can see this
  private balance: number;    // Hidden from everyone
  protected history: string[]; // Hidden from public, but visible to subclasses

  constructor(owner: string) {
    this.owner = owner;
    this.balance = 0;
    this.history = [];
  }

  public deposit(amount: number) {
    this.balance += amount; // ✅ Valid (inside the class)
  }
}

const myAcct = new BankAccount("Alice");
console.log(myAcct.owner);   // ✅ Valid
console.log(myAcct.balance); // ❌ Error: Property 'balance' is private
```

### (3) The Compile-Time Illusion
It is absolutely critical to understand that `public`, `private`, and `protected` are **Compile-Time only**. They are completely erased during compilation.
If you write `private balance` in TS, compile it to JS, and run it in a browser, a user can still open the DevTools console and write `myAcct.balance = 9999`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing TS `private` with JS `#private`

**The mistake:** A developer uses `private API_KEY = "123"` in their TS class, thinking it is secure from malicious browser extensions.

**Why it's wrong:** As mentioned, TS `private` is erased at runtime. It only stops developers from making mistakes in their IDE.
**Golden Rule:** If you need *true, cryptographically secure* runtime privacy in the browser, you must use the newer ECMAScript Private Field syntax, which uses a hash symbol: `#balance: number`. TypeScript supports this, and it actually prevents runtime access.
Use `private` for developer organization. Use `#private` for actual runtime security.

---





### Mistake 2: Assuming TypeScript `private` Modifiers Enforce Runtime Privacy

**The mistake:** Expecting `private secret: string` to prevent JavaScript property access at runtime.

**Why it's wrong:** TypeScript `public`, `protected`, and `private` modifiers are erased during compilation! At runtime, `private` properties are standard enumerable JS properties. Use `#private` for hard runtime privacy.

*Incorrect:*
```typescript
class User { private secret = "123"; }
const u = new User();
console.log((u as any).secret); // 💥 Outputs '123' at runtime!
```

*Fix:*
```typescript
class User { #secret = "123"; } // Hard ES2022 private field enforced at runtime
```



### Mistake 3: Attempting Outside Access to `protected` Class Members

**The mistake:** Accessing `inst.protectedField` from outside the class or subclass hierarchies.

**Why it's wrong:** `protected` members can be accessed ONLY inside the declaring class and its derived subclasses.

*Incorrect:*
```typescript
class Base { protected id = 1; }
const b = new Base();
// console.log(b.id); // ❌ Property 'id' is protected and only accessible within class 'Base' and its subclasses
```

*Fix:*
```typescript
class Base { protected id = 1; }
class Child extends Base { getId() { return this.id; } } // Accessible inside subclass
```



## 5. Practice Exercises

### Exercise 1: Enforcing Encapsulation with `private` and `protected`

**Scenario:**
Create a `BankAccount` class using `private` for balance and `protected` for account numbers.

**Requirements:**
1. Use `private` and `protected` modifiers on class fields.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class BankAccount {
>   private balance: number;
>   protected accountNumber: string;

  constructor(accountNumber: string, initialBalance: number) {
    this.accountNumber = accountNumber;
    this.balance = initialBalance;
  }

  public getBalance(): number {
    return this.balance;
  }
}

class SavingsAccount extends BankAccount {
  public getAccountInfo(): string {
    // Accessible! accountNumber is protected:
    return `Account: ${this.accountNumber}`;
    // ❌ Error: this.balance is private to BankAccount!
  }
}
```

> #### Technical Explanation
>
> 1. `private` members are accessible ONLY within the declaring class body.
> 2. `protected` members are accessible within the declaring class AND derived subclasses.
> 3. `public` (default) members are accessible anywhere.

---

### Exercise 2: TypeScript `private` vs JavaScript `#private` Fields

**Scenario:**
Contrast TypeScript `private name` (compile-time) against native ES `#name` private fields (runtime).

**Requirements:**
1. Show native ES `#balance` private field.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class SecureVault {
>   #secretKey: string; // Native JS Private Field (Hard Runtime Isolation)
>   private apiKey: string; // TS Access Modifier (Compile-time Check Only)

  constructor(secret: string, api: string) {
    this.#secretKey = secret;
    this.apiKey = api;
  }
}
```

> #### Technical Explanation
>
> 1. TypeScript `private` is enforced ONLY at compile time; erased in JavaScript output and accessible via bracket inspection `(obj as any)["apiKey"]`.
> 2. Native ES `#private` fields provide true runtime encapsulation enforced by the V8 JavaScript engine.
> 3. Use `#private` for security-critical runtime secrets.

---

### Exercise 3: Access Modifier Inheritance Matrix

**Scenario:**
Formulate an encapsulation visibility matrix for `public`, `protected`, `private`, and `#private`.

**Requirements:**
1. Contrast visibility inside class, subclass, and external consumers.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Access Modifier Visibility Matrix:
> - public: Class (YES), Subclass (YES), External (YES).
> - protected: Class (YES), Subclass (YES), External (NO).
> - private (TS): Class (YES), Subclass (NO), External (NO - Compile Time Only).
> - #private (ES): Class (YES), Subclass (NO), External (NO - True Hard Runtime Isolation).
> ```

> #### Technical Explanation
>
> 1. Access modifiers enforce encapsulation boundaries in class architectures.
> 2. TypeScript access modifiers add type safety without runtime performance overhead.
> 3. Core object-oriented design principle.

---



## 6. Related Terms
- [Classes Overview](classes.md) — Where these modifiers live.
- [Parameter Properties](parameter_properties.md) — A shorthand trick using these exact keywords.
- [Decorators](decorators.md) — Related concept: Decorators.
- [Static Members](static_members.md) — Related concept: Static Members.

---

## 7. Key Takeaways
- **Access Modifiers** dictate who can read/write properties and methods in a Class.
- `public`: Accessible anywhere (this is the default).
- `private`: Accessible ONLY inside the class itself.
- `protected`: Accessible inside the class AND any subclasses that inherit from it.
- These are **Compile-Time** checks only. They do not prevent a user from modifying the properties in runtime JavaScript.
