# Dynamic Segments (URL Parameters)

> **Level 9 — Routing & Ecosystem**
> A way to define a React Route with a variable placeholder in the URL (e.g., `/users/:id`), allowing a single component to handle thousands of different URLs.

---

## 1. Prerequisites
- [React Router](../level_09/react_router.md) — Where you define these routes.
- [`<Link>` Component](../level_09/link_component.md) — How you navigate to these routes.

---

## 2. Term Category
- **Routing Concept**

---

## 3. Environment Context
- **Client-Side**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building an Amazon clone. You have 5 million products. 
You cannot write 5 million static routes:
```javascript
<Route path="/product/1" element={<Product />} />
<Route path="/product/2" element={<Product />} />
// ... 4,999,998 more routes
```
Instead, you use a **Dynamic Segment**. You put a colon `:` in front of a word in the path. This tells React Router: "This part of the URL is a variable."

### (2) Defining the Route
```javascript
// The `:productId` is the Dynamic Segment!
<Route path="/products/:productId" element={<ProductDetail />} />
```
Now, if the user visits `/products/99` or `/products/apple-watch`, React Router will always load the `<ProductDetail />` component.

### (3) Extracting the Variable (`useParams`)
Once the component loads, it needs to know *which* product the user asked for. React Router provides the `useParams` hook to extract the variable straight out of the URL.
```javascript
import { useParams } from 'react-router-dom';

function ProductDetail() {
  // Extract the variable defined in the Route path
  const { productId } = useParams();

  // Now we can use it to fetch data from our API!
  useEffect(() => {
    fetch(`/api/products/${productId}`)
  }, [productId]);

  return <h1>Showing product: {productId}</h1>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Typo in the Parameter Name

**The mistake:** A developer defines the route as `<Route path="/users/:userId" />`. In the component, they write `const { id } = useParams()`.

**Why it's wrong:** `useParams` returns an object with keys that *exactly match* the names you defined in the Route with the colon `:`. Because they asked for `id` instead of `userId`, the variable will be `undefined`.
**Golden Rule:** The string after the colon in the Route (`:userId`) must perfectly match the variable you destructure from `useParams()`.

---



### Mistake 2: Failing to Handle Undefined or Un-Parsed Dynamic Route Parameters

**The mistake:** Calling `fetchUser(params.id)` expecting `params.id` to be a Number primitive.

**Why it's wrong:** Route params extracted via `useParams()` are ALWAYS String primitives (e.g. `'42'`)! Ensure string parsing (`parseInt(id, 10)`) or handling `undefined` params before making queries.

*Incorrect:*
```javascript
const { id } = useParams();
if (id === 42) { ... } // ❌ '42' === 42 evaluates to false!
```

*Fix:*
```javascript
const { id } = useParams();
if (Number(id) === 42) { ... } // Parse string to number
```

### Mistake 3: Configuring Dynamic Route Paths Without Colon Prefixes (`/users/id` instead of `/users/:id`)

**The mistake:** Defining route path `<Route path="/users/id" element={<User />} />`.

**Why it's wrong:** Omitting the colon `:` matches the literal string path `"/users/id"`, NOT dynamic route parameters. Use `/users/:id`.

*Incorrect:*
```javascript
<Route path="/users/id" element={<User />} /> // Matches literal URL /users/id
```

*Fix:*
```javascript
<Route path="/users/:id" element={<User />} /> // Dynamic param matching /users/42
```

## 6. Practice Exercises

### Exercise 1: Multi-Segment URLs

**Problem:** You are building a blog. You define this route:
`<Route path="/blog/:year/:month/:slug" element={<BlogPost />} />`
The user navigates to `/blog/2023/10/react-hooks`.
What will `useParams()` return inside the `<BlogPost />` component?

**Expected output:**
> [!check]- Answer
> ```javascript
> {
>   year: "2023",
>   month: "10",
>   slug: "react-hooks"
> }
> ```
> - Every segment with a `:` becomes a key in the object.

---



### Exercise 2: Extracting Dynamic Route Params with useParams

**Problem:** Extract `userId` from route path `/users/:userId` using `useParams()` hook in React Router.

**Expected output:**
> [!check]- Answer
> ```text
> import { useParams } from 'react-router-dom'; function UserProfile() { const { userId } = useParams(); return <h1>User ID: {userId}</h1>; }
> ```
> ```javascript
> import { useParams } from 'react-router-dom';
>
> function UserProfile() {
>   const { userId } = useParams();
>   return <h1>User ID: {userId}</h1>;
> }
> ```
>
> **Explanation:** `useParams()` extracts key-value string parameters matched by dynamic route path segments.

---

### Exercise 3: Multiple Dynamic Route Segments

**Problem:** Define route path with 2 dynamic segments matching `/categories/tech/products/42`.

**Expected output:**
> [!check]- Answer
> ```text
> <Route path="/categories/:category/products/:productId" element={<Product />} />
> ```
> ```javascript
> <Route path="/categories/:category/products/:productId" element={<Product />} />
> ```
>
> **Explanation:** Colons (`:param`) denote dynamic placeholder parameters in route path definitions.

## 7. Related Terms
- [React Router](../level_09/react_router.md) — The library that powers this.
- [`useEffect` Hook](../level_03/use_effect.md) — You usually take the URL parameter and immediately use it inside `useEffect` to fetch data.

---

## 8. Key Takeaways
- **Dynamic Segments** use a colon (`:id`) to create variable placeholders in your URL paths.
- They allow a single route and component to handle an infinite number of URLs (e.g., `/users/1`, `/users/2`).
- Use the **`useParams()`** hook inside your component to extract the actual value the user typed into the URL.
- The name you destructure from `useParams()` must exactly match the name you put after the colon in the Route.
