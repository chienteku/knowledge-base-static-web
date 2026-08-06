# Zod (Schema Validation)

> **Level 6 — Server Actions & Mutations**
> A TypeScript-first schema declaration and validation library used to securely inspect, parse, and enforce data types on untrusted user inputs.

---

## 1. Prerequisites
- [React Components](../level_01/react_components.md) — The form components that gather user input.

---

## 2. Term Category

**Security & Middleware** (Type-Safe Schema Validation): Zod provides type-safe schema validation for user input FormData and API payloads inside Server Actions and Route Handlers.



---

## 3. Explanation

### Environment Context
- **Universal** (Schemas run on the client for instant validation feedback and on the server to prevent data corruption).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Validating Form Data Schemas with Zod

**Scenario:**
Create a Zod schema validating user email and age parameters inside a Server Action.

**Requirements:**
1. Import `z` from `zod`.
2. Define schema and parse `formData`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email("Invalid email format"),
  age: z.coerce.number().min(18, "Must be at least 18 years old")
});

export async function registerUserAction(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    age: formData.get("age")
  };

  const result = UserSchema.safeParse(rawData);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors
    };
  }

  // Proceed with type-safe result.data...
  console.log("Validated User Data:", result.data);
}
```

> #### Technical Explanation
>
> 1. `z.object({...})` defines type-safe validation rules for incoming string payloads.
> 2. `z.coerce.number()` converts string values from `FormData` into numbers before parsing.
> 3. `safeParse()` returns a result object (`result.success`) without throwing runtime exceptions.

---

### Exercise 2: Formulating Flattened Field Validation Errors for React UI

**Scenario:**
Format Zod validation error objects using `result.error.flatten().fieldErrors` for consumption in forms.

**Requirements:**
1. Use `flatten().fieldErrors` to extract field error strings.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const schema = z.object({
>   password: z.string().min(8, "Password must be at least 8 chars")
> });

const result = schema.safeParse({ password: "123" });

if (!result.success) {
  const formattedErrors = result.error.flatten().fieldErrors;
  // Output: { password: ["Password must be at least 8 chars"] }
}
```

> #### Technical Explanation
>
> 1. `error.flatten().fieldErrors` converts complex Zod error trees into plain key-value objects mapping field names to error arrays.
> 2. Cleanly serializes across the Server-to-Client boundary.
> 3. Standard error formatting pattern for Next.js forms.

---

### Exercise 3: Validating Route Handler JSON Payloads with Zod

**Scenario:**
Validate incoming HTTP POST JSON payloads inside a Next.js API Route Handler using `schema.parseAsync()`.

**Requirements:**
1. Parse JSON body with Zod schema in `route.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/users/route.ts
> import { z } from "zod";

const CreateUserSchema = z.object({
  username: z.string().min(3),
  role: z.enum(["USER", "ADMIN"])
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = await CreateUserSchema.parseAsync(body);

    return Response.json({ success: true, data: validatedData });
  } catch (err: any) {
    return Response.json({ error: err.errors }, { status: 400 });
  }
}
```

> #### Technical Explanation
>
> 1. `parseAsync()` validates data asynchronously and throws a `ZodError` if validation fails.
> 2. Protects backend services from malformed or malicious JSON request payloads.
> 3. Ensures complete type safety inside backend Route Handlers.

---




---

## 6. Related Terms
- [Server Actions Overview (`"use server"`)](server_actions.md) — The backend functions validated by Zod schemas.
- [`useFormState` Hook](use_form_state.md) — How validation errors are displayed.
- [Form Actions](form_actions.md) — Related concept: Form Actions.

---

## 7. Key Takeaways
- Zod declares type schemas to inspect and parse untrusted inputs.
- `z.infer` automatically creates TypeScript types from your schema definitions.
- Use `z.coerce` to convert incoming string values (from forms or query parameters) into numbers or booleans.
- Always use `.safeParse()` in Server Actions to return validation errors without crashing the route.
- Field errors can be flattened into simple lists using `validation.error.flatten().fieldErrors`.
