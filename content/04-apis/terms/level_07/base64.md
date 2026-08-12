# Base64 Encoding

> **Level 7 — Data Formats & Serialization**
> A simple mathematical algorithm used to convert complex binary data (like images or files) into a safe string of standard ASCII text so it can be transmitted over HTTP.

---

## 1. Prerequisites
- [Serialization & Deserialization](serialization.md) — Base64 is essentially a form of serialization specifically for binary files.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — JSON can only hold text, so if you want to put an image in JSON, you must Base64 encode it.

---

## 2. Term Category

**Computer Science Concept / Data Formatting (Universal)**: Base64 Encoding is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
HTTP and JSON were designed to send *Text*. 
If you try to send a raw `.png` image or a `.pdf` file inside a JSON payload, the JSON parser will crash because the raw binary 1s and 0s of an image contain characters that break text formatting (like invisible control characters and null bytes).
We need a way to translate raw binary data into "safe" text characters (A-Z, a-z, 0-9). That algorithm is **Base64**. It looks at the binary data and maps it to 64 safe characters. 
Suddenly, an image becomes a massive string of text that looks like this: `iVBORw0KGgoAAAANSUhEUgAA...`

### (2) Reality Metaphor
Imagine you are a spy trying to send a physical object (a key) through a system that only accepts handwritten letters (the postal service).
You cannot put the physical key in the envelope. So, you place the key on a piece of paper and trace its exact shape with a pen. You send the letter. The receiver takes the letter, cuts out the shape, and casts a new key.
**Base64** is tracing the shape of a file into text so it can survive a text-only journey.

### (3) Base64 is NOT Encryption!
This is the most critical thing to understand about Base64. It is *encoding*, not encryption. 
Encoding just changes the *format* of the data so systems can read it (like translating English to French). Anyone who knows Base64 can instantly reverse it back into the original file. 
Encryption requires a secret password to reverse. Never use Base64 to "hide" passwords!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Base64 for large files

**The mistake:** A developer allows users to upload 50MB video files. To send the video to the API, they convert the 50MB video into a Base64 string and put it inside a JSON payload.

**Why it's wrong:** The Base64 math algorithm is horribly inefficient. When you convert binary into Base64 text, the file size grows by **33%**. Your 50MB video just became a 66MB text string! Furthermore, trying to load a 66MB string into your browser's RAM will likely crash the browser tab.
**Golden Rule:** Base64 is great for tiny images (like avatars) or short secrets (like Basic Auth). For large files (PDFs, Videos), you must use `multipart/form-data` instead of JSON!

---

### Mistake 2: Assuming Base64 Encoding Provides Data Encryption or Security

**The mistake:** Encoding sensitive passwords or user tokens with Base64 (`btoa()`) believing they are secured.

**Why it's wrong:** Base64 is an encoding format designed for safe text transport, NOT encryption. Anyone can decode a Base64 string instantly using `atob()`.

*Incorrect:*
```javascript
const secret = btoa('myPassword123'); // 'bXlQYXNzd29yZDEyMw==' ❌ Instantly decodable!
```

*Fix:*
```javascript
const hash = await bcrypt.hash('myPassword123', 10); // Cryptographic password hashing
```

---

### Mistake 3: Using Standard Base64 Characters in URL Query Strings (URL Component Corruption)

**The mistake:** Transmitting standard Base64 strings containing `+` and `/` characters inside URL parameters.

**Why it's wrong:** Standard Base64 contains `+` and `/` characters. In URLs, `+` is parsed as a space character, corrupting the Base64 payload. Use **Base64URL** encoding (`-` and `_`).

*Incorrect:*
```http
GET /api/verify?token=abc+def/123== HTTP/1.1 ; ❌ '+' parsed as space in URL!
```

*Fix:*
```http
GET /api/verify?token=abc-def_123 HTTP/1.1 ; Safe Base64URL encoding
```


---

## 5. Practice Exercises

### Exercise 1: Binary Buffer to Data URI Base64 Encoder

**Scenario:** An API asset manager converts raw binary image buffers into inline Base64 Data URIs (`data:image/png;base64,...`) for web rendering.

