# `void` & `never`

> **Level 2 — Basic Types**
> Two unique types related to the execution and return values of functions. `void` means a function finishes but returns nothing. `never` means a function *never* finishes or always throws an error.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — TypeScript primitive types overview.

---

## 2. Term Category

**Type System Fundamental** (Bottom & Absent Return Types): `void` signifies functions returning no value, while `never` signifies the bottom type for unreachable code paths or throwing functions.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) `void` (The Function Returns Nothing)
In JavaScript, if a function doesn't have a `return` statement, it implicitly returns `undefined`.
In TypeScript, we type these functions as returning **`void`**. It signals to other developers: *"This function performs an action (a side-effect), but do not expect any useful data back from it."*

```typescript
// This function logs to the console but doesn't return anything.
function logMessage(msg: string): void {
  console.log(msg);
  // No return statement needed!
}
```

### (2) `never` (The Function Never Completes)
`never` is an extreme type. It means the function reaches a state where it is physically impossible for it to return *anything*, not even `undefined`. 
This happens in two scenarios:
1. **Throwing an Error:** The function crashes the execution context.
2. **Infinite Loops:** The function literally never stops running.

```typescript
// This function crashes the app. It NEVER returns.
function crashApp(message: string): never {
  throw new Error(message);
}

// This function runs forever. It NEVER returns.
function runServer(): never {
  while (true) {
    listenForRequests();
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `void` with `undefined`

**The mistake:** A developer writes: `let data: void = undefined;` or types a function `function test(): undefined {}`

**Why it's wrong:** While a `void` function technically returns `undefined` at runtime in JS, they have totally different semantic meanings in TypeScript.
`undefined` is a literal value type. If a function returns `undefined`, it means the developer explicitly wrote `return undefined;`.
`void` is a behavioral type. It means "the return value is meant to be ignored."
**Golden Rule:** Never use `void` to type a standard variable. `void` should exclusively be used as the return type of functions that don't return data.

---



### Mistake 2: Confusing `void` Return Type with `never` Return Type

**The mistake:** Annotating functions that throw exceptions with `: void` instead of `: never`.

**Why it's wrong:** `void` means the function returns `undefined` (completes execution). `never` means the function NEVER returns (throws or loops infinitely).

*Incorrect:*
```typescript
function fail(): void {
    throw new Error("Crash!"); // Misrepresents function completion capability
}
```

*Fix:*
```typescript
function fail(): never {
    throw new Error("Crash!"); // Accurately represents non-returning function
}
```

### Mistake 3: Ignoring `never` in Exhaustiveness Checks

**The mistake:** Failing to handle all cases in a discriminated union switch statement.

**Why it's wrong:** Assigning unhandled union cases to a `never` parameter surfaces missing cases as early compile-time errors.

*Incorrect:*
```typescript
type Shape = "circle" | "square";
function area(s: Shape) {
    if (s === "circle") return 1;
    // Missing square case!
}
```

*Fix:*
```typescript
type Shape = "circle" | "square";
function area(s: Shape) {
    switch(s) {
        case "circle": return 1;
        case "square": return 2;
        default:
            const _exhaustiveCheck: never = s;
            return _exhaustiveCheck;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Distinguishing `void` Return Types in Callback Functions

**Scenario:**
Define event handler callbacks using `void` return types.

**Requirements:**
1. Annotate callback parameter `onComplete: () => void`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function executeTask(onComplete: () => void) {
>   console.log("Task executed.");
>   onComplete();
> }
> 
> // Callback can return a value (ignored by caller):
> executeTask(() => {
>   return 42; // Allowed! void in callback signatures means "ignore return value".
> });
> ```

> #### Technical Explanation
>
> 1. `void` in function return signatures indicates that callers should ignore any returned value.
> 2. In callback function types, `() => void` permits implementation callbacks to return values without compilation errors.
> 3. Ensures callback flexibility while preventing callers from consuming return values.

---

### Exercise 2: Exhaustiveness Checking with the `never` Type

**Scenario:**
Use the `never` type to enforce compile-time exhaustiveness checking in a `switch` statement over a discriminated union.

**Requirements:**
1. Assign unhandled union branches to a `never` variable in `default:`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Shape = { kind: "circle"; radius: number } | { kind: "square"; size: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    default:
      // If a new shape is added to Shape union, this line fails at compile time!
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

> #### Technical Explanation
>
> 1. `never` is the bottom type in TypeScript, containing no possible values.
> 2. Assigning `shape` to a `never` variable in `default` ensures all union members have been handled.
> 3. If a new member is added to the union later, `tsc` throws a compile error at the exhaustiveness check.

---

### Exercise 3: Comparative Analysis: `void` vs `never` vs `undefined`

**Scenario:**
Formulate an architectural comparison matrix contrasting `void`, `never`, and `undefined`.

**Requirements:**
1. Contrast return execution, value existence, and type hierarchy positions.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> void vs never vs undefined Matrix:
> - undefined: A real JavaScript primitive value. Function completes normally and explicitly returns undefined.
> - void: Represents absent return value. Function completes execution normally, but callers should ignore any returned result.
> - never: Bottom type. Function NEVER finishes execution (throws exception or runs infinite loop). No value can exist for never.
> ```

> #### Technical Explanation
>
> 1. `undefined` is a concrete runtime value.
> 2. `void` is a type-level indicator of omitted/ignored return values.
> 3. `never` represents impossible states or non-terminating code execution paths.

---



## 6. Related Terms
- [Function Types](../level_04/function_types.md) — Where `void` is heavily used.
- [Type Narrowing](../level_06/type_narrowing.md) — Exhaustive checks using `never` rely on this.
- [`null`, `undefined` & `strictNullChecks`](null_undefined_strict.md) — Related concept: `null`, `undefined` & `strictNullChecks`.
- [Discriminated Unions](../level_06/discriminated_unions.md) — Related concept: Discriminated Unions.
- [Exhaustiveness Checking (`never`)](../level_06/exhaustiveness_checking.md) — Related concept: Exhaustiveness Checking (`never`).
- [`unknown`](unknown.md) — unknown type.
- [`any`](any.md) — any type.

---

## 7. Key Takeaways
- **`void`** indicates that a function successfully completes its execution but does not return a usable value (it is meant for side-effects).
- **`never`** indicates an impossible state; it means a function will throw an error or loop infinitely, meaning it will literally never complete.
- Do not use `void` to type variables; use it only for function return signatures.
