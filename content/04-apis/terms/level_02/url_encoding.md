# URL Encoding (Percent-Encoding)

> **Level 2 — HTTP Anatomy**
> Escaping unsafe characters in query strings and paths.

---

## 1. Prerequisites
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — The string structure describing resource locations.
- [Query Parameters & Path Variables](query_params.md) — The parameters appended to URL query strings.

---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Universal**: Executed inside browsers and server HTTP routing systems.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
URLs are restricted to a small subset of the US-ASCII character set—primarily alphanumeric characters (`a-z`, `A-Z`, `0-9`) and a few safe symbols (like `-`, `_`, `.`, `~`). 

However, users frequently search for terms containing spaces, ampersands, or non-English characters (e.g. searching for `"shoes & socks"` or query inputs like `"カフェ"`).

If you place these special characters directly into a URL (for example: `http://api.com/search?q=shoes & socks`), the network parser gets confused. In a URL, the `&` symbol is a **reserved delimiter** used to separate query parameters. The browser will parse this request as search query `q=shoes` and a separate parameter named `socks` instead of a single string query `"shoes & socks"`.

To transmit unsafe characters safely, HTTP utilizes **URL Encoding** (also known as **Percent-Encoding**):
- It replaces unsafe or reserved characters with a `%` symbol followed by two hexadecimal digits representing the character's UTF-8 byte value.
- **Common Percent Encodings:**
  - Space (` `) becomes `%20` (or `+` inside query strings).
  - Ampersand (`&`) becomes `%26`.
  - Equals (`=`) becomes `%3D`.
  - Percent (`%`) becomes `%25`.

### (2) Built-in JavaScript Methods

#### `encodeURIComponent(string)`
Encodes all special, reserved, and non-ASCII characters. Use this to encode individual **query parameter values** or path segments.

#### `encodeURI(string)`
Only encodes characters that are completely invalid in any part of a URL (like spaces or Unicode), leaving valid URL structural characters (like `:`, `/`, `?`, `&`, `=`) untouched. Use this to encode a **complete, pre-built URL**.

### (3) Reality Metaphor
- A **raw URL string** is like carrying **volatile chemicals** (unsafe special characters) in open glass cups on a bumpy bus ride. They spill, mix, and trigger false alarms.
- **URL Encoding** is like packing those chemicals into **standardized, sealed plastic shipping crates** labeled with cargo codes (like `%26` or `%20`). The bus driver and inspectors (routers and proxy servers) see only safe standard packages and ship them along without worry. When the shipment arrives at the server, the receiver unpacks the crates (**decodes**) to retrieve the chemicals.

### (4) JavaScript Code Examples

#### Creating a Safe Query String using `encodeURIComponent`
```javascript
const query = "shoes & socks";

// 1. Unsafe way leads to broken query parsing
const unsafeUrl = `/api/search?q=${query}`;
console.log(unsafeUrl); // "/api/search?q=shoes & socks" (Server reads parameter: socks!)

// 2. Safe way encodes special characters
const safeUrl = `/api/search?q=${encodeURIComponent(query)}`;
console.log(safeUrl); // "/api/search?q=shoes%20%26%20socks" (Server reads query value: "shoes & socks")
```

#### Comparing `encodeURI` vs. `encodeURIComponent`
```javascript
const completeUrl = "http://example.com/search profile?name=John Doe&id=5";

// encodeURI leaves structural characters intact (e.g. :, /, ?, &)
console.log(encodeURI(completeUrl));
// "http://example.com/search%20profile?name=John%20Doe&id=5" (Safe!)

// encodeURIComponent encodes everything, ruining the URL structure
console.log(encodeURIComponent(completeUrl));
// "http%3A%2F%2Fexample.com%2Fsearch%20profile%3Fname%3DJohn%20Doe%26id%3D5" (Unusable as a link!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `encodeURI()` to escape individual query parameter values

**The mistake:** Escaping a query parameter containing slashes or ampersands using `encodeURI()`.

**Why it's wrong:** `encodeURI()` assumes it is processing a full URL, so it deliberately leaves structural characters like `/` and `&` unescaped. If your parameter values contain these characters, the server will misinterpret the query parameters.

*Incorrect:*
```javascript
const category = "books/fiction & biography";
const url = `/api/products?cat=${encodeURI(category)}`;
console.log(url); 
// "/api/products?cat=books/fiction & biography" (Slashes and ampersands remained!)
```

*Fix:* Use `encodeURIComponent()` for values.
```javascript
const url = `/api/products?cat=${encodeURIComponent(category)}`;
console.log(url); 
// "/api/products?cat=books%2Ffiction%20%26%20biography" (Correctly escaped!)
```

---

### Mistake 2: Using `encodeURI()` Instead of `encodeURIComponent()` for Query Parameter Values

**The mistake:** Encoding query values containing `&` or `=` using `encodeURI()`. 

**Why it's wrong:** `encodeURI()` preserves special URL delimiter characters (`/`, `?`, `&`, `#`, `=`). Use `encodeURIComponent()` to escape characters inside parameter key-value pairs.

