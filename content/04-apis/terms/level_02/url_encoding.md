# URL Encoding (Percent-Encoding)

> **Level 2 — HTTP Anatomy**
> Escaping unsafe characters in query strings and paths.

---

## 1. Prerequisites
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — The string structure describing resource locations.
- [Query Parameters & Path Variables](query_params.md) — The parameters appended to URL query strings.

---

## 2. Term Category

**Data Format (Universal: Executed inside browsers and server HTTP routing systems.)**: URL Encoding (Percent-Encoding) is a fundamental concept in this technology stack. **Level 2 — HTTP Anatomy**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Safe Query Parameter Encoding Utility

**Scenario:** An API client implements a query parameter encoding function using `encodeURIComponent()` to prevent URL syntax breakage.

**Requirements:**
1. Write encodeQueryParam(key, val).
2. Encode key and val.
3. Return `encodedKey=encodedVal`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function encodeQueryParam(key, val) {
>   if (key === null || key === undefined) return "";
>   const k = encodeURIComponent(String(key));
>   const v = encodeURIComponent(String(val ?? ""));
>   return `${k}=${v}`;
> }
>
> // Verification tests
> console.assert(encodeQueryParam("search", "hello world") === "search=hello%20world", "Test 1 Failed");
> console.assert(encodeQueryParam("price", "$100 & up") === "price=%24100%20%26%20up", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Percent-Encoding Syntax**: Replaces reserved characters with % followed by 2 hexadecimal digits (space = %20, & = %26, $ = %24).
> 2. **encodeURIComponent Purpose**: Encodes special characters that carry structural meaning in URLs (?, &, =, #, /).
> 3. **URL Syntax Protection**: Prevents user inputs containing & or = from splitting into unintended extra query parameters.
> 
---

### Exercise 2: Percent-Decoding Form Parameter Extractor

**Scenario:** A server request parser decodes percent-encoded form parameter strings safely using `decodeURIComponent()`.

**Requirements:**
1. Write decodeQueryValue(encodedStr).
2. Replace + with space.
3. Decode using decodeURIComponent().

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function decodeQueryValue(encodedStr) {
>   if (!encodedStr || typeof encodedStr !== "string") return "";
>   try {
>     // Replace + with space (application/x-www-form-urlencoded convention)
>     const normalized = encodedStr.replace(/\+/g, "%20");
>     return decodeURIComponent(normalized);
>   } catch (err) {
>     return encodedStr;
>   }
> }
>
> // Verification tests
> console.assert(decodeQueryValue("hello%20world") === "hello world", "Test 1 Failed");
> console.assert(decodeQueryValue("hello+world") === "hello world", "Test 2 Failed: + should decode to space");
> console.assert(decodeQueryValue("%24100") === "$100", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **decodeURIComponent Method**: Converts percent-encoded sequences (%20) back into original UTF-8 characters.
> 2. **Plus (+) to Space Conversion**: In form-urlencoded query strings, spaces are encoded as +; in standard percent-encoding as %20.
> 3. **URIError Handling**: Malformed percent sequences (e.g. %ZZ) throw URIError; try...catch prevents crashes.
> 
---

### Exercise 3: Double Percent-Encoding Sanitizer

**Scenario:** A security gateway detects and fixes double percent-encoded URLs (e.g. `%2520` instead of `%20`) to prevent security filter evasion.

**Requirements:**
1. Write fixDoubleEncoding(urlStr).
2. Detect `%25` sequences.
3. Decode double-encoded percent signs.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function fixDoubleEncoding(urlStr) {
>   if (!urlStr || typeof urlStr !== "string") return urlStr;
>
>   // %25 is the percent-encoded representation of the % symbol itself
>   if (/%25[0-9a-fA-F]{2}/.test(urlStr)) {
>     return urlStr.replace(/%25([0-9a-fA-F]{2})/g, "%$1");
>   }
>
>   return urlStr;
> }
>
> // Verification tests
> const doubleEncoded = "https://api.com/search?q=hello%2520world";
> const fixed = fixDoubleEncoding(doubleEncoded);
>
> console.assert(fixed === "https://api.com/search?q=hello%20world", "Test 1 Failed");
> console.assert(fixDoubleEncoding("https://api.com/search?q=hello%20world") === "https://api.com/search?q=hello%20world", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Double Encoding Security Risk**: Attackers double-encode characters (%252E for .) to bypass web application firewall (WAF) filters.
> 2. **%25 Encoding**: %25 is the percent-encoded value of the % character itself.
> 3. **Sanitization Order**: Decoding double-encoded URIs before security validation prevents WAF filter evasion.
---

## 6. Related Terms
- [Query Parameters & Path Variables](query_params.md) — The URL data inputs escaped by percent-encoding.
- [Request Body & Payloads](request_body.md) — Un-encoded data payloads that do not require URL character escaping.

---

## 7. Key Takeaways
- URL Encoding (Percent-Encoding) replaces non-ASCII and reserved delimiter characters with hexadecimal byte codes.
- It prevents special characters (like `&`, `=`, `?`) from breaking URL structure parsing.
- Use `encodeURIComponent()` to escape individual query parameter values or path variables.
- Use `encodeURI()` only to escape complete, pre-built URL string targets.
- Decode values back to plain text on the server using `decodeURIComponent()`.
