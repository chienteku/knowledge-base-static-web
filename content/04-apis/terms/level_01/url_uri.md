# URL / URI (Uniform Resource Identifier)

> **Level 1 — The Foundations of the Web**
> The string of characters used to identify and locate a specific resource (like a webpage, image, or API data) on the internet.

---

## 1. Prerequisites
- [HTTP / HTTPS](http_https.md) — URLs almost always start with this protocol.

---

## 2. Term Category
- **Web Standard / Locator**

---

## 3. Environment Context
- **Universal Standard**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Break it down

**Problem:** Identify the Protocol, the Domain, and the Path in this URL: `http://localhost:8080/images/cat.jpg`

**Expected output:**
> [!check]- Answer
> ```text
> Protocol: http://
> Domain: localhost:8080 (the host and the port!)
> Path: /images/cat.jpg
> ```
> - The protocol comes before the `://`.
> - The domain is everything up to the first single slash `/`.

---

### Exercise 2: URL Structure Breakdown

**Problem:** Deconstruct URL components for `https://user:pass@api.example.com:8080/v1/items?page=2#section`:
1. Scheme/Protocol
2. Hostname
3. Port
4. Path
5. Query Parameters

**Expected output:**
> [!check]- Answer
> ```text
> 1. Scheme: https
> 2. Hostname: api.example.com
> 3. Port: 8080
> 4. Path: /v1/items
> 5. Query Params: page=2
> ```
> ```text
> Scheme: https
> Hostname: api.example.com
> Port: 8080
> Path: /v1/items
> Query: page=2
> Fragment: #section
> ```
> - **Explanation:** URLs consist of protocol, authorization, host, port, path, query, and fragment.
---

### Exercise 3: URI vs URL Relationship

**Problem:** True or False: All URLs are URIs, but not all URIs are URLs.

**Expected output:**
> [!check]- Answer
> ```text
> True. URI is the umbrella category containing both URLs and URNs.
> ```
> ```text
> True. URI is the umbrella category containing both URLs and URNs.
> ```
> - **Explanation:** URL and URN are both specific subsets of URIs.
---

## 7. Related Terms
- [Query Parameters & Path Variables](../level_02/query_params.md) — How we pass dynamic data directly inside the URL.
- [DNS (Domain Name System)](dns.md) — Related concept: DNS (Domain Name System).

---

## 8. Key Takeaways
- **URL (Uniform Resource Locator)** is the digital address of a file or data point.
- It consists of a Protocol, a Domain, a Path, and optional Query Parameters.
- Never hardcode `localhost` URLs in frontend code that you plan to deploy to the public internet!
