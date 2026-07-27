# Web Core Vitals (FCP, LCP, CLS, TTFB)

> **Level 9 — Built-in Optimizations**
> A set of standardized web performance metrics defined by Google to objectively measure loading speed, interactivity, and visual stability of web pages.

---

## 1. Prerequisites
- [SEO (Search Engine Optimization)](../level_01/seo.md) — The search engine indexing context that relies on these vitals.

---

## 2. Term Category
- **Optimization**

---

## 3. Environment Context
- **Client Only** (Vitals represent real-world user metrics captured and measured inside the client's browser window).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Identify the Broken Metric

**Problem:** Match each user complaint to the broken Web Core Vital metric:
1. "Every time I try to click the accept button, a late-loading advertisement pops in, pushes the button down, and I accidentally click the wrong item!"
2. "I clicked the submit button on the signup form, but the page just hung there for a second before showing the spinner."
3. "The page structure loaded instantly, but the large hero banner image took 8 seconds to transition from grey to full color."

**Expected output:**
```text
1. CLS (Layout shift caused by lack of reserved dimensions).
2. INP / FID (Latency between action input and browser thread reaction).
3. LCP (Slow rendering of the primary layout element).
```

> [!check]- Answer
> - CLS is always related to elements moving unexpectedly.

---

### Exercise 2: Core Vitals Metrics Matrix

**Problem:** Match Core Vital metric to technical measurement:
1. LCP (Largest Contentful Paint)
2. INP (Interaction to Next Paint)
3. CLS (Cumulative Layout Shift)

**Expected output:**
```text
1. Render time of largest image/text block visible in viewport (Loading speed)
2. Latency of user interaction feedback to next painted frame (Interactivity)
3. Visual stability score measuring unexpected layout movements (Visual stability)
```

> [!check]- Answer
> - LCP -> Loading Performance (Target < 2.5s)
> - INP -> Interactivity & Responsiveness (Target < 200ms)
> - CLS -> Visual Stability (Target < 0.1)
> 
> ```text
> LCP < 2.5s | INP < 200ms | CLS < 0.1
> ```

---

### Exercise 3: useReportWebVitals Hook Setup

**Problem:** Write `useReportWebVitals` hook function logging metric name and value inside `app/providers.tsx`.

**Expected output:**
```tsx
'use client'; import { useReportWebVitals } from 'next/navigation'; export function WebVitals() { useReportWebVitals((metric) => { console.log(metric.name, metric.value); }); return null; }
```

> [!check]- Answer
> - `useReportWebVitals()` captures real-user Core Vitals metrics.
> 
> ```tsx
> 'use client';
> import { useReportWebVitals } from 'next/navigation';
> 
> export function WebVitals() {
>   useReportWebVitals((metric) => {
>     console.log(`[Web Vital] ${metric.name}: ${metric.value}`);
>   });
>   return null;
> }
> ```


---

## 7. Related Terms
- [`<Image>` Component](../level_09/next_image.md) — The optimization tool for LCP and CLS.
- [`next/font` Optimization](../level_09/next_font.md) — The optimization tool for CLS.

---

## 8. Key Takeaways
- Web Core Vitals are Google's standardized performance indicators for SEO ranking.
- LCP tracks loading speed of the primary content block; CLS tracks layout visual stability.
- INP/FID tracks interactivity delays; TTFB tracks server response time.
- Next.js built-in features automate code optimizations to help developers pass these vitals.
- Real-user metrics (field data) are the source of truth for SEO rankings, not local developer tests.
