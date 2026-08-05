# Parameter Properties

> **Level 10 — Classes & OOP in TypeScript**
> A syntactic sugar shorthand in TypeScript that allows you to declare and initialize a class property in a single location: directly inside the constructor signature.

---

## 1. Prerequisites
- [Classes Overview](classes.md) — The standard, verbose way of initializing properties.
- [Access Modifiers (`public`, `private`, `protected`)](access_modifiers.md) — The keywords required to trigger this shorthand.
---

## 2. Term Category
- **TypeScript Syntactic Sugar**

---

## 3. Environment Context
- **Compile-Time (Compiles to standard JS property assignment)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Look at a standard TypeScript class. You have to write the word `name` **four different times** just to assign it!
1. Declare the property: `name: string;`
2. Define the constructor parameter: `constructor(name: string)`
3. Use it in the assignment: `this.name = ...`
4. Use it as the value: `... = name;`

```typescript
// The Verbose Way
class User {
  public name: string;
  private age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}
```
This violates DRY and creates massive boilerplate. TypeScript introduced **Parameter Properties** to collapse all four steps into one.

### (2) The Shorthand Syntax
If you place an Access Modifier (`public`, `private`, `protected`) OR the `readonly` keyword directly in front of a constructor parameter, TypeScript will automatically declare the property and assign the value to `this` under the hood!

```typescript
// The Shorthand Way (Identical behavior to the code above!)
class User {
  constructor(public name: string, private age: number) {
    // Look, no body needed! TS automatically does `this.name = name`
  }
}
```

### (3) Mixing Standard and Parameter Properties
You can mix regular parameters and Parameter Properties in the same constructor.

