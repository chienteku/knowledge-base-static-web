# Blob & ArrayBuffer

> **Level 7 — Data Formats & Serialization**
> Handling binary response bodies in the browser (`res.blob()`, `res.arrayBuffer()`).

---

## 1. Prerequisites
- [The fetch() API](../level_05/fetch.md) — The network request builder.
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — The response container wrapper.

---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Browser-Specific**: Standard interfaces implemented in modern web browsers. (Node.js uses `Buffer` as its primary binary interface).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Web applications frequently download files other than text-based JSON—such as PDF receipts, JPEG photos, audio files, or compressed zip archives.

If you attempt to read a binary file stream using `res.text()` or `res.json()`, the browser will attempt to map the raw binary bytes to text characters, corrupting the file structure.

To handle raw bytes in the browser, JavaScript provides two primary objects:

#### 1. Blob (Binary Large Object)
- Represents raw, immutable, file-like binary data. 
- A Blob has a `size` (in bytes) and a `type` (MIME type).
- **Primary Use:** Displaying or saving files. You can convert a Blob into a temporary local URL using `URL.createObjectURL(blob)` and pass it directly to an HTML tag (like `<img src="...">` or `<a href="..." download>`).

#### 2. ArrayBuffer
- Represents a raw, fixed-length buffer of binary data in memory.
- **Primary Use:** Manipulating byte data. An ArrayBuffer is opaque; JavaScript cannot read or write its contents directly. Instead, you must wrap it in a **TypedArray** (such as `Uint8Array`) or a `DataView` to access and manipulate individual bytes.

---

### (2) Reality Metaphor
Imagine receiving raw materials.
- **A Blob** is like receiving a **sealed package** containing a photograph. You do not need to open the package or modify the pixels. You just want to slide the package directly into a picture frame (**creating an Object URL for an `<img>` tag**) or place it in an outgoing mailbox (**uploading it**).
- **An ArrayBuffer** is like receiving a **raw block of clay**. You want to touch it, slice it, alter its dimensions, and examine its texture byte-by-byte (**using a TypedArray view**).

---

### (3) JavaScript Browser Examples

#### Example 1: Downloading and Displaying an Image as a Blob
We fetch a profile image, create a temporary URL, and render it in the DOM:

```javascript
async function loadAndDisplayImage() {
  try {
    const res = await fetch('/api/user/avatar.png');
    if (!res.ok) throw new Error("Image download failed");
    
    // 1. Read the response as a Blob file
    const imageBlob = await res.blob();
    
    // 2. Generate a temporary local URL pointing to the Blob in browser memory
    const imageUrl = URL.createObjectURL(imageBlob);
    
    // 3. Assign the URL to an image element source
    const imgNode = document.querySelector('#avatar-display');
    imgNode.src = imageUrl;
  } catch (err) {
    console.error(err);
  }
}
```

#### Example 2: Verifying a File Type using ArrayBuffer and TypedArray
Every file type starts with specific header bytes called **magic numbers**. We can read these bytes to verify a file's format:

