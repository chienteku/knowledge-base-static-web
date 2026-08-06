# Client-Side Routing

> **Level 9 — Routing & Ecosystem**
> The technique of navigating between different "pages" entirely within the user's browser, without ever requesting a new HTML file from the server.

---

## 1. Prerequisites
- [SPA](../../../03-javascript/terms/level_10/spa.md) — The architecture that requires Client-Side routing.
- [DOM (Document Object Model)](../../../01-html/terms/level_09/dom.md) — What routing is actually doing under the hood.

---

## 2. Term Category
- **Web Architecture / React Concept**

---

## 3. Environment Context
- **Client-Side**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a traditional website (Server-Side Routing), clicking a link to `/about` forces the browser to destroy the current page, send a network request to the server, wait for the server to generate an entirely new `about.html` file, and download it. This causes a slow, white "flash" on the screen.
React builds Single Page Applications (SPAs). There is only ONE HTML file (`index.html`). We need a way to make it *look* like the user is navigating to different pages, without ever actually refreshing the browser.

### (2) How it works
Client-Side Routing intercepts the user's click. Instead of letting the browser request a new page, it:
1. **Changes the URL:** It uses the HTML5 History API (`window.history.pushState`) to change the URL bar from `/home` to `/about`.
2. **Swaps Components:** It destroys the `<Home />` React component and instantly mounts the `<About />` component in its place.
Because no network request for HTML is made, the transition is instant.

### (3) The Trade-offs
**Pros:** Lightning-fast navigation. Feels like a native mobile app. State (like a playing audio track) can persist while the user navigates across the app.
**Cons:** The initial load is heavier (because you have to download the JavaScript for *all* pages upfront, unless you use Code Splitting). SEO can sometimes be trickier because web crawlers have to execute JS to see the "pages".

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using traditional `<a href="/about">` tags

**The mistake:** A developer builds a React app but uses standard HTML anchor tags for their navigation menu.

**Why it's wrong:** The standard `<a href>` tag hard-refreshes the browser. It bypasses React entirely and makes a full round-trip request to the server. You lose all your React State, and the app feels slow. 
**Golden Rule:** In a React SPA, never use `<a href>` for internal links. You must use the routing library's `<Link>` component. (You still use `<a href>` for external links to other websites).

---



### Mistake 2: Using Native HTML Anchors (`<a href="/path">`) Instead of Client Router Links

**The mistake:** Writing `<a href="/dashboard">Dashboard</a>` in a React Single Page Application (SPA).

**Why it's wrong:** Native HTML `<a>` links cause a FULL BROWSER PAGE RELOAD, wiping out React component state and Context memory stores. Use router navigation links (`<Link to="/dashboard">`).

*Incorrect:*
```javascript
<a href="/dashboard">Dashboard</a> // ❌ Triggers full browser page reload!
```

*Fix:*
```javascript
<Link to="/dashboard">Dashboard</Link> // Client-side routing without page reloads
```

### Mistake 3: Failing to Configure Production Web Server Fallback Routes for SPA Client Routing

**The mistake:** Deploying an SPA to Nginx or S3 and getting 404 errors on refreshing deep URLs like `/users/42`.

**Why it's wrong:** Static web servers look for physical file `/users/42/index.html`. Configure server rewrite rules to redirect all request paths back to `index.html`.

*Incorrect:*
```javascript
// Nginx returning 404 Not Found on refreshing /dashboard URL
```

*Fix:*
```javascript
Nginx config: try_files $uri $uri/ /index.html; -- Fallback to SPA root index.html
```

## 6. Practice Exercises

### Exercise 1: Server vs Client

**Problem:** You are listening to a song on Spotify's web player. You click on a different playlist. The URL changes, the playlist UI updates, but the song *keeps playing seamlessly*. Is this Server-Side or Client-Side routing?

**Expected output:**
> [!check]- Answer
> ```text
> Client-Side Routing.
> If it were Server-Side, the entire browser page would refresh, and the song would immediately stop and have to reload.
> ```
> - Think about what happens to the browser tab during a refresh.
> 
---



### Exercise 2: Client-Side Routing Advantage

**Problem:** State 2 benefits of Client-Side Routing over traditional Multi-Page Application (MPA) routing (1. Zero full-page reloads for fast route transitions; 2. Preserves React component state across route updates).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Zero full-page reloads for fast transitions; 2. Preserves React state across route updates
> ```
> ```text
> 1. Zero full-page reloads for fast transitions; 2. Preserves React state across route updates
> ```
>
> **Explanation:** Client-side routing updates browser URL and DOM tree without requesting new HTML pages from servers.
> 
---

### Exercise 3: HTML5 History API Methods

**Problem:** What browser History API method does client-side routing use to update URL without page reloads? (`history.pushState()`).

**Expected output:**
> [!check]- Answer
> ```text
> history.pushState()
> ```
> ```text
> history.pushState()
> ```
>
> **Explanation:** `pushState()` and `replaceState()` update the browser URL path without triggering server page fetches.
> 
## 7. Related Terms
- [React Router](react_router.md) — The most popular library used to implement Client-Side Routing in React.
- [`<Link>` Component](link_component.md) — Related concept: `<Link>` Component.
- [Single Page Applications (SPA)](spa.md) — Related concept: Single Page Applications (SPA).

---

## 8. Key Takeaways
- **Client-Side Routing** swaps out React components to simulate page navigation without ever refreshing the browser.
- It provides a lightning-fast, native-app-like experience.
- It relies on the browser's History API to change the URL visually.
- Never use standard `<a href>` tags for internal navigation, as they trigger a full page refresh.
