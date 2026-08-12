# Character Encoding & Buffer ↔ String

> **Level 6 — Data Handling**
> Turning raw bytes into text (`'utf8'`) and back — the source of most Buffer bugs.

---

## 1. Prerequisites
- [Buffers](buffers.md) — The raw binary memory arrays undergoing translation.

---

## 2. Term Category

**Data Handling (Node.js Core Architecture .)**: Character Encoding & Buffer ↔ String is a fundamental concept in this technology stack. **Level 6 — Data Handling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
At the hardware level, computers only read and write raw binary bytes (zeros and ones). Humans read and write text characters. 

To bridge this gap, we use a **Character Encoding**: a standardized dictionary mapping specific numbers (bytes) to visible characters. 

In Node.js, files and network streams are loaded into memory as raw binary **`Buffers`**. To read or manipulate this data, we must convert it back and forth between a **Buffer** and a **JavaScript String**:
-   **Decoding (Buffer ──> String):** Converting raw bytes to a text string via `buffer.toString(encoding)`.
-   **Encoding (String ──> Buffer):** Flattening a text string to raw bytes via `Buffer.from(string, encoding)`.

#### Common Node.js Encodings
-   **`'utf8'` (Default):** Unicode character encoding. Variable-length format: standard English characters consume exactly 1 byte, while non-English characters, symbols, and emojis can consume 2 to 4 bytes.
-   **`'ascii'`:** 7-bit character set mapping English text. Each character is exactly 1 byte.
-   **`'hex'` / `'base64'`:** Encodes binary bytes into readable ASCII text strings, which is useful for sending image files or hashes over text-only channels (like JSON bodies or emails).

---

### (2) Reality Metaphor
Imagine a **secret decoder ring handbook**.
- A **Buffer** is a list of raw numbers: `[72, 101, 108, 108, 111]`. You cannot read this directly.
- **Character Encoding** is the **decoder handbook** explaining: `72 = H`, `101 = e`, `108 = l`, etc.
- **`buffer.toString('utf8')`** is looking up each number in the handbook to write down: `"Hello"`.
- **`Buffer.from('Hello', 'utf8')`** is converting `"Hello"` back into `[72, 101, 108, 108, 111]`.
- If you use the **wrong encoding dictionary** (e.g. reading hex data using UTF-8), you get unreadable gibberish characters (**Mojibake**).

---

### (3) JavaScript Implementation Example

An example illustrating the difference between string length (characters) and buffer length (bytes) when using multi-byte UTF-8 characters:

```javascript
// 1. Encoding: String to Buffer
const emojiStr = "Fire 🔥";
console.log("String Character Length:", emojiStr.length); // Output: 6

const utf8Buf = Buffer.from(emojiStr, 'utf8');
console.log("UTF-8 Buffer Byte Length:", utf8Buf.length); // Output: 9
// Why 9? F, i, r, e, and the space take 1 byte each (5). The emoji '🔥' takes 4 bytes. 5 + 4 = 9.

// 2. Hex/Base64 Encodings
const hexString = utf8Buf.toString('hex');
console.log("Hexadecimal representation:", hexString); // Output: 4669726520f09f94a5

// 3. Decoding: Buffer back to String
const restoredStr = Buffer.from(hexString, 'hex').toString('utf8');
console.log("Restored Text String:", restoredStr); // Output: "Fire 🔥"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Splitting multi-byte characters when reading stream chunks

**The mistake:** Reading binary chunks from a stream and decoding each chunk to a string immediately:

```javascript
// BAD: If a multi-byte character (like an emoji) is cut in half at the chunk boundary,
// decoding it directly will yield a corrupted replacement character: 
stream.on('data', (chunk) => {
  const textChunk = chunk.toString('utf8'); // Possible Mojibake!
});
```

**Why it's wrong:** Stream chunks are split based on arbitrary buffer sizes, not character boundaries. If a 4-byte emoji sits at the boundary of a chunk (e.g., 2 bytes in chunk A, 2 bytes in chunk B), calling `chunk.toString()` on chunk A will fail to resolve the emoji, resulting in a permanent `` character.

*Fix:* Use the built-in `string_decoder` core module. It remembers partial multi-byte characters and pauses decoding until the remainder of the bytes arrive in the next chunk:

```javascript
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

