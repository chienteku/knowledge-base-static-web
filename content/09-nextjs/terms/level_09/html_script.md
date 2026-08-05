# HTML `<script>` Element

> **Level 9 — Built-in Optimizations**
> The standard HTML tag used to load and execute external JavaScript scripts, which Next.js abstracts to control loading execution orders and prevent main-thread blocking.

---

## 1. Prerequisites
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — The performance metrics impacted by script execution.

---

## 2. Term Category
- **Optimization**

---

## 3. Environment Context
- **Universal** (Included by the server in HTML structures and executed by client browser engines).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Modern websites rely on third-party JavaScript scripts for services like Google Analytics, Stripe payments, customer support chats, or social media tracking pixels.

However, standard HTML `<script>` tags block browser rendering by default. When the browser parser reads `<script src="analytics.js">`, it stops downloading and building the HTML page, fetches the script file, compiles it, runs it, and only then resumes rendering the visual page. This delays page loading and degrades Web Core Vitals.

---

### (2) Native Loading Attributes (`async` and `defer`)
To mitigate blocking, the HTML standard introduced two loading attributes:

-   **Standard `<script>`:** Blocks HTML parsing while downloading and executing.
-   **`<script async>`:** Downloads the script file in parallel with HTML parsing. However, as soon as the file finishes downloading, it pauses HTML parsing immediately to execute the script. This can block rendering at random, unpredictable times.
-   **`<script defer>`:** Downloads the script file in parallel. It guarantees that the script will only execute *after* the HTML parsing is fully completed, preserving script execution order.

---

### (3) Transition to Next.js Script Optimization
Next.js abstracts these behaviors into the `<Script>` component (`next/script`). Instead of leaving script timing to browser default behaviors, `<Script>` introduces specialized strategy attributes (`beforeInteractive`, `afterInteractive`, `lazyOnload`) to coordinate loading relative to Next.js page hydration.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing standard script tags in layouts without loading strategies

**The mistake:** Including standard blocking scripts directly inside a root layout head:

```html
<!-- BAD: Blocks parsing and delays hydration -->
<head>
  <script src="https://example.com/widget.js"></script>
</head>
```

**Why it's wrong:** If the external script is slow to respond, the user's browser hangs on a blank screen. Next.js cannot render layout outlines or hydrations until the blocking script completes its round-trip transaction.

**Golden Rule:** Use Next.js's `<Script>` component for all external scripts to manage execution strategies safely.

---

### Mistake 2: Using Native HTML `<script>` Tags in React Components (Execution Order Failures)

**The mistake:** Writing `<script src="https://example.com/analytics.js"></script>` inside a React component template.

**Why it's wrong:** Native `<script>` tags inside React component templates execute unpredictably during client-side hydration and component re-renders. Use `next/script` (`<Script />`).

*Incorrect:*
```tsx
<script src="https://example.com/analytics.js"></script> <!-- ❌ Unpredictable hydration execution! -->
```

*Fix:*
```tsx
import Script from 'next/script';
<Script src="https://example.com/analytics.js" strategy="lazyOnload" />
```

---

### Mistake 3: Loading Third-Party Analytics Scripts Synchronously on Main Thread

**The mistake:** Loading heavy third-party tracking scripts synchronously during initial page load.

**Why it's wrong:** Synchronous script loading blocks main thread parsing, delaying initial page interactivity and degrading First Input Delay (FID) / Interaction to Next Paint (INP). Use `strategy="lazyOnload"` or `strategy="afterInteractive"`.

*Incorrect:*
```tsx
/* Loading heavy analytics script synchronously, blocking main thread */
```

*Fix:*
```tsx
<Script src="/analytics.js" strategy="lazyOnload" /> <!-- Loads during browser idle time -->
```


---

## 6. Practice Exercises

### Exercise 1: Standard Defer Script

**Problem:** Complete the HTML code below to load an external library without blocking HTML rendering, ensuring it executes only after parsing is complete:

```html
<!-- Solution: -->
<script 
  src="https://example.com/library.js"
  defer
></script>
```

> [!check]- Answer
> - Add the boolean attribute `defer` to the script tag.

---

### Exercise 2: next/script Loading Strategy Matrix

**Problem:** Match `<Script />` loading strategy to behavior:
1. `strategy="beforeInteractive"` 
2. `strategy="afterInteractive"` 
3. `strategy="lazyOnload"` 
4. `strategy="worker"` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Loads in server head before initial hydration script executes
> 2. Loads immediately after page hydration completes (Default)
> 3. Loads during browser idle time after all assets finish
> 4. Offloads script execution to a Web Worker (partytown)
> ```
> - `beforeInteractive` -> Critical scripts (e.g. polyfills, security consent)
> - `afterInteractive` -> Analytics, tag managers (Default)
> - `lazyOnload` -> Non-critical chat widgets, social widgets
> - `worker` -> Offload to Web Worker via Partytown
> 
> ```tsx
> <Script src="/chat.js" strategy="lazyOnload" />
> ```

---

### Exercise 3: Script onLoad Event Handler

**Problem:** Write `<Script />` component executing callback function `initMap()` when script finishes loading via `onLoad` prop.

**Expected output:**
> [!check]- Answer
> ```tsx
> <Script src="/map.js" onLoad={() => initMap()} />
> ```
> - `onLoad` fires callback function after script finishes loading.
> 
> ```tsx
> <Script
>   src="https://maps.example.com/api.js"
>   onLoad={() => initGoogleMaps()}
> />
> ```


---

## 7. Related Terms
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — The performance metrics impacted by script execution.
- [`<Script>` Component](next_script.md) — The Next.js wrapper.

---

## 8. Key Takeaways
- The HTML `<script>` tag embeds executable JavaScript on web pages.
- Standard script tags block the browser rendering engine by default.
- `async` downloads in parallel but executes immediately, potentially blocking layout paints.
- `defer` downloads in parallel and executes only after HTML parsing completes.
- Next.js's `<Script>` component optimizes these strategies automatically to improve Web Core Vitals.