```typescript
class Config {
  constructor(
    public id: string,      // Creates `this.id`
    private key: string,    // Creates `this.key`
    tempData: any           // Standard parameter. Does NOT create `this.tempData`
  ) {
    console.log(tempData);
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `public`

**The mistake:** A developer loves the shorthand, so they write:
```typescript
class Car {
  constructor(brand: string) {}
}
const c = new Car("Ford");
console.log(c.brand); // ❌ Error: Property 'brand' does not exist on type 'Car'.
```

**Why it's wrong:** To trigger the magic shorthand, you MUST include an access modifier (`public`/`private`/`protected`) or `readonly`. If you omit them, TS treats `brand` as a standard, temporary function argument that is thrown away as soon as the constructor finishes running.
**Golden Rule:** Even if a property is public (which is the default), you MUST explicitly write the word `public` in the constructor to trigger the Parameter Property shorthand.

---



### Mistake 2: Re-Declaring Class Field Properties when Using Constructor Parameter Properties

**The mistake:** Declaring `name: string;` at class root AND `constructor(public name: string)` (TS1086).

**Why it's wrong:** Adding `public`, `private`, `protected`, or `readonly` to constructor parameters automatically declares AND initializes the field. Re-declaring at class root causes duplicate member declarations.

*Incorrect:*
```typescript
class User {
    // name: string; // ❌ Duplicate identifier 'name'
    constructor(public name: string) {}
}
```

*Fix:*
```typescript
class User {
    constructor(public name: string) {} // Declares and assigns this.name automatically!
}
```

### Mistake 3: Expecting Parameter Properties Without Access Modifiers to Create Fields

**The mistake:** Writing `constructor(name: string)` expecting `this.name` to be automatically created.

**Why it's wrong:** Parameter property shorthand requires an explicit modifier (`public`, `private`, `protected`, or `readonly`). Without a modifier, it is a standard local parameter.

*Incorrect:*
```typescript
class User {
    constructor(name: string) {
        // this.name is NOT created automatically without access modifier!
    }
}
```

*Fix:*
```typescript
class User {
    constructor(public name: string) {} // Access modifier triggers field creation
}
```



### Mistake 4: Re-Declaring Class Field Properties when Using Constructor Parameter Properties

**The mistake:** Declaring `name: string;` at class root AND `constructor(public name: string)` (TS1086).

**Why it's wrong:** Adding `public`, `private`, `protected`, or `readonly` to constructor parameters automatically declares AND initializes the field. Re-declaring at class root causes duplicate member declarations.

*Incorrect:*
```typescript
class User {
    // name: string; // ❌ Duplicate identifier 'name'
    constructor(public name: string) {}
}
```

*Fix:*
```typescript
class User {
    constructor(public name: string) {} // Declares and assigns this.name automatically!
}
```

### Mistake 5: Expecting Parameter Properties Without Access Modifiers to Create Fields

**The mistake:** Writing `constructor(name: string)` expecting `this.name` to be automatically created.

**Why it's wrong:** Parameter property shorthand requires an explicit modifier (`public`, `private`, `protected`, or `readonly`). Without a modifier, it is a standard local parameter.

*Incorrect:*
```typescript
class User {
    constructor(name: string) {
        // this.name is NOT created automatically without access modifier!
    }
}
```

*Fix:*
```typescript
class User {
    constructor(public name: string) {} // Access modifier triggers field creation
}
```

## 6. Practice Exercises

### Exercise 1: Readonly Parameter Properties

**Problem:** You want to create a `DatabaseId` class. You want the ID string to be publicly accessible, but absolutely immutable (read-only) once instantiated. Write the class using the Parameter Property shorthand.

**Expected output:**
> [!check]- Answer
> ```typescript
> class DatabaseId {
>   constructor(public readonly id: string) {}
> }
> 
> // Alternatively, just `readonly` works too (it assumes public):
> // constructor(readonly id: string) {}
> ```
> - You can combine modifiers!

---



### Exercise 2: Readonly Private Parameter Property Shorthand

**Problem:** Create `class Config` using `constructor(private readonly apiKey: string)` shorthand.

**Expected output:**
> [!check]- Answer
> ```text
> Parameter property shorthand implemented
> ```
> ```typescript
> class Config {
>   constructor(private readonly apiKey: string) {}
>   getKey() { return this.apiKey; }
> }
> const c = new Config("secret");
> console.log("Parameter property shorthand implemented");
> ```
>
> **Explanation:** `private readonly` parameter properties declare, restrict, and initialize fields automatically.

---

### Exercise 3: Compiled JS Parameter Property Expansion

**Problem:** What JS code does `constructor(public id: number) {}` compile to?

**Expected output:**
> [!check]- Answer
> ```text
> constructor(id) { this.id = id; }
> ```
> ```typescript
> console.log("constructor(id) { this.id = id; }");
> ```
>
> **Explanation:** TS compiler expands parameter property shorthand into explicit constructor assignments.

---

### Exercise 4: Readonly Private Parameter Property Shorthand

**Problem:** Create `class Config` using `constructor(private readonly apiKey: string)` shorthand.

**Expected output:**
> [!check]- Answer
> ```text
> Parameter property shorthand implemented
> ```
> ```typescript
> class Config {
>   constructor(private readonly apiKey: string) {}
>   getKey() { return this.apiKey; }
> }
> const c = new Config("secret");
> console.log("Parameter property shorthand implemented");
> ```
>
> **Explanation:** `private readonly` parameter properties declare, restrict, and initialize fields automatically.

---

### Exercise 5: Compiled JS Parameter Property Expansion

**Problem:** What JS code does `constructor(public id: number) {}` compile to?

**Expected output:**
> [!check]- Answer
> ```text
> constructor(id) { this.id = id; }
> ```
> ```typescript
> console.log("constructor(id) { this.id = id; }");
> ```
>
> **Explanation:** TS compiler expands parameter property shorthand into explicit constructor assignments.

## 7. Related Terms
- [Classes Overview](classes.md) — The parent topic.
- [Access Modifiers (`public`, `private`, `protected`)](access_modifiers.md) — The trigger for this feature.
---

## 8. Key Takeaways
- **Parameter Properties** are a shorthand syntax to remove boilerplate when initializing class properties.
- Prefixing a constructor parameter with `public`, `private`, `protected`, or `readonly` automatically declares that property on the class and assigns the argument to `this.property`.
- It collapses declaration, parameter definition, and assignment into a single line.
- If you forget the modifier, it remains a standard function argument and will not be attached to the class instance.
