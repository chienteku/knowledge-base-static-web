# JavaScript Rest Parameters (`...`)

> **Level 3 — Navigation & Routing Fundamentals**
> A JavaScript ES6 syntax pattern that collects an indefinite number of trailing arguments into a single array, which Next.js maps to catch-all URL parameters.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The parent framework utilizing ES6 syntax.

---

## 2. Term Category

**Routing & Layouts** (Optional Catch-All Route Segments): Optional catch-all segments (`[[...slug]]`) match zero or more nested URL path segments, making parent routes optional.



---

## 3. Explanation

### Environment Context
- **Universal** (Runs on both server-side routing engines and client-side code).

### (1) Design Motivation — "Why did we design this?"
In early JavaScript versions, writing functions that accepted a variable number of arguments (like a function that sums any amount of numbers) was difficult. Developers had to use the built-in, array-like `arguments` object, which lacked standard array methods (like `.map` or `.reduce`) and made signatures hard to read:

```javascript
// Old and confusing arguments utility
function sum() {
  return Array.prototype.slice.call(arguments).reduce((a, b) => a + b);
}
```

ES6 introduced **Rest Parameters** (the triple dot `...` syntax) to solve this. Rest parameters allow functions to gather any number of arguments directly into a clean, true JavaScript array, making function signatures clear and highly functional. Next.js borrows this exact ES6 syntax to define dynamic folder routes that capture multiple URL path segments.

---

### (2) Core Concept — ES6 Function Rest Syntax
A rest parameter must be prefixed with `...` and must be the **last** parameter in the function signature:

```typescript
// The 'numbers' parameter collects all incoming arguments into an array
export function sumAll(operator: string, ...numbers: number[]): number {
  const total = numbers.reduce((sum, num) => sum + num, 0);
  console.log(`Operation: ${operator}, Result: ${total}`);
  return total;
}

sumAll("Addition", 1, 2, 3, 4); // Outputs: "Operation: Addition, Result: 10"
```

---

### (3) Connection to Next.js Catch-All Routing
Next.js leverages this syntax in the file system. When you want a single folder path to capture all nested trailing sub-URLs, you wrap the directory name with brackets and three dots:

```
app/
└── shop/
    └── [...slug]/
        └── page.tsx   (Catch-all route)
```

If a user visits `/shop/clothes/shirts/large`, the Next.js router captures the path segments using the rest parameter model, passing them as a string array:

```typescript
// app/shop/[...slug]/page.tsx
interface PageProps {
  params: {
    slug: string[]; // Captured as an array: ["clothes", "shirts", "large"]
  };
}

export default function ShopPage({ params }: PageProps) {
  const [category, item, size] = params.slug;

  return (
    <div>
      <h1>Category: {category}</h1>
      <p>Product: {item} (Size: {size})</p>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Declaring other parameters after the rest parameter

**The mistake:** Placing another variable name after the rest parameter in a function definition:

```typescript
// BAD: SyntaxError: Rest parameter must be last formal parameter
function processUsers(...users: string[], action: string) {
  // ...
}
```

**Why it's wrong:** The JavaScript compiler cannot determine where the dynamic arguments array ends if there are named variables following it. The rest parameter must consume everything that remains.

**Golden Rule:** The rest parameter (`...`) must always be the final parameter in a function signature.

---

### Mistake 2: Confusing ES6 Rest Parameters with Next.js Catch-All Route Syntax

**The mistake:** Attempting to use ES6 function rest parameters `(...args)` as folder names (`app/docs/...args/page.tsx`).

**Why it's wrong:** Next.js catch-all routes require square brackets enclosing 3 dots: `[...slug]`. Omitting brackets creates invalid routing folders.

*Incorrect:*
```tsx
// app/docs/...slug/page.tsx ❌ Invalid folder name!
```

*Fix:*
```typescript
// app/docs/[...slug]/page.tsx Correct catch-all bracket syntax
```

---

### Mistake 3: Mutating Rest Parameter Arrays in Functions

**The mistake:** Writing `function handle(...args) { args.push(1); }`.

**Why it's wrong:** Rest parameters capture function arguments into a new array. Mutating rest parameters directly can cause unexpected side effects in data pipelines.

*Incorrect:*
```typescript
function log(...tags: string[]) {
  tags.push('default'); // ❌ Un-encapsulated mutation!
}
```

*Fix:*
```typescript
function log(...tags: string[]) {
  const allTags = [...tags, 'default']; // Create new array
}
```


---

## 5. Practice Exercises

### Exercise 1: Optional Catch-All Route Segments `[[...slug]]`

**Scenario:**
Create an optional catch-all route `app/shop/[[...slug]]/page.tsx` matching both `/shop` and `/shop/shoes/nike`.

**Requirements:**
1. Use double bracket folder syntax `[[...slug]]`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/shop/[[...slug]]/page.tsx
> export default async function ShopPage({
>   params
> }: {
>   params: Promise<{ slug?: string[] }>;
> }) {
>   const { slug } = await params;

  return (
    <main className="p-6">
      <h1>Shop Catalog</h1>
      <p>Active Category: {slug ? slug.join(" > ") : "All Products"}</p>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. Double bracket syntax `[[...slug]]` makes the catch-all parameter optional.
> 2. Matches base URL path `/shop` (`params.slug` is undefined) AND nested paths `/shop/a/b` (`params.slug` is `['a', 'b']`).
> 3. Consolidates catalog index pages and sub-category pages into a single `page.tsx` component.

---

### Exercise 2: Optional Catch-All Params Guard

**Scenario:**
Handle undefined `slug` parameters gracefully when accessing base route paths.

**Requirements:**
1. Provide fallback default state when `slug` is undefined.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export default async function OptionalGuard({
>   params
> }: {
>   params: Promise<{ slug?: string[] }>;
> }) {
>   const { slug } = await params;
>   const category = slug?.[0] ?? "featured";
>   const subCategory = slug?.[1] ?? "all";

  return (
    <div>
      <p>Category: {category}</p>
      <p>Sub-Category: {subCategory}</p>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. Optional chaining `slug?.[0]` guards against `TypeError` exceptions when accessing base `/shop` route paths.
> 2. Nullish coalescing operator `??` sets sensible default values for base paths.
> 3. Defensive programming pattern for optional catch-all routes.

---

### Exercise 3: Architectural Trade-Off: `[...slug]` vs `[[...slug]]`

**Scenario:**
Formulate an architectural selection decision matrix comparing `[...slug]` vs `[[...slug]]`.

**Requirements:**
1. Contrast required catch-all vs optional catch-all route matching.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Catch-All Selection Matrix:
> - Required Catch-All ([...slug]): Requires at least 1 path segment (/docs/a). Visiting base path (/docs) targets a separate app/docs/page.tsx file.
> - Optional Catch-All ([[...slug]]): Matches 0 or more path segments. Visiting base path (/shop) AND nested path (/shop/a) BOTH target app/shop/[[...slug]]/page.tsx.
> ```

> #### Technical Explanation
>
> 1. `[...slug]` is chosen when the root path has a distinct layout/page from child paths.
> 2. `[[...slug]]` is chosen when root and child paths share identical layout and rendering logic.
> 3. Key routing directory design decision.

---




---

## 6. Related Terms
- None!

---

## 7. Key Takeaways
- Rest parameters (`...`) collect multiple arguments into a true JavaScript array.
- The rest parameter must be the last parameter in a function signature.
- Next.js uses this syntax for `[...slug]` catch-all directory names.
- Catch-all routes receive dynamic path segments as an array of strings in their `params` prop.
