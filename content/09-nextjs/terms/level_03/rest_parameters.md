# JavaScript Rest Parameters (`...`)

> **Level 3 — Navigation & Routing Fundamentals**
> A JavaScript ES6 syntax pattern that collects an indefinite number of trailing arguments into a single array, which Next.js maps to catch-all URL parameters.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The parent framework utilizing ES6 syntax.

---

## 2. Term Category
- **Architecture**

---

## 3. Environment Context
- **Universal** (Runs on both server-side routing engines and client-side code).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Argument Filtering

**Problem:** Complete the function below to accept a threshold number followed by a dynamic list of scores, returning only scores that exceed the threshold:

```typescript
// Solution:
export function filterScores(threshold: number, ...scores: number[]): number[] {
  return scores.filter((score) => score > threshold);
}
```

> [!check]- Answer
> - Prefix the `scores` parameter with the rest parameter triple dots to capture arguments.

---

### Exercise 2: TypeScript Rest Parameter Function Typing

**Problem:** Write TypeScript function `combinePaths(base: string, ...segments: string[])` returning concatenated path string.

**Expected output:**
> [!check]- Answer
> ```typescript
> function combinePaths(base: string, ...segments: string[]): string { return [base, ...segments].join('/'); }
> ```
> - Rest parameters capture variable arguments as typed arrays.
> 
> ```typescript
> function combinePaths(base: string, ...segments: string[]): string {
>   return [base, ...segments].join('/');
> }
> ```

---

### Exercise 3: Spread vs Rest Parameter Distinction

**Problem:** Distinguish between ES6 Rest parameters vs Spread operator.

**Expected output:**
> [!check]- Answer
> ```text
> Rest parameters collect multiple function arguments into a single array (...args); Spread operator expands an array or object into individual elements (...arr).
> ```
> - Rest collects arguments: `function(...args)`
> - Spread expands arrays: `[...items]`
> 
> ```text
> Rest = Collect into array; Spread = Expand into items.
> ```


---

## 7. Related Terms
- None!

---

## 8. Key Takeaways
- Rest parameters (`...`) collect multiple arguments into a true JavaScript array.
- The rest parameter must be the last parameter in a function signature.
- Next.js uses this syntax for `[...slug]` catch-all directory names.
- Catch-all routes receive dynamic path segments as an array of strings in their `params` prop.
