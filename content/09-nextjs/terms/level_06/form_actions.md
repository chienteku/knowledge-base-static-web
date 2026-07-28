# Form Actions

> **Level 6 — Server Actions & Mutations**
> The native HTML `<form action="...">` pattern supercharged by React 19 and Next.js, allowing forms to seamlessly invoke Server Actions without manual event handlers.

---

## 1. Prerequisites
- [Server Actions (`"use server"`)](../level_06/server_actions.md) — The functions that form actions execute.
- [HTML Forms](../../../01-html/terms/level_05/form.md) — The standard Web API this builds upon.

---

## 2. Term Category
- **Data Mutation / UI**

---

## 3. Environment Context
- **Server Component or Client Component**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional React, form submission requires capturing the `onSubmit` event, calling `e.preventDefault()`, tracking the state of every input using `useState` or `useRef`, and manually building a JSON object to send to the server.
React 19 and Next.js embraced the native HTML Web Standard. Forms natively know how to gather their input data and send it. By passing a Server Action to the `action` prop, React intercepts the native submission and securely routes it to your server function.

### (2) The Syntax
Your Server Action will automatically receive a native Web `FormData` object containing the values of all inputs that have a `name` attribute.

```tsx
export default function CheckoutForm() {
  
  // The Server Action
  async function processOrder(formData: FormData) {
    "use server";
    
    // Extract data using native Web APIs
    const itemId = formData.get('itemId');
    const quantity = formData.get('quantity');
    
    await database.createOrder(itemId, Number(quantity));
  }

  return (
    // We pass the function to the `action` prop!
    <form action={processOrder}>
      {/* Inputs MUST have a name attribute! */}
      <input type="hidden" name="itemId" value="abc-123" />
      <input type="number" name="quantity" required />
      
      <button type="submit">Buy Now</button>
    </form>
  );
}
```

### (3) Progressive Enhancement
Because Form Actions are built on top of native HTML forms, they feature **Progressive Enhancement**. If the user's internet is slow and the React JavaScript bundle hasn't finished downloading yet, the form *still works*! The browser will fall back to a standard HTML form submission, and Next.js will intercept it on the server and process the Server Action anyway.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `name` attribute

**The mistake:** A developer writes `<input type="text" id="username" />` and wonders why `formData.get('username')` is returning null in their Server Action.

**Why it's wrong:** The native HTML `FormData` API explicitly relies on the `name` attribute of inputs to construct the key-value pairs. IDs and classes are completely ignored during form submission.
**Golden Rule:** Every input, select, and textarea inside a form MUST have a `name` attribute if you want to read its value in a Server Action.

---

### Mistake 2: Executing `event.preventDefault()` When Submitting Native Form Actions

**The mistake:** Adding `@submit.prevent` or `e.preventDefault()` to `<form action={serverAction}>`.

**Why it's wrong:** Next.js native form actions manage event submission automatically. Calling `preventDefault()` stops native progressive enhancement and breaks automatic form submission.

*Incorrect:*
```tsx
<form action={createPost} onSubmit={(e) => e.preventDefault()}> <!-- ❌ Prevents form action execution! -->
```

*Fix:*
```tsx
<form action={createPost}> <!-- Let native form action handle submission -->
```

---

### Mistake 3: Accessing Un-Parsed FormData Keys Without Type Casting

**The mistake:** Writing `const age = formData.get('age'); age + 5`.

**Why it's wrong:** `formData.get('key')` returns `FormDataEntryValue | null` (a string or File). Performing numeric arithmetic directly results in string concatenation (`'255'`). Cast types explicitly.

*Incorrect:*
```typescript
const age = formData.get('age');
console.log(age + 5); // ❌ Produces string concatenation '255'!
```

*Fix:*
```typescript
const age = Number(formData.get('age')); // Explicitly cast to number
console.log(age + 5); // 30
```


---

## 6. Practice Exercises

### Exercise 1: Multiple Submit Buttons

**Problem:** You have a form with a "Save as Draft" button and a "Publish" button. How can you trigger different Server Actions depending on which button is clicked?

**Expected output:**
> [!check]- Answer
> ```tsx
> <form action={defaultAction}>
>   <input name="title" />
>   
>   {/* The formAction prop overrides the form's action! */}
>   <button formAction={saveDraftAction}>Save as Draft</button>
>   <button formAction={publishAction}>Publish</button>
> </form>
> ```
> - Native HTML buttons have a specific attribute that overrides the form's action.

---

### Exercise 2: Native Form Action Progressive Enhancement

**Problem:** Why do Next.js `<form action={serverAction}>` forms function even if JavaScript is disabled in the browser?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js server actions leverage standard HTML native form POST submission mechanisms, enabling progressive enhancement when JS is disabled.
> ```
> - Native HTML `<form action>` submits POST requests without browser JS.
> 
> ```text
> JS Enabled: Client fetch action submission;
> JS Disabled: Native HTML POST submission.
> ```

---

### Exercise 3: FormData Extraction Pattern

**Problem:** Write Server Action `createUser(formData: FormData)` extracting string `email` and `name`.

**Expected output:**
> [!check]- Answer
> ```typescript
> 'use server'; export async function createUser(formData: FormData) { const email = formData.get('email') as string; const name = formData.get('name') as string; await db.user.create({ data: { email, name } }); }
> ```
> - `formData.get('key')` extracts submitted form input fields.
> 
> ```typescript
> 'use server';
> 
> export async function createUser(formData: FormData) {
>   const email = formData.get('email') as string;
>   const name = formData.get('name') as string;
>   await db.user.create({ data: { email, name } });
> }
> ```


---

## 7. Related Terms
- [Server Actions (`"use server"`)](../level_06/server_actions.md) — The target of the Form Action.
- [`useFormStatus`](../level_06/use_form_status.md) — How to show a loading spinner while the action is running.

---

## 8. Key Takeaways
- **Form Actions** allow you to pass a Server Action directly into the `<form action={...}>` prop.
- The Server Action automatically receives a native **`FormData`** object containing the form's data.
- Inputs must have a `name` attribute to be included in the `FormData`.
- Because it utilizes native HTML, the form works even before JavaScript has loaded (Progressive Enhancement).