*Incorrect:*
```javascript
const tag = 'news&updates';
const url = 'https://api.com/search?tag=' + encodeURI(tag); // ❌ Preserves & symbol, breaking query parsing!
```

*Fix:*
```javascript
const tag = 'news&updates';
const url = 'https://api.com/search?tag=' + encodeURIComponent(tag); // Safely converts & to %26
```

---

### Mistake 3: Double URL Encoding String Parameters

**The mistake:** Calling `encodeURIComponent()` twice on the same input string before sending an API request.

**Why it's wrong:** Double encoding converts `%20` into `%2520`, causing backend decoders to receive literal `%20` strings instead of spaces.

*Incorrect:*
```javascript
const param = encodeURIComponent(encodeURIComponent('hello world')); // ❌ Converts to 'hello%2520world'
```

*Fix:*
```javascript
const param = encodeURIComponent('hello world'); // Converts to 'hello%20world'
```


---

## 6. Practice Exercises

### Exercise 1: URL Encoder

**Problem:** Complete the function `buildSearchUrl` to return a fully URL-encoded search query path using JavaScript helper functions.

```javascript
function buildSearchUrl(baseURL, searchTerm) {
  // Return the complete safe URL path
}

const target = buildSearchUrl("/search", "Node.js & Express");
console.log("Encoded Path:", target);
```

**Expected output:**
> [!check]- Answer
> ```text
> Encoded Path: /search?q=Node.js%20%26%20Express
> ```
> - Inside the function, return `baseURL + "?q=" + encodeURIComponent(searchTerm)`.

---

### Exercise 2: Percent-Encoding Character Map

**Problem:** Identify the percent-encoded ASCII representations for:
1. Space ` `
2. Ampersand `&` 
3. Equals `=` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. %20 (or +)
> 2. %26
> 3. %3D
> ```
> ```text
> 1. Space -> %20 (or +)
> 2. Ampersand -> %26
> 3. Equals -> %3D
> ```
> - **Explanation:** Percent-encoding replaces reserved ASCII characters with `%HEX` equivalents.
---

### Exercise 3: encodeURI vs encodeURIComponent Choice

**Problem:** Which function should be used to encode an entire complete URL string vs an individual query parameter value?

**Expected output:**
> [!check]- Answer
> ```text
> Use encodeURI() for complete URLs; use encodeURIComponent() for individual query parameter values.
> ```
> ```javascript
> // Complete URL:
> const fullUrl = encodeURI('https://example.com/my page.html');
> // Parameter value:
> const paramUrl = 'https://example.com/search?q=' + encodeURIComponent('salt & pepper');
> ```
> - **Explanation:** `encodeURI` preserves valid URL structural syntax; `encodeURIComponent` escapes all delimiters.
---

## 7. Related Terms
- [Query Parameters & Path Variables](query_params.md) — The URL data inputs escaped by percent-encoding.
- [Request Body & Payloads](request_body.md) — Un-encoded data payloads that do not require URL character escaping.

---

## 8. Key Takeaways
- URL Encoding (Percent-Encoding) replaces non-ASCII and reserved delimiter characters with hexadecimal byte codes.
- It prevents special characters (like `&`, `=`, `?`) from breaking URL structure parsing.
- Use `encodeURIComponent()` to escape individual query parameter values or path variables.
- Use `encodeURI()` only to escape complete, pre-built URL string targets.
- Decode values back to plain text on the server using `decodeURIComponent()`.
