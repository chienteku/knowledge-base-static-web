# Character Encoding (UTF-8)

> **Level 7 — Data Formats & Serialization**
> How text becomes bytes, and why non-ASCII/emoji break naive payloads.

---

## 1. Prerequisites
- [Serialization & Deserialization](serialization.md) — The concepts of formatting objects for transmission.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — UTF-8 text encoding for JSON data serialization.

---

## 2. Term Category

**Data Format (Universal: Affects network socket configurations, database collations, and HTTP header properties.)**: Character Encoding (UTF-8) is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Computers cannot store or transmit characters like `"A"`, `"ñ"`, or `"🚀"` directly. They only understand binary numbers (0s and 1s). 

To send text over a network, we need a lookup dictionary that maps every written character to a specific sequence of binary numbers. This dictionary is called a **Character Encoding**:

*   **ASCII (Legacy):** An early, simple encoding standard that maps English letters, numbers, and basic punctuation to numbers from `0` to `127`. Each character consumes exactly **1 byte** (8 bits, with 1 bit unused). 
    *   *Limit:* ASCII cannot represent non-English letters (like `é` or `中`) or emojis.
*   **Unicode (The Character Set):** A universal index table that maps *every* character in *every* human language (plus emojis) to a unique ID code called a **Code Point** (e.g. `"A"` is mapped to `U+0041`, while `"😊"` is `U+1F60A`).
*   **UTF-8 (The Transmission Format):** The dominant character encoding of the modern web. It is a **variable-width encoding** that converts Unicode code points into raw byte streams:
    *   Basic English ASCII characters consume **1 byte** (for backwards compatibility).
    *   Accented Latin characters (like `é`) consume **2 bytes**.
    *   Asian characters (like `中`) consume **3 bytes**.
    *   Emojis (like `😊`) consume **4 bytes**.

#### The Byte Length Bug
In HTTP, the `Content-Length` header must specify the request body size in **bytes**, not characters. If your payload contains emojis or non-ASCII characters, calculating the size using character string lengths will result in a value that is too small. The server will cut off the connection before reading the entire payload, causing parsing failures.

---

### (2) Reality Metaphor
Imagine a secret decoder book used by agents.
- **ASCII** is like a **1-page decoder ring** that only maps numbers `1` to `26` to English letters. It is simple, but if an agent tries to write a message containing a symbol or a foreign word, the ring is useless.
- **Unicode** is a **massive encyclopedia** that maps every word, symbol, and drawing in history to a unique index page number.
- **UTF-8** is a **transmission code** for the encyclopedia page numbers. Instead of sending every page number as a long 4-digit code (which would make simple English messages 4 times longer), UTF-8 uses a shortcut: common English letters are sent as short 1-digit codes, and only expands to 2, 3, or 4-digit codes when complex characters or emojis are used.

---

### (3) JavaScript & Node.js Implementation Example

Calculating length mismatches when dealing with multi-byte strings:

```javascript
// A string with 5 characters, but containing a multi-byte emoji
const payload = "Hello😊";

console.log("String Length (Characters):", payload.length); 
// Output: 7 (JavaScript counts UTF-16 code units; the emoji counts as 2 units)

// 1. Correct Byte Length calculation in Node.js
const byteLengthNode = Buffer.byteLength(payload, 'utf8');
console.log("Byte Length (Node.js):", byteLengthNode); 
// Output: 9 (5 bytes for 'Hello' + 4 bytes for '😊')

// 2. Correct Byte Length calculation in the Browser
const encoder = new TextEncoder();
const encodedBytes = encoder.encode(payload);
console.log("Byte Length (Browser):", encodedBytes.length); 
// Output: 9

// 3. Safe HTTP Header Configuration
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Content-Length': byteLengthNode.toString() // Set to 9, not 7!
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting `Content-Length` using `string.length` instead of byte length

**The mistake:** Explicitly defining the `Content-Length` header of an API request using the string character count:
```javascript
const body = JSON.stringify({ message: "Hello world 🚀" });
const headers = {
  'Content-Length': body.length // WRONG!
};
```

**Why it's wrong:** The rocket emoji `🚀` consumes 4 bytes. `body.length` counts the character representations in JS, returning a value that is smaller than the actual byte size. The server reads only a portion of the request body, leaving off the final bytes. The server then attempts to parse the truncated data, fails to find a closing bracket, and returns a `400 Bad Request` parsing error.

---

### Mistake 2: Parsing UTF-8 Multi-Byte Characters as ASCII Bytes (Character Corruption / Mojibake)

**The mistake:** Trimming UTF-8 strings by slicing byte length directly (`buffer.slice(0, 10)`).

**Why it's wrong:** UTF-8 uses variable-length encoding (1 to 4 bytes per character). Slicing in the middle of a multi-byte emoji or non-Latin character corrupts character rendering (mojibake ).

*Incorrect:*
```javascript
// Splitting buffer at byte 10
const text = buffer.slice(0, 10).toString('utf8'); // ❌ Truncates multi-byte character halfway!
```

*Fix:*
```javascript
// Use TextDecoder or string-based splitting:
const decoder = new TextDecoder('utf-8');
const text = decoder.decode(buffer);
```

---

### Mistake 3: Omitting `charset=utf-8` in HTTP `Content-Type` Headers

**The mistake:** Sending non-ASCII text responses with header `Content-Type: text/html` omitting `charset`.

**Why it's wrong:** Without an explicit `charset=utf-8` parameter, browsers fallback to local legacy encodings (Windows-1252), corrupting foreign language characters.

*Incorrect:*
```http
Content-Type: text/html ; Missing charset declaration
```

*Fix:*
```http
Content-Type: text/html; charset=utf-8
```


---

## 5. Practice Exercises

### Exercise 1: UTF-8 vs ASCII TextEncoder / TextDecoder Converter

**Scenario:** A web application uses `TextEncoder` and `TextDecoder` to convert multi-byte Unicode strings (e.g. emojis, non-Latin scripts) into UTF-8 byte arrays.

**Requirements:**
1. Write encodeStringToUtf8Bytes(textStr).
2. Write decodeUtf8BytesToString(uint8Array).
3. Verify lossless Unicode roundtrip.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function encodeStringToUtf8Bytes(textStr) {
>   const encoder = new TextEncoder();
>   return encoder.encode(textStr);
> }
>
> function decodeUtf8BytesToString(uint8Array) {
>   const decoder = new TextDecoder("utf-8");
>   return decoder.decode(uint8Array);
> }
>
> // Verification tests
> const unicodeText = "Hello 🚀 世界";
> const bytes = encodeStringToUtf8Bytes(unicodeText);
>
> console.assert(bytes.length > unicodeText.length, "Test 1 Failed: UTF-8 byte length > char length for multi-byte Unicode");
> console.assert(decodeUtf8BytesToString(bytes) === unicodeText, "Test 2 Failed: Lossless decode");
> ```
>
> #### Technical Explanation
>
> 1. **TextEncoder / TextDecoder APIs**: Standard Web API for converting strings to/from UTF-8 Uint8Array byte arrays.
> 2. **UTF-8 Variable-Width Encoding**: ASCII characters use 1 byte (0-127); emojis and non-Latin characters use 2 to 4 bytes.
> 3. **String.length vs Byte Count**: JavaScript string.length counts UTF-16 code units, NOT raw UTF-8 byte count.
> 
---

