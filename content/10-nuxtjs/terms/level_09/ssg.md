# Static Site Generation (SSG)

> **Level 9 — Advanced Rendering & Architecture**
> A rendering architecture where Nuxt pre-renders every single page of your application into fully complete, static HTML files *at build time*, rather than on-demand when a user requests them.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — SSR renders HTML on-demand. SSG renders HTML ahead of time.
- [Hydration](../level_01/hydration.md) — The client-side bootstrapping process that still runs after loading static HTML.

---

## 2. Term Category
- **Rendering Strategies**

---

## 3. Environment Context
- **Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Server-Side Rendering (SSR) is great for SEO, but it requires a running Node.js server. If 100,000 users visit your blog post simultaneously, the Node server has to render that exact same blog post 100,000 times. This is inefficient and expensive.

If the content of the blog post hasn't changed, why render it over and over? 

**Static Site Generation (SSG)** solves this. When you run the `nuxi generate` command, Nuxt acts like a web crawler. It visits every single route in your application, executes the Vue components, fetches the API data, and saves the final result as a hardcoded `index.html` file on your disk.

### (2) The Ultimate Performance
Because the output is just raw `.html`, `.css`, and `.js` files, you do not need a Node.js server to host an SSG app. You can deploy it to a CDN (Content Delivery Network). 

When a user requests a page, the CDN serves the pre-built HTML file instantly. It is literally impossible to have a faster Time to First Byte (TTFB).

### (3) Enabling SSG
To tell Nuxt to generate static HTML files, you use the `nuxt generate` command instead of `nuxt build`.

