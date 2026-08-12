# Blob & ArrayBuffer

> **Level 7 — Data Formats & Serialization**
> Handling binary response bodies in the browser (`res.blob()`, `res.arrayBuffer()`).

---

## 1. Prerequisites
- [The fetch() API](../level_05/fetch.md) — The network request builder.
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — The response container wrapper.

---

## 2. Term Category

**Browser API / Networking (Browser-Specific: Standard interfaces implemented in modern web browsers. .)**: Blob & ArrayBuffer is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Blob to ArrayBuffer Reader for In-Memory Cryptographic Hash

**Scenario:** A client-side file upload utility reads a browser `Blob` object as an `ArrayBuffer` to compute SHA-256 checksums before upload.

**Requirements:**
1. Write readBlobAsArrayBuffer(blobObject).
2. Convert Blob to ArrayBuffer.
3. Return ArrayBuffer.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function readBlobAsArrayBuffer(blobObject) {
>   if (!blobObject) throw new Error("Blob object required");
>
>   if (typeof blobObject.arrayBuffer === "function") {
>     return await blobObject.arrayBuffer();
>   }
>
>   return new Promise((resolve, reject) => {
>     const reader = new FileReader();
>     reader.onload = () => resolve(reader.result);
>     reader.onerror = () => reject(reader.error);
>     reader.readAsArrayBuffer(blobObject);
>   });
> }
>
> // Verification tests
> const mockBlob = {
>   arrayBuffer: async () => new ArrayBuffer(8)
> };
>
> readBlobAsArrayBuffer(mockBlob).then(buf => {
>   console.assert(buf.byteLength === 8, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Blob vs ArrayBuffer Difference**: Blob represents higher-level immutable file-like raw data; ArrayBuffer represents fixed-length low-level memory bytes.
> 2. **arrayBuffer() Async Method**: Modern Web API method returning a promise resolving to the Blob's underlying ArrayBuffer.
> 3. **Cryptographic Hashing**: Web Crypto API (crypto.subtle.digest) requires ArrayBuffer inputs to calculate SHA-256 hashes.
> 
---

### Exercise 2: DataView TypedArray Byte Manipulator

**Scenario:** A binary parser uses `Uint8Array` views to inspect and modify individual byte elements of an ArrayBuffer payload.

**Requirements:**
1. Write setBufferFlag(arrayBuffer, byteIndex, bitMask).
2. Modify specific bit flag.
3. Return updated Uint8Array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setBufferFlag(arrayBuffer, byteIndex, bitMask) {
>   const bytes = new Uint8Array(arrayBuffer);
>   if (byteIndex < 0 || byteIndex >= bytes.length) {
>     throw new Error("Byte index out of bounds");
>   }
>
>   bytes[byteIndex] = bytes[byteIndex] | bitMask;
>   return bytes;
> }
>
> // Verification tests
> const buf = new ArrayBuffer(4);
> const bytes = setBufferFlag(buf, 0, 0b00000001);
>
> console.assert(bytes[0] === 1, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Uint8Array View**: Creates a 1-byte unsigned integer view over the underlying ArrayBuffer memory.
> 2. **Bitwise Flag Operations**: Allows manipulating individual bit flags in binary protocol headers.
> 3. **Shared Memory Views**: Multiple TypedArray views can inspect the SAME underlying ArrayBuffer without copying memory.
> 
---

### Exercise 3: Client-Side Downloadable Blob File Generator

**Scenario:** A dashboard export module converts JSON data strings into a downloadable file `Blob` and generates object URLs (`URL.createObjectURL(blob)`).

**Requirements:**
1. Write createDownloadableJsonBlob(jsonDataObj).
2. Construct Blob with type application/json.
3. Return object URL.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createDownloadableJsonBlob(jsonDataObj, mockUrlCreator) {
>   const jsonStr = JSON.stringify(jsonDataObj, null, 2);
>   const blob = new Blob([jsonStr], { type: "application/json" });
>
>   const urlCreator = mockUrlCreator || globalThis.URL;
>   const objectUrl = urlCreator ? urlCreator.createObjectURL(blob) : "blob:fake-url";
>
>   return {
>     blob,
>     objectUrl,
>     sizeBytes: blob.size
>   };
> }
>
> // Verification tests
> const mockUrl = { createObjectURL: (b) => `blob:http://app.com/uuid-123` };
> const res = createDownloadableJsonBlob({ report: "sales" }, mockUrl);
>
> console.assert(res.objectUrl === "blob:http://app.com/uuid-123", "Test 1 Failed");
> console.assert(res.sizeBytes > 0, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Blob Constructor Syntax**: new Blob([parts], { type: mimeType }) creates immutable binary blob object.
> 2. **URL.createObjectURL()**: Generates temporary blob: URI pointing to in-memory Blob file for browser download links.
> 3. **Memory Management (revokeObjectURL)**: URL.revokeObjectURL(url) must be called when download finishes to release memory.
---

## 6. Related Terms
- [FormData & Multipart Uploads](../level_05/formdata.md) — The payload format used to send files back to the server.
- [Binary vs Text Formats](binary_vs_text_formats.md) — The network data serialization paradigms.

---

## 7. Key Takeaways
- Use Blobs to represent opaque, immutable file-like data in the browser.
- Use `URL.createObjectURL(blob)` to map a binary Blob to a local URL for rendering or downloading.
- Use ArrayBuffers to represent raw, fixed-length memory blocks for byte-level manipulation.
- Access and modify ArrayBuffer memory by wrapping it in a TypedArray (like `Uint8Array`) or a `DataView`.
- Do not attempt to read index indices directly from an ArrayBuffer wrapper.
