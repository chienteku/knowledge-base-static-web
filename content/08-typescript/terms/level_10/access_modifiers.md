# Access Modifiers (`public`, `private`, `protected`)

> **Level 10 — Classes & OOP in TypeScript**
> Keywords that control which parts of your code are allowed to read or modify a specific property or method inside a Class.

---

## 1. Prerequisites
- [Classes Overview](../level_10/classes.md) — The structure these modifiers attach to.
- [JavaScript Private Fields](../../../03-javascript/terms/level_07/class.md) — The runtime equivalent of `private`.

---

## 2. Term Category
- **TypeScript OOP Modifier**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Assuming TypeScript `private` Modifiers Enforce Runtime Privacy

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

### Mistake 5: Attempting Outside Access to `protected` Class Members

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

## 6. Practice Exercises

### Exercise 1: Protected vs Private

**Problem:** You have a `class Animal { private name: string; protected age: number; }`. You create `class Dog extends Animal`. Inside `Dog`, can you write `console.log(this.name)`? Can you write `console.log(this.age)`?

**Expected output:**
```text
You CANNOT access `this.name` because it is `private`. Private means *strictly* the Animal class.
You CAN access `this.age` because it is `protected`. Protected allows subclasses to access the property.
```

> [!check]- Answer
> - Think about inheritance!

---



### Exercise 2: Access Modifier Hierarchy Matrix

**Problem:** State visibility differences: `public` (everywhere), `protected` (class & subclasses), `private` (class only).

**Expected output:**
```text
public: everywhere, protected: subclasses, private: class only
```

> [!check]- Answer
> ```typescript
> console.log("public: everywhere, protected: subclasses, private: class only");
> ```
>
> **Explanation:** Access modifiers restrict compile-time member visibility across class hierarchies.

### Exercise 3: ES Private Fields `#` vs TS `private`

**Problem:** Which syntax enforces true hard JavaScript runtime privacy? (ES `#field`)

**Expected output:**
```text
ES #field syntax enforces runtime privacy
```

> [!check]- Answer
> ```typescript
> console.log("ES #field syntax enforces runtime privacy");
> ```
>
> **Explanation:** ES `#field` private members use native JavaScript language-level private slots.



### Exercise 4: Access Modifier Hierarchy Matrix

**Problem:** State visibility differences: `public` (everywhere), `protected` (class & subclasses), `private` (class only).

**Expected output:**
```text
public: everywhere, protected: subclasses, private: class only
```

> [!check]- Answer
> ```typescript
> console.log("public: everywhere, protected: subclasses, private: class only");
> ```
>
> **Explanation:** Access modifiers restrict compile-time member visibility across class hierarchies.

### Exercise 5: ES Private Fields `#` vs TS `private`

**Problem:** Which syntax enforces true hard JavaScript runtime privacy? (ES `#field`)

**Expected output:**
```text
ES #field syntax enforces runtime privacy
```

> [!check]- Answer
> ```typescript
> console.log("ES #field syntax enforces runtime privacy");
> ```
>
> **Explanation:** ES `#field` private members use native JavaScript language-level private slots.

## 7. Related Terms
- [Classes Overview](../level_10/classes.md) — Where these modifiers live.
- [Parameter Properties](../level_10/parameter_properties.md) — A shorthand trick using these exact keywords.

---

## 8. Key Takeaways
- **Access Modifiers** dictate who can read/write properties and methods in a Class.
- `public`: Accessible anywhere (this is the default).
- `private`: Accessible ONLY inside the class itself.
- `protected`: Accessible inside the class AND any subclasses that inherit from it.
- These are **Compile-Time** checks only. They do not prevent a user from modifying the properties in runtime JavaScript.
