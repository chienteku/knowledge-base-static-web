# Conditional Rendering

> **Level 5 — DOM & Event Handling**
> The practice of showing or hiding specific components and HTML elements based on a condition (like a boolean state variable).

---

## 1. Prerequisites
- [JSX](../level_01/jsx.md) — Understanding how to embed JavaScript expressions using `{}`.
- [State](../level_02/state.md) — The boolean data that usually drives the condition.

---

## 2. Term Category
- **React Syntax / UI Logic**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a typical UI, things appear and disappear constantly. If `isLoggedIn` is true, show a "Logout" button. If it's false, show a "Login" button. 
In imperative vanilla JS, you would select the button and set `element.style.display = 'none'`.
In React, we use **Conditional Rendering**. We literally use JavaScript `if` statements and logical operators directly inside the JSX to dictate what gets returned to the Virtual DOM.

### (2) The Ternary Operator (`condition ? true : false`)
The most common way to conditionally render one of two things is the JavaScript Ternary Operator. You can embed it directly inside JSX.
```javascript
function Navbar({ isLoggedIn }) {
  return (
    <nav>
      {isLoggedIn ? <LogoutButton /> : <LoginButton />}
    </nav>
  );
}
```

### (3) The Logical AND Operator (`&&`)
If you only want to render something if the condition is true, and render *nothing* if it's false, you use the `&&` operator.
```javascript
function Mailbox({ unreadMessages }) {
  // If unreadMessages is greater than 0, the <h2> renders.
  // If it's 0, React renders nothing.
  return (
    <div>
      {unreadMessages > 0 && <h2>You have new mail!</h2>}
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The Number Zero Trap

**The mistake:** A developer writes `{messages.length && <p>New Messages</p>}`. The array is empty, so `messages.length` is `0`.

**Why it's wrong:** In JavaScript, `0` is a "falsy" value. The `&&` operator evaluates the left side. If it's falsy, it stops and returns the left side! 
So, instead of rendering nothing, React will literally render the number `0` onto the screen!
**Golden Rule:** Always make sure the left side of the `&&` operator evaluates to a strict boolean (`true` or `false`). Write `{messages.length > 0 && ...}`.

---



### Mistake 2: Using Numeric Length Expressions in `&&` Logical Short-Circuiting (Number Zero Rendering Trap)

**The mistake:** Writing `{items.length && <List items={items} />}` when `items.length` is `0`.

**Why it's wrong:** In JavaScript, `0 && <Component />` evaluates to numeric `0`! Instead of rendering nothing, React renders a literal `0` on the screen. Use explicit boolean checks `{items.length > 0 && <List />}` or ternary `{items.length ? <List /> : null}`.

*Incorrect:*
```javascript
function Cart({ items }) {
  return <div>{items.length && <List items={items} />}</div>; // ❌ Renders '0' on screen when empty!
}
```

*Fix:*
```javascript
function Cart({ items }) {
  return <div>{items.length > 0 && <List items={items} />}</div>; // Explicit boolean comparison
}
```

### Mistake 3: Returning `undefined` or Un-Handled Fallbacks from Component Render Functions

**The mistake:** Writing `if (loading) return;` inside a component render function.

**Why it's wrong:** Returning `undefined` from a component render function throws error `Nothing was returned from render`. Return `null` or explicit fallback JSX (`<Spinner />`).

*Incorrect:*
```javascript
if (loading) return; // ❌ Returns undefined, throwing render error!
```

*Fix:*
```javascript
if (loading) return <Spinner />; // Or return null;
```

## 6. Practice Exercises

### Exercise 1: Early Return

**Problem:** You have a component that receives a `user` object. If `user` is null, the entire component should stop rendering and just show a loading spinner. If `user` exists, it should show a massive 50-line profile UI. How do you conditionally render this cleanly?

**Expected output:**
```javascript
function Profile({ user }) {
  // Use an Early Return!
  if (!user) {
    return <Spinner />;
  }

  // If user exists, it skips the if statement and renders the rest normally.
  return (
    <div>
      <h1>{user.name}</h1>
      {/* 50 more lines of code */}
    </div>
  );
}
```

> [!check]- Answer
> - You don't always have to use inline operators inside the JSX. You can use standard `if` statements before the `return` keyword!

---



### Exercise 2: Ternary Conditional Rendering Component

**Problem:** Render `<UserDashboard />` if `isLoggedIn` is true, otherwise render `<LoginForm />` using ternary operator.

**Expected output:**
```text
function App({ isLoggedIn }) { return isLoggedIn ? <UserDashboard /> : <LoginForm />; }
```

> [!check]- Answer
> ```javascript
> function App({ isLoggedIn }) {
>   return isLoggedIn ? <UserDashboard /> : <LoginForm />;
> }
> ```
>
> **Explanation:** Ternary operators provide clean dual-branch conditional rendering.

### Exercise 3: Falsy Values in JSX

**Problem:** Which falsy values are ignored and render nothing in JSX? (`null`, `undefined`, `false`, ``). Which falsy value renders on screen? (`0`).

**Expected output:**
```text
Ignored: null, undefined, false, empty string; Rendered on screen: 0
```

> [!check]- Answer
> ```text
> Ignored: null, undefined, false, empty string; Rendered on screen: 0
> ```
>
> **Explanation:** React ignores boolean `false`, `null`, `undefined`, and `` while rendering numeric `0`.

## 7. Related Terms
- [JSX](../level_01/jsx.md) — The syntax that allows us to inject JS operators.
- [Virtual DOM](../level_01/virtual_dom.md) — When a condition turns false, React removes that node from the Virtual DOM, destroying the component.

---

## 8. Key Takeaways
- **Conditional Rendering** allows you to show/hide UI based on variables.
- Use the Ternary Operator (`condition ? A : B`) for either/or logic.
- Use the Logical AND (`condition && A`) to show something or nothing.
- Avoid placing numbers (like `array.length`) directly on the left side of `&&`, as it will render the number `0` on the screen. Always convert it to a boolean (`length > 0`).
- Use standard `if` statements for "Early Returns" to prevent complex components from rendering before data is ready.
