# URL / URI (Uniform Resource Identifier)

> **Level 1 — The Foundations of the Web**
> The string of characters used to identify and locate a specific resource (like a webpage, image, or API data) on the internet.

---

## 1. Prerequisites
- [HTTP / HTTPS](http_https.md) — URLs almost always start with this protocol.

---

## 2. Term Category

**Web Standard / Locator (Universal Standard)**: URL / URI (Uniform Resource Identifier) is a fundamental concept in this technology stack. **Level 1 — The Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If there are billions of files and data points spread across millions of servers worldwide, how do you find the exact one you want? 
We needed a standardized addressing system. The **URI (Uniform Resource Identifier)** was created to uniquely identify a resource. A **URL (Uniform Resource Locator)** is a specific type of URI that not only identifies the resource but also tells you exactly *how to locate it* on the network.
Every time you type `https://www.google.com/images/logo.png` into your browser, you are using a URL to ask the internet to find a very specific file on a very specific server.

### (2) Reality Metaphor
A URL is exactly like a physical mailing address.
- `Protocol`: (How do we send it?) -> US Postal Service vs FedEx.
- `Domain`: (Which building?) -> 123 Main Street, New York.
- `Path`: (Which room in the building?) -> Apartment 4B.

### (3) The Anatomy of a URL
Let's break down `https://api.github.com/users/chienteku?sort=desc`:
1. **Protocol (`https://`)**: Tells the browser to use secure HTTP to talk to the server.
2. **Domain/Host (`api.github.com`)**: The specific computer (Server) we are trying to reach. (Under the hood, the internet translates this into an IP address like `192.168.1.1`).
3. **Path (`/users/chienteku`)**: The specific "folder" or "resource" we want from that server.
4. **Query Parameters (`?sort=desc`)**: Extra instructions or filters we are sending to the server (we want the user data sorted in descending order).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Hardcoding `localhost` URLs in production frontend code

**The mistake:** A developer writes `fetch('http://localhost:3000/api/users')` in their React app, and then deploys the React app to Vercel or Netlify.

**Why it's wrong:** `localhost` literally means "this exact computer." When you run the React app on your laptop, `localhost` points to your backend running on your laptop. But when a user in Brazil opens your deployed React app on their phone, their phone executes `fetch('http://localhost...')`. The phone will try to look for the backend *on the phone itself*, fail, and crash!
**Golden Rule:** Never hardcode URLs. Always use Environment Variables so the URL automatically changes from `localhost` to `https://api.mywebsite.com` when you deploy to production!

---

### Mistake 2: Confusing URI, URL, and URN Terminology

**The mistake:** Calling an ISBN number (`urn:isbn:0451450523`) a URL.

**Why it's wrong:** URI is the overarching umbrella term. A **URL** specifies *how to locate* a resource (`https://...`). A **URN** specifies *what the resource is named* regardless of location (`urn:isbn:...`).

*Incorrect:*
```http
/* Referring to 'urn:isbn:0451450523' as a URL */
```

*Fix:*
```http
/* Correct terminology: 'urn:isbn:0451450523' is a URN (and a URI), but NOT a URL */
```

---

### Mistake 3: Omitting Protocol Scheme in Relative API URLs

**The mistake:** Writing `fetch('api.example.com/users')` without leading `https://`.

**Why it's wrong:** Without a protocol scheme (`https://`), browsers treat `api.example.com/users` as a relative path attached to the current page origin (`https://currentsite.com/api.example.com/users`).

*Incorrect:*
```javascript
fetch('api.example.com/data'); // ❌ Resolves to current domain relative path!
```

*Fix:*
```javascript
fetch('https://api.example.com/data'); // Absolute URL with scheme
```


---

## 5. Practice Exercises

### Exercise 1: URL Query Parameter Extractor & Builder

**Scenario:** A web frontend router parses and manipulates URL query strings using the standard `URL` and `URLSearchParams` web APIs.

