# `useNavigate` Hook

> **Level 9 — Routing & Ecosystem**
> A hook that allows you to programmatically change the URL and navigate the user using JavaScript code, rather than waiting for them to click a `<Link>`.

---

## 1. Prerequisites
- [React Router](react_router.md) — The library that provides this hook.
- [`<Link>` Component](link_component.md) — The declarative alternative to this imperative hook.
---

## 2. Term Category
- **React Router Hook**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
`<Link>` is great for navigation menus. But what if you need to redirect the user *after* an action completes?
For example, a user fills out a Login form and clicks "Submit". You need to:
1. Validate the password.
2. Send an API request.
3. Wait for the server's "Success" response.
4. **THEN redirect them to the Dashboard.**
You cannot use a `<Link>` for this, because `<Link>` navigates instantly. You need to Imperatively command React Router to navigate via code. That is what `useNavigate` is for.

### (2) How to use it
You call the hook to get the `navigate` function. Then you call that function and pass it a URL string.
```javascript
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const success = await loginAPI();
    
    if (success) {
      // Programmatically redirect the user!
      navigate('/dashboard');
    } else {
      showError("Bad password");
    }
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### (3) The "Replace" Trick
Normally, navigating adds a new entry to the browser's History (so the user can click the Back button). 
If a user is at `/login`, successfully logs in, and goes to `/dashboard`, you *don't* want them to click the Back button and end up back on the Login screen!
You can pass `{ replace: true }`. This overwrites the current history entry, effectively erasing the Login screen from the Back button history.
`navigate('/dashboard', { replace: true })`

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `useNavigate` instead of `<Link>` for simple buttons

**The mistake:** A developer creates a "Go to About Page" button and uses an `onClick` with `useNavigate('/about')` instead of just wrapping it in a `<Link>`.

**Why it's wrong:** It breaks accessibility (Screen Readers won't know it's a link), and the user cannot "Right Click -> Open in New Tab". 
**Golden Rule:** If the user is just navigating by clicking, ALWAYS use `<Link>`. Only use `useNavigate` for programmatic redirects (like after a form submission or a timer).

---



### Mistake 2: Calling `navigate('/path')` Directly inside Component Render Bodies

**The mistake:** Writing `const navigate = useNavigate(); navigate('/login');` in component render code.

**Why it's wrong:** Calling `navigate()` during render triggers a side-effect side navigation during render phase! This causes infinite re-render loops or crashes. Call `navigate()` inside event handlers or `useEffect`.

*Incorrect:*
```javascript
function ProtectedPage({ isAuth }) {
  const navigate = useNavigate();
  if (!isAuth) navigate('/login'); // ❌ Imperative side-effect call during render!
}
```

*Fix:*
```javascript
function ProtectedPage({ isAuth }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuth) navigate('/login'); // Safe inside useEffect
  }, [isAuth, navigate]);
}
```

### Mistake 3: Passing Numeric Strings to `navigate(-1)` for Backwards History Navigation

**The mistake:** Calling `navigate('-1')` expecting to go back to previous browser page.

**Why it's wrong:** Passing string `'-1'` navigates to the literal relative URL path `"/current/-1"`! Pass numeric integer `-1` (`navigate(-1)`) for history back navigation.

*Incorrect:*
```javascript
navigate('-1') // ❌ Navigates to relative path '/-1'!
```

*Fix:*
```javascript
navigate(-1) // Navigates 1 step back in browser history
```

## 6. Practice Exercises

### Exercise 1: The "Go Back" Button

**Problem:** You are building a "Cancel" button. If the user clicks it, you want them to go back to whatever page they were on previously. How do you do this with `useNavigate`?

**Expected output:**
> [!check]- Answer
> ```javascript
> const navigate = useNavigate();
> 
> function handleCancel() {
>   // Passing -1 tells the router to go back one step in history!
>   navigate(-1);
> }
> ```
> - The `navigate` function accepts numbers as well as strings!

---



### Exercise 2: Programmatic Navigation on Form Submit

**Problem:** Use `useNavigate()` to programmatically navigate to `/dashboard` after successful API form submit.

**Expected output:**
> [!check]- Answer
> ```text
> function LoginForm() { const navigate = useNavigate(); const handleSubmit = async e => { e.preventDefault(); await login(); navigate('/dashboard', { replace: true }); }; return <form onSubmit={handleSubmit}><button>Login</button></form>; }
> ```
> ```javascript
> function LoginForm() {
>   const navigate = useNavigate();
>   const handleSubmit = async e => {
>     e.preventDefault();
>     await login();
>     navigate('/dashboard', { replace: true });
>   };
>   return (
>     <form onSubmit={handleSubmit}>
>       <button>Login</button>
>     </form>
>   );
> }
> ```
>
> **Explanation:** `useNavigate()` executes programmatic client-side routing inside event handlers.

---

### Exercise 3: Replacing History Entry with `{ replace: true }`

**Problem:** Why pass `{ replace: true }` option to `navigate('/dashboard', { replace: true })` after login? (Replaces current login page entry in browser history so pressing Back button does not return to login).

**Expected output:**
> [!check]- Answer
> ```text
> Replaces current page in browser history so pressing Back button does not return to login page
> ```
> ```text
> Replaces current page in browser history so pressing Back button does not return to login page
> ```
>
> **Explanation:** `replace: true` prevents users from back-navigating into completed authentication forms.

## 7. Related Terms
- [`<Link>` Component](link_component.md) — The declarative sibling.
- [Side Effects](../level_03/side_effects.md) — You often use `useNavigate` inside a `useEffect` (e.g., "If user is not logged in, navigate to /login").
---

## 8. Key Takeaways
- **`useNavigate`** allows you to navigate the user using JavaScript code.
- It is primarily used for redirects after an action (like a form submission, an API success, or a logout).
- You can pass `{ replace: true }` to prevent the user from using the Back button to return to the previous page.
- You can pass `-1` to simulate the browser's Back button.
- Do not use it as a replacement for `<Link>` on standard navigation buttons.
