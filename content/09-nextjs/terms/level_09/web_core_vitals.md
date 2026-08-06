# Web Core Vitals (FCP, LCP, CLS, TTFB)

> **Level 9 — Built-in Optimizations**
> A set of standardized web performance metrics defined by Google to objectively measure loading speed, interactivity, and visual stability of web pages.

---

## 1. Prerequisites
- [SEO (Search Engine Optimization)](../level_01/seo.md) — The search engine indexing context that relies on these vitals.
- [Next.js Overview](../level_01/nextjs.md) — Web performance metrics in Next.js applications.

---

## 2. Term Category

**Performance & Optimization** (Web Core Vitals Telemetry): Web Core Vitals telemetry monitors LCP, INP, and CLS performance metrics using `useReportWebVitals()` hooks and server reporting.



---

## 3. Explanation

### Environment Context
- **Client Only** (Vitals represent real-world user metrics captured and measured inside the client's browser window).

### (1) Design Motivation — "Why did we design this?"
Historically, developers measured website speed using subjective criteria like "how fast it loads on my desktop computer." This ignored users accessing websites on low-powered mobile devices or unstable networks.

To standardize performance tracking, Google introduced **Web Core Vitals**. These metrics provide objective, quantifiable measurements of user experience. Because search engines use these vitals directly to calculate SEO rankings, building fast sites is a business requirement. 

Next.js structures its built-in components (`<Image>`, `next/font`, `<Script>`) specifically to automate the engineering work required to pass these checks.

---

### (2) The Key Vitals Defined

-   **Largest Contentful Paint (LCP):** Measures loading speed. It tracks the time it takes for the page's primary, largest visible block (usually a hero image or headline text) to render on the screen. **Goal: Under 2.5 seconds.**
-   **Cumulative Layout Shift (CLS):** Measures visual stability. It tracks how much elements move around unexpectedly during loading (for example, a button shifting downward because an image above it suddenly loaded). **Goal: Under 0.1 (dimensionless score).**
-   **Interaction to Next Paint (INP) / First Input Delay (FID):** Measures responsiveness. It tracks the latency from when a user clicks a button, taps a link, or presses a key, to when the browser paints the next visual frame on the screen. **Goal: Under 200 milliseconds.**
-   **Time to First Byte (TTFB):** Measures server response latency. It tracks the duration from when a browser requests a page until it receives the very first byte of data back from the server. **Goal: Under 800ms.**
-   **First Contentful Paint (FCP):** Tracks the time until the browser renders the very first item of DOM content (such as a loading background or outline).

---

### (3) How Next.js Target Vitals automatically
Next.js features map directly to these Core Vitals:

| Next.js Feature | Target Core Vital | How it helps |
|---|---|---|
| `<Image>` Component | **LCP & CLS** | Auto-resizes image dimensions to prevent layout shifts (CLS) and loads optimized formats for faster rendering (LCP). |
| `next/font` | **CLS** | Inlines CSS font declarations and preloads font files to prevent flash-of-unstyled-text shifts. |
| Streaming / PPR | **TTFB & FCP** | Streams layout outlines immediately from CDN edges so the browser receives data instantly, bypassing slow database queries. |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying solely on local Lighthouse reports instead of real-user data (CrUX)

**The mistake:** Testing your site speed once on a developer laptop and assuming the site is fully optimized.

**Why it's wrong:** Lighthouse runs in a clean, simulated sandbox. Real users access your site on budget phones, on public transit networks, and on varying browser engines. Search engine indexing bots rank pages based on the Chrome User Experience Report (CrUX), which aggregates actual field metrics from real visitors.

**Golden Rule:** Test your application speed using mobile throttling options in Chrome DevTools, and implement real-user monitoring (RUM) tools in production to track Core Vitals.

---

### Mistake 2: Ignoring Largest Contentful Paint (LCP) Delays Caused by Lazy-Loaded Hero Images

**The mistake:** Adding `loading="lazy"` to above-the-fold hero banner images.

**Why it's wrong:** Lazy-loading hero images delays image fetching until layout parsing completes, spiking LCP metric delays. Add `priority` prop to hero images.

*Incorrect:*
```tsx
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} loading="lazy" /> // ❌ Degrades LCP score!
```

*Fix:*
```tsx
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority /> // Optimizes LCP metric
```

---

### Mistake 3: Blocking Interaction to Next Paint (INP) with Long Synchronous Main Thread Tasks

**The mistake:** Executing 200ms synchronous array loops inside client button `onClick` event handlers.

**Why it's wrong:** Long synchronous tasks block the main browser thread, delaying visual feedback and degrading the **INP** (Interaction to Next Paint) Web Core Vital metric. Defer work to web workers.

*Incorrect:*
```tsx
/* Running 200ms synchronous calculations inside onClick handler -> High INP delay! */
```

*Fix:*
```tsx
/* Offload heavy array processing to Web Workers or chunk work with requestIdleCallback() */
```


---

## 5. Practice Exercises

### Exercise 1: Measuring Web Core Vitals with `useReportWebVitals()`

**Scenario:**
Report client-side Web Core Vitals performance metrics (`LCP`, `INP`, `CLS`) to an analytics endpoint.

**Requirements:**
1. Import `useReportWebVitals` from `next/navigation` inside a Client Component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import { useReportWebVitals } from "next/navigation";
> 
> export default function WebVitalsReporter() {
>   useReportWebVitals((metric) => {
>     console.log(`[Web Vital] ${metric.name}:`, metric.value);
>     
>     // Send telemetry to analytics server:
>     fetch("/api/telemetry", {
>       method: "POST",
>       headers: { "Content-Type": "application/json" },
>       body: JSON.stringify(metric)
>     });
>   });
> 
>   return null;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `useReportWebVitals()` measures real-user performance metrics (RUM) in client browsers.
> 2. `metric.name` identifies the Web Vital metric (`LCP`, `INP`, `CLS`, `FCP`, `TTFB`).
> 3. Allows tracking real user performance metrics across production deployments.
> 
---

### Exercise 2: Optimizing Largest Contentful Paint (LCP)

**Scenario:**
Optimize a slow LCP score caused by a hero banner image.

**Requirements:**
1. Add `priority` prop to hero image component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Image from "next/image";
> 
> export default function Hero() {
>   return (
>     <section>
>       <Image
>         src="/hero-banner.jpg"
>         alt="Hero Banner"
>         width={1200}
>         height={600}
>         priority // Instructs browser to preload LCP image immediately!
>       />
>     </section>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Largest Contentful Paint (LCP) measures the time taken to render the largest visible UI element.
> 2. `priority` prop injects `<link rel="preload">` tag into HTML head for hero images.
> 3. Directly improves LCP speed score.
> 
---

### Exercise 3: Optimizing Interaction to Next Paint (INP)

**Scenario:**
Improve a poor INP (Interaction to Next Paint) score caused by synchronous CPU blocking tasks in event handlers.

**Requirements:**
1. Wrap CPU task in `startTransition()` or `setTimeout()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import { startTransition } from "react";
> 
> export default function NonBlockingButton() {
>   function handleClick() {
>     // Yield main thread to allow browser UI paint before heavy task:
>     startTransition(() => {
>       // Heavy CPU task...
>     });
>   }
> 
>   return <button onClick={handleClick}>Process Data</button>;
> }
> ```
> 
> #### Technical Explanation
>
> 1. Interaction to Next Paint (INP) measures page responsiveness to user clicks and keypresses.
> 2. Synchronous JavaScript blocking main thread prevents browser UI repaints.
> 3. `startTransition` yields main thread control, maintaining low INP response times.
> 
---


## 6. Related Terms
- [`<Image>` Component](next_image.md) — The optimization tool for LCP and CLS.
- [`next/font` Optimization](next_font.md) — The optimization tool for CLS.
- [HTML `<img>` Element](html_img.md) — Related concept: HTML `<img>` Element.
- [HTML `<script>` Element](html_script.md) — Related concept: HTML `<script>` Element.

---

## 7. Key Takeaways
- Web Core Vitals are Google's standardized performance indicators for SEO ranking.
- LCP tracks loading speed of the primary content block; CLS tracks layout visual stability.
- INP/FID tracks interactivity delays; TTFB tracks server response time.
- Next.js built-in features automate code optimizations to help developers pass these vitals.
- Real-user metrics (field data) are the source of truth for SEO rankings, not local developer tests.
