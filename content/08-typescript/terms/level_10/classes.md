# Classes Overview

> **Level 10 — Classes & OOP in TypeScript**
> The standard ES6 JavaScript Class structure, enhanced by TypeScript with strict property initialization, typing, and access controls.

---

## 1. Prerequisites
- [Interfaces](../level_03/interfaces.md) — The alternative to Classes for defining object shapes.
- [JavaScript Classes](../../../03-javascript/terms/level_07/class.md) — The runtime feature TypeScript is building upon.

---

## 2. Term Category
- **TypeScript Core Syntax / OOP**

---

## 3. Environment Context
- **Runtime & Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern JavaScript (ES6+), Classes are standard way to create objects with shared methods (Object-Oriented Programming).
However, in pure JavaScript, class properties are dynamic. You can add new properties in the constructor or arbitrarily attach them later.
TypeScript brings strictness to Classes. You must declare every single property the Class intends to have *before* the constructor, and you must initialize those properties, or TS will throw an error.

### (2) The TypeScript Class Structure
Notice how we must declare `id` and `title` at the top of the class before the `constructor`.

```typescript
class TodoItem {
  // 1. Property Declarations (TypeScript specific)
  id: number;
  title: string;
  isCompleted: boolean = false; // Default value

  // 2. The Constructor
  constructor(id: number, title: string) {
    this.id = id;
    this.title = title;
    // We don't need to initialize isCompleted because it has a default
  }

  // 3. Methods
  complete() {
    this.isCompleted = true;
  }
}

const item = new TodoItem(1, "Buy Milk");
```

### (3) Classes act as both Values and Types!
This is one of the most unique features of Classes in TypeScript.
When you declare `class User`, you create two things simultaneously:
1. A **Runtime Value**: The actual JavaScript constructor function `User` that you call with `new User()`.
2. A **Compile-Time Type**: An Interface representing the instance of the class, allowing you to write `function save(user: User)`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The `strictPropertyInitialization` Error

**The mistake:** A developer writes a class like this:
```typescript
class User {
  name: string; // ❌ Error: Property 'name' has no initializer and is not definitely assigned in the constructor.
  
  constructor() {
    this.setupName();
  }
  
  setupName() { this.name = "Alice"; }
}
```

**Why it's wrong:** TypeScript is incredibly strict about ensuring your class properties aren't `undefined`. If you declare `name: string`, TS mathematically verifies that `name` is assigned a value inside the `constructor`. Because the assignment happened in a secondary function (`setupName`), TS cannot guarantee it runs, and throws an error.
**Golden Rule:** Initialize properties either at declaration (`name = "Alice"`) or directly inside the `constructor`. If you truly know what you are doing, you can use the Definite Assignment Assertion operator (`name!: string`) to tell TS to ignore the error.

---



### Mistake 2: Referencing Instance Properties in Constructor Before Calling `super()`

**The mistake:** Writing `this.name = name; super();` in subclass constructors (TS17009).

**Why it's wrong:** In derived class constructors, `super()` MUST be called before accessing `this` or returning from the constructor.

*Incorrect:*
```typescript
class Base {}
class Child extends Base {
    name: string;
    constructor(name: string) {
        // this.name = name; // ❌ 'super' must be called before accessing 'this'
        super();
    }
}
```

*Fix:*
```typescript
class Base {}
class Child extends Base {
    name: string;
    constructor(name: string) {
        super(); // Call super first
        this.name = name;
    }
}
```

### Mistake 3: Failing to Initialize Class Properties without Definite Assignment Assertions

**The mistake:** Declaring `class User { name: string; }` with `strictPropertyInitialization: true` without initializers.

**Why it's wrong:** With strict property initialization, class properties MUST be initialized in their declaration or constructor body.

*Incorrect:*
```typescript
class User {
    // name: string; // ❌ Property 'name' has no initializer and is not definitely assigned in constructor
}
```

*Fix:*
```typescript
class User {
    name!: string; // Definite assignment assertion OR initialize directly
}
```



### Mistake 4: Referencing Instance Properties in Constructor Before Calling `super()`

**The mistake:** Writing `this.name = name; super();` in subclass constructors (TS17009).

**Why it's wrong:** In derived class constructors, `super()` MUST be called before accessing `this` or returning from the constructor.