stream.on('data', (chunk) => {
  const textChunk = decoder.write(chunk); // Safe! Collects boundary fragments.
  console.log(textChunk);
});
```
*(Alternatively, configure the stream directly: `readableStream.setEncoding('utf8')`).*

---



### Mistake 2: Assuming Binary Buffer Length (`buffer.length`) Equals String Character Count

**The mistake:** Using `buffer.length` to measure UTF-8 string length for multi-byte Unicode characters (e.g. Emoji / Chinese).

**Why it's wrong:** In UTF-8, characters can occupy 1 to 4 bytes. `buffer.length` returns total byte count, NOT character count (`'🚀'.length === 2`, `Buffer.from('🚀').length === 4`).

*Incorrect:*
```javascript
const buf = Buffer.from('🚀');
console.log(buf.length === 1); // ❌ false! buf.length is 4 bytes!
```

*Fix:*
```javascript
const str = '🚀';
console.log(str.length); // String length (code units)
console.log(Buffer.byteLength(str, 'utf-8')); // True byte count (4)
```

### Mistake 3: Splitting Multi-Byte UTF-8 Characters Across Buffer Chunk Boundaries

**The mistake:** Decoding individual stream chunks directly with `.toString('utf-8')`.

**Why it's wrong:** If a 4-byte UTF-8 character is split across two stream chunks, calling `.toString()` on the partial chunk outputs corrupt replacement characters (``). Use `string_decoder`.

*Incorrect:*
```javascript
stream.on('data', (chunk) => {
  text += chunk.toString('utf-8'); // ❌ Corrupts multi-byte characters split across chunks!
});
```

*Fix:*
```javascript
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf-8');
stream.on('data', (chunk) => {
  text += decoder.write(chunk); // Safely handles multi-byte boundary splits
});
```

## 5. Practice Exercises

### Exercise 1: UTF-8 vs Base64 vs Hex Buffer Transcoder

**Scenario:** A data transformation service converts incoming payload strings between binary encodings (`utf-8`, `base64`, `hex`, `ascii`).

**Requirements:**
1. Write transcodeBuffer(inputStr, fromEncoding, toEncoding).
2. Convert inputStr to Buffer using fromEncoding.
3. Encode Buffer to target string using toEncoding.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function transcodeBuffer(inputStr, fromEncoding = "utf-8", toEncoding = "base64") {
>   if (typeof inputStr !== "string") {
>     throw new TypeError("Input must be a string");
>   }
>
>   const buf = Buffer.from(inputStr, fromEncoding);
>   return {
>     original: inputStr,
>     byteLength: buf.length,
>     transcoded: buf.toString(toEncoding)
>   };
> }
>
> // Verification tests
> const res1 = transcodeBuffer("Hello World", "utf-8", "base64");
> console.assert(res1.transcoded === "SGVsbG8gV29ybGQ=", "Test 1 Failed: Base64 encoding mismatch");
>
> const res2 = transcodeBuffer("SGVsbG8gV29ybGQ=", "base64", "hex");
> console.assert(res2.transcoded === "48656c6c6f20576f726c64", "Test 2 Failed: Hex encoding mismatch");
> ```
>
> #### Technical Explanation
>
> 1. **Supported Node.js Encodings**: `utf-8`, `base64`, `base64url`, `hex`, `ascii`, `binary` (`latin1`), `utf16le`.
> 2. **Buffer.from(string, encoding)**: Parses encoded string representation into raw binary bytes.
> 3. **buffer.toString(encoding)**: Formats raw binary bytes into encoded string representations.
> 
---

### Exercise 2: Multi-Byte Character Chunking Safe Decoder

