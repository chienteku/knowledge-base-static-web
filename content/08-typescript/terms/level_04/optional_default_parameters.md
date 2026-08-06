# Optional & Default Parameters

> **Level 4 — Functions**
> Techniques for making function arguments non-mandatory. Optional parameters (`?`) allow an argument to be skipped, while Default parameters (`=`) provide a fallback value if an argument is skipped.

---

## 1. Prerequisites
- [Function Types](function_types.md) — The syntax these modify.
- [Optional Properties (`?`)](../level_03/optional_properties.md) — The exact same `?` syntax, but for interfaces.

---

## 2. Term Category

**TypeScript Core Syntax** (Optional & Default Parameter Typing): Optional (`param?: T`) and default (`param: T = val`) parameters allow function calls with omitted arguments.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Combining Optional and Required Parameters

**Scenario:**
Create a `createLogger` function with a required `prefix` and optional `timestamp` parameter.

**Requirements:**
1. Place optional parameters after required parameters.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function logMessage(prefix: string, message: string, timestamp?: Date) {
>   const timeStr = timestamp ? `[${timestamp.toISOString()}] ` : "";
>   console.log(`${timeStr}${prefix}: ${message}`);
> }

logMessage("INFO", "System initialized");
logMessage("ERROR", "Database connection lost", new Date());
```

> #### Technical Explanation
>
> 1. Optional parameters (`timestamp?: Date`) must be declared AFTER all required parameters.
> 2. Inside the function body, `timestamp` has type `Date | undefined`.
> 3. Allows callers to omit optional arguments at call sites.

---

### Exercise 2: Utilizing Default Parameters for Automatic Type Inference

**Scenario:**
Create a `connect` function with default `timeout` (5000) and `retry` (true) parameters.

**Requirements:**
1. Use default assignment syntax (`timeout = 5000`).

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function connect(host: string, timeout = 5000, retry = true) {
>   console.log(`Connecting to ${host} (timeout=${timeout}ms, retry=${retry})`);
> }

connect("api.example.com");             // Uses defaults (5000, true)
connect("api.example.com", 10000, false); // Overrides defaults
```

> #### Technical Explanation
>
> 1. Default parameters (`timeout = 5000`) automatically infer parameter types (`number`).
> 2. Unlike optional parameters, default parameters preserve non-nullable types (`number` instead of `number | undefined`) inside the function body.
> 3. If callers explicitly pass `undefined`, the default parameter value is evaluated.

---

### Exercise 3: Auditing Parameter Ordering Rule Violations

**Scenario:**
Explain why placing an optional or default parameter BEFORE a required parameter causes a compilation error.

**Requirements:**
1. Demonstrate invalid parameter order.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ Compile Error: Required parameter cannot follow an optional parameter!
> // function invalid(optional?: string, required: number) {}

// ✅ CORRECT (Re-order parameters or pass undefined):
function valid(required: number, optional?: string) {}
```

> #### Technical Explanation
>
> 1. JavaScript positional arguments require arguments to be supplied from left to right.
> 2. Placing optional parameters first would require callers to pass `undefined` explicitly to reach required positional parameters.
> 3. Enforces left-to-right positional clarity.

---



## 6. Related Terms
- [Function Types](function_types.md) — The parent topic.
- [Optional Properties (`?`)](../level_03/optional_properties.md) — How `?` works inside objects.
- [Generic Default Types (`=`)](../level_07/default_generics.md) — Related concept: Generic Default Types (`=`).

---

## 7. Key Takeaways
- Use **Optional Parameters** (`arg?: type`) to allow callers to skip an argument. The argument will be `undefined` inside the function.
- Use **Default Parameters** (`arg = value`) to provide a fallback value. TS automatically infers the type and marks it as optional.
- Never use both `?` and `=` on the same parameter.
- Optional parameters must always be listed *after* all required parameters in the function signature.
