# Interfaces

> **Level 3 — Object Types & Interfaces**
> A named contract that defines the shape of an object. It is the primary, most powerful way to define reusable object structures in TypeScript.

---

## 1. Prerequisites
- [Object Types](object_types.md) — The concept that Interfaces abstract.

---

## 2. Term Category

**TypeScript Core Syntax** (Object Interface Contracts): Interfaces define object structure contracts, supporting inheritance extension (`extends`) and automatic declaration merging.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
Writing inline Object Types (`{ name: string, age: number }`) inside every function signature is unreadable and violates the DRY (Don't Repeat Yourself) principle. 
We need a way to declare a "Shape" once, give it a name, and reuse it everywhere. **Interfaces** solve this. 

### (2) Declaring and Using Interfaces
You declare an Interface using the `interface` keyword. By convention, interface names are written in PascalCase.

```typescript
// 1. Declare the shape
interface User {
  name: string;
  age: number;
}

// 2. Reuse it everywhere!
function greet(user: User) { ... }
function save(user: User) { ... }

const myUser: User = { name: "Alice", age: 28 };
```

### (3) Interface Inheritance (Extends)
The superpower of Interfaces is that they can inherit from other Interfaces using the `extends` keyword, exactly like Classes in Object-Oriented Programming.
This allows you to build complex shapes out of smaller, reusable pieces.

```typescript
interface Animal {
  name: string;
}

// Dog inherits 'name', and adds 'breed'
interface Dog extends Animal {
  breed: string;
}

const myDog: Dog = { name: "Rex", breed: "German Shepherd" };
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Declaration Merging (Accidental Overwrites)

**The mistake:** A developer creates `interface Window { myGlobalFlag: boolean; }` in their code.

**Why it happens:** Unlike Type Aliases, Interfaces in TypeScript support **Declaration Merging**. If you declare two interfaces with the exact same name in the same scope, TypeScript will *merge* them together! 
Because `Window` is already a massive built-in TS interface representing the browser, the developer just successfully added `myGlobalFlag` to the global `window` object type!
**Golden Rule:** Declaration merging is powerful for augmenting global libraries, but it can cause incredibly confusing bugs if you accidentally reuse a common name. If you do not want merging, use `type` instead of `interface`.

---



### Mistake 2: Attempting to Model Union Types using `interface` Syntax

**The mistake:** Writing `interface Status = "open" | "closed";` (SyntaxError).

**Why it's wrong:** `interface` defines object shapes and class contracts. Primitive union types or tuple aliases must be declared using `type` alias syntax.

*Incorrect:*
```typescript
// interface Status = "open" | "closed"; // ❌ SyntaxError
```

*Fix:*
```typescript
type Status = "open" | "closed"; // Correct use of type alias for unions
```

### Mistake 3: Confusing Interface Inheritance `extends` with Type Intersection `&`

**The mistake:** Using `&` with `interface` syntax expecting single inheritance hierarchy optimization.

**Why it's wrong:** `interface Child extends Parent` provides better compiler performance and error messages than complex type intersection chains.

*Incorrect:*
```typescript
type A = { a: number };
type B = { b: string };
type AB = A & B; // Type intersection
```

*Fix:*
```typescript
interface A { a: number }
interface B extends A { b: string } // Interface inheritance
```

## 5. Practice Exercises

### Exercise 1: Extending Interfaces with `extends`

**Scenario:**
Define a base `Entity` interface and extend it into a `UserEntity` interface.

**Requirements:**
1. Create `Entity` with `id` and `createdAt`.
2. Extend `Entity` to create `UserEntity` with `email`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Entity {
>   id: string;
>   createdAt: Date;
> }
> 
> interface UserEntity extends Entity {
>   email: string;
>   role: "admin" | "user";
> }
> 
> const user: UserEntity = {
>   id: "usr_100",
>   createdAt: new Date(),
>   email: "admin@example.com",
>   role: "admin"
> };
> ```
> 
> #### Technical Explanation
>
> 1. `interface Child extends Parent` inherits all properties from the parent interface.
> 2. Enables clean OOP composition and interface inheritance hierarchies.
> 3. Improves compilation performance compared to complex type intersections (`&`).
> 
---

### Exercise 2: Implementing Interfaces in Classes

**Scenario:**
Create a class implementing a `Printable` interface contract.

**Requirements:**
1. Define `Printable` interface with `print(): void` method.
2. Implement interface in `Invoice` class.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Printable {
>   print(): void;
> }
> 
> class Invoice implements Printable {
>   constructor(public id: number, public amount: number) {}
> 
>   print(): void {
>     console.log(`Invoice #${this.id}: $${this.amount}`);
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. `class ClassName implements InterfaceName` verifies that the class satisfies the interface contract.
> 2. Ensures that required methods (`print()`) and properties are present on class instances.
> 3. Standard object-oriented architecture pattern.
> 
---

### Exercise 3: Comparative Decision Matrix: `interface` vs `type`

**Scenario:**
Formulate an architectural selection matrix comparing `interface` against Type Aliases (`type`).

**Requirements:**
1. Contrast declaration merging, extension syntax, object shape modeling, and union type support.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> interface vs type Selection Matrix:
> - interface: Declaration merging SUPPORTED, extends syntax, best for object shapes & OOP contracts. Cannot represent primitives, unions, or tuples directly.
> - type: Declaration merging UNSUPPORTED, intersection (&) syntax, supports primitive aliases, unions ('A' | 'B'), tuples, and mapped types.
> Rule of Thumb: Prefer interface for public APIs & object shapes; use type for unions, primitives & utility computations.
> ```
> 
> #### Technical Explanation
>
> 1. Interfaces are open and extensible via declaration merging and `extends`.
> 2. Type aliases are closed and versatile for complex type mathematics and unions.
> 3. Foundational architectural choice in TypeScript.
> 
---



## 6. Related Terms
- [Type Aliases (`type`)](../level_05/type_aliases.md) — The alternative way to name a type.
- [`implements` Keyword](../level_10/implements.md) — How Classes use Interfaces to enforce their own shape.
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — Related concept: Structural Typing / Duck Typing.
- [Declaration Merging](declaration_merging.md) — Related concept: Declaration Merging.
- [Index Signatures](index_signatures.md) — Related concept: Index Signatures.
- [Object Types](object_types.md) — Related concept: Object Types.
- [Optional Properties (`?`)](optional_properties.md) — Related concept: Optional Properties (`?`).
- [Readonly Properties (`readonly`)](readonly.md) — Related concept: Readonly Properties (`readonly`).
- [`this` Typing in Functions](../level_04/this_typing.md) — Related concept: `this` Typing in Functions.
- [Intersection Types (`&`)](../level_05/intersection_types.md) — Related concept: Intersection Types (`&`).
- [Abstract Classes](../level_10/abstract_classes.md) — Related concept: Abstract Classes.
- [Declaration Files (`.d.ts`)](../level_11/declaration_files.md) — Related concept: Declaration Files (`.d.ts`).

---

## 7. Key Takeaways
- **Interfaces** are named contracts that define the required shape of an object.
- They drastically improve code readability and reusability.
- Interfaces can inherit from one another using the `extends` keyword.
- Interfaces uniquely support **Declaration Merging**, meaning declaring the same interface twice will combine their properties rather than throwing an error.
- Prefer `interface` for defining object structures, and `type` for unions/advanced types.
