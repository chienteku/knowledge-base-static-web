# Zod (Schema Validation)

> **Level 6 — Server Actions & Mutations**
> A TypeScript-first schema declaration and validation library used to securely inspect, parse, and enforce data types on untrusted user inputs.

---

## 1. Prerequisites
- [React Components](../level_01/react_components.md) — The form components that gather user input.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Universal** (Schemas run on the client for instant validation feedback and on the server to prevent data corruption).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
All user input is untrusted. Whether it is a user registering via a form or sending a JSON request payload, you must inspect the data to ensure it matches the expected types and constraints (e.g., that an email looks like an email and a quantity is a positive integer) before sending it to a database.

Hand-writing validation logic is tedious and error-prone:
```javascript
if (!email || typeof email !== 'string' || !email.includes('@')) {
  return "Invalid email";
}
```

**Zod** solves this by providing a declarative, chainable schema language. You write a single schema, and Zod validates the data, generates validation error messages, and automatically infers the corresponding TypeScript types. In Next.js, Zod is standard practice for validating `FormData` payloads inside Server Actions.

---

### (2) Schema Declaration and Parsing
You define schemas using `z` commands and validate payloads using `.safeParse()`:

```typescript
import { z } from 'zod';

// 1. Define the schema shape and rules
export const SignupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Please enter a valid email address"),
  age: z.coerce.number().int().positive("Age must be a positive integer"),
});

// 2. Automatically derive the TypeScript type from the schema!
export type SignupInput = z.infer<typeof SignupSchema>;
```

---

### (3) Validating Server Actions Safely
Inside a Server Action, you read the `FormData` object and validate it using `.safeParse()`:

```typescript
'use server';

import { SignupSchema } from '@/lib/schemas';

export async function registerUser(formData: FormData) {
  // Convert FormData entries to a plain object
  const rawData = {
    username: formData.get('username'),
    email: formData.get('email'),
    age: formData.get('age'),
  };

  // Validate the object using safeParse (does not throw)
  const validation = SignupSchema.safeParse(rawData);

  if (!validation.success) {
    // Return structured validation errors back to the form UI
    return {
      errors: validation.error.flatten().fieldErrors,
    };
  }

  // validation.data is now fully validated and typed: SignupInput!
  const { username, email, age } = validation.data;
  await saveUserToDatabase({ username, email, age });

  return { success: true };
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `.parse()` instead of `.safeParse()` inside user-facing controllers

**The mistake:** Calling the throwing `.parse()` method inside a Server Action:

```typescript
export async function submitData(formData: FormData) {
  // BAD: If validation fails, throws a raw ZodError and crashes the request!
  const data = MySchema.parse(Object.fromEntries(formData)); 
  return { success: true };
}
```

**Why it's wrong:** `.parse()` throws a runtime `ZodError` when validation fails. In Next.js, an unhandled error inside a Server Action bubbles up and triggers the generic `error.tsx` crash screen. The user loses their typed inputs and is shown a system error page.

**Golden Rule:** Always use `.safeParse()` inside API routes and Server Actions. It returns a result object containing `{ success: false, error }`, allowing you to return specific field error messages to the UI gracefully.

---

### Mistake 2: Trusting Client-Side Zod Validation Without Server-Side Re-Validation

**The mistake:** Validating form data with Zod in the browser client and skipping Zod validation inside the Server Action.

**Why it's wrong:** Malicious users can bypass browser client validation by sending raw POST HTTP requests directly to Server Action endpoints. ALWAYS re-validate data with Zod on the server.

*Incorrect:*
```typescript
'use server';
export async function createUser(rawInput: any) {
  await db.user.create({ data: rawInput }); // ❌ Un-validated raw input trusted on server!
}
```

*Fix:*
```typescript
'use server';
const schema = z.object({ email: z.string().email(), age: z.number().min(18) });
export async function createUser(rawInput: any) {
  const validated = schema.parse(rawInput); // Validate on server
  await db.user.create({ data: validated });
}
```

---

### Mistake 3: Using `schema.parse()` Instead of `schema.safeParse()` inside Server Actions

**The mistake:** Using `schema.parse(data)` without `try/catch` in a Server Action.

**Why it's wrong:** `schema.parse()` throws a raw ZodError exception when validation fails, triggering 500 error boundaries. Use `schema.safeParse()` to return structured validation error objects.

*Incorrect:*
```typescript
const data = userSchema.parse(input); // ❌ Throws un-handled ZodError exception on invalid input!
```

*Fix:*
```typescript
const result = userSchema.safeParse(input);
if (!result.success) {
  return { error: result.error.flatten().fieldErrors }; // Clean error payload
}
const data = result.data;
```


---

## 6. Practice Exercises

### Exercise 1: Form Validation Check

**Problem:** Complete the schema below to validate a product creation form. The product name is required (min 2 chars), price must be a positive number, and description is optional:

```typescript
import { z } from 'zod';

// Solution:
export const ProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  description: z.string().optional(),
});
```

> [!check]- Answer
> - Use `z.coerce.number()` to automatically parse string inputs from standard form fields into numeric types.

---

### Exercise 2: Zod Schema Definition and safeParse Pattern

**Problem:** Write Zod schema for `userSchema` requiring valid `email` and min 8-char `password`, and a function validating `formData` with `safeParse()`.

**Expected output:**
> [!check]- Answer
> ```typescript
> import { z } from 'zod'; const userSchema = z.object({ email: z.string().email(), password: z.string().min(8) }); export function validateForm(data: unknown) { return userSchema.safeParse(data); }
> ```
> - `z.object()` defines validation rules; `safeParse()` checks input safely.
> 
> ```typescript
> import { z } from 'zod';
> 
> const userSchema = z.object({
>   email: z.string().email('Invalid email address'),
>   password: z.string().min(8, 'Password must be at least 8 characters')
> });
> 
> export function validateForm(data: unknown) {
>   const result = userSchema.safeParse(data);
>   if (!result.success) {
>     return { errors: result.error.flatten().fieldErrors };
>   }
>   return { data: result.data };
> }
> ```

---

### Exercise 3: Inferring TypeScript Types from Zod Schema

**Problem:** Write TypeScript line inferring static TS type `UserType` from Zod `userSchema`.

**Expected output:**
> [!check]- Answer
> ```text
> type UserType = z.infer<typeof userSchema>;
> ```
> - `z.infer<typeof schema>` extracts static TypeScript types automatically.
> 
> ```typescript
> type UserType = z.infer<typeof userSchema>;
> ```


---

## 7. Related Terms
- [Server Actions Overview (`"use server"`)](server_actions.md) — The backend functions validated by Zod schemas.
- [`useFormState` Hook](use_form_state.md) — How validation errors are displayed.
- [Form Actions](form_actions.md) — Related concept: Form Actions.

---

## 8. Key Takeaways
- Zod declares type schemas to inspect and parse untrusted inputs.
- `z.infer` automatically creates TypeScript types from your schema definitions.
- Use `z.coerce` to convert incoming string values (from forms or query parameters) into numbers or booleans.
- Always use `.safeParse()` in Server Actions to return validation errors without crashing the route.
- Field errors can be flattened into simple lists using `validation.error.flatten().fieldErrors`.
