# `<Link>` Component

> **Level 9 — Routing & Ecosystem**
> React Router's replacement for the standard HTML `<a>` (anchor) tag. It allows users to navigate between routes without triggering a full page refresh.

---

## 1. Prerequisites
- [React Router](react_router.md) — The library that provides this component.
- [Client-Side Routing](client_side_routing.md) — Why we cannot use `<a>` tags.
---

## 2. Term Category
- **React Router Component**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you write `<a href="/about">About Us</a>`, the browser will do what browsers have done since 1990: it will wipe the current page from memory and send an HTTP request to the server for `/about`.
This destroys the React Single Page Application architecture. 
React Router provides the **`<Link>`** component. It looks and acts exactly like an `<a>` tag to the user, but it intercepts the click, stops the browser from refreshing, and tells React Router to swap the components instantly.

### (2) How to use it
Instead of `href`, you use the `to` prop.
```javascript
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      {/* Good: Instant Client-Side Navigation */}
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/dashboard">Dashboard</Link>
      
      {/* Bad: Causes a full page refresh! */}
      <a href="/login">Login</a>
    </nav>
  );
}
```

### (3) The `<NavLink>` Upgrade
React Router also provides a specialized version called `<NavLink>`. It is identical to `<Link>`, but it knows if it is currently "active".
If you are currently on the `/about` URL, the `<NavLink to="/about">` will automatically receive an `active` CSS class, allowing you to easily highlight the current tab in your navigation menu!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `<Link>` for external websites

**The mistake:** A developer writes `<Link to="https://google.com">Google</Link>`.

**Why it's wrong:** React Router is only designed to handle *internal* routes within your own application. It will literally try to navigate your app to `localhost:3000/https://google.com`, which will break.
**Golden Rule:** Only use `<Link>` for internal pages. If you are linking to an external website, use a standard HTML `<a href="...">` tag!

---



### Mistake 2: Using `href` Attribute Instead of `to` Prop on React Router `<Link>` Components

**The mistake:** Writing `<Link href="/dashboard">Dashboard</Link>`.

**Why it's wrong:** React Router `<Link>` components require the `to` prop (e.g. `<Link to="/dashboard">`). Passing `href` fails to pass destination route info, causing routing errors.

*Incorrect:*
```javascript
<Link href="/dashboard">Dashboard</Link> // ❌ Wrong prop name for React Router!
```

*Fix:*
```javascript
<Link to="/dashboard">Dashboard</Link> // Correct 'to' prop
```

### Mistake 3: Using `<Link>` for External Outbound URLs (e.g. `https://google.com`)

**The mistake:** Writing `<Link to="https://google.com">Google</Link>`.

**Why it's wrong:** `<Link>` is designed strictly for internal client-side SPA routing. For external outbound URLs, use standard HTML `<a href="https://google.com" target="_blank" rel="noreferrer">`.

*Incorrect:*
```javascript
<Link to="https://google.com">External</Link> // ❌ Intercepted as internal client route!
```

*Fix:*
```javascript
<a href="https://google.com" target="_blank" rel="noreferrer">External</a>
```

## 6. Practice Exercises

### Exercise 1: The Active Tab

**Problem:** You are building a sidebar menu. You want the link to be bold if the user is currently on that page. Which component should you import from `react-router-dom`?

**Expected output:**
> [!check]- Answer
> ```text
> You should use `<NavLink>`. 
> It automatically provides an `isActive` boolean or an `active` class so you can easily apply bold styling to the current page.
> ```
> - `Link` is standard. There is a special version specifically for navigation menus.

---



### Exercise 2: Active Link Styling with NavLink

**Problem:** Use `<NavLink>` with function `className={({ isActive }) => isActive ? 'active' : ''}` to style active navigation links.

**Expected output:**
> [!check]- Answer
> ```text
> <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>Profile</NavLink>
> ```
> ```javascript
> <NavLink
>   to="/profile"
>   className={({ isActive }) => (isActive ? 'active' : '')}
>
>   Profile
> </NavLink>
> ```
>
> **Explanation:** `<NavLink>` provides `isActive` state callback for styling active navigation routes.

---

### Exercise 3: Relative Link Navigation

**Problem:** Navigate 1 level up relative to current route using `<Link to="..">`.

**Expected output:**
> [!check]- Answer
> ```text
> <Link to="..">Back</Link>
> ```
> ```javascript
> <Link to="..">Back</Link>
> ```
>
> **Explanation:** Relative link targets (`to=".."`) resolve relative to the current route segment location.

## 7. Related Terms
- [`useNavigate` Hook](use_navigate.md) — The imperative alternative to `<Link>`. (Used for buttons and redirects).
- [Client-Side Routing](client_side_routing.md) — The core concept powering this.
- [React Router](react_router.md) — Related concept: React Router.
---

## 8. Key Takeaways
- The **`<Link>`** component must be used instead of `<a>` tags for all internal navigation.
- It prevents the browser from hard-refreshing, preserving React state and making navigation instant.
- Use the `to="/path"` prop instead of `href="/path"`.
- Use `<NavLink>` when building navigation menus to easily highlight the active page.
- Continue using `<a>` tags for external links to other websites.