*Incorrect:*
```typescript
class Base {}
class Child extends Base {
    name: string;
    constructor(name: string) {
        // this.name = name; // ❌ 'super' must be called before accessing 'this'
        super();
    }
}
```

*Fix:*
```typescript
class Base {}
class Child extends Base {
    name: string;
    constructor(name: string) {
        super(); // Call super first
        this.name = name;
    }
}
```

### Mistake 5: Failing to Initialize Class Properties without Definite Assignment Assertions

**The mistake:** Declaring `class User { name: string; }` with `strictPropertyInitialization: true` without initializers.

**Why it's wrong:** With strict property initialization, class properties MUST be initialized in their declaration or constructor body.

*Incorrect:*
```typescript
class User {
    // name: string; // ❌ Property 'name' has no initializer and is not definitely assigned in constructor
}
```

*Fix:*
```typescript
class User {
    name!: string; // Definite assignment assertion OR initialize directly
}
```

## 6. Practice Exercises

### Exercise 1: Classes vs Interfaces

**Problem:** Both `class User` and `interface User` allow you to define an object shape and use it as a type (`const u: User`). When should you use a Class, and when should you use an Interface?

**Expected output:**
```text
- Use an **Interface** when you only care about the *Shape* of the data (e.g., standard API JSON responses, React component props, or function parameters). Interfaces are completely erased at compile-time, so they have zero performance cost.
- Use a **Class** when you need *Behavior* (methods) combined with State (properties), or when you specifically need the `instanceof` operator at runtime.
```

> [!check]- Answer
> - Think about the Compile-Time vs Runtime erasure rules.

---



### Exercise 2: Class Implementation with Methods and Properties

**Problem:** Create `class Car` with `speed: number` and method `accelerate(amount: number): number`.

**Expected output:**
```text
Car class implemented
```

> [!check]- Answer
> ```typescript
> class Car {
>   constructor(public speed: number = 0) {}
>   accelerate(amount: number): number {
>     return this.speed += amount;
>   }
> }
> const c = new Car(10);
> console.log(c.accelerate(20));
> ```
>
> **Explanation:** Classes encapsulate state properties and behavior methods into object instances.

### Exercise 3: Getter and Setter Method Typing

**Problem:** Define getter `get name(): string` and setter `set name(val: string)`.

**Expected output:**
```text
Getter/setter accessors implemented
```

> [!check]- Answer
> ```typescript
> class Person {
>   private _name = "";
>   get name(): string { return this._name; }
>   set name(val: string) { this._name = val; }
> }
> console.log("Getter/setter accessors implemented");
> ```
>
> **Explanation:** Accessor getters and setters control property read and write operations.



### Exercise 4: Class Implementation with Methods and Properties

**Problem:** Create `class Car` with `speed: number` and method `accelerate(amount: number): number`.

**Expected output:**
```text
Car class implemented
```

> [!check]- Answer
> ```typescript
> class Car {
>   constructor(public speed: number = 0) {}
>   accelerate(amount: number): number {
>     return this.speed += amount;
>   }
> }
> const c = new Car(10);
> console.log(c.accelerate(20));
> ```
>
> **Explanation:** Classes encapsulate state properties and behavior methods into object instances.

### Exercise 5: Getter and Setter Method Typing

**Problem:** Define getter `get name(): string` and setter `set name(val: string)`.

**Expected output:**
```text
Getter/setter accessors implemented
```

> [!check]- Answer
> ```typescript
> class Person {
>   private _name = "";
>   get name(): string { return this._name; }
>   set name(val: string) { this._name = val; }
> }
> console.log("Getter/setter accessors implemented");
> ```
>
> **Explanation:** Accessor getters and setters control property read and write operations.

## 7. Related Terms
- [Access Modifiers](../level_10/access_modifiers.md) — The `private`/`public` keywords added to TS classes.
- [`implements` Keyword](../level_10/implements.md) — How to force a Class to obey an Interface.

---

## 8. Key Takeaways
- **Classes** in TypeScript are standard ES6 JavaScript classes, but with strict property declarations and typing.
- All properties must be declared at the top of the class body.
- TypeScript strictly enforces that all declared properties are initialized (either with a default value or inside the constructor).
- A Class uniquely acts as both a **Runtime Value** (the constructor) and a **Compile-Time Type** (the shape of the instance).