**Requirements:**
1. Write toBase64DataUri(mimeType, bufferData).
2. Convert buffer to Base64 string.
3. Prepend `data:<mimeType>;base64,` header string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function toBase64DataUri(mimeType, bufferData) {
>   if (!mimeType || !bufferData) return null;
>
>   const base64Str = Buffer.isBuffer(bufferData)
>     ? bufferData.toString("base64")
>     : Buffer.from(bufferData).toString("base64");
>
>   return `data:${mimeType};base64,${base64Str}`;
> }
>
> // Verification tests
> const buf = Buffer.from("PNG_BINARY_HEADER_DATA");
> const uri = toBase64DataUri("image/png", buf);
>
> console.assert(uri.startsWith("data:image/png;base64,"), "Test 1 Failed");
> console.assert(uri.includes(buf.toString("base64")), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Base64 Purpose**: Encodes binary data into 64 printable ASCII characters (A-Z, a-z, 0-9, +, /) for safe text transport.
> 2. **Data URI Scheme**: Allows embedding inline binary resources (images, fonts) directly inside HTML/CSS or JSON APIs.
> 3. **Base64 Expansion Overhead**: Base64 increases data size by exactly 33% (4 bytes encoded for every 3 raw binary bytes).
> 
---

### Exercise 2: Base64URL Safe Encoder & Decoder for JWT Tokens

**Scenario:** A JWT parser converts standard Base64 strings into URL-safe Base64URL representations by replacing `+` and `/` and stripping `=` padding.

**Requirements:**
1. Write toBase64Url(base64Str).
2. Write fromBase64Url(base64UrlStr).
3. Ensure lossless roundtrip encoding.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function toBase64Url(base64Str) {
>   if (typeof base64Str !== "string") return "";
>   return base64Str
>     .replace(/=/g, "")
>     .replace(/\+/g, "-")
>     .replace(/\//g, "_");
> }
>
> function fromBase64Url(base64UrlStr) {
>   if (typeof base64UrlStr !== "string") return "";
>   let base64 = base64UrlStr
>     .replace(/-/g, "+")
>     .replace(/_/g, "/");
>
>   while (base64.length % 4 !== 0) {
>     base64 += "=";
>   }
>   return base64;
> }
>
> // Verification tests
> const origBase64 = "usr/42+test==";
> const urlSafe = toBase64Url(origBase64);
>
> console.assert(!urlSafe.includes("+") && !urlSafe.includes("/") && !urlSafe.includes("="), "Test 1 Failed");
> console.assert(fromBase64Url(urlSafe) === origBase64, "Test 2 Failed: Lossless roundtrip");
> ```
>
> #### Technical Explanation
>
> 1. **Base64URL Variation**: RFC 4648 variation replacing + with - and / with _ to avoid URL query parameter escaping issues.
> 2. **Padding Equal Sign (=)**: Standard Base64 uses = for 4-byte block alignment; Base64URL omits padding.
> 3. **URL Safety**: Guarantees tokens can be transmitted in URL path segments without corruption.
> 
---

### Exercise 3: Base64 Bandwidth Overhead Auditor

**Scenario:** An API performance tool computes exact byte size explosion when sending binary files as Base64 JSON payloads vs raw binary.

**Requirements:**
1. Write auditBase64Overhead(rawByteCount).
2. Calculate encoded Base64 byte length `ceil(bytes / 3) * 4`.
3. Return percentage increase.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditBase64Overhead(rawByteCount) {
>   if (typeof rawByteCount !== "number" || rawByteCount <= 0) {
>     return { rawBytes: 0, base64Bytes: 0, overheadPct: 0 };
>   }
>
>   const base64Bytes = Math.ceil(rawByteCount / 3) * 4;
>   const overheadBytes = base64Bytes - rawByteCount;
>   const overheadPct = Number(((overheadBytes / rawByteCount) * 100).toFixed(2));
>
>   return {
>     rawBytes: rawByteCount,
>     base64Bytes,
>     overheadBytes,
>     overheadPct
>   };
> }
>
> // Verification tests
> const audit = auditBase64Overhead(3000);
> console.assert(audit.base64Bytes === 4000, "Test 1 Failed: 3000 raw -> 4000 Base64");
> console.assert(audit.overheadPct === 33.33, "Test 2 Failed: 33.33% overhead");
> ```
>
> #### Technical Explanation
>
> 1. **Base64 Math Ratio**: Every 3 input bytes (24 bits) map to 4 output Base64 index values (6 bits each).
> 2. **Network Cost Impact**: Transmitting large files (videos, high-res images) as Base64 wastes significant network bandwidth.
> 3. **Prefer Multipart/Octet-Stream**: Large file uploads should use raw binary streams (application/octet-stream) instead of Base64 JSON strings.
---

## 6. Related Terms
- [Basic & Bearer Authentication](../level_04/basic_bearer_auth.md) — Basic Auth literally uses Base64 to combine the username and password into the header.
- [JWT (JSON Web Tokens)](../level_04/jwt.md) — The Header and Payload of a JSON Web Token are Base64 encoded (which is why anyone can read them!).
- [FormData & Multipart Uploads](../level_05/formdata.md) — Related concept: FormData & Multipart Uploads.
- [Character Encoding (UTF-8)](character_encoding.md) — Related concept: Character Encoding (UTF-8).
- [Protocol Buffers (protobuf)](../level_10/protocol_buffers.md) — Related concept: Protocol Buffers (protobuf).

---

## 7. Key Takeaways
- **Base64** converts raw binary files (images, PDFs) into a safe string of text.
- It allows non-text data to be sent inside JSON payloads.
- It increases file size by ~33%, so it should only be used for small files.
- **It is NOT encryption.** It provides zero security.
