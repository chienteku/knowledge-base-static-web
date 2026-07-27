# React Server Components (RSC)

> **Level 10 — Modern React & Architectures**
> A revolutionary React architecture that allows you to write components that run *exclusively* on the server, never sending any JavaScript to the browser, drastically reducing bundle sizes.

---

## 1. Prerequisites
- [Server-Side Rendering (SSR)](../level_10/ssr.md) — SSR is about rendering initial HTML. RSC is about *staying* on the server permanently.
- [Hydration](../level_10/hydration.md) — RSCs completely skip the Hydration process!

---

## 2. Term Category
- **React Architecture / Paradigm Shift**

---

## 3. Environment Context
- **Server-Side ONLY**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional SSR, the server renders the HTML, but it *also* has to send the entire JavaScript file for that component to the browser so it can be [Hydrated](../level_10/hydration.md). 
If your `<Article>` component imports a massive Markdown parsing library (2MB), the user has to download that 2MB library, even though the article is just static text!
**React Server Components (RSC)** fix this. They are components that run on the server, output HTML, and then *die*. They never send their JavaScript to the browser. The user downloads 0 bytes of JS for that component!

### (2) Server Components vs Client Components
With RSCs (introduced in Next.js 13 App Router), you now have two types of components:

**1. Server Components (The Default):**
They run on the server. They can directly access databases and secret API keys. They send 0 JavaScript to the browser. Because they don't run in the browser, they **CANNOT use `useState`, `useEffect`, or `onClick`**. 
```javascript
// This is an RSC. It talks to the DB and ships 0 JS to the browser!
export default async function UserProfile() {
  const user = await db.query('SELECT * FROM users');
  return <h1>{user.name}</h1>;
}
```

**2. Client Components:**
If you need interactivity (buttons, state, hooks), you must explicitly mark the file with the `'use client'` directive at the very top. This tells React: "Package this component's JavaScript and send it to the browser for Hydration."

### (3) The Interweaving Tree
The magic of RSCs is that you can mix them! You can have a Server Component `<Sidebar>`, which passes data down to a Client Component `<LikeButton>`. React seamlessly merges the server HTML with the interactive client JS.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Hooks in a Server Component

**The mistake:** A developer leaves out the `'use client'` directive, but tries to use `useState` inside the component.

**Why it's wrong:** Server Components run once on the Node.js server to generate HTML, and then they disappear. There is no user clicking things on the server, so State and Effects do not exist! The compiler will throw an error.
**Golden Rule:** If a component needs `useState`, `useEffect`, or `onClick`, you MUST add `'use client'` to the top of the file.

---



### Mistake 2: Attempting to Use React Hooks (`useState`, `useEffect`) inside React Server Components (RSC)

**The mistake:** Calling `useState()` or `useEffect()` inside an async Server Component function.

**Why it's wrong:** Server Components execute ONLY on the server during build/request time! They do not persist in browser DOM memory, so hooks like `useState` or `useEffect` cannot exist in RSCs. Add `'use client'`.

*Incorrect:*
```javascript
export default async function ServerPage() {
  const [count, setCount] = useState(0); // ❌ Error: Hooks unavailable in Server Components!
}
```

*Fix:*
```javascript
'use client'; // Mark component as Client Component
export default function ClientPage() { const [count, setCount] = useState(0); }
```

### Mistake 3: Exposing Private Server Secrets (Database Passwords) to Client Components

**The mistake:** Importing a file containing private API keys or database queries inside a Client Component.

**Why it's wrong:** Client Component code is bundled and sent to the browser! Any secrets imported into Client Components will be visible in client bundle JS source files. Use package `server-only` to guard server-only modules.

*Incorrect:*
```javascript
// Importing database secret key inside Client Component ('use client')
```

*Fix:*
```javascript
import 'server-only'; // Enforces server-only execution guard at build time
```

## 6. Practice Exercises

### Exercise 1: Server or Client?

**Problem:** You are building a page. You need the following 3 components. Should they be Server Components or Client Components?
1. `<BlogText>` (Just renders a massive wall of text).
2. `<ImageCarousel>` (Has a "Next" button that changes the image).
3. `<DatabaseStats>` (Reads secure info from the SQL database).

**Expected output:**
```text
1. Server Component. (No interactivity needed, saves sending JS to the browser).
2. Client Component. (Requires `onClick` and `useState` to change images).
3. Server Component. (Requires secure server-side database access).
```

> [!check]- Answer
> - Interactivity = Client. Data fetching/Static UI = Server.

---



### Exercise 2: Async Data Fetching in React Server Component

**Problem:** Write async Server Component querying database directly without API endpoints.

**Expected output:**
```text
export default async function UsersPage() { const users = await db.users.findMany(); return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>; }
```

> [!check]- Answer
> ```javascript
> export default async function UsersPage() {
>   const users = await db.users.findMany();
>   return (
>     <ul>
>       {users.map(u => <li key={u.id}>{u.name}</li>)}
>     </ul>
>   );
> }
> ```
>
> **Explanation:** React Server Components support direct `async/await` database queries with zero client bundle size.

### Exercise 3: RSC Bundle Size Advantage

**Problem:** Why do npm dependencies used strictly inside React Server Components add 0 bytes to client JS bundle size? (Server Components execute on the server, sending only rendered UI JSON to the browser).

**Expected output:**
```text
Server Components execute on the server, sending rendered UI JSON to the browser without shipping code to client
```

> [!check]- Answer
> ```text
> Server Components execute on the server, sending rendered UI JSON to the browser without shipping code to client
> ```
>
> **Explanation:** RSC architecture keeps heavy dependencies on the server, minimizing client bundle sizes.

## 7. Related Terms
- [Hydration](../level_10/hydration.md) — What Client Components do, and what Server Components intentionally skip.
- [Next.js](../level_10/nextjs.md) — The first framework to fully implement the RSC architecture.

---

## 8. Key Takeaways
- **React Server Components (RSC)** execute entirely on the server and send ZERO JavaScript to the browser.
- They drastically reduce bundle sizes and allow direct, secure access to databases.
- Because they don't run in the browser, they cannot use Hooks or Event Listeners.
- If you need interactivity, you must add the **`'use client'`** directive to the top of the file to turn it into a traditional Client Component.
- Modern React apps seamlessly interweave Server and Client components together.
