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

**Media Element (Universal Browser Support)**: `<iframe>` is a fundamental concept in this technology stack. **Level 3 — Media & Embedding**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Secure Sandbox Embed with Title and Lazy Loading

**Scenario:** A developer embeds a third-party widget using `<iframe>`, enforcing security sandbox restrictions and accessibility titles.

**Requirements:**
1. Create an `<iframe>` element with `src`.
2. Include an accessible `title` attribute.
3. Apply `sandbox` restrictions and `loading="lazy"`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="embed-container">
>   <iframe src="https://example.com/widget" title="Interactive Weather Forecast Widget" width="300" height="200" loading="lazy" sandbox="allow-scripts allow-same-origin">
>   </iframe>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **The `<iframe>` Element**: Embeds an independent HTML document nested inside the current webpage.
> 2. **Mandatory `title` Attribute**: Screen readers announce the `title` attribute to inform blind users what content the embedded iframe contains.
> 3. **Security via `sandbox`**: The `sandbox` attribute restricts iframe capabilities (prevents popups, top-level navigation, or untrusted script execution).
> 
---

### Exercise 2: Accessible Embedded Video Frame

**Scenario:** Embeds a YouTube video using `<iframe>` with proper aspect ratio and feature permissions.

**Requirements:**
1. Include descriptive `title`.
2. Configure `allow` permissions policy.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="video-responsive">
>   <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="HTML5 Web Standards Tutorial Video" width="560" height="315" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
>   </iframe>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Feature Policy (`allow`)**: Controls feature permissions (camera, microphone, fullscreen, autoplay) granted to the embedded iframe document.
> 2. **`allowfullscreen` Flag**: Enables the user to maximize embedded video to full screen mode.
> 3. **Responsive Wrapper Pattern**: Wrap iframes in aspect-ratio CSS containers to maintain fluid scaling on mobile screens.
> 
---

### Exercise 3: Cross-Origin Security Restrictions and Lazy Loading

**Scenario:** Applies performance lazy loading and origin isolation attributes to external map embeds.

**Requirements:**
1. Set `loading="lazy"`.
2. Set `referrerpolicy="no-referrer-when-downgrade"`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <iframe src="https://maps.example.com/embed?q=San+Francisco" title="Map showing Acme Corp San Francisco Headquarters" width="600" height="450" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
> </iframe>
> ```
>
> #### Technical Explanation
>
> 1. **Native `loading="lazy"`**: Defers loading iframe network resources until the user scrolls near the viewport, saving data.
> 2. **Referrer Policy**: `referrerpolicy` controls how much HTTP referrer header info is sent to external iframe origins.
> 3. **Accessibility Titling**: Prevents screen readers from reading meaningless iframe internal file URLs.
## 6. Related Terms
- [`src` Attribute](src.md) — The attribute defining the iframe source URL.
- [`<img>`](img.md) — Another tag that embeds external content (images) by fetching a source URL.

---

## 7. Key Takeaways
- An `<iframe>` embeds an entirely separate webpage inside a rectangular box on your page.
- It is commonly used for YouTube videos, Google Maps, and third-party widgets.
- The embedded page is completely isolated; your CSS and JavaScript cannot easily interact with it.
- Always include a `title` attribute on your iframes for accessibility.
- Many websites actively block themselves from being iframed for security reasons.
