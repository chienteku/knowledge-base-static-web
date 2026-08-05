# Server-Side Rendering (SSR)

> **Level 10 — Modern React & Architectures**
> The process of executing React components on a Node.js server to generate a fully populated HTML string, and sending that complete HTML to the user's browser for an instant initial load.

---

## 1. Prerequisites
- Single Page Applications (SPA) — The opposite of SSR (Client-Side Rendering).
- [Next.js](nextjs.md) — The framework that makes SSR easy in React.
---

## 2. Term Category
- **Web Architecture / Rendering Strategy**

---

## 3. Environment Context
- **Server-Side (Node.js)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a standard React SPA (Client-Side Rendering), the server sends the browser an empty HTML file: `<div id="root"></div>`. The browser then downloads a massive JavaScript file, executes it, fetches data from an API, and *finally* paints the UI on the screen.
This is terrible for two reasons:
1. **Slow Initial Load:** Users on slow phones stare at a white screen for 5 seconds.
2. **Bad SEO:** Search engine web crawlers (like Googlebot) often look at the empty `<div id="root">`, assume the website has no content, and rank it poorly.
**Server-Side Rendering (SSR)** solves this. The Node.js server fetches the API data, runs the React components itself, and sends a 100% complete, fully-painted HTML file to the browser.

### (2) How it works in Next.js (App Router)
In modern Next.js, Server-Side Rendering is the default! If you fetch data directly inside your component, Next.js will automatically pause, wait for the data on the server, and render the HTML before sending it to the user.
```javascript
// This component runs on the Node.js server!
export default async function BlogFeed() {
  // The server fetches the data directly from the database
  const posts = await db.getPosts();

  // The server generates the HTML and sends it to the browser
  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

### (3) The Trade-off
SSR gives you instant initial page loads and perfect SEO. However, it requires a Node.js server to be running 24/7 to process every incoming request, which is more expensive than hosting a static Client-Side SPA on an Amazon S3 bucket.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaking Server Secrets

**The mistake:** A developer writes SSR code that uses a secret database password, but accidentally imports that file into a Client-Side component.

**Why it's wrong:** If a Client-Side component imports server code, Webpack will bundle the database password into the `bundle.js` file and send it to every user's browser! 
**Golden Rule:** Always separate your Server code from your Client code. Modern frameworks like Next.js have strict rules (like the `"server only"` directive) to prevent secrets from leaking into the browser.

---



### Mistake 2: Performing Heavy Un-Cached Database Queries on Every SSR Request

**The mistake:** Executing slow 5-second un-indexed database queries inside an SSR page renderer.

**Why it's wrong:** Server-Side Rendering (SSR) generates HTML on EVERY incoming request. If a query takes 5 seconds, the user sees a blank browser tab for 5 seconds before receiving initial HTML! Cache queries or use streaming.

*Incorrect:*
```javascript
// Heavy 5s un-cached query inside per-request SSR renderer
```

*Fix:*
```javascript
Cache data using React cache() or use Streaming SSR (<Suspense>)
```

### Mistake 3: Accessing Browser Global Objects (`window`, `localStorage`) During Initial SSR Render

**The mistake:** Reading `localStorage.getItem('theme')` directly inside component body during SSR.

**Why it's wrong:** SSR components execute on the Node.js server where `window` and `localStorage` are undefined, throwing `ReferenceError`. Access browser APIs inside `useEffect()`.

*Incorrect:*
```javascript
const theme = localStorage.getItem('theme'); // ❌ ReferenceError during SSR on server!
```

*Fix:*
```javascript
useEffect(() => { const theme = localStorage.getItem('theme'); }, []);
```

## 6. Practice Exercises

### Exercise 1: SSR vs CSR

**Problem:** You right-click a webpage and select "View Page Source". 
In App A, you see `<div id="root"></div><script src="bundle.js"></script>`.
In App B, you see `<h1>Welcome to my Blog</h1><p>Here is the first post...</p>`.
Which one is Server-Side Rendered?

**Expected output:**
> [!check]- Answer
> ```text
> App B is Server-Side Rendered (SSR).
> The server did the hard work of generating the actual HTML content before sending it over the network. App A is Client-Side Rendered (CSR); it relies on the browser to execute JS to build the UI.
> ```
> - "View Page Source" shows exactly what the server sent over the network.

---



### Exercise 2: SSR vs SSG vs Client Rendering Matrix

**Problem:** Match rendering modes: 1. SSR (Render HTML per request on server); 2. SSG (Render HTML at build time); 3. CSR (Render HTML in browser via JS).

**Expected output:**
> [!check]- Answer
> ```text
> 1. SSR: per-request server render; 2. SSG: build-time static render; 3. CSR: in-browser JS render
> ```
> ```text
> 1. SSR: per-request server render; 2. SSG: build-time static render; 3. CSR: in-browser JS render
> ```
>
> **Explanation:** SSR provides dynamic real-time data rendering with initial HTML SEO benefits.

---

### Exercise 3: SSR Hydration Error Prevention

**Problem:** Why is it critical for server-rendered HTML to match initial client-rendered HTML output? (Mismatches trigger React hydration errors and force client DOM re-renders).

**Expected output:**
> [!check]- Answer
> ```text
> Mismatches trigger React hydration errors and force client DOM re-renders
> ```
> ```text
> Mismatches trigger React hydration errors and force client DOM re-renders
> ```
>
> **Explanation:** Matching HTML markup ensures seamless client hydration without layout shifts.

## 7. Related Terms
- [Hydration](hydration.md) — The process of attaching interactivity to the SSR HTML once it reaches the browser.
- [Static Site Generation (SSG)](ssg.md) — SSR's faster, pre-rendered cousin.
- [Portals](../level_07/portals.md) — Related concept: Portals.
- [Single Page Applications (SPA)](../level_09/spa.md) — Related concept: Single Page Applications (SPA).
- [Next.js](nextjs.md) — Related concept: Next.js.
- [Streaming SSR](streaming_ssr.md) — Related concept: Streaming SSR.
---

## 8. Key Takeaways
- **Server-Side Rendering (SSR)** generates the React HTML on a Node.js server instead of the user's browser.
- It solves the "blank white screen" problem of SPAs, providing instant initial page loads.
- It provides perfect SEO, as web crawlers receive fully populated HTML.
- It requires an active Node.js server to process requests on the fly.
