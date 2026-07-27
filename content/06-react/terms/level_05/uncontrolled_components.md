# Uncontrolled Components

> **Level 5 — DOM & Event Handling**
> A form input where React steps back and allows the native HTML DOM to manage its own internal data, grabbing the value only when absolutely necessary (e.g., on form submission).

---

## 1. Prerequisites
- [Controlled Components](../level_05/controlled_components.md) — You must understand the standard way to handle forms to understand the alternative.
- [`useRef` Hook](../level_04/use_ref.md) — The hook used to grab data from Uncontrolled Components.

---

## 2. Term Category
- **React Design Pattern / Form Handling**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Controlled Components (typing every keystroke into React State) are powerful, but they cause a Re-render on *every single keystroke*. If you have a massive, complex form with 50 inputs, typing "Hello" causes 5 re-renders of the entire form. This can cause severe input lag.
If you don't need real-time validation (like forcing uppercase letters), and you only care about the data when the user clicks "Submit", you can use **Uncontrolled Components**.

### (2) How it works
Instead of using `value` and `onChange`, you attach a `useRef` directly to the input DOM node. You let the user type normally (without React interfering). When the form is submitted, you read the value straight from the DOM using the ref.

```javascript
import { useRef } from 'react';

function CheckoutForm() {
  const addressRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    // We grab the value directly from the DOM, only when submitted!
    console.log("Shipping to:", addressRef.current.value);
  }

  // Notice: No `value` prop! No `onChange` prop!
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" ref={addressRef} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### (3) `defaultValue`
If you need an Uncontrolled Component to have starting text (e.g., editing an existing profile), you cannot use the `value` prop (because React will assume you want to Control it). 
Instead, you use the special React prop `defaultValue="Main St."`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mixing Controlled and Uncontrolled

**The mistake:** A developer passes `value={state}` to an input, but forgets to add `onChange`. They try to use a `ref` to read it instead.

**Why it's wrong:** React will throw a giant red warning in the console: "A component is changing an uncontrolled input to be controlled." An input must be strictly one or the other. If you use `value`, it is controlled. If you use `ref` and `defaultValue`, it is uncontrolled.
**Golden Rule:** Pick a lane. If you need real-time UI updates (disabling a submit button until the password is 8 chars), use Controlled. If you just need the raw data on submit, Uncontrolled is faster.

---



### Mistake 2: Attempting to Read Input Values via `useState` in Uncontrolled Components

**The mistake:** Using `useRef` for input value access while also maintaining redundant `useState` input handlers.

**Why it's wrong:** Uncontrolled components delegate input state management directly to the browser DOM. Mix-and-matching controlled and uncontrolled states adds redundant code.

*Incorrect:*
```javascript
// Redundantly creating useState and useRef for same input
```

*Fix:*
```javascript
Use useRef for uncontrolled forms or useState for controlled forms
```

### Mistake 3: Using `value` Prop Instead of `defaultValue` on Uncontrolled Inputs

**The mistake:** Writing `<input ref={inputRef} value="Initial" />` on an uncontrolled input.

**Why it's wrong:** Passing `value` locks the input as read-only. For uncontrolled inputs with initial values, use `defaultValue="Initial"` (or `defaultChecked`).

*Incorrect:*
```javascript
<input ref={inputRef} value="Initial" /> // ❌ Locks input as read-only!
```

*Fix:*
```javascript
<input ref={inputRef} defaultValue="Initial" /> // Initial value for uncontrolled input
```

## 6. Practice Exercises

### Exercise 1: The File Upload

**Problem:** You are building an `<input type="file" />` for a user to upload a profile picture. Should this be Controlled or Uncontrolled?

**Expected output:**
```text
It MUST be Uncontrolled.
For security reasons, browsers do not allow JavaScript to programmatically set the `value` of a file input. Therefore, React State cannot control it. You must use a `ref` (or an `onChange` that just reads the `e.target.files` without forcing a `value` back into the input).
```

> [!check]- Answer
> - Think about browser security with user hard drives.

---



### Exercise 2: Uncontrolled Form Submission via Ref

**Problem:** Build uncontrolled form reading `emailRef.current.value` on submit.

**Expected output:**
```text
function UncontrolledForm() { const emailRef = useRef(null); const handleSubmit = e => { e.preventDefault(); console.log(emailRef.current.value); }; return <form onSubmit={handleSubmit}><input ref={emailRef} defaultValue="user@ex.com" /><button type="submit">Save</button></form>; }
```

> [!check]- Answer
> ```javascript
> function UncontrolledForm() {
>   const emailRef = useRef(null);
>   const handleSubmit = e => {
>     e.preventDefault();
>     console.log(emailRef.current.value);
>   };
>   return (
>     <form onSubmit={handleSubmit}>
>       <input ref={emailRef} defaultValue="user@ex.com" />
>       <button type="submit">Save</button>
>     </form>
>   );
> }
> ```
>
> **Explanation:** Uncontrolled components read DOM input values on demand using React refs.

### Exercise 3: File Input Type Requirement

**Problem:** Why MUST `<input type="file">` always be implemented as an uncontrolled component in React? (File inputs are read-only in browser DOM security models and cannot be programmatically set via `value`).

**Expected output:**
```text
Browser security models restrict programmatically setting file input values
```

> [!check]- Answer
> ```text
> Browser security models restrict programmatically setting file input values
> ```
>
> **Explanation:** File inputs delegate file selection management directly to native OS file dialogs.

## 7. Related Terms
- [Controlled Components](../level_05/controlled_components.md) — The standard, React-centric way to handle forms.
- [`useRef` Hook](../level_04/use_ref.md) — The mechanism used to interact with uncontrolled inputs.

---

## 8. Key Takeaways
- **Uncontrolled Components** let the browser DOM handle its own input state, rather than using React State.
- They are significantly more performant for massive forms because keystrokes do not trigger Re-renders.
- You extract the data using `useRef` when the form is finally submitted.
- Use `defaultValue` instead of `value` to set their initial state.
- File inputs `<input type="file" />` are always Uncontrolled.
