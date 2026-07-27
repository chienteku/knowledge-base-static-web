# Generics Overview (`<T>`)

> **Level 7 — Generics**
> Variables for *Types*. Instead of passing data into a function, you pass a Type into a function, allowing the function to be incredibly reusable while maintaining strict type safety.

---

## 1. Prerequisites
- [Function Types](../level_04/function_types.md) — Generics are most often used to make functions dynamic.
- [Type Aliases](../level_05/type_aliases.md) — The structures that often receive Generics.

---

## 2. Term Category
- **TypeScript Advanced Mechanics**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Understanding `Array<T>`

**Problem:** You have been using Generics since Level 2 without realizing it! The built-in Array type is actually a Generic Class. If you write `const arr = new Array<string>()`, what is happening?

**Expected output:**
```text
The built-in Array class is defined as `class Array<T>`. 
When you pass `<string>`, you are telling the Array class that its internal `push(item: T)` method should become `push(item: string)`.
This is exactly how `string[]` works under the hood!
```

> [!check]- Answer
> - Think about what `.push()` expects.

---



### Exercise 2: Generic Identity Function

**Problem:** Write generic identity function `identity<T>(val: T): T`.

**Expected output:**
```text
100
```

> [!check]- Answer
> ```typescript
> function identity<T>(val: T): T {
>   return val;
> }
> console.log(identity(100));
> ```
>
> **Explanation:** Generic `identity<T>` returns exact input type argument `T`.

### Exercise 3: Generic Array First Item Extractor

**Problem:** Write generic `first<T>(arr: T[]): T | undefined`.

**Expected output:**
```text
hello
```

> [!check]- Answer
> ```typescript
> function first<T>(arr: T[]): T | undefined {
>   return arr[0];
> }
> console.log(first(["hello", "world"]));
> ```
>
> **Explanation:** Generics preserve array element types in function return signatures.

## 7. Related Terms
- [Generic Constraints](../level_07/generic_constraints.md) — How to limit what `T` can be.
- [Utility Types Overview](../level_08/utility_types.md) — All utility types are just Generic Type Aliases!

---

## 8. Key Takeaways
- **Generics (`<T>`)** act as variables for Types.
- They allow you to write reusable functions/classes that work with any data type, without sacrificing the strictness of the compiler.
- You declare them using `<T>` before the parameter list.
- TypeScript can usually infer the Generic type from the arguments you pass, meaning you rarely have to explicitly write `<string>` when calling the function.
