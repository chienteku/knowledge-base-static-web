# React Server Components (RSC)

> **Level 1 — Core Concepts & Architecture**
> A paradigm shift in React where components execute exclusively on the Server. Their code, dependencies, and execution cost are never sent to the browser.

---

## 1. Prerequisites
- [Next.js Overview](nextjs.md) — The framework that implements RSCs.
- [React Components](react_components.md) — The standard UI building blocks.

---

## 2. Term Category

**React Server Component** (React Server Components Architecture): React Server Components (RSC) execute exclusively on the server, streaming zero-bundle-size HTML flight data to the client.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
Historically, React components ran on the client (the browser). If a component needed the `date-fns` library to format a date, the user's browser had to download the entire `date-fns` JS library. If a component needed database data, the browser had to make a network request, wait for the response, and then render.
**React Server Components (RSC)** solve this by executing the component on the server *during the request*. The server does the heavy lifting, formats the date, talks directly to the database, and sends down pure, lightweight HTML/UI. Zero JavaScript payload is added to the client bundle!

### (2) Server Components by Default
In the Next.js App Router, **every component is a Server Component by default**. You don't need any special syntax.

```tsx
import db from '@/lib/db';

// Notice this is an `async` function!
// Standard client React cannot do this.
export default async function UserProfile({ id }: { id: string }) {
  // 1. We talk DIRECTLY to the database! 
  // No API route needed! No `useEffect`!
  const user = await db.user.findUnique({ where: { id } });

  // 2. This renders on the server. The browser only receives the resulting HTML.
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### (3) The Limitations of Server Components
Because RSCs never run in the browser, they have strict limitations:
- **No Interactivity:** You cannot use `onClick`, `onChange`, or any DOM event listeners.
- **No State:** You cannot use `useState`, `useReducer`, or `useEffect`.
- **No Browser APIs:** You cannot access `window`, `document`, or `localStorage`.
If you need any of these, you must use a [Client Component](../level_01/client_components.md).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to add interactivity to a Server Component

**The mistake:** A developer tries to add a button to their default Next.js component.
```tsx
export default function Card() {
  // ❌ ERROR: Event handlers cannot be passed to Client Component props.
  return <button onClick={() => alert('Hi!')}>Click Me</button>
}
```

**Why it's wrong:** The `Card` component is a Server Component. It runs on the server, generates HTML, and dies. The browser receives the HTML, but since the component's JavaScript was never sent to the browser, the `onClick` function physically does not exist on the user's computer!
**Golden Rule:** Keep Server Components static and data-driven. Extract interactive elements (like buttons) into dedicated Client Components.

---

### Mistake 2: Attempting to Pass Event Handlers (`onClick`) to Server Components

**The mistake:** Defining `<ServerComponent onClick={() => {}} />`.

**Why it's wrong:** Server Components execute on the server and generate static HTML + RSC payload streams. Event handlers are interactive JavaScript functions that exist ONLY in browser client environments.

*Incorrect:*
```typescript
// Page.tsx (Server Component)
<ServerCard onClick={() => console.log('click')} /> // ❌ Cannot pass event handlers to Server Components!
```

*Fix:*
```typescript
// Move interactive event listeners into isolated Client Components ('use client')
```

---

### Mistake 3: Waterfall Async Data Fetching in Sequential Server Components

**The mistake:** Writing `const user = await getUser();` followed by `const posts = await getPosts(user.id);` in separate sequential sub-components.

**Why it's wrong:** Sequential `await` statements create data fetching waterfalls. Fetch independent data concurrently using `Promise.all([getUser(), getPosts()])` or parallel RSC trees.

*Incorrect:*
```typescript
const user = await fetchUser();
const posts = await fetchPosts(); // ❌ Sequential waterfall fetching!
```

*Fix:*
```typescript
// Parallelize data fetching:
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);
```


---

## 5. Practice Exercises

### Exercise 1: Accessing Database Resources Directly in Server Components

**Scenario:**
Query a PostgreSQL database directly inside a React Server Component using `pg` or an ORM.

**Requirements:**
1. Query database inside async RSC component without API routes.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/posts/page.tsx
> import { db } from "@/lib/db";

export default async function PostsPage() {
  // Direct database query on Node.js server!
  const posts = await db.query("SELECT id, title FROM posts LIMIT 10");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Latest Posts</h1>
      <ul>
        {posts.rows.map((post: any) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. React Server Components execute exclusively on the server, allowing direct database or file system access.
> 2. Database access credentials and query logic never leak to the client browser.
> 3. Eliminates building intermediate API routes solely for component data fetching.

---

### Exercise 2: Verifying Zero Client Bundle Footprint for RSC Dependencies

**Scenario:**
Import a heavy 500KB Markdown parsing library inside a Server Component and verify client JS bundle size.

**Requirements:**
1. Import library in Server Component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/article/page.tsx
> import { marked } from "marked";

export default async function ArticlePage({ content }: { content: string }) {
  const html = marked(content);

  return (
    <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
```

> #### Technical Explanation
>
> 1. Server Component dependencies (`marked`) are executed on the server and stripped from client JavaScript bundles.
> 2. Client receives only the rendered static HTML output.
> 3. Significantly reduces total client bundle download size.

---

### Exercise 3: Auditing RSC Serialization Boundaries

**Scenario:**
Explain why passing non-serializable objects (functions, Symbol, class instances) as props from Server Components to Client Components throws a serialization error.

**Requirements:**
1. Contrast serializable JSON props vs non-serializable props.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // ❌ INCORRECT (Functions cannot be passed across RSC boundary):
> // <ClientButton onClick={() => console.log('click')} />

// ✅ CORRECT (Pass serializable primitive data props):
// <ClientButton productId="123" />
```

> #### Technical Explanation
>
> 1. Props passed across the Server-to-Client boundary are serialized as JSON-like flight data streams.
> 2. Functions and non-serializable class instances cannot be serialized over flight streams.
> 3. Always pass serializable data primitives across RSC boundaries.

---




---

## 6. Related Terms
- [Client Components (`"use client"`)](client_components.md) — The interactive counterpart to RSCs.
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — A related, but distinct concept about generating initial HTML.
- [App Router vs Pages Router](app_router_vs_pages.md) — Related concept: App Router vs Pages Router.
- [Network Boundary](network_boundary.md) — Related concept: Network Boundary.
- [Node.js Runtime](nodejs_runtime.md) — Related concept: Node.js Runtime.
- [React Components](react_components.md) — Related concept: React Components.
- [React Suspense](../level_02/react_suspense.md) — Related concept: React Suspense.
- [Server-side Fetching (Extended `fetch`)](../level_05/fetch.md) — Related concept: Server-side Fetching (Extended `fetch`).
- [ORM (Object-Relational Mapping) & Prisma](../level_05/orm_prisma.md) — Related concept: ORM (Object-Relational Mapping) & Prisma.
- [React Server Component Payload (RSC Payload)](../level_08/rsc_payload.md) — RSC Payload.
- [Next.js Overview](nextjs.md) — Related concept: Next.js Overview.
- [Partial Prerendering (PPR)](../level_08/ppr.md) — Related concept: Partial Prerendering (PPR).

---

## 7. Key Takeaways
- In the Next.js App Router, **all components are Server Components by default**.
- They execute entirely on the server and send zero JavaScript to the client.
- They allow you to write `async/await` directly in your component to fetch data from databases or APIs.
- They CANNOT use state (`useState`), lifecycle hooks (`useEffect`), or event listeners (`onClick`).
