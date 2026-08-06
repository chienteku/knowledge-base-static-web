# `server/routes/`

> **Level 7 — Server Engine (Nitro)**
> A dedicated directory for backend endpoints that act exactly like `server/api/` routes, except they are mapped directly to the root URL without the `/api` prefix.

---

## 1. Prerequisites
- [`server/api/` Routes](server_api_routes.md) — The standard directory for JSON APIs.
- [Express.js (Legacy Node Server Context)](express_js.md) — The server routing structure that Nitro/H3 replaces.

---

## 2. Term Category

**Server & Nitro Engine** (Server-Side Endpoint Routes): Server Routes in `server/routes/` handle custom raw server responses (file downloads, RSS feeds, webhooks) un-prefixed by `/api/`.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
In Nuxt, standard API logic (like fetching a user or posting a comment) belongs in `server/api/`. This keeps your backend cleanly separated under the `yoursite.com/api/...` namespace.

However, sometimes you need to serve a specific file or endpoint directly at the root level of your domain. For example, search engines look for `sitemap.xml` at `yoursite.com/sitemap.xml`, not `yoursite.com/api/sitemap.xml`. GitHub looks for OAuth callbacks at `/auth/callback`.

The `server/routes/` directory was created to handle these root-level server requests.

### (2) Core Concept
Files placed in `server/routes/` behave identically to `server/api/`. They use `defineEventHandler` and are executed by Nitro. The only difference is the URL routing.

**Structure Comparison:**
```text
server/
├── api/
│   └── users.ts     # -> http://localhost:3000/api/users
└── routes/
    └── sitemap.xml.ts # -> http://localhost:3000/sitemap.xml
```

### (3) Serving Raw Strings / XML
When building things like Sitemaps or RSS feeds, you don't want to return JSON. You want to return raw XML. To do this, you use the H3 utility `setResponseHeader` inside your route.

```typescript
// server/routes/sitemap.xml.ts
export default defineEventHandler((event) => {
  // Tell the browser this is an XML file, not JSON!
  setResponseHeader(event, 'Content-Type', 'text/xml');

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://mysite.com/</loc>
      </url>
    </urlset>
  `.trim();
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting standard JSON APIs in `routes/`
**The mistake:** Creating `server/routes/getProducts.ts` to fetch products for your frontend UI.

**Why it's wrong:** While it technically works, mixing frontend HTML pages (from the `pages/` directory) and backend JSON APIs at the root URL creates severe routing conflicts and makes your app chaotic to maintain.
**Golden Rule:** If it returns JSON for your frontend to consume, put it in `server/api/`. Only use `server/routes/` for root-level files required by external services (Sitemaps, RSS, webhooks, OAuth callbacks).

---

### Mistake 2: Confusing `server/routes/` with `server/api/` (URL Path Prefix Misunderstanding)

**The mistake:** Placing file in `server/routes/rss.xml.ts` expecting URL to be `/api/rss.xml`.

**Why it's wrong:** Files in `server/routes/` map directly to the root URL path without `/api/`. `server/routes/rss.xml.ts` maps to `/rss.xml`.

*Incorrect:*
```vue
// server/routes/sitemap.xml.ts ❌ Does NOT have /api/ prefix!
```

*Fix:*
```vue
// Maps to root URL: /sitemap.xml
```

---

### Mistake 3: Returning Un-Formatted Plain Strings for Custom Content Types (e.g. RSS/XML)

**The mistake:** Returning XML string from `server/routes/feed.xml.ts` without setting `setHeader(event, 'Content-Type', 'text/xml')`.

**Why it's wrong:** Without explicit `Content-Type` headers, browsers treat XML strings as plain text or HTML. Set custom headers explicitly for non-JSON routes.

*Incorrect:*
```typescript
export default defineEventHandler((event) => {
  return '<xml><item>Feed</item></xml>'; // ❌ Missing Content-Type: text/xml header!
});
```

*Fix:*
```vue
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/xml');
  return '<xml><item>Feed</item></xml>';
});
```


---

## 5. Practice Exercises

### Exercise 1: Generating Custom RSS XML Feeds with Server Routes

**Scenario:**
Create a server route `server/routes/feed.xml.ts` generating a dynamic RSS XML feed payload.

**Requirements:**
1. Set `Content-Type: application/xml` and return XML string.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/routes/feed.xml.ts
> export default defineEventHandler((event) => {
>   const xmlFeed = `<?xml version="1.0" encoding="UTF-8" ?>
> <rss version="2.0">
>   <channel>
>     <title>Enterprise Nuxt Blog</title>
>     <link>https://example.com</link>
>     <description>Latest Nuxt 3 News</description>
>   </channel>
> </rss>`;
> 
>   setResponseHeader(event, "Content-Type", "application/xml");
>   return xmlFeed;
> });
> ```
> 
> #### Technical Explanation
>
> 1. Files in `server/routes/` are served at root path URLs un-prefixed by `/api/`.
> 2. `server/routes/feed.xml.ts` generates endpoint `/feed.xml`.
> 3. Ideal for custom non-JSON endpoints (sitemaps, RSS feeds, `robots.txt`).
> 
---

### Exercise 2: Implementing Webhook Receivers in `server/routes/webhooks/`

**Scenario:**
Create a Stripe webhook listener endpoint `server/routes/webhooks/stripe.post.ts` validating signatures.

**Requirements:**
1. Export handler in `server/routes/webhooks/stripe.post.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/routes/webhooks/stripe.post.ts
> export default defineEventHandler(async (event) => {
>   const rawBody = await readRawBody(event);
>   const signature = getHeader(event, "stripe-signature");
>   
>   // Validate Stripe signature payload...
>   console.log("Stripe Webhook Received!");
>   
>   return { received: true };
> });
> ```
> 
> #### Technical Explanation
>
> 1. `readRawBody(event)` reads the raw string payload buffer required for HMAC signature verification.
> 2. Un-prefixed server routes provide clean URL paths (`/webhooks/stripe`) for third-party service callbacks.
> 3. Standard webhook receiver pattern.
> 
---

### Exercise 3: Serving Dynamic Raw File Downloads

**Scenario:**
Create a server route `server/routes/download/[file].ts` setting `Content-Disposition` headers for file downloads.

**Requirements:**
1. Set `Content-Disposition: attachment; filename="..."`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/routes/download/[file].ts
> export default defineEventHandler((event) => {
>   const fileName = getRouterParam(event, "file");
>   
>   setResponseHeader(event, "Content-Disposition", `attachment; filename="${fileName}"`);
>   setResponseHeader(event, "Content-Type", "application/octet-stream");
>   
>   return `Dummy binary buffer content for ${fileName}`;
> });
> ```
> 
> #### Technical Explanation
>
> 1. `Content-Disposition: attachment` forces the user's browser to prompt a file download dialog.
> 2. Dynamic path parameters allow serving custom generated files.
> 3. Raw server route application.
> 
---


## 6. Related Terms
- [`server/api/` Routes](server_api_routes.md) — The standard directory for JSON APIs.
- [H3 Request Handlers (`defineEventHandler`)](h3_handlers.md) — The utilities used to parse incoming webhooks in these routes.
- [Nitro Engine](../level_01/nitro_engine.md) — Related concept: Nitro Engine.

---

## 7. Key Takeaways
- `server/routes/` maps files directly to the root URL (no `/api` prefix).
- They use the exact same H3 engine and syntax as `server/api/`.
- Use them strictly for Sitemaps, RSS feeds, OAuth callbacks, and Webhooks.
- Standard JSON endpoints should always stay in `server/api/`.
