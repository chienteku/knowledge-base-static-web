# Character Encoding & Buffer ↔ String

> **Level 6 — Data Handling**
> Turning raw bytes into text (`'utf8'`) and back — the source of most Buffer bugs.

---

## 1. Prerequisites
- [Buffers](./buffers.md) — The raw binary memory arrays undergoing translation.

---

## 2. Term Category
- **Data Handling**

---

## 3. Environment Context
- **Node.js Core Architecture** (Core binary formatting rules implemented across V8 and Node system layers).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Decoder Script

**Problem:** You are given a file containing a hex-encoded string payload. Write a script to read the file, decode the hex string into a standard UTF-8 string, and output the result:

```javascript
const fs = require('fs');

function decodeHexFile(filePath) {
  // Read hex file content as standard string
  const hexStr = fs.readFileSync(filePath, 'utf8').trim();
  
  // Convert hex string into a binary Buffer
  const buf = Buffer.from(hexStr, 'hex');
  
  // Decode buffer to readable UTF-8 string
  return buf.toString('utf8');
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Converting Hex to Base64 via Buffer

**Problem:** Convert hex string `'68656c6c6f'` to Base64 string using Node.js `Buffer`.

**Expected output:**
```text
Buffer.from('68656c6c6f', 'hex').toString('base64');
```

> [!check]- Answer
> ```javascript
> const base64 = Buffer.from('68656c6c6f', 'hex').toString('base64');
> ```
>
> **Explanation:** `Buffer.from(str, encoding)` parses encoded binary representations.

### Exercise 3: StringDecoder Utility Role

**Problem:** Why use `StringDecoder` instead of `buffer.toString()` when reading text streams?

**Expected output:**
```text
It preserves incomplete multi-byte UTF-8 characters across chunk boundaries until the next chunk arrives.
```

> [!check]- Answer
> ```text
> It preserves incomplete multi-byte UTF-8 characters across chunk boundaries until the next chunk arrives.
> ```
>
> **Explanation:** `StringDecoder` buffers partial multi-byte UTF-8 bytes to prevent text corruption.

## 7. Related Terms
- [Buffers](./buffers.md) — The raw byte structure translated by encodings.
- [Data Chunks](./chunks.md) — The chunk payloads that risk character boundary corruption.

---

## 8. Key Takeaways
- Character encodings translate binary bytes to readable text strings.
- `Buffer.from()` encodes strings to bytes; `buffer.toString()` decodes bytes to strings.
- UTF-8 is the standard variable-length encoding: English characters take 1 byte; symbols/emojis take up to 4 bytes.
- String character length does not always match buffer byte length.
- Decoding stream chunks directly can split multi-byte characters, causing corruption.
- Use `string_decoder` or `stream.setEncoding('utf8')` to prevent multi-byte splicing errors.
