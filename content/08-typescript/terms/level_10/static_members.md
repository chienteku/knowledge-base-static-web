# Static Members

> **Level 10 — Classes & OOP in TypeScript**
> Properties or methods inside a class that belong to the Class itself, rather than to instances (objects) created from the class.

---

## 1. Prerequisites
- [Classes](../level_10/classes.md) — The foundation of Object-Oriented Programming.

---

## 2. Term Category
Object-Oriented Programming (OOP) Feature

---

## 3. Core Definition
In standard Object-Oriented Programming, when you create a property inside a class, every new object you instantiate gets its own independent copy of that property. 

However, if you mark a property or method with the **`static`** keyword, it belongs exclusively to the class blueprint itself. You cannot access it on `new MyClass()`; you must access it directly on `MyClass`.

---

## 4. Key Characteristics / Rules
- **Class-Level Scope:** Accessed directly via the Class Name (e.g., `Math.PI`), not via `this`.
- **Shared State:** Since it belongs to the class, all instances implicitly share the same underlying static data.
- **Can be Private:** You can combine `static` with access modifiers like `private static` to hide the static data from the outside world.

---

## 5. Typical Usage / Common Patterns

### The Singleton Pattern / Tracking Instances
```typescript
class Robot {
  // A static property that keeps track of how many robots have been built
  public static totalRobotsBuilt: number = 0;

  constructor(public name: string) {
    // We increment the static property whenever a new instance is created
    Robot.totalRobotsBuilt++;
  }

  // A static method
  public static reportProduction(): string {
    return `We have produced ${Robot.totalRobotsBuilt} robots.`;
  }
}

const r1 = new Robot("R2D2");
const r2 = new Robot("C3PO");

// Accessing the static property directly on the Class
console.log(Robot.totalRobotsBuilt); // Output: 2
console.log(Robot.reportProduction()); // Output: "We have produced 2 robots."
```

---

## 6. Common Pitfalls
- **Using `this` for Static Members:** Inside a non-static method, you cannot use `this.myStaticProp` to access a static property. You must use the Class Name directly (`MyClass.myStaticProp`).

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Attempting Access to Static Members from Class Instance Objects

**The mistake:** Writing `const inst = new MathUtils(); inst.add(1, 2);` (TS2339).

**Why it's wrong:** Static members belong to the constructor function itself (`MathUtils.add`), NOT to instantiated objects.

*Incorrect:*
```typescript
class MathUtils { static add(a: number, b: number) { return a + b; } }
const m = new MathUtils();
// m.add(1, 2); // ❌ Property 'add' does not exist on type 'MathUtils'
```

*Fix:*
```typescript
class MathUtils { static add(a: number, b: number) { return a + b; } }
MathUtils.add(1, 2); // Access via Class Constructor name
```

### Mistake 2: Using Class Generic Parameters inside Static Member Declarations

**The mistake:** Writing `static defaultVal: T;` inside `class Box<T>`.

**Why it's wrong:** Static members exist on the class constructor object independently of generic instance instantiations.

*Incorrect:*
```typescript
class Box<T> {
    // static item: T; // ❌ Static members cannot reference class type parameters!
}
```

*Fix:*
```typescript
class Box<T> {
    static create<U>(val: U): Box<U> { return new Box<U>(); } // Static methods use own generics
}
```

### Mistake 3: Overwriting Built-In Static Function Property Names like `name` or `length`

**The mistake:** Declaring `static name: string` inside class definitions.

**Why it's wrong:** In JavaScript, function objects already have built-in read-only static properties `name` and `length`. Overwriting them causes collisions.

*Incorrect:*
```typescript
class User {
    // static name: string; // ❌ Static property 'name' conflicts with built-in property 'Function.name'
}
```

*Fix:*
```typescript
class User {
    static displayName: string; // Use distinct non-colliding static property name
}
```



### Mistake 4: Attempting Access to Static Members from Class Instance Objects

**The mistake:** Writing `const inst = new MathUtils(); inst.add(1, 2);` (TS2339).

**Why it's wrong:** Static members belong to the constructor function itself (`MathUtils.add`), NOT to instantiated objects.

*Incorrect:*
```typescript
class MathUtils { static add(a: number, b: number) { return a + b; } }
const m = new MathUtils();
// m.add(1, 2); // ❌ Property 'add' does not exist on type 'MathUtils'
```

