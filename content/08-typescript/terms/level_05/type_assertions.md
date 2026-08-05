# Type Assertions (`as`)

> **Level 5 — Union & Intersection Types**
> A way to forcefully override the compiler's inferred type. It is essentially you telling TypeScript: *"I have more information than you do; shut up and treat this variable as Type X."*

---

## 1. Prerequisites
- [Type Inference](../level_01/type_inference.md) — The system you are forcefully overriding.

---

## 2. Term Category
- **TypeScript Type Override**

---

## 3. Environment Context
- **Compile-Time (Dangerous)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes, TypeScript doesn't have enough context to know what a type actually is.
The most common example is `document.getElementById()`.
```typescript
const myCanvas = document.getElementById("main-canvas");
```
TypeScript knows `getElementById` returns an `HTMLElement`. But it has no idea that the specific ID `"main-canvas"` is an `<canvas>` element. If you try to call `myCanvas.getContext("2d")`, TS will throw an error because generic `HTMLElement`s don't have that method.
**Type Assertions** (using the `as` keyword) allow you to override TS and provide the specific type.

### (2) The `as` Keyword
You place `as Type` after the expression you want to override.

```typescript
// We assert that we KNOW this is specifically an HTMLCanvasElement
const myCanvas = document.getElementById("main-canvas") as HTMLCanvasElement;

// ✅ TS now allows canvas-specific methods!
const ctx = myCanvas.getContext("2d");
```

### (3) The Lie
A Type Assertion is NOT a type conversion! It does not change the data at runtime. It is a pure Compile-Time lie. 
If you write `const num = "Hello" as unknown as number`, the variable `num` is still a string at runtime. You just lied to the compiler, and your code will probably crash.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `as` to fix careless errors

**The mistake:** A developer writes a function expecting a full `User` object (with 10 properties). In their test file, they don't want to type out all 10 properties, so they write: `const fakeUser = { name: "Alice" } as User;`.

**Why it's wrong:** The compiler throws away all safety checks when you use `as`. The function tries to access `fakeUser.email`, gets `undefined`, and crashes. 
**Golden Rule:** Never use `as` just to silence the compiler. Only use `as` when you have mathematically certain context that the compiler physically cannot see (like DOM element IDs or specific API response mapping).

---



### Mistake 2: Using Type Assertions `as TargetType` to Force Incompatible Conversions

**The mistake:** Writing `const str = 123 as string;` expecting numeric value to become a string.

**Why it's wrong:** Type assertions `as` perform zero runtime conversions! They only inform the compiler. Invalid assertions require double assertions `as unknown as Target` or actual runtime conversions.

*Incorrect:*
```typescript
const x = "123" as number; // ❌ Conversion of type 'string' to type 'number' may be a mistake
```

*Fix:*
```typescript
const x = Number("123"); // Correct runtime type conversion
```

### Mistake 3: Using Angle Bracket Syntax `<Type>` in JSX / TSX Files

**The mistake:** Writing `<User>data` in `.tsx` files.

**Why it's wrong:** Angle bracket assertion syntax `<Type>val` conflicts with JSX element syntax in `.tsx` files. Always use `val as Type` syntax.

*Incorrect:*
```typescript
// const el = <HTMLInputElement>evt.target; // ❌ Syntax error in TSX!
```

*Fix:*
```typescript
const el = evt.target as HTMLInputElement; // Standard assertion syntax
```

## 6. Practice Exercises

### Exercise 1: `as any` Abuse

**Problem:** What happens if you write `const data = document.getElementById("main") as any;`?

**Expected output:**
> [!check]- Answer
> ```text
> You have just completely disabled the type checker for the `data` variable. 
> You can now write `data.makeMeASandwich()`, and the compiler will allow it, resulting in a runtime crash. 
> Never assert to `any` unless absolutely migrating legacy code.
> ```
> - Review the dangers of the `any` type.

---



### Exercise 2: DOM Element Type Assertion

**Problem:** Assert `document.getElementById("input")` to `HTMLInputElement`.

**Expected output:**
> [!check]- Answer
> ```text
> HTMLInputElement assertion applied
> ```
> ```typescript
> const input = document.getElementById("input") as HTMLInputElement;
> console.log("HTMLInputElement assertion applied");
> ```
>
> **Explanation:** Assertions inform TS of specific DOM element subclass types.

---

### Exercise 3: Double Assertion Escape Hatch

**Problem:** Perform double assertion `val as unknown as Target` for incompatible structural conversions.

**Expected output:**
> [!check]- Answer
> ```text
> Double assertion syntax verified
> ```
> ```typescript
> const str = "123";
> const num = str as unknown as number; // Compiles, though unsafe!
> console.log("Double assertion syntax verified");
> ```
>
> **Explanation:** Bypassing TS safety with double assertions requires intermediate `unknown` assertions.

## 7. Related Terms
- [`any`](../level_02/any.md) — The type you should never assert to.
- [Type Narrowing](../level_06/type_narrowing.md) — The safe, runtime-checked alternative to blindly asserting types.
- [Excess Property Checks](../level_03/excess_property_checks.md) — Related concept: Excess Property Checks.
- [Non-null Assertion Operator (`!`)](non_null_assertion.md) — Related concept: Non-null Assertion Operator (`!`).
- [`satisfies` Operator](satisfies_operator.md) — Related concept: `satisfies` Operator.
- [Branded / Nominal Types](../level_09/branded_nominal_types.md) — Related concept: Branded / Nominal Types.
- [Const Assertions (`as const`)](../level_11/const_assertions.md) — Related concept: Const Assertions (`as const`).
- [`unknown`](../level_02/unknown.md) — Safely asserting unknown types.

---

## 8. Key Takeaways
- **Type Assertions** (`as`) forcefully override the compiler's understood type for a specific expression.
- It is most commonly used for DOM manipulation (`as HTMLCanvasElement`), where TS cannot know the specifics of your HTML file.
- It is a purely Compile-Time mechanism. It does **not** perform data conversion at runtime.
- Using `as` is dangerous because you are bypassing the safety of the compiler. If you lie to it, your app will crash.