```bash
# Development
npm run dev

# Production Build (SSR with Node.js Server)
npm run build

# Static Site Generation (Outputs static HTML files to the .output/public folder)
npm run generate
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using SSG for highly dynamic data
**The mistake:** Building a live sports ticker or a cryptocurrency dashboard and deploying it via `npm run generate`.

**Why it's wrong:** SSG fetches data *at build time*. If Bitcoin is $60,000 when you run `npm run generate` on Monday, the static HTML file will say $60,000 forever. If a user visits the site on Friday, they will still see $60,000 in the HTML until you trigger an entirely new build process.
**Golden Rule:** Only use SSG for content that changes infrequently (Blogs, Marketing Pages, Documentation). For highly dynamic data, use SSR or fetch the data purely on the client side using SPA mode.

---

### Mistake 2: Using `npx nuxi build` Instead of `npx nuxi generate` for Static Site Generation

**The mistake:** Running `nuxi build` expecting a static HTML output directory (`.output/public`).

**Why it's wrong:** `nuxi build` compiles a Node.js server output (`.output/server`). `nuxi generate` pre-renders all routes into static HTML files for static CDN hosting (`.output/public`).

*Incorrect:*
```bash
nuxi build // ❌ Builds Node.js server output, NOT static HTML files!
```

*Fix:*
```vue
nuxi generate # Pre-renders static HTML files into .output/public/
```

---

### Mistake 3: Using Dynamic Request Functions (`useCookie`, `useRequestHeaders`) in SSG Pages

**The mistake:** Reading request headers inside a static blog page intended for `nuxi generate`.

**Why it's wrong:** During `nuxi generate`, there is no incoming HTTP request object. Reading request headers returns `undefined` or throws build errors.

*Incorrect:*
```vue
<script setup>
const headers = useRequestHeaders(); // ❌ Undefined during nuxi generate static build!
</script>
```

*Fix:*
```vue
<script setup>
// Keep SSG pages pure; read user cookies in Client Components or onMounted
</script>
```


---

### Mistake 4: Using `npx nuxi build` Instead of `npx nuxi generate` for Static Site Generation

**The mistake:** Running `nuxi build` expecting a static HTML output directory (`.output/public`).

**Why it's wrong:** `nuxi build` compiles a Node.js server output (`.output/server`). `nuxi generate` pre-renders all routes into static HTML files for static CDN hosting (`.output/public`).

*Incorrect:*
```bash
nuxi build // ❌ Builds Node.js server output, NOT static HTML files!
```

*Fix:*
```vue
nuxi generate # Pre-renders static HTML files into .output/public/
```

---

### Mistake 5: Using Dynamic Request Functions (`useCookie`, `useRequestHeaders`) in SSG Pages

**The mistake:** Reading request headers inside a static blog page intended for `nuxi generate`.

**Why it's wrong:** During `nuxi generate`, there is no incoming HTTP request object. Reading request headers returns `undefined` or throws build errors.

*Incorrect:*
```vue
<script setup>
const headers = useRequestHeaders(); // ❌ Undefined during nuxi generate static build!
</script>
```

*Fix:*
```vue
<script setup>
// Keep SSG pages pure; read user cookies in Client Components or onMounted
</script>
```


---

### Mistake 6: Using `npx nuxi build` Instead of `npx nuxi generate` for Static Site Generation

**The mistake:** Running `nuxi build` expecting a static HTML output directory (`.output/public`).

**Why it's wrong:** `nuxi build` compiles a Node.js server output (`.output/server`). `nuxi generate` pre-renders all routes into static HTML files for static CDN hosting (`.output/public`).

*Incorrect:*
```bash
nuxi build // ❌ Builds Node.js server output, NOT static HTML files!
```

*Fix:*
```vue
nuxi generate # Pre-renders static HTML files into .output/public/
```

---

### Mistake 7: Using Dynamic Request Functions (`useCookie`, `useRequestHeaders`) in SSG Pages

**The mistake:** Reading request headers inside a static blog page intended for `nuxi generate`.

**Why it's wrong:** During `nuxi generate`, there is no incoming HTTP request object. Reading request headers returns `undefined` or throws build errors.

*Incorrect:*
```vue
<script setup>
const headers = useRequestHeaders(); // ❌ Undefined during nuxi generate static build!
</script>
```

*Fix:*
```vue
<script setup>
// Keep SSG pages pure; read user cookies in Client Components or onMounted
</script>
```


---

## 6. Practice Exercises

### Exercise 1: Comparing Rendering Modes

**Problem:** You are building a Documentation website. The markdown files change maybe once a week. You want perfect SEO and you want to host it for free on GitHub Pages (which only supports static files). Which rendering mode should you use: SSR, SPA, or SSG?

**Expected output:**
```text
SSG (Static Site Generation).
It provides perfect SEO (unlike SPA), and does not require a Node.js server (unlike SSR), meaning it can be hosted for free on GitHub pages.
```

> [!check]- Answer
> - Documentation sites that change infrequently do not require runtime dynamic database renders but still require full indexing accessibility.

---

### Exercise 2: Static Crawl Prerender Pattern

**Problem:** Write `nuxt.config.ts` configuration instructing `nuxi generate` to pre-render dynamic routes `/posts/1` and `/posts/2`.

**Expected output:**
```typescript
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/posts/1', '/posts/2']
    }
  }
});
```

> [!check]- Answer
> - `nitro.prerender.routes` specifies explicit static pre-rendering targets.
> 
> ```typescript
> export default defineNuxtConfig({
>   nitro: {
>     prerender: {
>       routes: ['/posts/1', '/posts/2']
>     }
>   }
> });
> ```

---

### Exercise 3: SSG Generation Output Folder

**Problem:** Where does `nuxi generate` save compiled static HTML files and static assets?

**Expected output:**
```text
.output/public/ (or dist/)
```

> [!check]- Answer
> - `.output/public/` contains pre-rendered static HTML and assets.
> 
> ```text
> .output/public/index.html
> ```


---

### Exercise 4: Static Crawl Prerender Pattern

**Problem:** Write `nuxt.config.ts` configuration instructing `nuxi generate` to pre-render dynamic routes `/posts/1` and `/posts/2`.

**Expected output:**
```typescript
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/posts/1', '/posts/2']
    }
  }
});
```

> [!check]- Answer
> - `nitro.prerender.routes` specifies explicit static pre-rendering targets.
> 
> ```typescript
> export default defineNuxtConfig({
>   nitro: {
>     prerender: {
>       routes: ['/posts/1', '/posts/2']
>     }
>   }
> });
> ```

---

### Exercise 5: SSG Generation Output Folder

**Problem:** Where does `nuxi generate` save compiled static HTML files and static assets?

**Expected output:**
```text
.output/public/ (or dist/)
```

> [!check]- Answer
> - `.output/public/` contains pre-rendered static HTML and assets.
> 
> ```text
> .output/public/index.html
> ```


---

### Exercise 6: Static Crawl Prerender Pattern

**Problem:** Write `nuxt.config.ts` configuration instructing `nuxi generate` to pre-render dynamic routes `/posts/1` and `/posts/2`.

**Expected output:**
```typescript
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/posts/1', '/posts/2']
    }
  }
});
```

> [!check]- Answer
> - `nitro.prerender.routes` specifies explicit static pre-rendering targets.
> 
> ```typescript
> export default defineNuxtConfig({
>   nitro: {
>     prerender: {
>       routes: ['/posts/1', '/posts/2']
>     }
>   }
> });
> ```

---

### Exercise 7: SSG Generation Output Folder

**Problem:** Where does `nuxi generate` save compiled static HTML files and static assets?

**Expected output:**
```text
.output/public/ (or dist/)
```

> [!check]- Answer
> - `.output/public/` contains pre-rendered static HTML and assets.
> 
> ```text
> .output/public/index.html
> ```


---

## 7. Related Terms
- [Single Page Application (SPA)](../level_09/spa.md) — The other rendering mode that doesn't require a Node server, but sacrifices SEO.
- [Route Rules Configuration](../level_08/route_rules.md) — How to apply `prerender: true` to specific routes instead of the whole app.

---

## 8. Key Takeaways
- SSG pre-renders your application into static HTML files during the build process.
- It is triggered using the `nuxi generate` command.
- It provides perfect SEO and the absolute fastest possible loading speeds.
- It does not require a Node.js server to host.
- It is not suitable for highly dynamic data that changes every minute.
