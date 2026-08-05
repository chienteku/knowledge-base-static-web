# Optional & Default Parameters

> **Level 4 — Functions**
> Techniques for making function arguments non-mandatory. Optional parameters (`?`) allow an argument to be skipped, while Default parameters (`=`) provide a fallback value if an argument is skipped.

---

## 1. Prerequisites
- [Function Types](function_types.md) — The syntax these modify.
- [Optional Properties (`?`)](../level_03/optional_properties.md) — The exact same `?` syntax, but for interfaces.

---

## 2. Term Category
- **TypeScript Core Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Optional Parameters (`?`)
In JavaScript, you can call `function add(a, b)` with just `add(5)`. In TypeScript, that throws an error (`Expected 2 arguments, got 1`).
If you want to allow a parameter to be skipped, you use the `?` modifier. This tells TS the argument might be `undefined`.
**Strict Rule:** Optional parameters must ALWAYS come *last* in the parameter list.

```typescript
// `greeting` is optional. It is typed as `string | undefined`
function logMessage(msg: string, greeting?: string) {
  if (greeting) {
    console.log(`${greeting} ${msg}`);
  } else {
    console.log(msg);
  }
}

logMessage("Alice");            // ✅ Valid
logMessage("Alice", "Hello");   // ✅ Valid
```

### (2) Default Parameters (`=`)
If you provide a default value (a standard ES6 JavaScript feature), TypeScript is smart enough to do two things automatically:
1. It automatically makes the parameter Optional (you don't need the `?`).
2. It automatically Infers the type from the default value!

```typescript
// TS infers `greeting` is an optional `string`!
function logMessage2(msg: string, greeting = "Hello") {
  console.log(`${greeting} ${msg}`);
}

logMessage2("Alice"); // Outputs: "Hello Alice"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Combining `?` with a default value

**The mistake:** A developer writes: `function setup(port?: number = 8080) {}`

**Why it's wrong:** This is completely redundant and causes a TS compiler error (`Parameter cannot have question mark and initializer`).
If you provide a default value (`= 8080`), the parameter is ALREADY optional. You do not need the `?`.
**Golden Rule:** Use `?` when there is no default value (the logic handles `undefined`). Use `=` when you want a fallback value. Never use both.

---



### Mistake 2: Placing Required Parameters After Optional Parameters

**The mistake:** Writing `function greet(name?: string, age: number)` (TS1016).

**Why it's wrong:** Optional parameters must be placed AFTER all required parameters in function signatures.

*Incorrect:*
```typescript
// function greet(name?: string, age: number) {} // ❌ A required parameter cannot follow an optional parameter
```

*Fix:*
```typescript
function greet(age: number, name?: string) {} // Correct order
```

### Mistake 3: Combining Optional Modifier `?` with Default Initializer `= value`

**The mistake:** Writing `function count(step?: number = 1)`.

**Why it's wrong:** Default parameters are automatically optional! Adding `?` alongside `= value` is redundant syntax.

*Incorrect:*
```typescript
// function count(step?: number = 1) {} // Redundant '?'
```

*Fix:*
```typescript
function count(step: number = 1) {} // Automatically optional with default
```

## 6. Practice Exercises

### Exercise 1: The Ordering Rule

**Problem:** Why does `function register(age?: number, name: string)` throw a compilation error?

**Expected output:**
> [!check]- Answer
> ```text
> Because an optional parameter cannot precede a required parameter.
> If you called `register(28)`, how does the compiler know if `28` is meant for `age` or `name`? It doesn't. 
> Therefore, all required parameters must come first, and all optional parameters must be pushed to the very end of the signature.
> ```
> - Think about how positional arguments work in JS.

---



### Exercise 2: Inferred Types in Default Parameters

**Problem:** What is the inferred parameter type for `function multiply(x = 10)`?

**Expected output:**
> [!check]- Answer
> ```text
> number
> ```
> ```typescript
> function multiply(x = 10) {
>   return x * 2;
> }
> console.log("number");
> ```
>
> **Explanation:** TypeScript infers parameter types from default assignment values.

---

### Exercise 3: Passing `undefined` to Trigger Defaults

**Problem:** Demonstrate that passing `undefined` triggers parameter default initializer.

**Expected output:**
> [!check]- Answer
> ```text
> Hello Guest
> ```
> ```typescript
> function greet(name = "Guest") {
>   console.log(`Hello ${name}`);
> }
> greet(undefined);
> ```
>
> **Explanation:** `undefined` triggers default parameter initializers at runtime.

## 7. Related Terms
- [Function Types](function_types.md) — The parent topic.
- [Optional Properties (`?`)](../level_03/optional_properties.md) — How `?` works inside objects.
- [Generic Default Types (`=`)](../level_07/default_generics.md) — Related concept: Generic Default Types (`=`).

---

## 8. Key Takeaways
- Use **Optional Parameters** (`arg?: type`) to allow callers to skip an argument. The argument will be `undefined` inside the function.
- Use **Default Parameters** (`arg = value`) to provide a fallback value. TS automatically infers the type and marks it as optional.
- Never use both `?` and `=` on the same parameter.
- Optional parameters must always be listed *after* all required parameters in the function signature.
