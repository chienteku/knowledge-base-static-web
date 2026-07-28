# Interfaces

> **Level 3 — Object Types & Interfaces**
> A named contract that defines the shape of an object. It is the primary, most powerful way to define reusable object structures in TypeScript.

---

## 1. Prerequisites
- [Object Types](../level_03/object_types.md) — The concept that Interfaces abstract.

---

## 2. Term Category
- **TypeScript Core Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Interface vs Type Alias

**Problem:** You can also define an object shape using `type User = { name: string }`. In modern TypeScript, when should you use `interface` and when should you use `type`?

**Expected output:**
> [!check]- Answer
> ```text
> The modern TS community consensus:
> - Use `interface` by default when defining the shape of Objects or Classes. It provides better error messages and is more performant for the compiler.
> - Use `type` when you need advanced type manipulation (like Unions `type A = string | number`, Intersections, or mapped types).
> ```
> - Which one supports `extends` naturally?

---



### Exercise 2: Extending Multiple Interfaces

**Problem:** Create `interface Child extends Parent1, Parent2` combining `id: number` and `name: string`.

**Expected output:**
> [!check]- Answer
> ```text
> Child interface extends multiple parents
> ```
> ```typescript
> interface Parent1 { id: number }
> interface Parent2 { name: string }
> interface Child extends Parent1, Parent2 {}
> const c: Child = { id: 1, name: "Alice" };
> console.log("Child interface extends multiple parents");
> ```
>
> **Explanation:** Interfaces can extend multiple parent interfaces simultaneously.

---

### Exercise 3: Interface vs Type Alias Selection Rule

**Problem:** State recommended TS guideline for modeling public object shapes (Prefer Interface).

**Expected output:**
> [!check]- Answer
> ```text
> Prefer interface for object shapes to enable declaration merging & performance
> ```
> ```typescript
> console.log("Prefer interface for object shapes to enable declaration merging & performance");
> ```
>
> **Explanation:** Interfaces offer better compiler caching and extension semantics for object types.

## 7. Related Terms
- [Type Aliases](../level_05/type_aliases.md) — The alternative way to name a type.
- [`implements`](../level_10/implements.md) — How Classes use Interfaces to enforce their own shape.

---

## 8. Key Takeaways
- **Interfaces** are named contracts that define the required shape of an object.
- They drastically improve code readability and reusability.
- Interfaces can inherit from one another using the `extends` keyword.
- Interfaces uniquely support **Declaration Merging**, meaning declaring the same interface twice will combine their properties rather than throwing an error.
- Prefer `interface` for defining object structures, and `type` for unions/advanced types.
