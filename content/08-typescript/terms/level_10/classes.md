# Classes Overview

> **Level 10 — Classes & OOP in TypeScript**
> The standard ES6 JavaScript Class structure, enhanced by TypeScript with strict property initialization, typing, and access controls.

---

## 1. Prerequisites
- [Interfaces](../level_03/interfaces.md) — The alternative to Classes for defining object shapes.
- [Class](../../../03-javascript/terms/level_07/class.md) — The runtime feature TypeScript is building upon.

---

## 2. Term Category

**Object-Oriented Programming** (Class Instance & Prototype Blueprint): Classes combine field state, constructor initialization, and prototype methods into object blueprints with static type checking.



---

## 3. Explanation

### Environment Context
- **Runtime & Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Authoring Class Blueprints with Methods and Fields

**Scenario:**
Create a `User` class with `name` and `email` properties and a `getProfile()` method.

**Requirements:**
1. Declare fields, constructor, and method.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class User {
>   name: string;
>   email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

  getProfile(): string {
    return `${this.name} <${this.email}>`;
  }
}

const user = new User("Alice", "alice@example.com");
console.log(user.getProfile());
```

> #### Technical Explanation
>
> 1. Classes act as blueprints for creating stateful object instances.
> 2. Field types (`name: string`) are verified during assignment inside constructor functions.
> 3. Methods are attached to `User.prototype` to minimize memory usage across instances.

---

### Exercise 2: Class Inheritance with `super()`

**Scenario:**
Extend `User` into an `AdminUser` class that calls `super()` in its constructor.

**Requirements:**
1. Extend `User` and call `super(name, email)` in `AdminUser`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class AdminUser extends User {
>   permissions: string[];

  constructor(name: string, email: string, permissions: string[]) {
    super(name, email); // Must call super() before accessing 'this'!
    this.permissions = permissions;
  }
}

const admin = new AdminUser("Bob", "bob@example.com", ["read", "write"]);
```

> #### Technical Explanation
>
> 1. Subclasses extending parent classes must invoke `super()` in their constructors.
> 2. `super()` executes the parent constructor to initialize inherited fields.
> 3. `this` cannot be accessed before calling `super()`.

---

### Exercise 3: Auditing Un-Initialized Class Field Errors

**Scenario:**
Explain why un-initialized class fields trigger compile errors under `"strictPropertyInitialization": true`.

**Requirements:**
1. Show compile error on un-initialized field without constructor assignment.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class Product {
>   // ❌ Compile Error under strictPropertyInitialization: Property 'title' has no initializer...
>   // title: string; 

  // ✅ CORRECT (Initialize in constructor or inline):
  title: string = "Untitled";
}
```

> #### Technical Explanation
>
> 1. `"strictPropertyInitialization": true` ensures all declared class fields are initialized.
> 2. Fields must be initialized directly inline (`title: string = ""`) or inside the constructor body.
> 3. Eliminates `undefined` runtime property bugs on class instances.

---



## 6. Related Terms
- [Access Modifiers (`public`, `private`, `protected`)](access_modifiers.md) — The `private`/`public` keywords added to TS classes.
- [`implements` Keyword](implements.md) — How to force a Class to obey an Interface.
- [`typeof` & `instanceof` Guards](../level_06/typeof_instanceof.md) — Related concept: `typeof` & `instanceof` Guards.
- [Generic Interfaces & Classes](../level_07/generic_interfaces_classes.md) — Related concept: Generic Interfaces & Classes.
- [Decorators](decorators.md) — Related concept: Decorators.
- [Parameter Properties](parameter_properties.md) — Related concept: Parameter Properties.
- [Abstract Classes](abstract_classes.md) — Abstract classes.

---

## 7. Key Takeaways
- **Classes** in TypeScript are standard ES6 JavaScript classes, but with strict property declarations and typing.
- All properties must be declared at the top of the class body.
- TypeScript strictly enforces that all declared properties are initialized (either with a default value or inside the constructor).
- A Class uniquely acts as both a **Runtime Value** (the constructor) and a **Compile-Time Type** (the shape of the instance).
