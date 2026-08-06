# Server Actions Overview (`"use server"`)

> **Level 6 — Server Actions & Mutations**
> Asynchronous JavaScript functions that execute exclusively on the Server. They are the modern Next.js paradigm for handling form submissions and data mutations.

---

## 1. Prerequisites
- [React Server Components (RSC)](../level_01/rsc.md) — The environment that popularized Server Actions.
- [Client Components (`"use client"`)](../level_01/client_components.md) — The counterpart directive to `"use server"`.

---

## 2. Term Category

**Data Mutation & Actions** (Server Action Mutation Framework): Server Actions are asynchronous server-side functions invoked directly from client components or HTML forms without API endpoints.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
Historically, if you wanted a user to submit a "Contact Us" form and save it to a database, you had to:
1. Build a separate API endpoint (e.g., `POST /api/contact`).
2. Write an `onSubmit` handler in your React component.
3. Use `e.preventDefault()`.
4. Manually construct a `fetch()` request to send the JSON payload to the API.
5. Handle the loading state and errors.
This is an enormous amount of boilerplate! **Server Actions** eliminate all of it. They allow you to define a server-side function directly in your React file and pass it straight to the `<form action={...}>` prop.

### (2) The `"use server"` Directive
You opt-in by placing `"use server"` at the top of an `async` function body, or at the top of a dedicated file.

```tsx
// app/settings/page.tsx
import db from '@/lib/db';

export default function Settings() {
  
  // This is a Server Action!
  async function updateUser(formData: FormData) {
    "use server"; // Tells Next.js this function must run on the server
    
    // We can talk directly to the database here!
    const name = formData.get('name');
    await db.user.update({ data: { name } });
  }

  // We pass the function directly to the form! No API routes needed!
  return (
    <form action={updateUser}>
      <input name="name" type="text" />
      <button type="submit">Save</button>
    </form>
  );
}
```

### (3) How it works under the hood
When the user clicks "Save", Next.js automatically makes a hidden `POST` request to the server, executes your `updateUser` function, and returns the result. It acts like a remote procedure call (RPC).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting validation and security

**The mistake:** A developer writes a Server Action to delete a post, but forgets to check if the user is an admin.
```tsx
async function deletePost(id: string) {
  "use server";
  await db.post.delete({ where: { id } }); // ❌ Anyone can call this!
}
```

**Why it's wrong:** Server Actions are publicly accessible endpoints! Even though you didn't create a traditional `/api/delete` route, a hacker can easily inspect the network tab and trigger your Server Action directly.
**Golden Rule:** Treat every single Server Action like a public API route. ALWAYS authenticate the user, check permissions, and validate the input data (using Zod) inside the action body.

---

### Mistake 2: Omitting the `'use server'` Directive at Top of Server Action Files

**The mistake:** Creating a dedicated server action file `actions.ts` without `'use server'` at the top.

**Why it's wrong:** Without `'use server'`, exported functions are bundled into client JS code. Database credentials and private queries inside the action will leak to the browser or fail.

*Incorrect:*
```typescript
// app/actions.ts
// ❌ Missing 'use server' directive!
export async function deleteUser(id: string) { await db.user.delete({ where: { id } }); }
```

*Fix:*
```typescript
// app/actions.ts
'use server'; // Required at top of dedicated action files
export async function deleteUser(id: string) { await db.user.delete({ where: { id } }); }
```

---

### Mistake 3: Exposing Insecure Server Actions Without Authentication Checks

**The mistake:** Writing `'use server'; export async function deleteAccount(id: string) { await db.delete(id); }` without checking user session.

**Why it's wrong:** Server Actions expose public HTTP POST endpoints. Anyone can invoke a Server Action with arbitrary parameters unless you verify the user session INSIDE the action.

*Incorrect:*
```typescript
'use server';
export async function deleteUser(id: string) {
  await db.user.delete({ where: { id } }); // ❌ Un-authenticated publicly callable action!
}
```

*Fix:*
```typescript
'use server';
export async function deleteUser(id: string) {
  const session = await getSession();
  if (!session || session.user.id !== id) throw new Error('Unauthorized');
  await db.user.delete({ where: { id } });
}
```


---

## 5. Practice Exercises

### Exercise 1: Authoring Standalone Server Actions

**Scenario:**
Create `app/actions/comments.ts` with exported `"use server"` action functions.

**Requirements:**
1. Add `"use server"` directive at the top of the file.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/actions/comments.ts
> "use server";

import { revalidatePath } from "next/cache";

export async function addCommentAction(formData: FormData) {
  const text = formData.get("text") as string;
  if (!text) throw new Error("Comment text is required");

  // Save comment to database...

  revalidatePath("/blog/[slug]", "page");
}
```

> #### Technical Explanation
>
> 1. Adding `"use server"` at the top of a file exports all functions as callable Server Actions.
> 2. Allows importing actions into Client Components (`"use client"`).
> 3. Standard organization pattern for application mutations.

---

### Exercise 2: Invoking Server Actions inside Client Component Buttons

**Scenario:**
Invoke a Server Action imperatively inside a Client Component button click handler.

**Requirements:**
1. Call imported Server Action inside `startTransition()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useTransition } from "react";
import { addCommentAction } from "@/app/actions/comments";

export default function QuickAddButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("text", "Quick Comment!");
      await addCommentAction(formData);
    });
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? "Adding..." : "Quick Add Comment"}
    </button>
  );
}
```

> #### Technical Explanation
>
> 1. Server Actions can be invoked imperatively inside client event handlers (not just HTML forms).
> 2. `useTransition` tracks action execution pending state without blocking UI responsiveness.
> 3. Flexible client interaction pattern.

---

### Exercise 3: Handling Server Action Return Values and Errors

**Scenario:**
Return typed response objects `{ success: boolean, message: string }` from a Server Action.

**Requirements:**
1. Return JSON-serializable status object from action.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> "use server";

export async function safeMutation(formData: FormData) {
  const title = formData.get("title");
  if (!title) {
    return { success: false, message: "Title field is mandatory" };
  }

  // Perform database mutation...

  return { success: true, message: "Mutation completed successfully!" };
}
```

> #### Technical Explanation
>
> 1. Server Actions can return JSON-serializable primitive objects or values.
> 2. Returning status objects avoids throwing raw unhandled exceptions across the network boundary.
> 3. Idiomatic error handling pattern for user forms.

---




---

## 6. Related Terms
- [Form Actions](form_actions.md) — How Server Actions are actually invoked.
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — The legacy way to handle mutations.
- [`useFormState` Hook](use_form_state.md) — Related concept: `useFormState` Hook.
- [Zod (Schema Validation)](zod_validation.md) — Related concept: Zod (Schema Validation).
- [`useFormStatus` Hook](use_form_status.md) — useFormStatus hook.

---

## 7. Key Takeaways
- **Server Actions** are `async` functions that execute on the server but can be called directly from your React UI.
- They eliminate the need to manually build API routes and `fetch` requests for simple data mutations.
- You declare them using the `"use server"` directive inside the function body, or at the top of a file.
- They are public endpoints! You must implement proper authentication and data validation inside them.
