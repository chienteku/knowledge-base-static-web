# Single Page Applications (SPA)

> **Level 9 — Routing & Ecosystem**
> A modern web architecture where the server only ever sends a single HTML document to the browser, and React uses JavaScript to dynamically rewrite the page content to simulate navigation.

---

## 1. Prerequisites
- [Virtual DOM](../level_01/virtual_dom.md) — The technology React uses to rewrite the page so quickly.
- [Components](../level_01/components.md) — Building Single Page Applications with React components.

---

## 2. Term Category
Web Architecture Concept

---

## 3. Core Definition
In a traditional Multi-Page Application (MPA) built with PHP or Ruby, every time you click a link, the browser deletes the current page, sends a request to the server, waits for the server to generate a new HTML file, and renders it from scratch. This causes a visible "flash" or "refresh."

React fundamentally changes this by building **Single Page Applications (SPAs)**. When you visit a React site, you download one empty `index.html` file and a massive JavaScript bundle. When you click a link to go to the "About" page, the browser does *not* contact the server for a new page. Instead, React instantly rips out the old components and injects the new "About" components directly into the DOM using JavaScript.

---

## 4. Key Characteristics / Rules
- **Instant Navigation:** Because no server trip is required for the HTML, navigating between pages in an SPA feels instantaneous, like a native mobile app.
- **Heavy Initial Load:** The tradeoff is that the user must wait to download the entire JavaScript bundle before they can see anything on the very first visit.
- **Client-Side Routing:** You must use a tool (like React Router) to manipulate the browser's URL bar so users can still use the Back/Forward buttons and bookmark links.

---

## 5. Typical Usage / Common Patterns

### The standard `index.html` of an SPA
If you view the source code of a React SPA in your browser, it usually looks completely empty, no matter what page you are on:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>My React App</title>
  </head>
  <body>
    <!-- The single div where React injects everything -->
    <div id="root"></div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

---

## 6. Common Pitfalls
- **Terrible SEO:** Because search engine bots historically couldn't execute JavaScript well, they would just see an empty `<div id="root"></div>` and assume the website had no content. This is the primary reason Server-Side Rendering (SSR) frameworks were invented.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Failing to Configure Server Rewrite Rules for SPA Deep Linking

**The mistake:** Refreshing browser on URL `https://app.com/settings/profile` and getting web server `404 Not Found`.

**Why it's wrong:** In Single Page Applications (SPAs), all routes share a single `index.html` file. Web servers must be configured to fallback all un-matched routes to `index.html`.

*Incorrect:*
```javascript
// Web server expecting physical file /settings/profile/index.html
```

*Fix:*
```javascript
Configure web server (Nginx/Apache/Cloudflare) fallback rewrite rule to index.html
```

### Mistake 2: Loading Massive Single Monolithic JavaScript Bundles in SPAs (Initial Load Lag)

**The mistake:** Bundling the entire SPA into a single 15MB `bundle.js` loaded on initial page visit.

**Why it's wrong:** Loading a 15MB bundle causes initial white-screen load lag. Use Code Splitting (`React.lazy`) to load dynamic route chunks on demand.

*Incorrect:*
```javascript
// Single 15MB bundle.js for whole SPA
```

*Fix:*
```javascript
Use route-based code-splitting with React.lazy and Suspense
```



### Mistake 3: Ignoring Search Engine Optimization (SEO) Meta Tags in Pure Client-Rendered SPAs

**The mistake:** Deploying a pure client-side SPA and expecting search engine crawlers to parse dynamic JS metadata automatically.

**Why it's wrong:** Pure client-side SPAs serve empty `<div id="root"></div>` HTML. Search engine crawlers can index incomplete content. Use SSR/SSG (Next.js) or dynamic rendering for public marketing pages.

*Incorrect:*
```javascript
// Expecting web crawlers to parse dynamic JS meta tags in pure client SPA
```

*Fix:*
```javascript
Use Next.js SSR/SSG for public SEO marketing pages
```

## 6. Practice Exercises



### Exercise 1: SPA Architecture Definition

**Problem:** Define Single Page Application (SPA) (A web application that loads a single HTML page and dynamically updates page content as the user interacts with the app, without requesting new HTML pages from servers).

**Expected output:**
> [!check]- Answer
> ```text
> Loads a single HTML page and dynamically updates content without requesting full page reloads from servers
> ```
> ```text
> Loads a single HTML page and dynamically updates content without requesting full page reloads from servers
> ```
>
> **Explanation:** SPAs provide desktop-like fluid user experiences via client-side rendering and routing.
> 
---

### Exercise 2: SPA vs MPA Tradeoffs

**Problem:** Compare: SPA (Fast client navigation, rich interactivity; complex SEO/initial bundle size); MPA (Fast initial page load, simple SEO; full page reload on navigation).

**Expected output:**
> [!check]- Answer
> ```text
> SPA: fast navigation & interactivity; MPA: simple SEO & fast initial HTML load
> ```
> ```text
> SPA: fast navigation & interactivity; MPA: simple SEO & fast initial HTML load
> ```
>
> **Explanation:** Architectural choices depend on interactivity requirements vs initial SEO loading needs.
> 
---

### Exercise 3: Updating Page Title in SPA

**Problem:** Update `document.title` on route changes in SPA using `useEffect`.

**Expected output:**
> [!check]- Answer
> ```text
> useEffect(() => { document.title = 'Dashboard | My App'; }, []);
> ```
> ```javascript
> useEffect(() => {
>   document.title = 'Dashboard | My App';
> }, []);
> ```
>
> **Explanation:** Updating `document.title` in route components maintains browser tab context in SPAs.
> 
## 7. Related Terms
- [Client-Side Routing](client_side_routing.md) — The mechanism used to make an SPA feel like a multi-page site.
- [Server-Side Rendering (SSR)](../level_10/ssr.md) — The modern alternative to pure SPAs to fix the SEO and initial load time issues.

---

