# HTML `<script>` Element

> **Level 9 — Built-in Optimizations**
> The standard HTML tag used to load and execute external JavaScript scripts, which Next.js abstracts to control loading execution orders and prevent main-thread blocking.

---

## 1. Prerequisites
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — The performance metrics impacted by script execution.

---

## 2. Term Category

**Performance & Optimization** (Native HTML Script Comparison): Native `<script>` tags render standard external browser scripts without Next.js script loading strategy optimization or execution ordering.



---

## 3. Explanation

### Environment Context
- **Universal** (Included by the server in HTML structures and executed by client browser engines).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Refactoring Native `<script>` to Next.js `<Script>`

**Scenario:**
Refactor a blocking native `<script src="https://cdn.example.com/analytics.js"></script>` into Next.js `<Script>`.

**Requirements:**
1. Import `Script` from `next/script`.
2. Configure `strategy="afterInteractive"`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Script from "next/script";
> 
> export default function Analytics() {
>   return (
>     <Script
>       src="https://cdn.example.com/analytics.js"
>       strategy="afterInteractive"
>     />
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Native `<script>` tags block HTML parser execution, delaying page rendering and worsening FCP/LCP metrics.
> 2. `strategy="afterInteractive"` loads the script in the background after the page becomes interactive.
> 3. Prevents third-party scripts from blocking core page hydration.
> 
---

### Exercise 2: Inlining Third-Party Initialization Scripts

**Scenario:**
Inline a third-party analytics configuration script using `<Script id="analytics-init">`.

**Requirements:**
1. Provide unique `id` prop for inline script.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Script from "next/script";
> 
> export default function InlineAnalytics() {
>   return (
>     <Script id="gtm-init" strategy="afterInteractive">
>       {`
>         window.dataLayer = window.dataLayer || [];
>         function gtag(){dataLayer.push(arguments);}
>         gtag('js', new Date());
>         gtag('config', 'UA-12345678-1');
>       `}
>     </Script>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Inline `<Script>` components require a unique `id` prop to prevent duplicate script execution across route navigations.
> 2. Executes inline JavaScript safely without breaking React hydration.
> 3. Standard method for Google Tag Manager or tracking pixel initialization.
> 
---

### Exercise 3: Offloading Heavy Scripts to Web Workers (`strategy="worker"`)

**Scenario:**
Offload a heavy third-party tracking library to a background Web Worker using Partytown (`strategy="worker"`).

**Requirements:**
1. Set `strategy="worker"`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Script from "next/script";
> 
> export default function WorkerScript() {
>   return (
>     <Script
>       src="https://cdn.example.com/heavy-tracker.js"
>       strategy="worker"
>     />
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `strategy="worker"` offloads script execution to a background Web Worker via Partytown.
> 2. Frees up the main browser UI thread for smooth 60fps rendering and input responsiveness.
> 3. Dramatically improves Interaction to Next Paint (INP) web vital scores.
> 
---


## 6. Related Terms
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — The performance metrics impacted by script execution.
- [`<Script>` Component](next_script.md) — The Next.js wrapper.

---

## 7. Key Takeaways
- The HTML `<script>` tag embeds executable JavaScript on web pages.
- Standard script tags block the browser rendering engine by default.
- `async` downloads in parallel but executes immediately, potentially blocking layout paints.
- `defer` downloads in parallel and executes only after HTML parsing completes.
- Next.js's `<Script>` component optimizes these strategies automatically to improve Web Core Vitals.