### Exercise 2: Malformed UTF-8 Sequence Sanitizer & Replacement Character Guard

**Scenario:** An API payload decoder handles invalid UTF-8 byte sequences gracefully using the Unicode Replacement Character (`�`).

**Requirements:**
1. Write safeDecodeUtf8(uint8Array).
2. Use TextDecoder with fatal: false option.
3. Detect replacement characters.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safeDecodeUtf8(uint8Array) {
>   const decoder = new TextDecoder("utf-8", { fatal: false });
>   const decodedStr = decoder.decode(uint8Array);
>
>   const hasMalformedBytes = decodedStr.includes("�");
>
>   return {
>     decodedStr,
>     hasMalformedBytes
>   };
> }
>
> // Verification tests
> const validBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
> console.assert(safeDecodeUtf8(validBytes).hasMalformedBytes === false, "Test 1 Failed");
>
> const invalidBytes = new Uint8Array([0xFF, 0xFE, 0xFD]); // Invalid UTF-8 bytes
> console.assert(safeDecodeUtf8(invalidBytes).hasMalformedBytes === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Unicode Replacement Character (U+FFFD)**: Substituted when a byte sequence cannot be decoded as valid UTF-8.
> 2. **TextDecoder fatal Option**: Setting fatal: true forces TextDecoder to throw a TypeError on malformed bytes.
> 3. **Character Encoding Security**: Validating UTF-8 encoding prevents security bypasses caused by invalid byte sequences.
> 
---

### Exercise 3: Content-Type Charset Header Verification Guard

**Scenario:** An HTTP response inspector verifies that text response bodies match declared `Content-Type: text/plain; charset=utf-8` headers.

**Requirements:**
1. Write verifyResponseCharset(contentTypeHeader).
2. Extract charset directive.
3. Flag non-UTF8 charsets (e.g. ISO-8859-1).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifyResponseCharset(contentTypeHeader) {
>   if (!contentTypeHeader || typeof contentTypeHeader !== "string") {
>     return { valid: false, charset: "UTF-8", warning: "Missing charset header (defaults to UTF-8)" };
>   }
>
>   const parts = contentTypeHeader.split(";").map(p => p.trim());
>   for (const part of parts) {
>     if (part.toLowerCase().startsWith("charset=")) {
>       const charset = part.split("=")[1].toUpperCase();
>       return {
>         valid: charset === "UTF-8" || charset === "UTF8",
>         charset
>       };
>     }
>   }
>
>   return { valid: true, charset: "UTF-8" };
> }
>
> // Verification tests
> console.assert(verifyResponseCharset("text/html; charset=utf-8").valid === true, "Test 1 Failed");
> console.assert(verifyResponseCharset("text/html; charset=ISO-8859-1").valid === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Web Standard Encoding**: UTF-8 is the mandatory default character encoding for modern JSON APIs and HTML5.
> 2. **Legacy Charset Risks**: Using legacy charsets (ISO-8859-1, Windows-1252) causes corrupted text rendering (mojibake).
> 3. **HTTP Header Specification**: Content-Type specifies media type and character set encoding parameters.
---

## 6. Related Terms
- [Base64 Encoding](base64.md) — The binary-to-text format that translates raw bytes back into printable ASCII characters.
- [Binary vs Text Formats](binary_vs_text_formats.md) — The architectural trade-off between sending byte-streams vs character-encoded text.

---

## 7. Key Takeaways
- Characters must be converted to binary bytes using a Character Encoding before transmission.
- UTF-8 is a variable-width encoding that supports Unicode while remaining backwards compatible with ASCII.
- Standard English characters consume 1 byte; accented letters consume 2, Asian characters consume 3, and emojis consume 4 bytes.
- HTTP `Content-Length` headers must be defined using the byte size of a payload, not its character length.
- Use `Buffer.byteLength()` in Node or `TextEncoder` in browsers to calculate exact byte counts.
