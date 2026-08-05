# Branded / Nominal Types

> **Level 9 — Advanced Types**
> A design pattern in TypeScript used to simulate nominal (name-based) type safety by intersecting base primitive types with a virtual "brand" object, preventing distinct domain values from being accidentally mixed.

---

## 1. Prerequisites
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — The default shape-matching system.
- [Intersection Types (`&`)](../level_05/intersection_types.md) — Combining multiple type shapes together.

---

## 2. Term Category
- **Advanced Type**

---

## 3. Environment Context
- **Build-time** (Branding is entirely a compile-time filter. The virtual brand key is erased during build and does not exist on values at runtime).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
TypeScript is a **Structural Type System**, meaning type compatibility is based on shape. If two types have the same properties, they are considered identical.

While highly flexible, this is a dangerous weakness when working with primitive types like `string` or `number` that represent different concepts.

For example, look at this application code:
```typescript
type UserId = string;
type PostId = string;

function deletePost(postId: PostId, deletedBy: UserId) { ... }

const currentUserId: UserId = 'user_99';
const targetPostId: PostId = 'post_1001';

// Bug: Swapped arguments! But compiles successfully because both are plain strings.
deletePost(currentUserId, targetPostId); 
```

In a **Nominal Type System** (like Java or Rust), classes with different names are incompatible even if they wrap identical values. 

**Branded Types** (also called nominal typing simulation) are a design pattern created to simulate nominal types in TypeScript, separating critical identifiers and units to prevent logic bugs.

### (2) Core Mechanics
To create a branded type, we intersect a base primitive type with a unique, virtual brand property:

```typescript
// Define branded types
type UserId = string & { readonly __brand: 'UserId' };
type PostId = string & { readonly __brand: 'PostId' };
```

Because of structural typing:
- A plain `string` is **not compatible** with `UserId` because it lacks the `__brand` property.
- `UserId` is **not compatible** with `PostId` because their brand names differ.

To instantiate a branded type, you must cast the input string at your application boundaries (validation layers, database loaders, or network boundaries) using a Type Assertion:

```typescript
// Cast normal strings to branded types
const currentUserId = 'user_99' as UserId;
const targetPostId = 'post_1001' as PostId;

function deletePost(postId: PostId, deletedBy: UserId) {
  console.log(`Deleting ${postId} by user ${deletedBy}`);
}

// 1. Error: 'UserId' is not assignable to 'PostId'
// deletePost(currentUserId, targetPostId); 

// 2. Correct order: Compiles successfully!
deletePost(targetPostId, currentUserId);
```

At runtime, the brand is fictional. The compiled JavaScript is just plain string assignments:
```javascript
// Compiled output: No brand objects exist at runtime
const currentUserId = 'user_99';
const targetPostId = 'post_1001';
deletePost(targetPostId, currentUserId);
```

### (3) Real-World Application
Safeguarding currencies (USD vs EUR) or inputs that must be sanitized before processing.

```typescript
type SanitizedHtml = string & { readonly __brand: 'Sanitized' };

function sanitizeInput(input: string): SanitizedHtml {
  // Perform sanitization regex...
  const cleanStr = input.replace(/<script.*?>.*?<\/script>/gi, '');
  return cleanStr as SanitizedHtml; // Cast at the boundary
}

function renderHtml(html: SanitizedHtml) {
  document.body.innerHTML = html; // Safe rendering
}

const userInput = '<script>alert(1)</script><div>Hello</div>';
// renderHtml(userInput); // Error! Force developer to sanitize first
renderHtml(sanitizeInput(userInput)); // Compiles!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to access or instantiate the brand key at runtime

**The mistake:** Writing code that tries to populate or read the `__brand` property on a branded value.

**Why it's wrong:** The brand property does not exist in the JavaScript runtime. Accessing it returns `undefined`.

*Incorrect:*
```typescript
const userId = '123' as UserId;

