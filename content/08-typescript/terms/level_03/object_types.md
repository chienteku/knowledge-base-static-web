# Object Types

> **Level 3 — Object Types & Interfaces**
> The most fundamental way to define the shape (structure) of an object in TypeScript. It ensures an object contains exactly the required properties with the correct types.

---

## 1. Prerequisites
- [Primitive Types](../level_02/primitive_types.md) — The types usually found inside the object properties.

---

## 2. Term Category

**TypeScript Core Syntax** (Object Shape Definitions): Object types describe the properties, methods, and structure of JavaScript objects using type aliases or inline type literal syntax.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
In JavaScript, objects are completely fluid. You can create an object `const user = { name: "Alice" }`, and then later do `user.age = 28` or `delete user.name`. This fluidity causes endless bugs when a function expects a specific property that no longer exists.
TypeScript uses **Object Types** to lock down the "shape" of an object. If an object is defined as having a `name` and an `age`, it MUST have both. It cannot have only one, and it cannot have a third random property like `email`.

### (2) The Inline Object Type
The syntax looks identical to a JavaScript object literal, but instead of *values*, you provide *types*.

```typescript
function greet(user: { name: string; age: number }) {
  console.log("Hello " + user.name);
}

// ✅ Valid
greet({ name: "Alice", age: 28 });

// ❌ Error: Property 'age' is missing
greet({ name: "Bob" }); 

// ❌ Error: Object literal may only specify known properties, and 'email' does not exist in type '{ name: string; age: number; }'
greet({ name: "Charlie", age: 30, email: "c@c.com" });
```

### (3) The Limit of Inline Types
While typing objects "inline" (directly in the function parameters as seen above) works, it becomes incredibly messy if the object has 10 properties, or if you need to use the exact same object shape in 5 different functions. 
Because of this, we almost always abstract Object Types out into [Interfaces](../level_03/interfaces.md) or [Type Aliases](../level_05/type_aliases.md).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Typing `Object` with a capital 'O'

**The mistake:** A developer wants a function to accept any object, so they write `function process(data: Object)`.

**Why it's wrong:** In TypeScript, `Object` (capital O) refers to the global JavaScript Object prototype. It allows *anything* except `null` and `undefined` (even numbers and strings!).
Similarly, `{}` (the empty object type) means "an object with zero known properties."
**Golden Rule:** If you truly need a function to accept *any* standard object, use the built-in `Record<string, unknown>` utility type. But ideally, you should always define the exact shape of the object you expect.

---



### Mistake 2: Using Capitalized `Object` Type Annotation instead of `{}` or `object`

**The mistake:** Annotating variables with `: Object` or `: {}` expecting a structured record.

**Why it's wrong:** Capitalized `Object` describes all JS objects inheriting from `Object.prototype`, including primitives (like string, number). Use `object` (non-primitive) or `{ prop: type }`.

*Incorrect:*
```typescript
let data: Object = 123; // ❌ Compiles because numbers inherit from Object.prototype!
```

*Fix:*
```typescript
let data: object = { a: 1 }; // Only permits non-primitive objects
```

### Mistake 3: Re-assigning Nested Properties on Const Object Variables

**The mistake:** Assuming `const obj = { a: 1 };` prevents mutating property `obj.a = 2`.

**Why it's wrong:** `const` prevents re-assigning the variable reference itself, NOT mutating internal object properties. Use `readonly` property modifiers.

*Incorrect:*
```typescript
const user = { name: "Alice" };
user.name = "Bob"; // Mutates property!
```

*Fix:*
```typescript
const user: { readonly name: string } = { name: "Alice" };
// user.name = "Bob"; // ❌ Cannot assign to 'name' because it is a read-only property
```

## 5. Practice Exercises

### Exercise 1: Annotating Inline Object Types

**Scenario:**
Annotate a function receiving an inline object type parameter representing a user session.

**Requirements:**
1. Define inline object parameter type `{ user: string; token: string }`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function authenticate(session: { user: string; token: string }): boolean {
>   return session.token.length > 0;
> }
> 
> authenticate({ user: "alice", token: "tok_abc123" });
> ```
> 
> #### Technical Explanation
>
> 1. Inline object types `{ key: Type }` define property requirements directly in function parameter lists.
> 2. Useful for quick one-off function parameters.
> 3. Structural typing rules apply identically to inline object types and named interfaces.
> 
---

### Exercise 2: Reusing Object Shapes with Type Aliases

**Scenario:**
Extract an inline object shape into a reusable `type` alias `Product`.

**Requirements:**
1. Define `type Product = { id: string; name: string; price: number }`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Product = {
>   id: string;
>   name: string;
>   price: number;
> };
> 
> function formatProduct(product: Product): string {
>   return `${product.name} - $${product.price.toFixed(2)}`;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `type Product = { ... }` names an object shape for reuse across multiple function signatures.
> 2. Promotes DRY (Don't Repeat Yourself) type declarations across a codebase.
> 3. Clean object shape abstraction.
> 
---

### Exercise 3: Nested Object Shape Annotations

**Scenario:**
Annotate a complex nested object shape containing address data.

**Requirements:**
1. Define nested object type structure.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type UserWithAddress = {
>   id: number;
>   profile: {
>     firstName: string;
>     lastName: string;
>   };
>   address: {
>     street: string;
>     city: string;
>     zipCode: string;
>   };
> };
> ```
> 
> #### Technical Explanation
>
> 1. Object types can nest child object definitions arbitrarily deep.
> 2. All nested fields are strictly verified during property access.
> 3. Provides precise shape guarantees for complex JSON API payloads.
> 
---



## 6. Related Terms
- [Interfaces](interfaces.md) — The best way to abstract and reuse Object Types.
- [Optional Properties (`?`)](optional_properties.md) — How to make object properties non-mandatory.
- [Excess Property Checks](excess_property_checks.md) — Related concept: Excess Property Checks.

---

## 7. Key Takeaways
- **Object Types** define the strict shape of a JavaScript object, listing its properties and their corresponding types.
- TypeScript strictly enforces that an object perfectly matches its Type—no missing properties, and no extra/unknown properties allowed during literal assignment.
- Inline Object Types are hard to read and reuse; they should usually be extracted into Interfaces or Type Aliases.
- Never use the generic `Object` (capital O) to type an object.
