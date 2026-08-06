# Dynamic Rendering (SSR)

> **Level 8 — Rendering Strategies**
> The process of generating HTML on the server dynamically for every single incoming request. It ensures users always see perfectly fresh, personalized data at the cost of server processing time.

---

## 1. Prerequisites
- [React Server Components (RSC)](../level_01/rsc.md) — The mechanism Next.js uses to perform SSR in the App Router.
- [Client-Side Rendering (CSR) / SPA](../level_01/csr_spa.md) — The opposite of SSR, where rendering happens entirely in the browser.

---

## 2. Term Category

**Rendering Strategy** (Dynamic Server-Side Rendering): Server-Side Rendering (SSR) generates full HTML mark-up dynamically on the server for each incoming HTTP request.



---

## 3. Explanation

### Environment Context
- **Server (Request-Time)**

### (1) Design Motivation — "Why did we design this?"
If you build a traditional React app (CSR), the server sends a blank HTML file `<div id="root"></div>` and a massive JavaScript bundle. The browser downloads the JS, executes it, and *then* the user sees the page. This is slow and terrible for SEO.
Next.js solves this by rendering the React components on the Node.js server first. It converts your `<div>`s into an actual HTML string, and sends that fully-formed HTML to the browser. The user sees the content instantly, and Google bots can easily read the page.
If the data on the page needs to be perfectly live (e.g., a stock ticker) or user-specific (e.g., a shopping cart), the server must perform this rendering process *every single time* a user visits the page. This is **Server-Side Rendering (SSR)**.

### (2) SSR in the App Router (Dynamic Rendering)
In the legacy Next.js Pages router, SSR was a specific opt-in function called `getServerSideProps`.
In the App Router, **SSR is simply called "Dynamic Rendering."** 
It happens automatically if Next.js detects that your page relies on information that can only be known at Request-Time.

```tsx
// app/cart/page.tsx
import { cookies } from 'next/headers';

export default async function ShoppingCart() {
  // 1. We are reading the user's specific cookie.
  // Next.js cannot possibly know this cookie at build time.
  const userSession = cookies().get('session'); 

  // 2. Because of step 1, Next.js AUTOMATICALLY opts this entire
  // page into SSR (Dynamic Rendering). It will run this function
  // on the server every single time someone visits /cart.
  const cartItems = await fetchCartItems(userSession);

  return (
    <div>
      <h1>Your Cart</h1>
      <ul>{cartItems.map(i => <li>{i.name}</li>)}</ul>
    </div>
  );
}
```

### (3) Triggers for SSR
Next.js will automatically use SSR if you use any of the following:
1. `cookies()` or `headers()`
2. `searchParams` prop in `page.tsx`
3. A `fetch` request with `{ cache: 'no-store' }`

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accidental SSR

**The mistake:** A developer builds a marketing page that is supposed to be incredibly fast. They add `const query = searchParams.q` just to check if a tracking parameter exists in the URL. Suddenly, the page becomes 10x slower.

**Why it's wrong:** Reading `searchParams` forces the page into SSR (Dynamic Rendering). By checking the URL query string on the server, you have told Next.js it cannot pre-build the page. It must render it fresh on every request.
**Golden Rule:** Only opt into SSR if the data is highly dynamic. If you need to read `searchParams` for analytics or simple UI toggles, pass it down to a Client Component and read it there using the `useSearchParams()` hook, allowing the Server Component to remain static!

---



### Mistake 2: Failing to Handle Slow Database Queries in SSR Pages (High TTFB Latency)

**The mistake:** Executing un-indexed 3-second database queries directly in an SSR page component without Suspense streaming.

**Why it's wrong:** Un-streamed SSR holds the entire HTTP connection open until all server data fetches complete, creating poor Time To First Byte (TTFB) latency for users.

*Incorrect:*
```typescript
export default async function Page() {
  const slowData = await db.rawQuery(); // ❌ Delays initial HTML response by 3+ seconds!
  return <div>{slowData}</div>;
}
```

*Fix:*
```typescript
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SlowDataComponent /> {/* Streams response progressively */}
    </Suspense>
  );
}
```

---



### Mistake 3: Using SSR for Purely Static Content (Resource Waste)

**The mistake:** Configuring `export const dynamic = 'force-dynamic'` on static documentation pages.

**Why it's wrong:** Dynamic SSR re-renders HTML on every single HTTP request. For content that changes infrequently, dynamic SSR wastes server resources compared to SSG or ISR.