**Requirements:**
1. Write updateQueryParam(urlStr, paramKey, paramVal).
2. Parse urlStr with URL API.
3. Set query parameter.
4. Return updated URL string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function updateQueryParam(urlStr, paramKey, paramVal) {
>   try {
>     const url = new URL(urlStr);
>     if (paramVal === null || paramVal === undefined) {
>       url.searchParams.delete(paramKey);
>     } else {
>       url.searchParams.set(paramKey, String(paramVal));
>     }
>     return url.toString();
>   } catch (err) {
>     return urlStr;
>   }
> }
>
> // Verification tests
> const initial = "https://example.com/search?q=js&page=1";
>
> const updated = updateQueryParam(initial, "page", 2);
> console.assert(updated === "https://example.com/search?q=js&page=2", "Test 1 Failed");
>
> const deleted = updateQueryParam(updated, "q", null);
> console.assert(deleted === "https://example.com/search?page=2", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **URL API Purpose**: Standard browser & Node API for parsing, constructing, and manipulating URL strings.
> 2. **URLSearchParams API**: Provides methods (.get, .set, .append, .delete) to manage URL query parameters safely.
> 3. **Automatic Encoding**: URLSearchParams automatically percent-encodes special characters in keys and values.
> 
---

### Exercise 2: URI Path Normalizer & Percent-Encoding Sanitizer

**Scenario:** An API gateway sanitizes user search inputs by encoding special characters using `encodeURIComponent()` to prevent URI syntax errors.

**Requirements:**
1. Write buildSearchUri(baseEndpoint, rawQuery).
2. Encode rawQuery with encodeURIComponent().
3. Return complete search URI.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildSearchUri(baseEndpoint, rawQuery) {
>   if (!baseEndpoint || typeof rawQuery !== "string") return baseEndpoint;
>
>   const encodedQuery = encodeURIComponent(rawQuery);
>   const separator = baseEndpoint.includes("?") ? "&" : "?";
>
>   return `${baseEndpoint}${separator}query=${encodedQuery}`;
> }
>
> // Verification tests
> const uri1 = buildSearchUri("https://api.com/items", "react & vue");
> console.assert(uri1 === "https://api.com/items?query=react%20%26%20vue", "Test 1 Failed");
>
> const uri2 = buildSearchUri("https://api.com/items?cat=tech", "100%");
> console.assert(uri2 === "https://api.com/items?cat=tech&query=100%25", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Percent-Encoding**: Replaces non-ASCII or reserved URI characters with % followed by 2 hex digits (e.g. space = %20, & = %26).
> 2. **encodeURI vs encodeURIComponent**: encodeURI leaves URI structure chars (?, &, /, #) intact; encodeURIComponent encodes ALL special characters.
> 3. **URI Injection Prevention**: Encoding parameters prevents malicious users from injecting arbitrary query parameters.
> 
---

### Exercise 3: Relative URI to Absolute URL Resolver

**Scenario:** A web crawler resolves relative links found on a page into absolute URLs relative to the page's base URL.

**Requirements:**
1. Write resolveAbsoluteUrl(relativeLink, baseUrl).
2. Use new URL(relativeLink, baseUrl).
3. Return absolute URL string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveAbsoluteUrl(relativeLink, baseUrl) {
>   try {
>     const resolved = new URL(relativeLink, baseUrl);
>     return resolved.toString();
>   } catch (err) {
>     return null;
>   }
> }
>
> // Verification tests
> const base = "https://example.com/blog/posts/article-1";
>
> console.assert(
>   resolveAbsoluteUrl("image.png", base) === "https://example.com/blog/posts/image.png",
>   "Test 1 Failed: Relative path"
> );
>
> console.assert(
>   resolveAbsoluteUrl("/about", base) === "https://example.com/about",
>   "Test 2 Failed: Absolute path relative to host"
> );
>
> console.assert(
>   resolveAbsoluteUrl("../authors", base) === "https://example.com/blog/authors",
>   "Test 3 Failed: Parent directory traversal"
> );
> ```
>
> #### Technical Explanation
>
> 1. **URL Resolution Algorithm**: The URL constructor resolves relative paths, root paths (/), and parent paths (../) against base URLs.
> 2. **URI vs URL vs URN**: URI (Identifier) is the superclass; URL (Locator) specifies HOW to reach resource; URN (Name) specifies name.
> 3. **Robust Crawler Resolution**: Prevents broken links when fetching assets from different relative directory levels.
---

## 6. Related Terms
- [Query Parameters & Path Variables](../level_02/query_params.md) — How we pass dynamic data directly inside the URL.
- [DNS (Domain Name System)](dns.md) — Related concept: DNS (Domain Name System).

---

## 7. Key Takeaways
- **URL (Uniform Resource Locator)** is the digital address of a file or data point.
- It consists of a Protocol, a Domain, a Path, and optional Query Parameters.
- Never hardcode `localhost` URLs in frontend code that you plan to deploy to the public internet!
