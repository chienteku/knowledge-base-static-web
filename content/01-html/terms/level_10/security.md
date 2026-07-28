# Content Security Policy (CSP) & HTML Security

> **Level 10 — Canvas, SVG & Storage**
> A suite of browser security mechanisms—including Content Security Policy metadata, iframe sandboxes, subresource integrity hashes, and text escaping—used to protect web applications against Cross-Site Scripting (XSS) and code injection attacks.

---

## 1. Prerequisites
- [`<script>`](../level_08/script.md) — The script loading tag that carries security risks.
- [`<iframe>`](../level_03/iframe.md) — The frame element containing external websites.
- [HTML Entities](../level_09/html_entities.md) — The escaping syntax used to neutralize input strings.

---

## 2. Term Category
- **Concept / Security Architecture**

---

## 3. Environment Context
- **Web Browser Security** (Supported natively by modern browsers. Executed as security interceptors during the asset downloading and execution stages of the rendering pipeline).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Webpages are vulnerable to malicious attacks. The most common threat is **Cross-Site Scripting (XSS)**. 

XSS occurs when a hacker successfully injects malicious JavaScript code into your webpage. For example, if you build a comment section on your blog, and you print user comments directly to the page without checking them, a hacker could write:

```html
<script>
  // Malicious code that steals user passwords or session tokens 
  // and sends them to the hacker's server!
  sendToHacker(localStorage.getItem('session_token'));
</script>
```

When another user loads the page, their browser reads that script and executes it immediately, stealing their private data.

To prevent these attacks, browsers and web standard committees developed a series of HTML attributes and metadata instructions to create a defense-in-depth security layer.

---

### (2) Key Security Defenses

#### 1. Input Escaping (Neutralization)
Never print raw user text directly onto a page. Always escape characters like `<` and `>` using [HTML Entities](../level_09/html_entities.md) (`&lt;` and `&gt;`). This makes the script inert: the browser displays the literal text `<script>` on screen instead of running it.

#### 2. Content Security Policy (CSP)
CSP is a set of rules that tells the browser exactly which servers are trusted to load resources (scripts, styles, images) for your page. 

You can declare a CSP in your HTML using a `<meta>` tag inside the `<head>`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://apis.google.com;">
```
This policy tells the browser:
-   `default-src 'self'`: Only load resources that live on my own server.
-   `script-src 'self' https://apis.google.com`: Only execute script files loaded from my server or Google's API server.
-   **Critical Rule:** CSP automatically blocks **any inline scripts** (like `<script>alert(1)</script>`) and any script files loaded from unapproved websites.

#### 3. Iframe Sandboxing (`sandbox`)
When nesting external websites inside an `<iframe>`, you should restrict their capabilities. Adding the **`sandbox`** attribute acts as a child-lock:
```html
<!-- Restricts script execution, form submissions, and popups by default -->
<iframe src="https://thirdparty.com" sandbox></iframe>
```
To selectively allow features, add specific flags (e.g. `sandbox="allow-scripts allow-forms"`).

#### 4. Subresource Integrity (SRI)
When loading libraries (like Bootstrap or jQuery) from public Content Delivery Networks (CDNs), there is a risk that hackers could hijack the CDN and replace the library with malicious code. 

SRI uses a cryptographic hash (`integrity` attribute) to verify that the file downloaded is exactly the file you expected:
```html
<script src="https://cdn.com/jquery.js" integrity="sha384-H+K7U5..." crossorigin="anonymous"></script>
```
If the file content shifts by even a single character, the cryptographic hash fails, and the browser refuses to load the script.

---

### (3) Code Examples

#### Insecure Page (Vulnerable to XSS)
```html
<head>
  <title>Insecure Site</title>
</head>
<body>
  <!-- If 'userInput' is "<script>badCode()</script>", it will execute! -->
  <div id="comment-box">
    <%= userInput %> 
  </div>
</body>
```

#### Secured Page (Protected against XSS)
```html
<head>
  <meta charset="UTF-8">
  <title>Secure Site</title>
  
  <!-- 1. Enforce strict Content Security Policy -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' https://images.unsplash.com;">
</head>
<body>

  <!-- 2. Secure Iframe: sandboxed to prevent form submissions and window popups -->
  <iframe src="https://untrusted-ad.com" sandbox="allow-scripts"></iframe>

  <!-- 3. Secure CDN Script: locked using Subresource Integrity (SRI) -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js" 
          integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" 
          crossorigin="anonymous">
  </script>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using CSP `unsafe-inline` without constraint

**The mistake:** Setting up a CSP policy but using the `'unsafe-inline'` rule to make development easier:

```html
<!-- BAD: Disables the main protective feature of Content Security Policies! -->
<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';">
```

**Why it's wrong:** The `'unsafe-inline'` directive allows inline script blocks to execute. This means if a hacker successfully injects a `<script>` tag into your site, the browser will execute it, bypassing the core security check of CSP.

---



### Mistake 2: Rendering Un-Sanitized User Input Directly into HTML (`innerHTML` / XSS Vulnerability)

**The mistake:** Writing `element.innerHTML = req.query.userInput` in JavaScript.

**Why it's wrong:** Injecting un-sanitized user input into `innerHTML` allows attackers to embed malicious `<script>` tags or `onload` image handlers (Cross-Site Scripting / XSS). Use `textContent`.

*Incorrect:*
```html
div.innerHTML = userInput; // ❌ Vulnerable to DOM XSS attacks!
```

*Fix:*
```html
div.textContent = userInput; // Safe text-only assignment
```

### Mistake 3: Omitting Content Security Policy (CSP) Headers or Meta Tags

**The mistake:** Deploying web apps without Content Security Policy (CSP) restriction headers.

**Why it's wrong:** Without CSP headers, compromised third-party scripts can execute inline code and send stolen cookies to unauthorized external servers. Use `<meta http-equiv="Content-Security-Policy">`.

*Incorrect:*
```html
<!-- Missing Content-Security-Policy headers -->
```

*Fix:*
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
```



