# Function Types

> **Level 4 — Functions**
> The syntax used to strictly define the input parameters (arguments) and output (return value) of a function in TypeScript. It ensures functions are called correctly and return the expected data.

---

## 1. Prerequisites
- [Primitive Types](../level_02/primitive_types.md) — What is usually passed into functions.
- [`void` & `never`](../level_02/void_never.md) — Specific return types for functions.

---

## 2. Term Category

**TypeScript Core Syntax** (Function Signature Annotations): Function types `(param: T) => R` describe function input parameters and return types as first-class values.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
In JavaScript, functions are incredibly fragile.
```javascript
function add(a, b) { return a + b; }
add(5);           // NaN (because b is undefined)
add("5", "10");   // "510" (String concatenation instead of math)
```
TypeScript **Function Types** solve this by strictly enforcing exactly what must be passed into a function, and exactly what that function promises to return.

### (2) Typing Parameters and Return Values
You type the parameters by adding `: type` after the parameter name. You type the return value by adding `: type` after the closing parenthesis `)`.

```typescript
// Parameter types   vvvvvvvvvvvvvvv        vvvvvv Return type
function calculate(price: number, tax: number): number {
  return price + tax;
}

calculate(100, 5);    // ✅ Valid
calculate(100);       // ❌ Error: Expected 2 arguments, but got 1.
calculate("100", 5);  // ❌ Error: Argument of type 'string' is not assignable to type 'number'.
```

### (3) Typing the Function Itself (Callbacks)
Sometimes you need to pass a function *into* another function (a callback). You can type the entire signature of a function using the Arrow Function syntax `(args) => returnType`.

```typescript
// `onSuccess` is a function that takes a string and returns nothing.
function fetchData(onSuccess: (data: string) => void) {
  onSuccess("Data loaded!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting Return Type Inference

**The mistake:** A developer explicitly types the return value of every single function they write.
`function isAdult(age: number): boolean { return age >= 18; }`

**Why it's wrong:** While not strictly an "error", it is often redundant. TypeScript has excellent [Type Inference](../level_01/type_inference.md). If it sees `return age >= 18`, it already knows the function returns a `boolean`.
**Golden Rule:** You *must* type the parameters. However, you can often leave off the Return Type and let TS infer it. (Note: Many senior teams still prefer explicit return types on public API functions to prevent accidental return mutations, but internally, inference is preferred).

---



### Mistake 2: Confusing Function Parameter Names in Type Expressions

**The mistake:** Writing `type Callback = (string) => void;` expecting `string` to be the parameter type.

**Why it's wrong:** In function type signatures, `(string)` is parsed as parameter name `string` with implicit type `any`! Always specify parameter name AND type `(val: string) => void`.

*Incorrect:*
```typescript
type BadCb = (string) => void; // ❌ Parameter 'string' implicitly has 'any' type
```

*Fix:*
```typescript
type GoodCb = (text: string) => void; // Explicit name and type
```

### Mistake 3: Using `Function` Type as an Untyped Signature Annotator

**The mistake:** Annotating callbacks as `: Function`.

**Why it's wrong:** The global `Function` type allows calling with any arbitrary parameters without type checking, behaving like `any`.

*Incorrect:*
```typescript
function exec(cb: Function) { cb(1, 2, 3); } // Disables argument type checking
```

*Fix:*
```typescript
function exec(cb: (a: number, b: number) => void) { cb(1, 2); }
```

## 5. Practice Exercises

### Exercise 1: Annotating Callback Function Parameters

**Scenario:**
Type a `filterArray` utility function taking an array `T[]` and a predicate callback `(item: T) => boolean`.

**Requirements:**
1. Annotate predicate parameter type `(item: T) => boolean`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Predicate<T> = (item: T) => boolean;
> 
> function filterArray<T>(items: T[], predicate: Predicate<T>): T[] {
>   const result: T[] = [];
>   for (const item of items) {
>     if (predicate(item)) {
>       result.push(item);
>     }
>   }
>   return result;
> }
> 
> const evens = filterArray([1, 2, 3, 4], (num) => num % 2 === 0);
> ```
> 
> #### Technical Explanation
>
> 1. Function types `(item: T) => boolean` describe input parameters and return types as first-class values.
> 2. `filterArray` infers `num` as `number` inside the inline callback without manual annotations.
> 3. Standard higher-order function typing pattern.
> 
---

### Exercise 2: Defining Callable Object Interfaces (Call Signatures)

**Scenario:**
Create an interface for a callable function object that also has a static `version` property attached.

**Requirements:**
1. Define call signature `(input: string): string` and property `version: string`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Formatter {
>   (input: string): string; // Call signature
>   version: string;        // Property signature
> }
> 
> const format: Formatter = Object.assign(
>   (input: string) => input.trim().toLowerCase(),
>   { version: "1.0.0" }
> );
> 
> console.log(format("  Hello  ")); // "hello"
> console.log(format.version);      // "1.0.0"
> ```
> 
> #### Technical Explanation
>
> 1. Interfaces with call signatures `(param: T): R` model callable JavaScript functions with attached static properties.
> 2. Essential for modeling legacy JavaScript libraries like jQuery (`$`) or Axios.
> 3. Advanced function object modeling pattern.
> 
---

### Exercise 3: Construct Signatures (`new () => T`)

**Scenario:**
Type a factory function that instantiates new class instances using a construct signature `new (...args: any[]) => T`.

**Requirements:**
1. Define construct signature parameter `ctor: new () => T`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Constructor<T> {
>   new (...args: any[]): T;
> }
> 
> class Service {
>   execute() { return "Service Executed"; }
> }
> 
> function createInstance<T>(ctor: Constructor<T>): T {
>   return new ctor();
> }
> 
> const instance = createInstance(Service);
> console.log(instance.execute());
> ```
> 
> #### Technical Explanation
>
> 1. Construct signatures `new (...args: any[]) => T` describe class constructors that produce instances of type `T`.
> 2. `new` keyword indicates that the function MUST be invoked with `new`.
> 3. Standard pattern for dependency injection containers and factory functions.
> 
---



## 6. Related Terms
- [`void` & `never`](../level_02/void_never.md) — What you return when a function doesn't return data.
- [Type Inference](../level_01/type_inference.md) — Why you don't always need to explicitly write the return type.
- [Function Overloads](function_overloads.md) — Related concept: Function Overloads.
- [Optional & Default Parameters](optional_default_parameters.md) — Related concept: Optional & Default Parameters.
- [Rest Parameters (`...`)](rest_parameters.md) — Related concept: Rest Parameters (`...`).
- [`this` Typing in Functions](this_typing.md) — Related concept: `this` Typing in Functions.
- [`ReturnType<T>`](../level_08/returntype.md) — Related concept: `ReturnType<T>`.

---

## 7. Key Takeaways
- **Function Types** enforce exactly what data goes into a function and what comes out.
- Syntax: `function name(arg1: type): returnType {}`.
- If you pass a function as a callback, use the arrow syntax: `(arg: type) => returnType`.
- While parameter types are mandatory, return types can often be omitted thanks to Type Inference.
