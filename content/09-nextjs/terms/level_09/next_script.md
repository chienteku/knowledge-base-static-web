# `<Script>` Component

> **Level 9 — Optimization**
> A React component replacing the standard HTML `<script>` tag, giving you precise control over when third-party scripts (like Google Analytics or Stripe) load and execute to prevent them from blocking the page.

---

## 1. Prerequisites
- [HTML `<script>` Element](html_script.md) — The standard element this improves.
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — Specifically First Input Delay (FID) and Time to Interactive (TTI).

---

## 2. Term Category

**Performance & Optimization** (Third-Party Script Loading Optimization): `<Script>` optimizes external third-party JavaScript loading using execution strategies (`beforeInteractive`, `afterInteractive`, `lazyOnload`, `worker`).



---

## 3. Explanation

### Environment Context
- **Client & Server Components**

### (1) Design Motivation — "Why did we design this?"
Modern websites are packed with third-party scripts: Google Analytics, Intercom Chatbots, Stripe Checkout, Facebook Pixel. 
If you just drop `<script src="analytics.js"></script>` into your HTML head, the browser stops rendering the page to download and execute that script. A heavy chatbot script could delay your site's interactivity by 3 seconds!
**`next/script`** provides a `strategy` prop, allowing you to tell Next.js exactly *when* each script should load, prioritizing your actual React app code over third-party marketing tools.

### (2) The `<Script>` Syntax & Strategies
You import the `<Script>` component and place it anywhere in your component tree.

```tsx
import Script from 'next/script';

export default function Dashboard() {
  return (
    <>
      {/* Strategy 1: beforeInteractive */}
      {/* Use for CRITICAL scripts that must execute BEFORE React hydrates (e.g., bot detection). */}
      <Script src="https://example.com/critical.js" strategy="beforeInteractive" />

      {/* Strategy 2: afterInteractive (DEFAULT) */}
      {/* Use for Tag Managers or Analytics. It loads quickly, but waits for React to finish hydrating first. */}
      <Script src="https://example.com/analytics.js" strategy="afterInteractive" />

      {/* Strategy 3: lazyOnload */}
      {/* Use for Chatbots or Social Media Widgets. It waits until the browser is completely idle. */}
      <Script src="https://example.com/heavy-chatbot.js" strategy="lazyOnload" />
    </>
  );
}
```

### (3) Executing Code After Load
Often, you need to run some code *after* a third-party script has successfully loaded (e.g., initializing a Stripe object). You can use the `onLoad` or `onReady` props.

```tsx
<Script 
  src="https://js.stripe.com/v3/" 
  onLoad={() => {
    console.log("Stripe has loaded! We can now initialize the payment form.");
  }}
/>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing `beforeInteractive` scripts in the wrong place

**The mistake:** A developer places a `<Script strategy="beforeInteractive">` inside a deeply nested `dashboard/settings/page.tsx` file.

**Why it's wrong:** `beforeInteractive` scripts are injected into the initial HTML from the server and are meant to execute before *anything* else. If you put them inside a specific page, they might not work correctly during client-side navigation.
**Golden Rule:** If a script absolutely must be `beforeInteractive`, it should ONLY be placed inside the root `app/layout.tsx` document.

---

### Mistake 2: Loading Non-Critical Scripts with Default `afterInteractive` Strategy

**The mistake:** Loading customer support chat widgets using default `strategy="afterInteractive"`.

**Why it's wrong:** `afterInteractive` scripts execute immediately after page hydration, competing for main thread resources during initial user load. Use `strategy="lazyOnload"` for non-critical widgets.

*Incorrect:*
```tsx
<Script src="/chat-widget.js" /> <!-- ❌ Default strategy competes for hydration resources! -->
```

*Fix:*
```tsx
<Script src="/chat-widget.js" strategy="lazyOnload" /> <!-- Deferred execution during browser idle -->
```

---

### Mistake 3: Placing `beforeInteractive` Scripts inside Sub-Page Components

**The mistake:** Adding `<Script src="/poly.js" strategy="beforeInteractive" />` inside `app/dashboard/page.tsx`.

**Why it's wrong:** `strategy="beforeInteractive"` works ONLY inside the root `app/layout.tsx`. Placing it inside sub-page components throws a runtime warning.

*Incorrect:*
```typescript
// app/dashboard/page.tsx
<Script src="/poly.js" strategy="beforeInteractive" /> // ❌ Warning: beforeInteractive only works in root layout!
```

*Fix:*
```tsx
// Move beforeInteractive scripts to app/layout.tsx root component
```


---

## 5. Practice Exercises

### Exercise 1: Loading Analytics Scripts After Page Interactivity

**Scenario:**
Load an external tracking script using `strategy="afterInteractive"`.

**Requirements:**
1. Import `Script` from `next/script`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Script from "next/script";

export default function AnalyticsScript() {
  return (
    <Script
      src="https://cdn.example.com/analytics.js"
      strategy="afterInteractive"
      onLoad={() => console.log("Analytics script loaded!")}
    />
  );
}
```

> #### Technical Explanation
>
> 1. `strategy="afterInteractive"` loads the script immediately after the page finishes initial hydration.
> 2. Default loading strategy for third-party scripts.
> 3. `onLoad` fires a callback function when script execution finishes.

---

### Exercise 2: Preloading Critical Scripts with `beforeInteractive`

**Scenario:**
Load a critical security or polyfill script before page hydration occurs using `strategy="beforeInteractive"`.

**Requirements:**
1. Set `strategy="beforeInteractive"` in `app/layout.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/layout.tsx
> import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://cdn.example.com/polyfill.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
```

> #### Technical Explanation
>
> 1. `strategy="beforeInteractive"` injects the script tag into the server HTML `<head>` before page hydration scripts execute.
> 2. Reserved for critical polyfills, security consent managers, or anti-bot detectors.
> 3. Must be declared inside `app/layout.tsx`.

---

### Exercise 3: Lazy-Loading Non-Critical Scripts with `lazyOnload`

**Scenario:**
Defer loading a non-critical chat widget script until browser idle time using `strategy="lazyOnload"`.

**Requirements:**
1. Set `strategy="lazyOnload"`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Script from "next/script";

export default function ChatWidget() {
  return (
    <Script
      src="https://cdn.example.com/chat-widget.js"
      strategy="lazyOnload"
    />
  );
}
```

> #### Technical Explanation
>
> 1. `strategy="lazyOnload"` defers script loading until all core page assets have finished downloading and the browser is idle.
> 2. Ideal for low-priority widgets (chat bubbles, feedback widgets, social share buttons).
> 3. Protects Web Core Vitals scores from third-party script bloat.

---




---

## 6. Related Terms
- [`<Image>` Component](next_image.md) — Optimization for visual assets.
- [`next/font` Optimization](next_font.md) — Optimization for typography.
- [HTML `<script>` Element](html_script.md) — Related concept: HTML `<script>` Element.

---

## 7. Key Takeaways
- **`next/script`** optimizes the loading of third-party JavaScript files.
- The **`strategy`** prop is the core feature, offering three main modes:
  - `beforeInteractive`: Critical scripts (bot detection).
  - `afterInteractive`: Default (analytics).
  - `lazyOnload`: Non-critical heavy scripts (chatbots).
- You can use the `onLoad` prop to execute React code immediately after a script finishes downloading.
- Inline scripts require a unique `id` prop to prevent duplicate execution during navigation.