```javascript
async function verifyPdfFile() {
  const res = await fetch('/api/document');
  
  // 1. Read response body as a raw ArrayBuffer
  const buffer = await res.arrayBuffer();
  
  // 2. Wrap the buffer in a 8-bit unsigned integer TypedArray to read bytes
  const bytes = new Uint8Array(buffer);
  
  // 3. Read the first 4 bytes (PDF signature is '%PDF', which translates to hex: 25 50 44 46)
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  
  if (isPdf) {
    console.log("Confirmed: Valid PDF document.");
  } else {
    console.warn("Security Alert: File header does not match PDF signature!");
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to read index values directly from an `ArrayBuffer`

**The mistake:** Trying to read individual bytes directly from a raw `ArrayBuffer` object:
```javascript
const buffer = await response.arrayBuffer();
console.log(buffer[0]); // WRONG! Returns undefined
```

**Why it's wrong:** An `ArrayBuffer` represents raw memory allocation and has no built-in index reader interface. Attempting to access its elements directly returns `undefined`.

*Fix:* You must create a TypedArray view of the buffer before accessing index items:
```javascript
const buffer = await response.arrayBuffer();
const view = new Uint8Array(buffer);
console.log(view[0]); // Correctly prints the first byte index value
```

---

### Mistake 2: Attempting to Read `ArrayBuffer` Byte Values Directly Without a TypedArray View

**The mistake:** Writing `const val = buffer[0]` directly on an `ArrayBuffer` instance.

**Why it's wrong:** `ArrayBuffer` represents raw unformatted byte memory. To read or write byte values, you MUST wrap it in a TypedArray view (`Uint8Array`) or `DataView`.

*Incorrect:*
```javascript
const buffer = new ArrayBuffer(8);
console.log(buffer[0]); // ❌ Returns undefined! Direct array indexing unsupported!
```

*Fix:*
```javascript
const buffer = new ArrayBuffer(8);
const view = new Uint8Array(buffer);
view[0] = 255; // Access bytes via TypedArray view
```

---

### Mistake 3: Loading Massive 2GB Binary Files Entirely into RAM as Blobs (Browser Crash)

**The mistake:** Fetching 2GB video files into browser memory using `response.blob()`.

**Why it's wrong:** Loading multi-gigabyte files into memory blobs exhausts browser tab RAM and triggers out-of-memory crashes. Use `response.body.getReader()` to stream binary chunks.

*Incorrect:*
```javascript
const res = await fetch('/video.mp4');
const blob = await res.blob(); // ❌ Loads entire 2GB file into RAM!
```

*Fix:*
```javascript
const res = await fetch('/video.mp4');
const reader = res.body.getReader(); // Stream chunked binary reader
```


---

## 6. Practice Exercises

### Exercise 1: Signature Search

**Problem:** You are building an upload validator. You read a file's ArrayBuffer and create a `Uint8Array` view. The first three index positions return:
`[71, 73, 70]` (ASCII codes for `G`, `I`, `F`). Which file type did the user upload?

> [!check]- Answer
> - **A GIF image.** (ASCII codes: 71 = G, 73 = I, 70 = F. Together, they represent the `'GIF'` file header).
> 
> 
---

### Exercise 2: Blob vs ArrayBuffer Distinction

**Problem:** Distinguish between a `Blob` and an `ArrayBuffer` in Web APIs.

**Expected output:**
> [!check]- Answer
> ```text
> Blob represents immutable raw file-like blob data (with MIME type metadata); ArrayBuffer represents mutable raw byte memory in RAM.
> ```
> ```text
> Blob -> Immutable file-like data with MIME type (e.g. image/png).
> ArrayBuffer -> Raw in-memory byte buffer manipulated via TypedArrays.
> ```
> - **Explanation:** Blobs represent file objects; ArrayBuffers represent memory byte arrays.
---

### Exercise 3: Creating Object URL from Blob

**Problem:** Write JavaScript line creating temporary DOM URL string for a image `Blob`.

**Expected output:**
> [!check]- Answer
> ```text
> const url = URL.createObjectURL(blob);
> ```
> ```javascript
> const url = URL.createObjectURL(blob);
> // Remember to revoke URL when done:
> URL.revokeObjectURL(url);
> ```
> - **Explanation:** `URL.createObjectURL(blob)` generates temporary `blob:http://...` DOM links.
---

## 7. Related Terms
- [FormData & Multipart Uploads](../level_05/formdata.md) — The payload format used to send files back to the server.
- [Binary vs Text Formats](binary_vs_text_formats.md) — The network data serialization paradigms.

---

## 8. Key Takeaways
- Use Blobs to represent opaque, immutable file-like data in the browser.
- Use `URL.createObjectURL(blob)` to map a binary Blob to a local URL for rendering or downloading.
- Use ArrayBuffers to represent raw, fixed-length memory blocks for byte-level manipulation.
- Access and modify ArrayBuffer memory by wrapping it in a TypedArray (like `Uint8Array`) or a `DataView`.
- Do not attempt to read index indices directly from an ArrayBuffer wrapper.
