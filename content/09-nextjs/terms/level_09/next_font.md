# `next/font` Optimization

> **Level 9 — Optimization**
> A built-in system that automatically downloads, hosts, and serves custom web fonts (like Google Fonts) directly from your server, eliminating privacy issues and external network requests.

---

## 1. Prerequisites
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — Specifically Cumulative Layout Shift (CLS).
- [Next.js Overview](../level_01/nextjs.md) — Automatic font optimization in Next.js.

---

## 2. Term Category

**Performance & Optimization** (Automatic Web Font Optimization): `next/font` automatically optimizes Google and custom web fonts by self-hosting font files and inlining CSS to eliminate layout shift.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
Traditionally, to use a Google Font like "Inter", you placed a `<link>` tag in your HTML head. 
When a user visits your site:
1. Their browser hits your server.
2. The browser reads the HTML and sees the Google Fonts link.
3. The browser stops, opens a new connection to `fonts.google.com`, and downloads the font.
4. While downloading, the text is either invisible (Flash of Invisible Text) or renders in a default font (Arial) and then suddenly snaps into the "Inter" font, shifting the page layout (Flash of Unstyled Text / CLS).
**`next/font`** solves this by downloading the Google Font *at build time* and serving it alongside your own CSS files.

### (2) The `next/font/google` Syntax
You import the font function, configure it, and apply its generated class name to your HTML.

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

// 1. Configure the font (subsets reduce file size!)
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Fallback behavior
});

// You can load multiple fonts, like a monospace font for code blocks
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono', // Useful for Tailwind CSS integration!
});

export default function RootLayout({ children }) {
  return (
    // 2. Apply the generated class to the body!
    <html lang="en">
      <body className={`${inter.className} ${robotoMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

### (3) Privacy & Performance
Because the font is downloaded during `npm run build` and hosted on your own domain, the user's browser never connects to Google. This improves performance (no extra DNS lookups) and ensures compliance with strict privacy laws (like GDPR) by not sending user IP addresses to Google.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Defining the font inside a React Component body

**The mistake:** A developer writes `const inter = Inter({ subsets: ['latin'] })` *inside* their `export default function Page()` component.

**Why it's wrong:** If you define the font inside the component body, Next.js will attempt to initialize and inject the font on every single render. This causes severe performance degradation and React warnings.
**Golden Rule:** ALWAYS define your font instances (e.g., `const inter = Inter(...)`) at the top level of your file, outside of any React components.

---

### Mistake 2: Using External Google Font CDN `<link>` Tags in `<head>` (Network Waterfall & FOIT)

**The mistake:** Adding `<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet">` in layout HTML.

**Why it's wrong:** External font CDN links introduce render-blocking network waterfalls and Flash of Unstyled Text (FOUT/FOIT). Use `next/font` to host fonts locally automatically.

*Incorrect:*
```tsx
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet"> <!-- ❌ Render-blocking CDN request! -->
```

*Fix:*
```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
// Apply inter.className to <body>
```

---

### Mistake 3: Instantiating `next/font` Google Fonts inside React Component Functions

**The mistake:** Calling `const inter = Inter({ subsets: ['latin'] })` inside the body of a component render function.

**Why it's wrong:** Font loaders MUST be instantiated at module scope outside component functions to allow static font asset extraction at build time. Instantiating inside render functions throws a build error.

*Incorrect:*
```typescript
export default function Page() {
  const inter = Inter({ subsets: ['latin'] }); // ❌ Font loader instantiated inside component render!
}
```

*Fix:*
```typescript
// Instantiate font loader at global module scope outside components:
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
export default function Page() { return <div className={inter.className}>Text</div>; }
```


---

## 5. Practice Exercises

### Exercise 1: Configuring Google Fonts with `next/font/google`

**Scenario:**
Configure Inter Google Font using `next/font/google` and apply its CSS variable to `app/layout.tsx`.

**Requirements:**
1. Import font loader from `next/font/google`.
2. Apply font variable to `<html>` or `<body>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/layout.tsx
> import { Inter } from "next/font/google";
> import "@/app/globals.css";
> 
> const inter = Inter({
>   subsets: ["latin"],
>   variable: "--font-inter",
>   display: "swap"
> });
> 
> export default function RootLayout({ children }: { children: React.ReactNode }) {
>   return (
>     <html lang="en" className={`${inter.variable} font-sans`}>
>       <body>{children}</body>
>     </html>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `next/font/google` automatically downloads and self-hosts font files at build time.
> 2. Inlines font CSS declarations to eliminate external HTTP network roundtrips to Google Fonts.
> 3. `display: 'swap'` ensures text remains visible while fonts load, preventing Cumulative Layout Shift (CLS).
> 
---

### Exercise 2: Loading Local Custom Fonts with `next/font/local`

**Scenario:**
Load a custom local font file (`/fonts/CustomFont.woff2`) using `next/font/local`.

**Requirements:**
1. Import `localFont` from `next/font/local`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import localFont from "next/font/local";
> 
> const myCustomFont = localFont({
>   src: "../public/fonts/CustomFont.woff2",
>   display: "swap",
>   variable: "--font-custom"
> });
> 
> export default function CustomText({ children }: { children: React.ReactNode }) {
>   return <div className={myCustomFont.className}>{children}</div>;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `next/font/local` optimizes and self-hosts proprietary or custom woff2 font files.
> 2. `myCustomFont.className` applies a unique hashed font class name directly to components.
> 3. Zero network requests to third-party font servers.
> 
---

### Exercise 3: Eliminating Cumulative Layout Shift (CLS) with Size Adjust

**Scenario:**
Explain how `next/font` calculates fallback font size adjustments to prevent layout shifts during font loading.

**Requirements:**
1. Detail `size-adjust` and `font-display: swap` mechanics.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Font CLS Elimination Architecture:
> - Step 1: next/font measures metric glyph dimensions of web font files at build time.
> - Step 2: Generates fallback font CSS declarations with size-adjust and letter-spacing overrides.
> - Step 3: Ensures fallback system font (Arial/Times) occupies EXACTLY the same layout width/height as the web font!
> Result: ZERO layout shift when web font finishes loading!
> ```
>
> #### Technical Explanation
>
> 1. Traditional web fonts cause visual text jumps (layout shifts) when loading finishes.
> 2. `next/font` calculates metric fallback overrides automatically.
> 3. Eliminates CLS web vital penalties for web typography.
> 
---


## 6. Related Terms
- [`<Image>` Component](next_image.md) — Another built-in performance optimization tool.
- [`layout.tsx`](../level_02/layout.md) — The best place to inject a global font.
- [`<Script>` Component](next_script.md) — Related concept: `<Script>` Component.
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — Related concept: Web Core Vitals (FCP, LCP, CLS, TTFB).

---

## 7. Key Takeaways
- **`next/font`** automatically downloads custom fonts at build-time and self-hosts them.
- It completely eliminates privacy issues (GDPR) associated with third-party font tracking.
- It prevents Cumulative Layout Shift (CLS) by automatically injecting size-adjust CSS properties.
- You can use `next/font/google` for Google Fonts, or `next/font/local` for custom `.woff2` files.
- Always instantiate the font *outside* of your React component functions.
