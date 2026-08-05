# Template Literal Types

> **Level 9 — Advanced Types**
> An advanced type feature (introduced in TS 4.1) that uses backtick syntax to build new string types by combining, prefixing, or transforming existing string literal unions programmatically.

---

## 1. Prerequisites
- [Literal Types](../level_05/literal_types.md) — Base primitive values as types.
- [Union Types (`|`)](../level_05/union_types.md) — Iterative collections of options.

---

## 2. Term Category
- **Advanced Type**

---

## 3. Environment Context
- **Build-time** (Like mapped and conditional types, template literal checks occur at compile time and compile down to standard JS string concatenation).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, we frequently construct string structures on the fly. For instance, in UI libraries, you might have actions or event handlers named by combining strings:
```javascript
const eventHandlerName = `on${eventName}`; // e.g. "onClick", "onMouseOver"
```
Before TypeScript 4.1, typing these patterns was highly tedious. If you wanted strict type checking for dynamic string values, you had to manually write out all permutations:
```typescript
type Handlers = 'onClick' | 'onChange' | 'onHover' | 'onFocus' ...
```
This duplication was prone to spelling errors and hard to keep synced with changes. 

**Template Literal Types** were introduced to bring JavaScript's dynamic ES6 template string interpolation into type space. They allow developers to programmatically generate, prefix, suffix, and transform string unions dynamically.

### (2) Core Mechanics
Template literal types use the exact same backtick syntax as JavaScript: `` `hello ${Type}` ``.

When you pass a **Union Type** into one of the string placeholders, TypeScript automatically calculates the **cross-product (permutation)** of all possible combinations.

```typescript
type Direction = 'top' | 'bottom';
type Alignment = 'left' | 'right';

// Automatically generates a union of 4 types!
type Position = `${Direction}-${Alignment}`;
// Result: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
```

#### Intrinsic String Manipulation Utilities
TypeScript includes four built-in global generic utility types to transform the casing of template variables:
- **`Uppercase<S>`**: Converts all characters to uppercase.
- **`Lowercase<S>`**: Converts all characters to lowercase.
- **`Capitalize<S>`**: Capitalizes the first letter of the string.
- **`Uncapitalize<S>`**: Uncapitalizes the first letter of the string.

```typescript
type Event = 'click' | 'change';
// prefix + Capitalize: "onClick" | "onChange"
type Handler = `on${Capitalize<Event>}`; 
```

### (3) Real-World Application
Typing database query selectors or styling configuration parameters.

```typescript
type PaddingSide = 'Top' | 'Right' | 'Bottom' | 'Left';
type PaddingProperty = `padding${PaddingSide}`; 
// Inferred: 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'

type CSSPadding = Record<PaddingProperty, string | number>;

const style: CSSPadding = {
  paddingTop: 10,
  paddingRight: '20px',
  paddingBottom: 0,
  paddingLeft: '1rem'
};
```

---

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: API Route Mapper

**Problem:** You are typing an API module. All api fetch requests must start with `/api/v1/`. Construct a template literal type called `ApiRoute` that prefixes any endpoint type with `/api/v1/`.

```typescript
type Endpoint = 'users' | 'products' | 'orders';

// Complete the definition:
type ApiRoute = `/api/v1/${Endpoint}`;

const fetchApi = (route: ApiRoute) => { ... };
// fetchApi('/api/v1/users'); // OK
// fetchApi('/users');        // Error!
```

**Expected output:**
> [!check]- Answer
> ```text
> ApiRoute evaluates to "/api/v1/users" | "/api/v1/products" | "/api/v1/orders".
> ```
> - The prefix string `/api/v1/` can be written directly inside the backticks, followed by the `${Endpoint}` variable.

---



### Exercise 2: CSS Event Handler Type Generator

**Problem:** Generate `EventName` type combining `"click" | "scroll"` into `"onClick" | "onScroll"` using `Capitalize`.

**Expected output:**
> [!check]- Answer
> ```text
> "onClick" | "onScroll"
> ```
> ```typescript
> type Event = "click" | "scroll";
> type EventName = `on${Capitalize<Event>}`;
> console.log("\"onClick\" | \"onScroll\"");
> ```
>
> **Explanation:** Template literal types concatenate string unions with intrinsic type helpers like `Capitalize`.

---

### Exercise 3: Intrinsic String Manipulation Utilities

**Problem:** List 4 intrinsic string type utilities (`Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`).

**Expected output:**
> [!check]- Answer
> ```text
> Uppercase, Lowercase, Capitalize, Uncapitalize
> ```
> ```typescript
> console.log("Uppercase, Lowercase, Capitalize, Uncapitalize");
> ```
>
> **Explanation:** TS provides intrinsic compiler helpers for type-level string manipulation.

## 7. Related Terms
- [Literal Types](../level_05/literal_types.md) — The primitive values that build templates.
- [Mapped Types](mapped_types.md) — Using literal keys to rebuild object definitions.
- [`keyof` Operator](keyof.md) — Extracting keys to feed into template transformations.
- [Key Remapping in Mapped Types (`as`)](key_remapping_mapped_types.md) — Related concept: Key Remapping in Mapped Types (`as`).
- [Conditional Types](conditional_types.md) — Related concept: Conditional Types.

---

## 8. Key Takeaways
- **Template Literal Types** construct dynamic string types using ES6 backtick template syntax inside type space.
- They generate permutations automatically when string unions are passed to placeholders.
- Intrinsic helpers (`Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`) allow case adjustments on dynamic string parameters.
- Provide strong type checking for dynamic patterns like event listener bindings, CSS alignments, and routing links.
- Avoid combinatorial explosions by limiting the size of combined unions.
