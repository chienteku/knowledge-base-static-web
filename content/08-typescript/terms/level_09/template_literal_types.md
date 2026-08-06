# Template Literal Types

> **Level 9 — Advanced Types**
> An advanced type feature (introduced in TS 4.1) that uses backtick syntax to build new string types by combining, prefixing, or transforming existing string literal unions programmatically.

---

## 1. Prerequisites
- [Literal Types](../level_05/literal_types.md) — Base primitive values as types.
- [Union Types (`|`)](../level_05/union_types.md) — Iterative collections of options.

---

## 2. Term Category

**TypeScript Advanced Type** (String Pattern Matching & Interpolation): Template literal types (`${Prefix}_${Suffix}`) build string literal union types using embedded string type interpolation.



---

## 3. Explanation

### Environment Context
- **Build-time** (Like mapped and conditional types, template literal checks occur at compile time and compile down to standard JS string concatenation).



---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating combinatorial explosions that crash the compiler

**The mistake:** Placing multiple large unions inside multiple placeholders of a template string.

**Why it's wrong:** The number of types generated is exponential. If you mix a union of 20 elements with another union of 20 elements, TypeScript must compute 400 types. Doing this with multiple large structures can result in the compiler throwing a "Type instantiation is excessively deep and possibly infinite" error and slowing down your editor's auto-completion.

*Incorrect:*
```typescript
type Alpha = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
type Numbers = '1' | '2' | '3' | '4' | '5' | '6' | '7';
type Symbols = '!' | '@' | '#' | '$' | '%' | '^' | '&';

// 7 * 7 * 7 = 343 combinations. Easy to slow down autocomplete if increased further
type Hash = `${Alpha}-${Numbers}-${Symbols}`; 
```

**Golden Rule:** Keep template literal permutations focused. Never combine multiple high-cardinality unions inside a single template literal definition.

---



### Mistake 2: Creating Massive Combinatorial Explosion in Template Literal Types

**The mistake:** Combining 5 large string unions inside a single template literal type `${A}_${B}_${C}_${D}`.

**Why it's wrong:** TypeScript evaluates all permutations of template literal unions. Combining large unions causes compiler exponential complexity spikes and `Expression produces a union that is too complex to represent` errors.

*Incorrect:*
```typescript
type A = "a"|"b"|"c"|"d"|"e";
type B = "1"|"2"|"3"|"4"|"5";
type C = "x"|"y"|"z"|"w"|"v";
// type Explosive = `${A}_${B}_${C}_${D}_${E}`; // ❌ Expression produces union that is too complex!
```

*Fix:*
```typescript
type EventName = `on${Capitalize<"click" | "hover">}`; // Keep permutations scoped
```

### Mistake 3: Confusing Template Literal Types with Runtime Template Strings

**The mistake:** Writing `` const str = `user_${id}` `` expecting template literal type inference without `as const`.

**Why it's wrong:** Runtime template strings widen to `string` unless assigned to `const` or asserted `as const`.

*Incorrect:*
```typescript
let id = "123";
let path = `user_${id}`; // Inferred as string, not `user_${string}`
```

*Fix:*
```typescript
const id = "123";
const path = `user_${id}` as const; // Infers exact template literal type
```

## 5. Practice Exercises

### Exercise 1: Generating Event Handler Names with Template Literals

**Scenario:**
Generate a union of event listener method names (`"onClick"` | `"onHover"`) from a base event union (`"click"` | `"hover"`).

**Requirements:**
1. Define `type EventListenerName = `on${Capitalize<Event>}`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Event = "click" | "hover" | "submit";
> 
> type EventListenerName = `on${Capitalize<Event>}`;
> // Inferred as: "onClick" | "onHover" | "onSubmit"
> 
> const handlerName: EventListenerName = "onClick";
> ```
> 
> #### Technical Explanation
>
> 1. Template literal types (`${Prefix}_${Suffix}`) perform string interpolation at the type level.
> 2. Automatically distributes over union types (`"click" | "hover"`).
> 3. Integrates with intrinsic string utilities (`Capitalize`, `Uppercase`).
> 
---

### Exercise 2: Building Type-Safe CSS Dimensional Units

**Scenario:**
Create a type `CSSLength` restricting values to strings ending in `"px"`, `"em"`, or `"rem"` (e.g. `"10px"`, `"2rem"`).

**Requirements:**
1. Define `type CSSLength = `${number}${"px" | "em" | "rem"}`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Unit = "px" | "em" | "rem";
> type CSSLength = `${number}${Unit}`;
> 
> const margin: CSSLength = "16px";
> const fontSize: CSSLength = "1.5rem";
> 
> // const invalid: CSSLength = "16pt"; // ❌ Compile Error: Type '"16pt"' is not assignable to type 'CSSLength'.
> ```
> 
> #### Technical Explanation
>
> 1. Template literal types can embed primitive type placeholders (`${number}`).
> 2. Validates string formatting syntax at compile time.
> 3. High precision string validation for design systems and CSS-in-JS libraries.
> 
---

### Exercise 3: Pattern Matching and Extracting String Segments

**Scenario:**
Extract the parameter name from a route path string `"/users/:id"` using conditional types and template literal inference (`"/:path"`).

**Requirements:**
1. Infer parameter name from `Route extends `/:${infer Param}``.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type ExtractParam<Route extends string> = 
>   Route extends `/:${infer Param}` ? Param : never;
> 
> type Param1 = ExtractParam<"/:userId">; // "userId"
> type Param2 = ExtractParam<"/:orderId">; // "orderId"
> ```
> 
> #### Technical Explanation
>
> 1. `infer` inside template literal types matches string substrings dynamically.
> 2. Parses URL path parameters statically during compilation.
> 3. Basis for type-safe routing libraries in Next.js and Express.
> 
---



## 6. Related Terms
- [Literal Types](../level_05/literal_types.md) — The primitive values that build templates.
- [Mapped Types](mapped_types.md) — Using literal keys to rebuild object definitions.
- [`keyof` Operator](keyof.md) — Extracting keys to feed into template transformations.
- [Key Remapping in Mapped Types (`as`)](key_remapping_mapped_types.md) — Related concept: Key Remapping in Mapped Types (`as`).
- [Conditional Types](conditional_types.md) — Related concept: Conditional Types.

---

## 7. Key Takeaways
- **Template Literal Types** construct dynamic string types using ES6 backtick template syntax inside type space.
- They generate permutations automatically when string unions are passed to placeholders.
- Intrinsic helpers (`Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`) allow case adjustments on dynamic string parameters.
- Provide strong type checking for dynamic patterns like event listener bindings, CSS alignments, and routing links.
- Avoid combinatorial explosions by limiting the size of combined unions.
