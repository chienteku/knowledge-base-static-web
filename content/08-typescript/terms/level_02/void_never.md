# `void` & `never`

> **Level 2 — Basic Types**
> Two unique types related to the execution and return values of functions. `void` means a function finishes but returns nothing. `never` means a function *never* finishes or always throws an error.

---

## 1. Prerequisites
None (Entry-level term)
---

## 2. Term Category
- **TypeScript Type Annotation**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Exhaustive Checking with `never`

**Problem:** Advanced TypeScript developers use the `never` type to create "Exhaustive Switch Statements". How does assigning a value to a `never` variable help catch bugs?

**Expected output:**
> [!check]- Answer
> ```text
> The `never` type represents an impossible state. Nothing can be assigned to `never`.
> If you have a Switch statement handling "Red" and "Blue", you put a `never` assignment in the `default` block. If someone later adds "Green" to the type, the Switch drops down to the `default` block, tries to assign "Green" to the `never` variable, and causes a Compile Error! It forces the developer to update the Switch statement.
> ```
> - Can a string be assigned to a type that represents impossibility?

---



### Exercise 2: `never` Exhaustiveness Checking

**Problem:** Implement an exhaustive switch default check assigning unhandled variants to `const _check: never = s`.

**Expected output:**
> [!check]- Answer
> ```text
> Exhaustiveness check pattern verified
> ```
> ```typescript
> type Direction = "North" | "South";
> function move(d: Direction) {
>   switch(d) {
>     case "North": return 1;
>     case "South": return 2;
>     default: const _check: never = d; return _check;
>   }
> }
> console.log("Exhaustiveness check pattern verified");
> ```
>
> **Explanation:** Assigning unhandled cases to `never` triggers compile errors if new union members are added.

---

### Exercise 3: `void` Callback Return Flexibility

**Problem:** State why TS permits callbacks returning numbers `() => number` to be passed to `() => void` parameters.

**Expected output:**
> [!check]- Answer
> ```text
> void parameters ignore returned callback values
> ```
> ```typescript
> console.log("void parameters ignore returned callback values");
> ```
>
> **Explanation:** `void` parameter callbacks allow functions to return values that callers simply ignore.

## 7. Related Terms
- [Function Types](../level_04/function_types.md) — Where `void` is heavily used.
- [Type Narrowing](../level_06/type_narrowing.md) — Exhaustive checks using `never` rely on this.
- [`null`, `undefined` & `strictNullChecks`](null_undefined_strict.md) — Related concept: `null`, `undefined` & `strictNullChecks`.
- [Discriminated Unions](../level_06/discriminated_unions.md) — Related concept: Discriminated Unions.
- [Exhaustiveness Checking (`never`)](../level_06/exhaustiveness_checking.md) — Related concept: Exhaustiveness Checking (`never`).
- [`unknown`](unknown.md) — unknown type.
- [`any`](any.md) — any type.
---

## 8. Key Takeaways
- **`void`** indicates that a function successfully completes its execution but does not return a usable value (it is meant for side-effects).
- **`never`** indicates an impossible state; it means a function will throw an error or loop infinitely, meaning it will literally never complete.
- Do not use `void` to type variables; use it only for function return signatures.