*Fix:*
```typescript
class MathUtils { static add(a: number, b: number) { return a + b; } }
MathUtils.add(1, 2); // Access via Class Constructor name
```

### Mistake 5: Using Class Generic Parameters inside Static Member Declarations

**The mistake:** Writing `static defaultVal: T;` inside `class Box<T>`.

**Why it's wrong:** Static members exist on the class constructor object independently of generic instance instantiations.

*Incorrect:*
```typescript
class Box<T> {
    // static item: T; // ❌ Static members cannot reference class type parameters!
}
```

*Fix:*
```typescript
class Box<T> {
    static create<U>(val: U): Box<U> { return new Box<U>(); } // Static methods use own generics
}
```

### Mistake 6: Overwriting Built-In Static Function Property Names like `name` or `length`

**The mistake:** Declaring `static name: string` inside class definitions.

**Why it's wrong:** In JavaScript, function objects already have built-in read-only static properties `name` and `length`. Overwriting them causes collisions.

*Incorrect:*
```typescript
class User {
    // static name: string; // ❌ Static property 'name' conflicts with built-in property 'Function.name'
}
```

*Fix:*
```typescript
class User {
    static displayName: string; // Use distinct non-colliding static property name
}
```

## 6. Practice Exercises



### Exercise 1: Static Class Factory Pattern

**Problem:** Create `class User` with `static createGuest()` returning a new `User("Guest")`.

**Expected output:**
> [!check]- Answer
> ```text
> Guest
> ```
> ```typescript
> class User {
>   constructor(public name: string) {}
>   static createGuest() { return new User("Guest"); }
> }
> console.log(User.createGuest().name);
> ```
>
> **Explanation:** Static factory methods instantiate pre-configured class objects.

---

### Exercise 2: Static Initialization Blocks (`static {}`)

**Problem:** Use ES2022 `static {}` initialization block to configure static state.

**Expected output:**
> [!check]- Answer
> ```text
> Static block executed
> ```
> ```typescript
> class App {
>   static config: object;
>   static {
>     App.config = { env: "production" };
>   }
> }
> console.log("Static block executed");
> ```
>
> **Explanation:** Static initialization blocks execute code logic when class constructors are defined.

---

### Exercise 3: Static Property Inheritance

**Problem:** Are static members inherited by derived subclass constructors? (Yes)

**Expected output:**
> [!check]- Answer
> ```text
> Yes, static members are inherited along class prototype chains
> ```
> ```typescript
> class Base { static id = 1; }
> class Child extends Base {}
> console.log(Child.id); // 1
> console.log("Yes, static members are inherited along class prototype chains");
> ```
>
> **Explanation:** Derived classes inherit static properties from parent class constructors.

---

### Exercise 4: Static Class Factory Pattern

**Problem:** Create `class User` with `static createGuest()` returning a new `User("Guest")`.

**Expected output:**
> [!check]- Answer
> ```text
> Guest
> ```
> ```typescript
> class User {
>   constructor(public name: string) {}
>   static createGuest() { return new User("Guest"); }
> }
> console.log(User.createGuest().name);
> ```
>
> **Explanation:** Static factory methods instantiate pre-configured class objects.

---

### Exercise 5: Static Initialization Blocks (`static {}`)

**Problem:** Use ES2022 `static {}` initialization block to configure static state.

**Expected output:**
> [!check]- Answer
> ```text
> Static block executed
> ```
> ```typescript
> class App {
>   static config: object;
>   static {
>     App.config = { env: "production" };
>   }
> }
> console.log("Static block executed");
> ```
>
> **Explanation:** Static initialization blocks execute code logic when class constructors are defined.

---

### Exercise 6: Static Property Inheritance

**Problem:** Are static members inherited by derived subclass constructors? (Yes)

**Expected output:**
> [!check]- Answer
> ```text
> Yes, static members are inherited along class prototype chains
> ```
> ```typescript
> class Base { static id = 1; }
> class Child extends Base {}
> console.log(Child.id); // 1
> console.log("Yes, static members are inherited along class prototype chains");
> ```
>
> **Explanation:** Derived classes inherit static properties from parent class constructors.

## 7. Related Terms
- [Access Modifiers](../level_10/access_modifiers.md) — Used alongside `static` to control who can view or modify the static data.

---
