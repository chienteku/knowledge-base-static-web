# `<Script>` Component

> **Level 9 — Optimization**
> A React component replacing the standard HTML `<script>` tag, giving you precise control over when third-party scripts (like Google Analytics or Stripe) load and execute to prevent them from blocking the page.

---

## 1. Prerequisites
- [HTML `<script>` Element](html_script.md) — The standard element this improves.
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — Specifically First Input Delay (FID) and Time to Interactive (TTI).
---

## 2. Term Category
- **Performance / Third-Party Integration**

---

## 3. Environment Context
- **Client & Server Components**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Inline Scripts

**Problem:** You don't have a `src` URL. You just have a raw block of JavaScript you want to execute (like configuring Google Analytics tracking IDs). How do you use the `<Script>` component for inline code?

**Expected output:**
> [!check]- Answer
> ```tsx
> {/* You pass the raw code as children, and you MUST provide an 'id' prop! */}
> <Script id="google-analytics" strategy="afterInteractive">
>   {`
>     window.dataLayer = window.dataLayer || [];
>     function gtag(){dataLayer.push(arguments);}
>     gtag('js', new Date());
>     gtag('config', 'GA_MEASUREMENT_ID');
>   `}
> </Script>
> ```
> - The `id` prop is strictly required so Next.js can track and deduplicate the inline script!

---

### Exercise 2: Inline Script Execution Pattern

**Problem:** Write `<Script id="gtm-script">` component executing inline JavaScript string using `dangerouslySetInnerHTML`.

**Expected output:**
> [!check]- Answer
> ```tsx
> <Script id="gtm" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `console.log('GTM Init');` }} />
> ```
> - Inline scripts require unique `id` prop.
> 
> ```tsx
> import Script from 'next/script';
> 
> export function AnalyticsScript() {
>   return (
>     <Script
>       id="gtm-init"
>       strategy="afterInteractive"
>       dangerouslySetInnerHTML={{
>         __html: `window.dataLayer = window.dataLayer || [];`,
>       }}
>     />
>   );
> }
> ```

---

### Exercise 3: next/script Mandatory id Prop Rule

**Problem:** Why does `<Script>` require an explicit `id` prop when executing inline scripts?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js uses the id prop to track and deduplicate inline script execution across page navigation.
> ```
> - `id` enables script deduplication across SPA route transitions.
> 
> ```text
> <Script id="unique-id"> ... </Script>
> ```


---

## 7. Related Terms
- [`<Image>` Component](next_image.md) — Optimization for visual assets.
- [`next/font` Optimization](next_font.md) — Optimization for typography.
- [HTML `<script>` Element](html_script.md) — Related concept: HTML `<script>` Element.
---

## 8. Key Takeaways
- **`next/script`** optimizes the loading of third-party JavaScript files.
- The **`strategy`** prop is the core feature, offering three main modes:
  - `beforeInteractive`: Critical scripts (bot detection).
  - `afterInteractive`: Default (analytics).
  - `lazyOnload`: Non-critical heavy scripts (chatbots).
- You can use the `onLoad` prop to execute React code immediately after a script finishes downloading.
- Inline scripts require a unique `id` prop to prevent duplicate execution during navigation.
