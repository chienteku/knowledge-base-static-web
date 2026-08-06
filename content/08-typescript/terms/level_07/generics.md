# Generics Overview (`<T>`)

> **Level 7 — Generics**
> Variables for *Types*. Instead of passing data into a function, you pass a Type into a function, allowing the function to be incredibly reusable while maintaining strict type safety.

---

## 1. Prerequisites
- [Function Types](../level_04/function_types.md) — Generics are most often used to make functions dynamic.
- [Type Aliases (`type`)](../level_05/type_aliases.md) — The structures that often receive Generics.

---

## 2. Term Category

**TypeScript Advanced Type** (Parametric Polymorphic Types): Generics (`<T>`) enable reusable component declarations that operate over arbitrary data types while preserving exact type identity.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
Imagine writing a function that simply returns whatever you pass into it (an "identity" function).
If you write `function returnIt(data: string): string`, it only works for strings.
If you want it to work for numbers, you could use `any`: `function returnIt(data: any): any`. But now you've lost all type safety! The compiler doesn't know what comes out.
**Generics** solve this. You tell the function: *"I am going to pass a Type into you. Whatever Type I pass in, use that as your parameter and return type."*

### (2) The `<T>` Syntax
You declare a Generic by putting a letter (usually `T` for Type) inside angle brackets `<T>` right before the parentheses.

```typescript
// <T> declares the Generic.
// We use T for the parameter type, and T for the return type.
function returnIt<T>(data: T): T {
  return data;
}
```

### (3) Using the Generic
When you call the function, you pass the Type into the angle brackets, and the data into the parentheses.

```typescript
// We pass `string` into T.
// The function internally becomes: (data: string) => string
const a = returnIt<string>("Hello");

// We pass `number` into T.
// The function internally becomes: (data: number) => number
const b = returnIt<number>(100);
```

### (4) Type Argument Inference
You actually don't need to write `<string>` when calling the function! TypeScript's engine is smart enough to look at `"Hello"` and automatically infer that `T` should be `string`.
`const a = returnIt("Hello") // TS infers T is string`

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use Type-specific methods on an unconstrained Generic

**The mistake:** A developer writes a generic function and tries to read the `.length` property.
```typescript
function getLength<T>(data: T) {
  return data.length; // ❌ ERROR: Property 'length' does not exist on type 'T'
}
```

**Why it's wrong:** `T` means *literally anything*. It could be a `string` (which has `.length`), but it could also be a `number` or a `boolean` (which do NOT have `.length`). TypeScript strictly prevents you from accessing properties on a raw Generic because it is not safe.
**Golden Rule:** If you need a Generic to have specific properties, you must use a [Generic Constraint](../level_07/generic_constraints.md).

---



### Mistake 2: Using Generics unnecessarily when Concrete Types Suffice

**The mistake:** Writing `function printName<T extends string>(name: T): void` when plain `: string` is simpler.

**Why it's wrong:** If a generic type parameter is used only once and does not relate return types to parameter types, generics add needless complexity.

*Incorrect:*
```typescript
function log<T extends string>(msg: T): void { console.log(msg); } // Over-engineered generic
```

*Fix:*
```typescript
function log(msg: string): void { console.log(msg); } // Clean concrete type signature
```

### Mistake 3: Expecting Generic Call Signature to Return Multiple Different Types per Invocation

**The mistake:** Expecting `function identity<T>(arg: T)` to dynamically cast return value without input relationship.

**Why it's wrong:** Generics preserve relationships between argument types and return types; they do not perform arbitrary casting.

*Incorrect:*
```typescript
function parse<T>(json: string): T { return JSON.parse(json); } // Unsafe unchecked generic return
```

*Fix:*
```typescript
function parse(json: string): unknown { return JSON.parse(json); } // Safer unknown return
```

## 5. Practice Exercises

### Exercise 1: Authoring Generic Identity Functions

**Scenario:**
Create a generic identity function `identity<T>(arg: T): T` that preserves input argument type identity.

**Requirements:**
1. Declare `<T>` generic type parameter.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function identity<T>(arg: T): T {
>   return arg;
> }
> 
> const num = identity(42);       // Inferred as number
> const str = identity("hello");  // Inferred as string
> const bool = identity(true);    // Inferred as boolean
> ```
> 
> #### Technical Explanation
>
> 1. `<T>` declares a generic type parameter captured during function invocation.
> 2. Passing `42` binds `T` to `number`, ensuring the function return type is also `number`.
> 3. Preserves type identity without resorting to unsafe `any`.
> 
---

### Exercise 2: Generic Array Utility Functions

**Scenario:**
Create a generic `getFirstElement<T>(arr: T[]): T | undefined` utility function.

**Requirements:**
1. Return `T | undefined`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function getFirstElement<T>(arr: T[]): T | undefined {
>   return arr[0];
> }
> 
> const firstNum = getFirstElement([10, 20, 30]);      // Inferred as number | undefined
> const firstStr = getFirstElement(["a", "b", "c"]);  // Inferred as string | undefined
> ```
> 
> #### Technical Explanation
>
> 1. `arr: T[]` operates on arrays of any element type `T`.
> 2. The return type `T | undefined` reflects that the array may be empty at runtime.
> 3. Type-safe array access utility.
> 
---

### Exercise 3: Comparative Analysis: Generics (`<T>`) vs `any` vs `unknown`

**Scenario:**
Formulate an architectural comparison matrix contrasting Generics (`<T>`) against `any` and `unknown`.

**Requirements:**
1. Contrast type preservation, safety, and reusability.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Generics (<T>) vs any vs unknown Matrix:
> - Generics (<T>): Type-safe AND type-preserving. Input type parameter binds directly to output return type (identity preserved).
> - any: Disables type checking completely. Destroys type relationship between input and output.
> - unknown: Type-safe top type. Accepts any input, but destroys exact output type relationships, requiring explicit narrowing.
> ```
> 
> #### Technical Explanation
>
> 1. Generics preserve relationships between input parameters and return types statically.
> 2. `any` disables static checking completely.
> 3. `unknown` forces downstream type narrowing without output type binding.
> 
---



## 6. Related Terms
- [Generic Constraints (`extends`)](generic_constraints.md) — How to limit what `T` can be.
- [Utility Types Overview](../level_08/utility_types.md) — All utility types are just Generic Type Aliases!
- [Conditional Types](../level_09/conditional_types.md) — Related concept: Conditional Types.
- [Generic Default Types (`=`)](default_generics.md) — Default generic parameters.
- [Generic Interfaces & Classes](generic_interfaces_classes.md) — Generic interfaces and classes.

---

## 7. Key Takeaways
- **Generics (`<T>`)** act as variables for Types.
- They allow you to write reusable functions/classes that work with any data type, without sacrificing the strictness of the compiler.
- You declare them using `<T>` before the parameter list.
- TypeScript can usually infer the Generic type from the arguments you pass, meaning you rarely have to explicitly write `<string>` when calling the function.
