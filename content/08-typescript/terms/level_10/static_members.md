# Static Members

> **Level 10 — Classes & OOP in TypeScript**
> Properties or methods inside a class that belong to the Class itself, rather than to instances (objects) created from the class.

---

## 1. Prerequisites
- [Classes Overview](classes.md) — The foundation of Object-Oriented Programming.

---

## 2. Term Category

**Object-Oriented Programming** (Class-Level Static Members): Static members (`static`) belong to the class constructor function itself rather than individual class instances.

---

## 3. Explanation

Static members (`static`) belong to the class constructor function itself rather than individual class instances.



---

- **Using `this` for Static Members:** Inside a non-static method, you cannot use `this.myStaticProp` to access a static property. You must use the Class Name directly (`MyClass.myStaticProp`).

---

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Defining Static Factory Methods and Constants

**Scenario:**
Create a `MathUtils` class with a static constant `PI` and a static factory method `createZeroPoint()`.

**Requirements:**
1. Use `static` keyword on fields and methods.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class MathUtils {
>   public static readonly PI = 3.14159;

  public static calculateArea(radius: number): number {
    return this.PI * radius ** 2;
  }
}

console.log(MathUtils.PI);
console.log(MathUtils.calculateArea(5));
```

> #### Technical Explanation
>
> 1. `static` members belong to the class constructor function (`MathUtils`) rather than instance objects (`new MathUtils()`).
> 2. Invoked directly on the class identifier (`MathUtils.calculateArea(5)`).
> 3. Ideal for global utility functions, constants, and singleton factory patterns.

---

### Exercise 2: Static Initialization Blocks (`static {}`)

**Scenario:**
Initialize complex static state inside a `static {}` block at class declaration time.

**Requirements:**
1. Use `static {}` initialization block.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class DatabaseConfig {
>   public static connectionString: string;

  static {
    const env = process.env.NODE_ENV || "development";
    DatabaseConfig.connectionString = env === "production" 
      ? "postgres://prod-db:5432" 
      : "postgres://localhost:5432";
  }
}

console.log(DatabaseConfig.connectionString);
```

> #### Technical Explanation
>
> 1. `static {}` blocks execute logic once when the class is loaded by the JavaScript engine.
> 2. Allows executing complex conditional statements and exception handling during static field initialization.
> 3. Feature aligned with modern ECMAScript standards.

---

### Exercise 3: Auditing Static Member Accessibility from Instance Methods

**Scenario:**
Explain why instance methods cannot access static members via `this.staticMember` without referencing `ClassName.staticMember` or `this.constructor`.

**Requirements:**
1. Show compile error when accessing `this.staticField` on instance.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class Application {
>   public static appName = "SaaS App";

  public getTitle(): string {
    // ❌ Compile Error: Property 'appName' does not exist on type 'Application' (instance)!
    // return this.appName;

    // ✅ CORRECT (Reference ClassName directly or this.constructor):
    return Application.appName;
  }
}
```

> #### Technical Explanation
>
> 1. `this` inside instance methods points to the instance object, NOT the static constructor function.
> 2. Static members exist on `Application`, not on `Application.prototype`.
> 3. Reference static members using the class name (`Application.appName`).

---



## 6. Related Terms
- [Access Modifiers (`public`, `private`, `protected`)](access_modifiers.md) — Used alongside `static` to control who can view or modify the static data.

---

---

## 7. Key Takeaways

- Static members (`static`) belong to the class constructor function itself rather than instance objects.
- `static {}` blocks execute once when the class is loaded by the JS engine for complex static initialization.
- Instance methods cannot access static members via `this.staticMember`; use `ClassName.staticMember` instead.
- Ideal for global utility functions, constants, and singleton factory patterns.