*Incorrect:*
```tsx
/* Forcing dynamic SSR on static documentation pages */
```

*Fix:*
```tsx
/* Use SSG or ISR for static/infrequently updated pages */
```


---




---

## 5. Practice Exercises

### Exercise 1: Enforcing Dynamic Server-Side Rendering

**Scenario:**
Force a route to execute dynamic Server-Side Rendering (SSR) on every request using `export const dynamic = 'force-dynamic'`.

**Requirements:**
1. Export `dynamic = "force-dynamic"` in `page.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/page.tsx
> export const dynamic = "force-dynamic";

export default async function RealtimeDashboard() {
  const res = await fetch("https://api.example.com/live", {
    cache: "no-store"
  });
  const data = await res.json();

  return (
    <main className="p-6">
      <h1>Realtime Metrics</h1>
      <p>Live Users: {data.activeUsers}</p>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. Server-Side Rendering (SSR) generates fresh HTML on Node.js servers for every incoming HTTP request.
> 2. `export const dynamic = 'force-dynamic'` opts out of static build caching for the route segment.
> 3. Essential for user-specific or real-time data dashboards.

---

### Exercise 2: Accessing Server Cookies and Headers during SSR

**Scenario:**
Read incoming request HTTP headers and session cookies on the server during SSR rendering.

**Requirements:**
1. Import `cookies` and `headers` from `next/headers`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import { cookies, headers } from "next/headers";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const headersList = await headers();
  
  const token = cookieStore.get("session_token");
  const userAgent = headersList.get("user-agent");

  return (
    <main className="p-6">
      <p>Session Active: {token ? "Yes" : "No"}</p>
      <p>Browser User Agent: {userAgent}</p>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. `cookies()` and `headers()` from `next/headers` provide access to incoming HTTP request metadata during SSR.
> 2. Invoking `cookies()` or `headers()` automatically switches the page segment from static to dynamic SSR rendering.
> 3. Secure server-side request inspection.

---

### Exercise 3: Streamlining SSR Content with React `<Suspense>`

**Scenario:**
Stream heavy server-rendered components using React `<Suspense>` boundaries to improve Time To First Byte (TTFB).

**Requirements:**
1. Wrap slow Server Component in `<Suspense fallback={...}>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import { Suspense } from "react";

async function SlowFeed() {
  const data = await fetch("https://api.example.com/slow", { cache: "no-store" }).then(r => r.json());
  return <div>Feed Loaded: {data.items.length} items</div>;
}

export default function FeedPage() {
  return (
    <main className="p-6">
      <h1>Live User Feed</h1>
      <Suspense fallback={<div>Loading Feed...</div>}>
        <SlowFeed />
      </Suspense>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. Next.js App Router uses HTML Streaming to deliver fast initial shell HTML while slow server components render in background streams.
> 2. `<Suspense>` streams fallback HTML first, then streams final component HTML over the open HTTP connection when data resolves.
> 3. Reduces TTFB (Time-To-First-Byte) latency significantly.

---




---

## 6. Related Terms
- [Static Site Generation (SSG)](ssg.md) — The faster, build-time alternative to SSR.
- [Data Caching (`force-cache`, `no-store`)](../level_05/data_caching.md) — The `no-store` cache option directly triggers SSR.
- [Client-Side Rendering (CSR) / SPA](../level_01/csr_spa.md) — Related concept: Client-Side Rendering (CSR) / SPA.
- [Hydration](../level_01/hydration.md) — Related concept: Hydration.
- [Next.js Overview](../level_01/nextjs.md) — Related concept: Next.js Overview.
- [React Server Components (RSC)](../level_01/rsc.md) — Related concept: React Server Components (RSC).
- [SEO (Search Engine Optimization)](../level_01/seo.md) — Related concept: SEO (Search Engine Optimization).
- [`cookies()` and `headers()` from `next/headers`](../level_05/cookies_headers.md) — Related concept: `cookies()` and `headers()` from `next/headers`.

---

## 7. Key Takeaways
- **Server-Side Rendering (SSR)** generates HTML on the server dynamically for every request.
- In the App Router, it is officially known as **Dynamic Rendering**.
- It is ideal for personalized pages (dashboards, carts) or highly live data.
- Next.js automatically switches to SSR if it detects you using `cookies()`, `headers()`, `searchParams`, or uncached `fetch` requests.
