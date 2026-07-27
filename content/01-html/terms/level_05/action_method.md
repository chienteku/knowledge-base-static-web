# `action` & `method` Attributes

> **Level 5 — Forms & User Input**
> The two fundamental attributes of a `<form>` tag that control where the user's data is sent (action) and how it is transmitted (method).

---

## 1. Prerequisites
- [`<form>`](../level_05/form.md) — The form tag containing these attributes.
- [URL (Uniform Resource Locator)](../level_01/url.md) — The address standard used to locate destination pages.

---

## 2. Term Category
- **Attribute**

---

## 3. Environment Context
- **Universal Browser Support** (Supported natively by all browsers since early HTML specs. The foundational data transfer mechanism of the web).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Method Selection

**Problem:** Choose the correct `method` (`GET` or `POST`) for each of the following scenarios:
1.  A user is searching for flights on a travel website.
2.  A user is updating their profile email address.
3.  A user is submitting a credit card payment.
4.  A user is filtering a list of shirts by color (red, blue).

**Expected output:**
```text
1. GET (Search filters should be shareable and bookmarkable)
2. POST (Changing profile details modifies database records)
3. POST (Financial transaction requires data security and payload size)
4. GET (Filters can be bookmarked)
```

> [!check]- Answer
> - If bookmarking the resulting page is useful, choose GET.
> - If data changes a database state or contains private details, choose POST.

---



### Exercise 2: GET vs POST Method Selection Matrix

**Problem:** Select `GET` or `POST` method for:
1. Search input filtering (`GET`)
2. User registration form (`POST`)
3. Contact us message submission (`POST`)
4. Pagination page switching (`GET`)

**Expected output:**
```text
1. GET
2. POST
3. POST
4. GET
```

> [!check]- Answer
> ```text
> 1. GET (idempotent search query parameter)
> 2. POST (secure data creation payload)
> 3. POST (form submission action)
> 4. GET (idempotent page navigation)
> ```
>
> **Explanation:** Use `GET` for safe, bookmarkable read queries; use `POST` for state mutations and sensitive data.

### Exercise 3: Default Form Action and Method

**Problem:** What are default values for `action` and `method` attributes if omitted on `<form>`?

**Expected output:**
```text
action defaults to current page URL; method defaults to GET.
```

> [!check]- Answer
> ```text
> action defaults to current page URL; method defaults to GET.
> ```
>
> **Explanation:** Omitted form attributes target current page with GET requests by default.

## 7. Related Terms
- [`<form>`](../level_05/form.md) — The parent container wrapper.
- [`<button>`](../level_05/button.md) — The button element which acts as the submission trigger.

---

## 8. Key Takeaways
- The `action` attribute specifies the URL destination for the form data package.
- The `method` attribute defines the HTTP verb (GET or POST) used to transmit the data.
- GET appends data to the URL query string (insecure, limited size, bookmarkable).
- POST packages data inside the HTTP request body (secure, unlimited size, not bookmarkable).
- Forms default to GET if the `method` attribute is omitted.