// Anti-pattern: Reading virtual key
if (userId.__brand === 'UserId') { ... } 
```

**Golden Rule:** Branded types are virtual compile-time constructs. Treat them as primitives at runtime and do not interact with the `__brand` key in JavaScript code.

---



### Mistake 2: Assuming Branded Nominal Types Exist as Runtime Constructs

**The mistake:** Expecting `const id: UserId = "user_123" as UserId;` to validate brand structure at runtime.

**Why it's wrong:** Branding tags (`__brand: "UserId"`) are pure compile-time assertions erased during compilation. At runtime, branded values are raw underlying primitives.

*Incorrect:*
```typescript
type UserId = string & { __brand: "UserId" };
const id = "123" as UserId;
console.log(typeof id); // 💥 Outputs 'string', NOT object or brand!
```

*Fix:*
```typescript
type UserId = string & { __brand: "UserId" };
function makeUserId(id: string): UserId {
    if (!id.startsWith("usr_")) throw new Error("Invalid ID format");
    return id as UserId; // Construct via validated factory
}
```

### Mistake 3: Attempting Direct Un-Asserted Assignment to Branded Primitive Types

**The mistake:** Assigning a raw `string` directly to a variable typed `UserId` without assertion factory functions.

**Why it's wrong:** Because raw `string` lacks the nominal `__brand` tag property, TS blocks direct assignment to prevent unvalidated IDs.

*Incorrect:*
```typescript
type UserId = string & { __brand: "UserId" };
// const id: UserId = "usr_123"; // ❌ Type 'string' is not assignable to type 'UserId'
```

*Fix:*
```typescript
type UserId = string & { __brand: "UserId" };
const id = "usr_123" as UserId; // Assert via validation factory
```

## 6. Practice Exercises

### Exercise 1: Currency Safety

**Problem:** You are building an e-commerce gateway. The currency handler accepts USD values and performs transactions. Prevent developer errors by branding numeric inputs to separate `USD` from `EUR` values. Complete the branded declarations and fix the function invoke call.

```typescript
// Complete branded declarations:
type USD = number & { readonly __brand: 'USD' };
type EUR = number & { readonly __brand: 'EUR' };

function chargeCard(amount: USD) {
  console.log(`Charged: $${amount}`);
}

const walletEUR = 50 as EUR;
const walletUSD = 60 as USD;

// Fix the chargeCard call:
// chargeCard(walletEUR); // Should throw compile error
chargeCard(walletUSD); // Should compile successfully
```

**Expected output:**
> [!check]- Answer
> ```text
> The compiler rejects walletEUR but accepts walletUSD.
> ```
> - The type parameter USD should be a number intersected with a brand shape.
> - Call `chargeCard` passing `walletUSD` instead of `walletEUR`.

---



### Exercise 2: Creating USD vs EUR Branded Currency Types

**Problem:** Create branded types `USD = number & { readonly __brand: unique symbol }` and `EUR` preventing accidental currency mixing.

**Expected output:**
> [!check]- Answer
> ```text
> USD and EUR branded types created
> ```
> ```typescript
> declare const usdBrand: unique symbol;
> type USD = number & { readonly [usdBrand]: true };
> declare const eurBrand: unique symbol;
> type EUR = number & { readonly [eurBrand]: true };
> console.log("USD and EUR branded types created");
> ```
>
> **Explanation:** Unique symbols prevent brand collision across independent domain types.

---

### Exercise 3: Branded Type Factory Helper

**Problem:** Write factory function `makeUSD(n: number): USD` for branded currency amounts.

**Expected output:**
> [!check]- Answer
> ```text
> Branded USD factory function verified
> ```
> ```typescript
> function makeUSD(n: number): USD {
>   if (n < 0) throw new Error("Amount must be positive");
>   return n as USD;
> }
> console.log("Branded USD factory function verified");
> ```
>
> **Explanation:** Factory functions validate domain invariants before applying compile-time nominal brand assertions.

## 7. Related Terms
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — The default matching system that branding limits.
- [Intersection Types (`&`)](../level_05/intersection_types.md) — The operator used to combine the primitive and the brand.
- [Type Assertions (`as`)](../level_05/type_assertions.md) — The casting syntax used to brand values.

---

## 8. Key Takeaways
- **Branded Types** simulate nominal (declaration-based) type safety inside structural type systems.
- Created by intersecting a primitive type (like `string` or `number`) with a virtual object containing a unique tag.
- Used to protect distinct variables of the same base type (e.g. `UserId` vs `ProductId`, or `USD` vs `EUR`) from accidental mixture.
- Enforced strictly at compile time; brand keys are erased and do not exist at runtime.
- Instantiated by casting primitives using type assertions (`as BrandedType`) at system boundaries.
