# React Router

> **Level 9 — Routing & Ecosystem**
> The industry-standard, third-party library used to implement Client-Side Routing in React applications.

---

## 1. Prerequisites
- [Client-Side Routing](../level_09/client_side_routing.md) — The concept this library implements.
- [Components](../level_01/components.md) — React Router uses components to define routes.

---

## 2. Term Category
- **React Ecosystem / Library**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React itself is just a UI library. It has absolutely no built-in way to handle URLs or routing. If you want `/login` to show the `<Login />` component, you have to build that logic from scratch using `window.location`.
Instead of reinventing the wheel, 99% of the React ecosystem uses **React Router** (`react-router-dom`). It provides a clean, declarative way to map URLs to specific components.

### (2) The Core Setup (v6+)
To use React Router, you wrap your app in a `BrowserRouter`, and then define your `Routes`.
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    // 1. Wrap everything in the Router
    <BrowserRouter>
      {/* 2. A container that looks at the URL and picks the right Route */}
      <Routes>
        {/* 3. The actual mappings */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        
        {/* A catch-all for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### (3) Nested Routes (Layouts)
React Router excels at "Nested Routing". You can have a persistent `<DashboardLayout />` (with a sidebar), and only swap out the main content area based on the URL.
```javascript
<Route path="/dashboard" element={<DashboardLayout />}>
  {/* These render INSIDE the Layout component! */}
  <Route path="stats" element={<Stats />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to route outside the `BrowserRouter`

**The mistake:** A developer tries to use a React Router hook (like `useNavigate`) inside a component, but that component is placed *above* or *outside* the `<BrowserRouter>` tags in `index.js`.

**Why it's wrong:** React Router uses the Context API under the hood! The `<BrowserRouter>` is the Context Provider. If a component is not inside it, it cannot access the routing data and will throw a fatal error.
**Golden Rule:** Wrap `<BrowserRouter>` around your `<App />` at the absolute highest level of your application (usually in `index.js` or `main.jsx`).

---



### Mistake 2: Rendering `<Route>` Components Outside of `<Routes>` Container in React Router v6

**The mistake:** Placing `<Route path="/" element={<Home />} />` directly inside `<BrowserRouter>` without a `<Routes>` wrapper.

**Why it's wrong:** In React Router v6, all `<Route>` components MUST be wrapped inside a `<Routes>` parent component. Omitting `<Routes>` throws error `[Route] is not a <Route> component. All component children of <Routes> must be a <Route>`.

*Incorrect:*
```javascript
<BrowserRouter>
  <Route path="/" element={<Home />} /> {/* ❌ Missing <Routes> parent! */}
</BrowserRouter>
```

*Fix:*
```javascript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
</BrowserRouter>
```

### Mistake 3: Using Legacy React Router v5 Component Syntax (`component={Home}`) in React Router v6

**The mistake:** Writing `<Route path="/" component={Home} />` in React Router v6.

**Why it's wrong:** React Router v6 replaced `component={Home}` with `element={<Home />}`. Passing component functions to `component` in v6 will not render.

*Incorrect:*
```javascript
<Route path="/" component={Home} /> // ❌ Legacy v5 syntax!
```

*Fix:*
```javascript
<Route path="/" element={<Home />} /> // Modern v6 JSX element syntax
```

## 6. Practice Exercises

### Exercise 1: Reading the Map

**Problem:** Based on this code, what component renders when the user visits `mysite.com/store/cart`?
```javascript
<Routes>
  <Route path="/store" element={<Store />}>
    <Route path="shoes" element={<Shoes />} />
    <Route path="cart" element={<Cart />} />
  </Route>
</Routes>
```

**Expected output:**
> [!check]- Answer
> ```text
> Both `<Store />` AND `<Cart />` will render!
> Because it's a nested route, the `<Cart />` component will be injected inside the layout of the `<Store />` component.
> ```
> - Notice how the `shoes` and `cart` routes are nested inside the `store` route.

---



### Exercise 2: React Router v6 Basic Setup

**Problem:** Configure `<BrowserRouter>`, `<Routes>`, and `<Route>` for `/` (`<Home />`) and `*` 404 fallback (`<NotFound />`).

**Expected output:**
> [!check]- Answer
> ```text
> function App() { return <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="*" element={<NotFound />} /></Routes></BrowserRouter>; }
> ```
> ```javascript
> function App() {
>   return (
>     <BrowserRouter>
>       <Routes>
>         <Route path="/" element={<Home />} />
>         <Route path="*" element={<NotFound />} />
>       </Routes>
>     </BrowserRouter>
>   );
> }
> ```
>
> **Explanation:** `path="*"` acts as a catch-all route for un-matched URL paths.

---

### Exercise 3: Nested Routes and Outlet

**Problem:** What component in React Router v6 renders child route components inside parent layouts? (`<Outlet />`).

**Expected output:**
> [!check]- Answer
> ```text
> <Outlet />
> ```
> ```javascript
> function DashboardLayout() {
>   return (
>     <div>
>       <Sidebar />
>       <Outlet /> {/* Renders nested child routes here */}
>     </div>
>   );
> }
> ```
>
> **Explanation:** `<Outlet />` projects nested child route elements inside parent layout components.

## 7. Related Terms
- [`<Link>` Component](../level_09/link_component.md) — How you navigate between these defined routes.
- [Dynamic Segments](../level_09/dynamic_segments.md) — How you handle URLs like `/users/123`.

---

## 8. Key Takeaways
- **React Router** is the standard library for navigating in React apps.
- You use `<Route path="/foo" element={<Component />}>` to define what UI belongs to what URL.
- It supports **Nested Routing**, allowing you to keep persistent layouts (like sidebars) while swapping out the inner content.
- Your entire app must be wrapped in a `<BrowserRouter>`.
