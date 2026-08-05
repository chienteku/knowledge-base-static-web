# Type Inference

> **Level 1 — Core Concepts & Environment Setup**
> The ability of the TypeScript compiler to automatically figure out (guess) the type of a variable based on its initial value, without you having to explicitly write the type.

---

## 1. Prerequisites
- [Static Typing vs Dynamic Typing](static_dynamic_typing.md) — The system that Inference is optimizing.
- [The TypeScript Compiler (`tsc`)](tsc.md) — The engine doing the guessing.

---

## 2. Term Category
- **TypeScript Core Mechanic**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In older statically typed languages like Java, you had to be extremely explicit:
`String myName = new String("Alice");`
This is incredibly repetitive and annoying to write. If I assign the string `"Alice"` to a variable, it is glaringly obvious that the variable is a string!
TypeScript was designed with a highly advanced intelligence engine. It utilizes **Type Inference** to look at the value you assign, and invisibly attach the correct static type to the variable for you.

### (2) How it works
If you declare a variable and initialize it immediately, you do not need to write a type annotation.
```typescript
// BAD: Redundant and annoying
let score: number = 100;
let name: string = "Alice";

// GOOD: Clean, pure Type Inference
let score = 100;    // TS automatically knows `score` is a number
let name = "Alice"; // TS automatically knows `name` is a string

score = "Winner"; // ❌ TS still throws an error! It inferred 'number', so you can't assign a string!
```

### (3) Return Type Inference
Inference also works on function return values.
```typescript
// TS looks at `a + b` (two numbers) and infers the function returns a number!
function add(a: number, b: number) {
  return a + b;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The Implicit `any` trap

**The mistake:** A developer declares a variable but doesn't assign a value to it right away.
```typescript
let user; // Declared, but no value assigned yet.
user = "Alice";
user = 123; // Wait, why didn't TS catch this error?!
```

**Why it's wrong:** Because you didn't give TS an initial value, it couldn't infer the type. So it throws its hands up and assigns it the type `any`. The `any` type completely disables type checking for that variable!
**Golden Rule:** Type Inference ONLY works if you initialize the variable immediately. If you must declare a variable without initializing it, you MUST provide an explicit type annotation: `let user: string;`

---



### Mistake 2: Adding Redundant Explicit Type Annotations Everywhere

**The mistake:** Writing `const name: string = "Alice"; let age: number = 25;`.

**Why it's wrong:** TypeScript automatically infers primitive types from initializers. Explicit annotations on simple primitives add unnecessary verbosity without safety benefits.

*Incorrect:*
```typescript
const msg: string = "Hello"; // Redundant type annotation
```

*Fix:*
```typescript
const msg = "Hello"; // Inferred as string automatically
```

### Mistake 3: Expecting `let` Variables to Infer Literal Types

**The mistake:** Writing `let action = "CLICK";` expecting `action` to be inferred as literal type `"CLICK"`.

**Why it's wrong:** `let` bindings undergo type widening to `string`. Use `const` or `as const` to preserve literal types.

*Incorrect:*
```typescript
let action = "CLICK"; // Inferred as string, not literal "CLICK"
```

*Fix:*
```typescript
const action = "CLICK"; // Inferred as literal type "CLICK"
```

## 6. Practice Exercises

### Exercise 1: Array Inference

**Problem:** What type will TypeScript infer for the following array?
`const data = [1, "Alice", true];`

**Expected output:**
> [!check]- Answer
> ```text
> TypeScript will infer a Union Array Type:
> `(string | number | boolean)[]`
> It looks at all the elements inside the initial array and combines their types!
> ```
> - Think about combining types!

---



### Exercise 2: Inferred Return Types

**Problem:** What is the inferred return type of `function add(a: number, b: number) { return a + b; }`?

**Expected output:**
> [!check]- Answer
> ```text
> number
> ```
> ```typescript
> function add(a: number, b: number) {
>   return a + b; // Inferred return type: number
> }
> console.log("number");
> ```
>
> **Explanation:** TypeScript infers function return types from evaluated `return` expressions.

---

### Exercise 3: Inference in Array Initializers

**Problem:** What is inferred type of `const items = [10, "hello"];`?

**Expected output:**
> [!check]- Answer
> ```text
> (string | number)[]
> ```
> ```typescript
> console.log("(string | number)[]");
> ```
>
> **Explanation:** Array literal initializers infer union element types `(T1 | T2)[]`.

## 7. Related Terms
- [Static Typing vs Dynamic Typing](static_dynamic_typing.md) — What is happening under the hood.
- [`any`](../level_02/any.md) — What happens when inference fails.
- [Type Widening](type_widening.md) — Related concept: Type Widening.
- [Primitive Types](../level_02/primitive_types.md) — Related concept: Primitive Types.
- [Function Types](../level_04/function_types.md) — Related concept: Function Types.
- [Literal Types](../level_05/literal_types.md) — Related concept: Literal Types.
- [`ReturnType<T>`](../level_08/returntype.md) — Related concept: `ReturnType<T>`.
- [`satisfies` Operator](../level_05/satisfies_operator.md) — satisfies operator.

---

## 8. Key Takeaways
- **Type Inference** is TypeScript's ability to automatically deduce the type of a variable based on its initial value.
- You should rely heavily on Inference! Do not write explicit types (`let name: string = "Bob"`) if the compiler can easily guess it. It makes your code cleaner.
- Inference works for primitives, arrays, objects, and function return values.
- If you declare a variable *without* assigning a value, inference fails, and TS will silently assign it the dangerous `any` type unless you provide an explicit annotation.
