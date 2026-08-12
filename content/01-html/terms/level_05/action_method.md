# `action` & `method` Attributes

> **Level 5 — Forms & User Input**
> The two fundamental attributes of a `<form>` tag that control where the user's data is sent (action) and how it is transmitted (method).

---

## 1. Prerequisites
- [`<form>`](form.md) — The form tag containing these attributes.
- [URL (Uniform Resource Locator)](../level_01/url.md) — The address standard used to locate destination pages.

---

## 2. Term Category

**Attribute (Universal Browser Support .)**: `action` & `method` Attributes is a fundamental concept in this technology stack. **Level 5 — Forms & User Input**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A `<form>` is designed to collect data from a user. But once that data is collected, it needs to travel to a web server to be processed (e.g., checking credentials, saving an order, or running a search).

To make this happen, the browser needs two pieces of information:
1.  **Where do we send the data?** (The **`action`** attribute)
2.  **How do we package and send the data?** (The **`method`** attribute)

Without these two attributes, the browser will not know how to forward the user's inputs, rendering the form useless.

---

### (2) The `action` Attribute
The `action` attribute specifies the URL of the server-side page or API endpoint that will process the submitted form data.
-   **Relative Path:** `action="/login"` (sends data to the same website).
-   **Absolute URL:** `action="https://api.example.com/register"` (sends data to a different server).

If you leave the `action` attribute blank, the browser defaults to reloading the current page, submitting the data to itself.

---

### (3) The `method` Attribute (GET vs. POST)
The `method` attribute determines the HTTP protocol verb used to send the data. There are two primary options:

| Feature | GET Method | POST Method |
| :--- | :--- | :--- |
| **Data Location** | Appended directly to the URL as a query string | Wrapped invisibly inside the HTTP request body |
| **URL Example** | `/search?q=shoes&sort=price` | `/login` (data is not visible in the URL bar) |
| **Visibility** | **Publicly visible** in the URL, browser history, and logs | **Hidden** from the URL bar |
| **Payload Size** | Restricted (max ~2000 characters depending on browser) | Unlimited |
| **Bookmarking** | Yes (excellent for search results pages) | No |
| **Use Case** | Search queries, filters, page jumps (safe, non-modifying reads) | Logins, signups, transactions, file uploads (writes) |

---

### (4) Code Examples

#### Short Snippet
Comparing GET and POST form definitions:

```html
<!-- GET form: query string will show in the URL -->
<form action="/search" method="GET">
  <input type="text" name="query">
</form>

<!-- POST form: payload is sent inside request body -->
<form action="/login" method="POST">
  <input type="password" name="password">
</form>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GET and POST Demos</title>
</head>
<body>

  <h1>Form Submission Examples</h1>

  <h2>1. Search Form (GET)</h2>
  <!-- GET is perfect here because users can bookmark their search results! -->
  <form action="https://google.com/search" method="GET">
    <label for="q">Google Search:</label>
    <input type="text" id="q" name="q">
    <button type="submit">Search</button>
  </form>

  <hr>

  <h2>2. Registration Form (POST)</h2>
  <!-- POST is required here because passwords are sensitive and cannot go in the URL! -->
  <form action="/register" method="POST">
    <p>
      <label for="user">Username:</label>
      <input type="text" id="user" name="username">
    </p>
    <p>
      <label for="pwd">Password:</label>
      <input type="password" id="pwd" name="pwd">
    </p>
    <button type="submit">Create Account</button>
  </form>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Submitting passwords or credit card data using GET

**The mistake:** Setting `method="GET"` (or leaving off the method, which defaults to GET) on a form with sensitive data:

```html
<!-- BAD: User's password will appear in their browser history and logs! -->
<form action="/login"> 
  <input type="password" name="user_password">
</form>
```

**Why it's wrong:** If a user logs in, their password will literally append to the URL: `/login?user_password=secret123`. Anyone looking over their shoulder, inspecting browser history, or checking server log files can see their raw credentials.

**Golden Rule:** Never use GET for forms that collect passwords, tokens, personal identification, or financial details. Always use POST.

---



### Mistake 2: Using `GET` Method for Submitting Sensitive Form Data (Passwords / Secrets)

**The mistake:** Submitting login/registration forms via `<form method="GET" action="/login">`.

**Why it's wrong:** The `GET` method appends all form field name-value pairs directly onto the URL query string (`/login?password=secret`), exposing passwords in browser history, server logs, and referrer headers. Use `method="POST"`.

*Incorrect:*
```html
<form method="GET" action="/login"> <!-- ❌ Appends password to URL query string! -->
```

*Fix:*
```html
<form method="POST" action="/login"> <!-- Encapsulates payload in HTTP body -->
```

### Mistake 3: Omitting `enctype="multipart/form-data"` on File Upload Forms

**The mistake:** Creating a file upload form `<form method="POST" action="/upload">` with `<input type="file">` omitting `enctype`.

**Why it's wrong:** Without `enctype="multipart/form-data"`, browsers transmit only the string filename of the file instead of the actual file binary contents. File uploads will fail.

*Incorrect:*
```html
<form method="POST" action="/upload">
  <input type="file" name="avatar"> <!-- ❌ Transmits string filename only! -->