**Scenario:** Uses Node.js `string_decoder` core module to safely decode multi-byte UTF-8 chunks split across stream chunk boundaries.

**Requirements:**
1. Write decodeMultiByteChunks(bufferChunksArray, mockStringDecoder).
2. Decode chunks sequentially.
3. Prevent corrupted UTF-8 replacement characters.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function decodeMultiByteChunks(bufferChunksArray = [], mockStringDecoder) {
>   const StringDecoder = mockStringDecoder || require("string_decoder").StringDecoder;
>   const decoder = new StringDecoder("utf-8");
>
>   let result = "";
>   for (const chunk of bufferChunksArray) {
>     result += decoder.write(chunk);
>   }
>   result += decoder.end();
>
>   return result;
> }
>
> // Verification tests
> const chunk1 = Buffer.from([0xF0, 0x9F]);
> const chunk2 = Buffer.from([0x98, 0x86]);
>
> const decoded = decodeMultiByteChunks([chunk1, chunk2]);
> console.assert(decoded === "😀", "Test 1 Failed: Multi-byte character must be reconstructed without corruption");
> ```
>
> #### Technical Explanation
>
> 1. **Multi-Byte Character Splitting**: UTF-8 characters take 1 to 4 bytes; stream chunks can split multi-byte characters in half.
> 2. **Buffer.toString() Limitation**: Calling `chunk.toString('utf-8')` on partial bytes returns replacement character.
> 3. **string_decoder Module**: Buffers incomplete multi-byte sequences until remaining bytes arrive in subsequent chunks.
> 
---

### Exercise 3: Binary Buffer Size vs String Character Length Evaluator

**Scenario:** Compares JavaScript string length (`str.length`) with actual byte size (`Buffer.byteLength(str)`) for multi-byte Unicode strings.

**Requirements:**
1. Write evaluateStringByteSize(unicodeStr).
2. Calculate `str.length`.
3. Calculate `Buffer.byteLength(str, 'utf-8')`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function evaluateStringByteSize(unicodeStr = "") {
>   const charLength = unicodeStr.length;
>   const byteLength = Buffer.byteLength(unicodeStr, "utf-8");
>
>   return {
>     charLength,
>     byteLength,
>     isMultiByte: byteLength > charLength,
>     bytesPerCharRatio: Number((byteLength / (charLength || 1)).toFixed(2))
>   };
> }
>
> // Verification tests
> const ascii = evaluateStringByteSize("hello");
> console.assert(ascii.charLength === 5 && ascii.byteLength === 5, "Test 1 Failed: ASCII is 1 byte per char");
>
> const emoji = evaluateStringByteSize("🚀🚀");
> console.assert(emoji.byteLength === 8, "Test 2 Failed: Each 🚀 emoji is 4 bytes in UTF-8");
> console.assert(emoji.isMultiByte === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **String Length vs Byte Length**: JavaScript `str.length` counts 16-bit code units; `Buffer.byteLength()` calculates UTF-8 bytes.
> 2. **Content-Length Header Bug**: Passing `str.length` to HTTP `Content-Length` header truncates multi-byte responses.
> 3. **Memory Footprint**: Always calculate `Buffer.byteLength()` when allocating buffers or setting network payload headers.
## 6. Related Terms
- [Buffers](buffers.md) — The raw byte structure translated by encodings.
- [Data Chunks](chunks.md) — The chunk payloads that risk character boundary corruption.

---

## 7. Key Takeaways
- Character encodings translate binary bytes to readable text strings.
- `Buffer.from()` encodes strings to bytes; `buffer.toString()` decodes bytes to strings.
- UTF-8 is the standard variable-length encoding: English characters take 1 byte; symbols/emojis take up to 4 bytes.
- String character length does not always match buffer byte length.
- Decoding stream chunks directly can split multi-byte characters, causing corruption.
- Use `string_decoder` or `stream.setEncoding('utf8')` to prevent multi-byte splicing errors.
