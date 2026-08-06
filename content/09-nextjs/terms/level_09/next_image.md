# `<Image>` Component

> **Level 9 — Optimization**
> A powerful React component replacing the standard HTML `<img>` tag, providing automatic image resizing, lazy loading, and modern format conversion (like WebP/AVIF) to drastically improve page speed.

---

## 1. Prerequisites
- [HTML `<img>` Element](html_img.md) — The standard tag this component improves upon.
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — The performance metrics (LCP, CLS) this component is designed to solve.

---

## 2. Term Category

**Performance & Optimization** (Advanced Image Asset Optimization): `<Image>` provides automatic WebP/AVIF format conversion, responsive image resizing, blur placeholders, and LCP preloading.



---

## 3. Explanation

### Environment Context
- **Server & Client Components**

### (1) Design Motivation — "Why did we design this?"
Images account for a massive percentage of the internet's bandwidth. If a user uploads a 5MB, 4000x4000px photograph of a dog, and you display it in a 300x300px square on your website using a standard `<img src="dog.jpg">`, the user's phone still downloads the full 5MB file. This destroys page load speeds and mobile data plans.
Furthermore, as images load, they push text down the page (Cumulative Layout Shift or CLS), creating a jarring user experience.
The `<Image>` component automatically intercepts image requests, resizes them on the server, converts them to modern compressed formats, prevents Layout Shift, and only loads them when the user scrolls them into view.

### (2) The `<Image>` Syntax
You import it from `next/image`. Unlike a standard `<img>`, you MUST provide a `width` and `height` to prevent Layout Shift, unless you are importing a local static image file (which Next.js can analyze automatically).

```tsx
import Image from 'next/image';
import localLogo from '@/public/logo.png';

export default function Page() {
  return (
    <div>
      {/* Local images don't need width/height, Next.js calculates it! */}
      <Image src={localLogo} alt="Company Logo" />

      {/* Remote images REQUIRE width and height to reserve space */}
      <Image 
        src="https://images.unsplash.com/photo-123" 
        alt="A beautiful landscape" 
        width={800} 
        height={600} 
      />
    </div>
  );
}
```

### (3) The `fill` Prop
What if you want an image to be responsive, filling its parent container perfectly (e.g., `width: 100%`)? You can't hardcode the width and height!
You use the `fill` prop. The parent container MUST have `position: relative` (or absolute/fixed) for this to work.

```tsx
<div style={{ position: 'relative', width: '100%', height: '300px' }}>
  <Image 
    src="/banner.jpg" 
    alt="Banner" 
    fill 
    style={{ objectFit: 'cover' }} 
  />
</div>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not configuring `remotePatterns`

**The mistake:** A developer writes `<Image src="https://my-database.com/photo.jpg" width={500} height={500} />` and gets a crashing error in the browser.

**Why it's wrong:** Next.js Image Optimization runs on your server. If Next.js allowed you to optimize *any* URL on the internet, malicious users could use your server to process millions of random images, running up a massive AWS bill.
**Golden Rule:** You MUST explicitly whitelist the external domains you trust in your `next.config.mjs` file using `remotePatterns`.

```js
// next.config.mjs
export default {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'my-database.com' },
    ],
  },
};
```

---

### Mistake 2: Omitting Mandatory `width` and `height` Props on Static Non-Imported Images

**The mistake:** Writing `<Image src="/logo.png" alt="Logo" />` without specifying `width` and `height`.

**Why it's wrong:** For remote or string paths, Next.js requires explicit `width` and `height` (or `fill` prop) to reserve layout space and prevent Cumulative Layout Shift (CLS).

*Incorrect:*
```tsx
<Image src="/logo.png" alt="Logo" /> <!-- ❌ Missing required width/height props! -->
```

*Fix:*
```tsx
<Image src="/logo.png" alt="Logo" width={200} height={50} />
```

---

### Mistake 3: Using `fill` Prop Without Relative Positioned Parent Container

**The mistake:** Using `<Image src="/bg.jpg" fill alt="BG" />` inside an un-styled `<div>` container.

**Why it's wrong:** When `fill` is used, `<Image />` positions itself absolutely (`position: absolute; inset: 0`). If the parent container lacks `position: relative`, the image expands to fill the entire body page.

*Incorrect:*
```tsx
<div>
  <Image src="/bg.jpg" fill alt="BG" /> <!-- ❌ Parent container lacks position: relative! -->
</div>
```

*Fix:*
```tsx
<div className="relative h-64 w-full">
  <Image src="/bg.jpg" fill alt="BG" className="object-cover" />
</div>
```


---

## 5. Practice Exercises

### Exercise 1: Optimizing Local Images with `next/image`

**Scenario:**
Optimize a local image asset using `<Image>` component imports to prevent Cumulative Layout Shift (CLS).

**Requirements:**
1. Import local image asset.
2. Render `<Image src={logo} alt="Logo" />`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Image from "next/image";
> import profilePic from "@/public/profile.jpg";

export default function Profile() {
  return (
    <div className="avatar-container">
      <Image
        src={profilePic}
        alt="User Profile Picture"
        placeholder="blur"
        className="rounded-full"
      />
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. `next/image` automatically measures width, height, and generates blur placeholders for static imported images.
> 2. Serves images in modern WebP/AVIF formats scaled to the user's viewport device resolution.
> 3. Eliminates Cumulative Layout Shift (CLS) web vital penalties.

---

### Exercise 2: Configuring Remote Domain Image Hosts

**Scenario:**
Configure `next.config.js` to allow rendering remote images from `images.unsplash.com`.

**Requirements:**
1. Add `images.remotePatterns` entry in `next.config.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // next.config.js
> module.exports = {
>   images: {
>     remotePatterns: [
>       {
>         protocol: "https",
>         hostname: "images.unsplash.com",
>         port: "",
>         pathname: "/**"
>       }
>     ]
>   }
> };
> ```

> #### Technical Explanation
>
> 1. Next.js restricts remote image optimization to explicitly allowed domains in `remotePatterns` for security.
> 2. Prevents malicious actors from abusing your server's image optimization endpoint.
> 3. Required setup for remote image hosting services.

---

### Exercise 3: Using `fill` for Responsive Card Banners

**Scenario:**
Render a responsive hero image that fills its parent container using `fill` prop.

**Requirements:**
1. Pass `fill`, `sizes`, and `priority` props to `<Image>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Image from "next/image";

export default function HeroBanner({ src }: { src: string }) {
  return (
    <div className="relative w-full h-64 overflow-hidden">
      <Image
        src={src}
        alt="Hero Banner"
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. `fill` instructs the image to stretch and fit its nearest `position: relative` parent container.
> 2. `priority` preloads LCP (Largest Contentful Paint) hero images immediately.
> 3. `sizes` assists the browser in selecting the optimal srcset image width.

---




---

## 6. Related Terms
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — Metrics improved by this component (CLS, LCP).
- [`next/font` Optimization](next_font.md) — A similar built-in optimization tool.
- [HTML `<img>` Element](html_img.md) — Related concept: HTML `<img>` Element.
- [`<Script>` Component](next_script.md) — Related concept: `<Script>` Component.

---

## 7. Key Takeaways
- The `<Image>` component replaces the HTML `<img>` tag.
- It automatically resizes images, converts them to WebP/AVIF, lazy-loads them, and prevents Layout Shift.
- You must provide `width` and `height` for remote images, OR use the `fill` prop within a relatively positioned parent.
- You must whitelist external image domains in `next.config.mjs` using `remotePatterns`.
- Use the `priority` prop for critical images above the fold (like Hero images) to disable lazy-loading and improve LCP.