</form>
```

*Fix:*
```html
<form method="POST" action="/upload" enctype="multipart/form-data">
  <input type="file" name="avatar">
</form>
```

## 5. Practice Exercises

### Exercise 1: Secure User Authentication Login Form

**Scenario:** An author constructs a secure login form using `method="post"` and a HTTPS destination URL in the `action` attribute.

**Requirements:**
1. Create a `<form>` tag with `action="/api/v1/login"` and `method="post"`.
2. Include labeled inputs for email and password.
3. Include a submit button.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <form action="/api/v1/login" method="post" class="login-form">
>   <h2>Account Sign-In</h2>
>
>   <div class="form-group">
>     <label for="login-email">Email Address</label>
>     <input type="email" id="login-email" name="email" required autocomplete="email">
>   </div>
>
>   <div class="form-group">
>     <label for="login-password">Password</label>
>     <input type="password" id="login-password" name="password" required autocomplete="current-password">
>   </div>
>
>   <button type="submit" class="btn-primary">Sign In</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **The `method="post"` Attribute**: HTTP POST submits form payload data in the HTTP request body rather than the URL, essential for sensitive credentials.
> 2. **The `action` Attribute**: Specifies the endpoint URL where submitted form data is processed.
> 3. **Security Best Practice**: Never use `method="get"` for login forms, as passwords would be exposed in browser history and server access logs.
> 
---

### Exercise 2: Site Search Query Form with GET Method

**Scenario:** A developer builds a site-wide search bar using `method="get"` so search results URLs can be bookmarked and shared.

**Requirements:**
1. Set `action="/search"` and `method="get"`.
2. Include a search input with `name="q"`.
3. Add an explicit label.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <form action="/search" method="get" role="search" class="search-form">
>   <label for="site-search">Search Portal</label>
>   <input type="search" id="site-search" name="q" placeholder="Search articles..." required>
>   <button type="submit">Search</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **The `method="get"` Attribute**: HTTP GET appends form input name/value pairs to the URL as a query string (e.g. `/search?q=accessibility`).
> 2. **URL Shareability**: GET requests allow users to bookmark, share, and refresh search result pages directly.
> 3. **Search Role (`role="search"`)**: Provides landmark role accessibility so screen readers can jump directly to the search form.
> 
---

### Exercise 3: File Upload Form with Multipart Encoding

**Scenario:** Constructs a user profile avatar upload form requiring `enctype="multipart/form-data"`.

**Requirements:**
1. Set `method="post"`.
2. Set `enctype="multipart/form-data"`.
3. Include an `<input type="file">`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <form action="/api/v1/avatar" method="post" enctype="multipart/form-data" class="upload-form">
>   <label for="avatar-file">Upload Profile Avatar (JPG or PNG)</label>
>   <input type="file" id="avatar-file" name="avatar" accept="image/png, image/jpeg" required>
>   <button type="submit">Upload Image</button>
> </form>
> ```
>
> #### Technical Explanation
>
> 1. **Multipart Encoding (`enctype`)**: Required when uploading binary files (`<input type="file">`) via POST requests.
> 2. **Default Encoding**: Default `application/x-www-form-urlencoded` cannot transfer binary file streams.
> 3. **Accept Constraint (`accept`)**: Restricts file picker options to specified MIME image types.
## 6. Related Terms
- [`<form>`](form.md) — The parent container wrapper.
- [`<button>`](button.md) — The button element which acts as the submission trigger.

---

## 7. Key Takeaways
- The `action` attribute specifies the URL destination for the form data package.
- The `method` attribute defines the HTTP verb (GET or POST) used to transmit the data.
- GET appends data to the URL query string (insecure, limited size, bookmarkable).
- POST packages data inside the HTTP request body (secure, unlimited size, not bookmarkable).
- Forms default to GET if the `method` attribute is omitted.
