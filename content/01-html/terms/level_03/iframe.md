# `<iframe>`

> **Level 3 — Media & Embedding**
> Embeds another HTML page within the current page.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — Understand basic HTML structures.
- [Attribute](../level_01/attribute.md) — Iframes rely heavily on attributes.
- [`src` Attribute](src.md) — The media source loader attribute.

---

## 2. Term Category
- **Media Element**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes you want to display complex content on your website that you didn't build yourself. For example, you want to show an interactive Google Map with your store's location, or you want to embed a playable YouTube video. 
You can't just copy and paste Google Maps' source code into your website—it's millions of lines of proprietary code!
The W3C created the `<iframe>` (Inline Frame) to solve this. An iframe cuts a rectangular hole in your website and lets another entirely separate website render inside that hole. It is quite literally a webpage embedded inside another webpage.

### (2) Reality Metaphor
Imagine a submarine with a thick glass porthole.
Your website is the inside of the submarine. The ocean outside is the rest of the internet (like YouTube or Google Maps). 
The `<iframe>` is the glass porthole. It allows you to look safely outside at the ocean, but the water (the code from the other website) cannot leak into your submarine and ruin your stuff. 

### (3) Code Examples

#### Short Snippet
```html
<!-- Cutting a 500x500 hole to display Wikipedia inside our site -->
<iframe src="https://en.wikipedia.org/" width="500" height="500"></iframe>
```

#### Fuller Example
```html
<article>
  <h2>How to find our coffee shop</h2>
  <p>We are located right in the heart of downtown!</p>
  
  <!-- Embedding an interactive Google Map using an iframe -->
  <!-- The title attribute is crucial for accessibility (screen readers) -->
  <iframe 
    src="https://www.google.com/maps/embed?pb=!1m18..." 
    width="600" 
    height="450" 
    title="Google Map showing our coffee shop location">
  </iframe>
</article>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `title` attribute for accessibility

**The mistake:** Leaving off the `title` attribute on an `<iframe>`.

**Why it's wrong:** When a screen reader encounters an iframe, it needs to know what is inside that "hole" before it decides to step inside and read it. The `title` attribute is the equivalent of the `alt` tag for images. It tells the blind user what the embedded content is. If you forget it, the screen reader might just read the massive, ugly URL.

*Incorrect:*
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
```

*Fix:*
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Rick Astley - Never Gonna Give You Up Music Video"></iframe>
```

### Mistake 2: Trying to iframe websites that block it

**The mistake:** Trying to embed a major website like `https://google.com` or `https://facebook.com` directly into an iframe.

**Why it's wrong:** For security reasons (to prevent a hacking technique called "Clickjacking"), most major websites send a special security header (`X-Frame-Options: DENY`) that explicitly forbids other sites from putting them inside an iframe. If you try it, the iframe will just show an empty gray box or an error. You can only iframe sites that explicitly allow it (like YouTube's special `/embed/` links).

---



### Mistake 3: Omitting the `sandbox` Attribute on Untrusted Third-Party `<iframe>` Embeds

**The mistake:** Embedding third-party user content `<iframe src="https://untrusted.com">` without sandbox restrictions.

**Why it's wrong:** Without `sandbox`, embedded third-party pages can execute scripts, pop up modals, and access cookies in parent document context (XSS risk).

*Incorrect:*
```html
<iframe src="https://untrusted-embed.com"></iframe> <!-- ❌ Security vulnerability! -->
```

*Fix:*
```html
<iframe src="https://untrusted-embed.com" sandbox="allow-scripts allow-same-origin"></iframe>
```

### Mistake 4: Omitting `title` Attribute on `<iframe>` Elements (Accessibility Failure)

**The mistake:** Embedding an iframe `<iframe src="map.html"></iframe>` without a `title` attribute.

**Why it's wrong:** Screen readers announce iframe frames using their `title` attribute. Omitting `title` causes screen readers to read out raw frame URLs.

*Incorrect:*
```html
<iframe src="/widget"></iframe> <!-- ❌ Missing title attribute for screen readers -->
```

*Fix:*
```html
<iframe src="/widget" title="Interactive Stock Ticker Widget"></iframe>
```

## 6. Practice Exercises

### Exercise 1: The Porthole

**Problem:** Does the CSS styling on your main website affect the buttons and text inside an `<iframe>`?

**Expected output:**
> [!check]- Answer
> ```text
> No! An iframe is a completely isolated environment (like looking through a glass porthole). Your website's CSS cannot cross the boundary to style the contents of the iframe, and the iframe's CSS cannot leak out to style your website.
> ```
> - Remember the submarine metaphor. The water cannot leak in!

---



### Exercise 2: Responsive Youtube Embed Iframe

**Problem:** Write accessible `<iframe>` for Youtube video with title `'Product Demo'` and `loading="lazy"`.

**Expected output:**
> [!check]- Answer
> ```text
> <iframe src="https://www.youtube.com/embed/xyz" title="Product Demo" loading="lazy" allowfullscreen></iframe>
> ```
> ```html
> <iframe 
>   src="https://www.youtube.com/embed/xyz" 
>   title="Product Demo" 
>   loading="lazy"
>   allowfullscreen>
> </iframe>
> ```
>
> **Explanation:** `title` provides accessibility; `loading="lazy"` defers frame loading until scrolled into view.

---

### Exercise 3: Sandbox Restrictions

**Problem:** What does `<iframe sandbox>` with no attribute values restrict?

**Expected output:**
> [!check]- Answer
> ```text
> Applies maximum security restrictions: disables JS scripts, forms, popups, and same-origin storage access.
> ```
> ```text
> Applies maximum security restrictions: disables JS scripts, forms, popups, and same-origin storage access.
> ```
>
> **Explanation:** Bare `sandbox` locks down embedded iframe capabilities completely.

## 7. Related Terms
- [`src` Attribute](src.md) — The attribute defining the iframe source URL.
- [`<img>`](img.md) — Another tag that embeds external content (images) by fetching a source URL.

---

## 8. Key Takeaways
- An `<iframe>` embeds an entirely separate webpage inside a rectangular box on your page.
- It is commonly used for YouTube videos, Google Maps, and third-party widgets.
- The embedded page is completely isolated; your CSS and JavaScript cannot easily interact with it.
- Always include a `title` attribute on your iframes for accessibility.
- Many websites actively block themselves from being iframed for security reasons.