### Mistake 4: Rendering Un-Sanitized User Input Directly into HTML (`innerHTML` / XSS Vulnerability)

**The mistake:** Writing `element.innerHTML = req.query.userInput` in JavaScript.

**Why it's wrong:** Injecting un-sanitized user input into `innerHTML` allows attackers to embed malicious `<script>` tags or `onload` image handlers (Cross-Site Scripting / XSS). Use `textContent`.

*Incorrect:*
```html
div.innerHTML = userInput; // ❌ Vulnerable to DOM XSS attacks!
```

*Fix:*
```html
div.textContent = userInput; // Safe text-only assignment
```

### Mistake 5: Omitting Content Security Policy (CSP) Headers or Meta Tags

**The mistake:** Deploying web apps without Content Security Policy (CSP) restriction headers.

**Why it's wrong:** Without CSP headers, compromised third-party scripts can execute inline code and send stolen cookies to unauthorized external servers. Use `<meta http-equiv="Content-Security-Policy">`.

*Incorrect:*
```html
<!-- Missing Content-Security-Policy headers -->
```

*Fix:*
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
```



### Mistake 6: Rendering Un-Sanitized User Input Directly into HTML (`innerHTML` / XSS Vulnerability)

**The mistake:** Writing `element.innerHTML = req.query.userInput` in JavaScript.

**Why it's wrong:** Injecting un-sanitized user input into `innerHTML` allows attackers to embed malicious `<script>` tags or `onload` image handlers (Cross-Site Scripting / XSS). Use `textContent`.

*Incorrect:*
```html
div.innerHTML = userInput; // ❌ Vulnerable to DOM XSS attacks!
```

*Fix:*
```html
div.textContent = userInput; // Safe text-only assignment
```

### Mistake 7: Omitting Content Security Policy (CSP) Headers or Meta Tags

**The mistake:** Deploying web apps without Content Security Policy (CSP) restriction headers.

**Why it's wrong:** Without CSP headers, compromised third-party scripts can execute inline code and send stolen cookies to unauthorized external servers. Use `<meta http-equiv="Content-Security-Policy">`.

*Incorrect:*
```html
<!-- Missing Content-Security-Policy headers -->
```

*Fix:*
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
```

## 6. Practice Exercises

### Exercise 1: Secure Tag Constructor

**Problem:** You are importing a styling framework from `https://cdn.styles.com/theme.css`. The developer documentation lists the file's SHA384 security hash as `abc123xyz...`. Write the secure HTML `<link>` tag including the required attributes to verify file integrity.

**Expected output:**
> [!check]- Answer
> ```html
> <link rel="stylesheet" href="https://cdn.styles.com/theme.css" integrity="sha384-abc123xyz..." crossorigin="anonymous">
> ```
> - Use the `integrity` attribute containing the type prefix `sha384-`.
> - Include the `crossorigin="anonymous"` attribute (SRI checks require cross-origin attributes to prevent CORS blockage).

---



### Exercise 2: Sanitizing User HTML Output

**Problem:** Which DOM property safely sets plain text without risk of XSS HTML injection (`innerHTML` or `textContent`)?

**Expected output:**
> [!check]- Answer
> ```text
> textContent
> ```
> ```javascript
> element.textContent = userInput;
> ```
>
> **Explanation:** `textContent` escapes HTML entity tags automatically, preventing XSS script execution.

---

### Exercise 3: Clickjacking Protection Header

**Problem:** Which HTTP security header prevents unauthorized sites from embedding your page inside malicious `<iframe` frames?

**Expected output:**
> [!check]- Answer
> ```text
> X-Frame-Options: DENY (or SAMEORIGIN) / CSP frame-ancestors.
> ```
> ```text
> X-Frame-Options: DENY (or SAMEORIGIN) / CSP frame-ancestors.
> ```
>
> **Explanation:** `X-Frame-Options` blocks Clickjacking iframe embedding attacks.

## 7. Related Terms
- [`<noscript>`](../level_08/noscript.md) — Fallbacks displayed when scripting is turned off.
- [Web Storage (Local/Session Storage)](../level_10/web_storage.md) — Storage blocks vulnerable to XSS data theft.

---

## 8. Key Takeaways
- Content Security Policy (CSP) restricts what resources browsers are allowed to download and execute.
- Always escape input strings (converting `<` to `&lt;`) to prevent raw HTML code injections.
- Use the `sandbox` attribute on `<iframe>` to lock down untrusted third-party embeds.
- Subresource Integrity (SRI) hashes prevent modified CDN files from executing on your site.
- Avoid using `'unsafe-inline'` in your Content Security Policy to keep scripts secure.
