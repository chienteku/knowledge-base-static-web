# Parameter Properties

> **Level 10 — Classes & OOP in TypeScript**
> A syntactic sugar shorthand in TypeScript that allows you to declare and initialize a class property in a single location: directly inside the constructor signature.

---

## 1. Prerequisites
- [Classes Overview](classes.md) — The standard, verbose way of initializing properties.
- [Access Modifiers (`public`, `private`, `protected`)](access_modifiers.md) — The keywords required to trigger this shorthand.

---

## 2. Term Category

**Object-Oriented Programming** (Constructor Parameter Shorthand): Parameter properties implicitly declare and initialize class member fields directly within constructor parameter declarations.



---

## 3. Explanation

### Environment Context
- **Compile-Time (Compiles to standard JS property assignment)**

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Refactoring Verbose Class Constructors to Parameter Properties

**Scenario:**
Refactor a verbose class constructor into clean parameter properties shorthand syntax.

**Requirements:**
1. Use `public`, `private`, or `readonly` inside constructor parameter lists.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ VERBOSE CLASS:
> // class User {
> //   public name: string;
> //   private age: number;
> //   constructor(name: string, age: number) {
> //     this.name = name;
> //     this.age = age;
> //   }
> // }

// ✅ CLEAN PARAMETER PROPERTIES SHORTHAND:
class User {
  constructor(
    public name: string,
    private age: number,
    public readonly id: string
  ) {}
}

const u = new User("Alice", 30, "usr_1");
console.log(u.name); // "Alice"
```

> #### Technical Explanation
>
> 1. Prefixing constructor parameters with access modifiers (`public`, `private`, `protected`, `readonly`) automatically declares and initializes member fields.
> 2. Eliminates redundant field declarations and `this.field = field` assignment boilerplate.
> 3. Significantly reduces visual noise in class definitions.

---

### Exercise 2: Transpiled JavaScript Output Analysis

**Scenario:**
Inspect transpiled JavaScript code generated from parameter properties shorthand.

**Requirements:**
1. Show TS parameter properties source vs transpiled JS output.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // TypeScript Source:
> class Item {
>   constructor(public title: string, private price: number) {}
> }
> ```

> ```javascript
> // Transpiled Output (JS):
> class Item {
>   constructor(title, price) {
>     this.title = title;
>     this.price = price;
>   }
> }
> ```

> #### Technical Explanation
>
> 1. `tsc` automatically expands parameter properties into field initializations inside the generated JS constructor.
> 2. Access modifiers are stripped completely during compilation.
> 3. Zero runtime performance penalty.

---

### Exercise 3: Auditing Parameter Property Modifier Omission Bugs

**Scenario:**
Explain why omitting access modifiers in constructor parameters converts them back into standard local arguments.

**Requirements:**
1. Show why `constructor(title: string)` does NOT create a class field `title`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class Widget {
>   // ❌ Does NOT create a class field 'title'! It is just a local constructor argument!
>   constructor(title: string) {}
> }

const w = new Widget("My Widget");
// console.log(w.title); // ❌ Compile Error: Property 'title' does not exist on type 'Widget'.
```

> #### Technical Explanation
>
> 1. Parameter property shorthand requires an EXPLICIT modifier (`public`, `private`, `protected`, or `readonly`).
> 2. Parameters without modifiers are treated as temporary local variables scoped strictly to the constructor body.
> 3. Common beginner oversight when using constructor shorthand.

---



## 6. Related Terms
- [Classes Overview](classes.md) — The parent topic.
- [Access Modifiers (`public`, `private`, `protected`)](access_modifiers.md) — The trigger for this feature.

---

## 7. Key Takeaways
- **Parameter Properties** are a shorthand syntax to remove boilerplate when initializing class properties.
- Prefixing a constructor parameter with `public`, `private`, `protected`, or `readonly` automatically declares that property on the class and assigns the argument to `this.property`.
- It collapses declaration, parameter definition, and assignment into a single line.
- If you forget the modifier, it remains a standard function argument and will not be attached to the class instance.
