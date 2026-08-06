# Branded / Nominal Types

> **Level 9 — Advanced Types**
> A design pattern in TypeScript used to simulate nominal (name-based) type safety by intersecting base primitive types with a virtual "brand" object, preventing distinct domain values from being accidentally mixed.

---

## 1. Prerequisites
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — The default shape-matching system.
- [Intersection Types (`&`)](../level_05/intersection_types.md) — Combining multiple type shapes together.

---

## 2. Term Category

**Type System Architecture** (Nominal Type Simulation Pattern): Branded nominal types attach unique phantom property tags to primitive types to simulate nominal typing in TypeScript's structural type system.



---

## 3. Explanation

### Environment Context
- **Build-time** (Branding is entirely a compile-time filter. The virtual brand key is erased during build and does not exist on values at runtime).



---

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Simulating Nominal Types with Nominal Branding Tags

**Scenario:**
Create nominal brand types for `UserId` and `OrderId` to prevent passing a `UserId` string into a function expecting an `OrderId`.

**Requirements:**
1. Define `type UserId = string & { readonly __brand: "UserId" }`.
2. Define `type OrderId = string & { readonly __brand: "OrderId" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Brand<K, T> = K & { readonly __brand: T };
> 
> type UserId = Brand<string, "UserId">;
> type OrderId = Brand<string, "OrderId">;
> 
> function makeUserId(id: string): UserId { return id as UserId; }
> function makeOrderId(id: string): OrderId { return id as OrderId; }
> 
> function processOrder(orderId: OrderId) {
>   console.log(`Processing Order ${orderId}`);
> }
> 
> const userId = makeUserId("usr_100");
> const orderId = makeOrderId("ord_500");
> 
> processOrder(orderId); // Valid!
> // processOrder(userId); // ❌ Compile Error: Type '"UserId"' is not assignable to type '"OrderId"'.
> ```
> 
> #### Technical Explanation
>
> 1. Branded types attach a phantom property tag (`__brand`) using type intersection (`&`).
> 2. Prevents structural type compatibility between identical underlying primitives (`string`).
> 3. Enforces domain type safety for domain IDs, currencies, and sanitized strings.
> 
---

### Exercise 2: Creating Un-Brand Helper Functions

**Scenario:**
Create a type-safe constructor helper that validates a raw un-sanitized string and returns a branded `SanitizedHTML` string.

**Requirements:**
1. Return `SanitizedHTML` from validation helper.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type SanitizedHTML = string & { readonly __brand: "SanitizedHTML" };
> 
> function sanitizeInput(rawHtml: string): SanitizedHTML {
>   const clean = rawHtml.replace(/<script.*?>.*?<\/script>/gi, "");
>   return clean as SanitizedHTML;
> }
> 
> function renderHTML(html: SanitizedHTML) {
>   document.body.innerHTML = html;
> }
> 
> const clean = sanitizeInput("<p>Hello</p>");
> renderHTML(clean);
> // renderHTML("<script>alert(1)</script>"); // ❌ Compile Error: Raw string is not SanitizedHTML!
> ```
> 
> #### Technical Explanation
>
> 1. Un-branded raw strings cannot be passed directly into functions expecting `SanitizedHTML`.
> 2. Guarantees that only strings processed by `sanitizeInput()` can reach dangerous DOM execution sinks.
> 3. Security architecture pattern for type-level XSS prevention.
> 
---

### Exercise 3: Zero-Runtime Overhead of Nominal Branding Audit

**Scenario:**
Explain why branded nominal types add zero bytes to transpiled JavaScript bundles.

**Requirements:**
1. Detail compile-time phantom property erasure.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Nominal Branding Runtime Audit:
> - Step 1: In TypeScript source: type UserId = string & { readonly __brand: "UserId" }.
> - Step 2: The __brand property exists ONLY in TypeScript's type system (phantom property).
> - Step 3: Transpiled JS output: const userId = "usr_100"; // Plain JavaScript string!
> Result: 100% compile-time type safety with ZERO runtime memory or performance overhead!
> ```
> 
> #### Technical Explanation
>
> 1. Phantom properties are never instantiated on runtime objects.
> 2. Type assertions (`as UserId`) inform `tsc` statically without invoking runtime functions.
> 3. Maximum type safety with zero performance impact.
> 
---



## 6. Related Terms
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — The default matching system that branding limits.
- [Intersection Types (`&`)](../level_05/intersection_types.md) — The operator used to combine the primitive and the brand.
- [Type Assertions (`as`)](../level_05/type_assertions.md) — The casting syntax used to brand values.

---

## 7. Key Takeaways
- **Branded Types** simulate nominal (declaration-based) type safety inside structural type systems.
- Created by intersecting a primitive type (like `string` or `number`) with a virtual object containing a unique tag.
- Used to protect distinct variables of the same base type (e.g. `UserId` vs `ProductId`, or `USD` vs `EUR`) from accidental mixture.
- Enforced strictly at compile time; brand keys are erased and do not exist at runtime.
- Instantiated by casting primitives using type assertions (`as BrandedType`) at system boundaries.
