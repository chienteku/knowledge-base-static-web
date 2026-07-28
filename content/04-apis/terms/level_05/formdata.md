# FormData & Multipart Uploads

> **Level 5 — Fetching Data (Client-Side)**
> Sending files/binary instead of JSON.

---

## 1. Prerequisites
- [Request Body & Payloads](../level_02/request_body.md) — The request message container formats.
- [The fetch() API](./fetch.md) — The network query tool.

---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Universal**: Supported in browsers and modern server-side environment parsers (like Multer in Node/Express).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard modern APIs exchange data using JSON (`application/json`). However, JSON is a strict text-based format. If you want to send binary files (like a PDF contract or a JPEG profile photo), you cannot place them directly into a standard JSON string.

To send a file via JSON, you must encode the binary data into a text string (using **Base64 Encoding**). This has major performance drawbacks:
- Base64 encoding increases file payload sizes by roughly **33%**, consuming more bandwidth.
- Encoding and decoding large files in memory consumes significant CPU resources, slowing down mobile clients and servers.

To upload files efficiently without text bloat, web standards use **`FormData`** and the **`multipart/form-data`** payload format:
- **`FormData` API:** A browser utility class that constructs a set of key-value pairs representing form inputs.
- **`multipart/form-data`:** A MIME type that instructs the browser to divide the request body into separate segments separated by unique **boundary strings** (e.g. `----WebKitFormBoundaryXYZ`). Each segment contains its own local headers (like the file name and type) followed by raw, un-encoded binary data.

---

### (2) Reality Metaphor
Imagine mailing multiple different items (a document, a shirt, and a liquid bottle) to a friend.
- **Base64 JSON** is like **blending all the items** into a uniform gray powder, shipping the powder, and expecting your friend to chemically separate the powder back into a shirt and a bottle of liquid. It is slow and consumes massive effort.
- **FormData / Multipart** is like packing the items into a **bento box with rigid plastic dividers (boundaries)**. One compartment holds the document (text), another holds the shirt (metadata), and a sealed section holds the liquid bottle (raw binary). Everything travels in a single package but stays in its own compartment.

---

### (3) JavaScript & HTTP Implementation

#### 1. Client-side Fetch Uploading a File
```javascript
async function uploadAvatar() {
  const fileInput = document.querySelector('#avatar-file');
  const file = fileInput.files[0];
  
  if (!file) return;

  // 1. Create a FormData instance
  const formData = new FormData();
  
  // 2. Append text fields and the binary file
  formData.append('username', 'Alice');
  formData.append('avatar', file); // File object appended directly

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      // 3. DO NOT set Content-Type header manually here!
      body: formData 
    });
    console.log("Upload complete!");
  } catch (err) {
    console.error("Upload failed:", err);
  }
}
```

#### 2. The Raw Request Structure sent over the network
When you pass a `FormData` object to `fetch`, the browser formats the raw TCP body like this:

```text
POST /api/upload HTTP/1.1
Host: example.com
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YW

------WebKitFormBoundary7MA4YW
Content-Disposition: form-data; name="username"

Alice
------WebKitFormBoundary7MA4YW
Content-Disposition: form-data; name="avatar"; filename="avatar.jpg"
Content-Type: image/jpeg

[RAW BINARY BYTES OF THE IMAGE HERE]
------WebKitFormBoundary7MA4YW--
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Manually setting the `Content-Type: multipart/form-data` header

**The mistake:** Explicitly configuring the headers object in fetch when sending a `FormData` payload:
```javascript
// WRONG!
fetch('/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' }, // DO NOT DO THIS
  body: formData
});
```

**Why it's wrong:** The browser needs to append the unique boundary parameter (`boundary=----WebKitFormBoundary...`) to the header so the server knows how to split the incoming segments. If you hardcode `Content-Type: multipart/form-data`, the browser's automatic boundary generation is skipped, causing the server to fail to parse the body boundary and reject the upload.

*Fix:* Omit the `Content-Type` header entirely. The browser detects the `FormData` body type and configures the header and boundary parameters automatically.

---

### Mistake 2: Attempting to Inspect `FormData` Objects using Direct `console.log(formData)`

**The mistake:** Writing `console.log(formData)` expecting to see a printed JSON key-value object in DevTools.

**Why it's wrong:** `FormData` is an opaque iterable object. Logging it directly displays an empty `FormData {}` instance. Inspect entries using `Array.from(formData.entries())` or `for (let [k,v] of formData)`. 

*Incorrect:*
```javascript
const form = new FormData(formElement);
console.log(form); // ❌ Prints empty FormData {} in console!
```

*Fix:*
```javascript
const form = new FormData(formElement);
console.log(Array.from(form.entries())); // Prints array of [key, value] pairs
```

---

### Mistake 3: Manually Setting `Content-Type: multipart/form-data` When Sending `FormData` with Fetch

**The mistake:** Adding `headers: { 'Content-Type': 'multipart/form-data' }` when passing `body: formData` to `fetch()`. 

**Why it's wrong:** Manually setting `Content-Type` strips the mandatory boundary string, causing backend multipart parsers to fail.

*Incorrect:*
```javascript
fetch('/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' }, // ❌ Strips boundary string!
  body: formData
});
```

*Fix:*
```javascript
fetch('/upload', {
  method: 'POST',
  body: formData // Browser automatically sets Content-Type with boundary parameter
});
```


---

## 6. Practice Exercises

### Exercise 1: Form Append Audit

**Problem:** Review this code designed to send a file to the server. Find the bug that will cause the server to fail to extract the file correctly:

```javascript
const form = new FormData();
form.append('description', 'User document');
form.append('doc', document.querySelector('#doc-input').value); // <-- Look here!

fetch('/api/doc', { method: 'POST', body: form });
```

> [!check]- Answer
> - `.value` on a file input element only returns a dummy text path string (like `C:\fakepath\file.txt`).
> - To grab the actual file object, access the element's `.files` array.

> [!check]- Answer
> - **The `.value` bug.** On line 3, calling `.value` appends a plain text string representing the filename. To upload the actual binary file, replace it with `document.querySelector('#doc-input').files[0]`.


---

### Exercise 2: FormData Construction and Append Pattern

**Problem:** Write JS snippet appending text field `username: 'Alice'` and file input `avatar` to a `FormData` object.

**Expected output:**
> [!check]- Answer
> ```text
> const data = new FormData(); data.append('username', 'Alice'); data.append('avatar', fileInput.files[0]);
> ```
> ```javascript
> const data = new FormData();
> data.append('username', 'Alice');
> data.append('avatar', fileInput.files[0]);
> ```
> - **Explanation:** `.append(key, value)` appends text strings and binary File/Blob objects.
---

### Exercise 3: FormData Conversion to URLSearchParams

**Problem:** Write single line converting `FormData` object to URL-encoded query string format.

**Expected output:**
> [!check]- Answer
> ```text
> const query = new URLSearchParams(formData).toString();
> ```
> ```javascript
> const query = new URLSearchParams(formData).toString();
> ```
> - **Explanation:** `URLSearchParams` accepts `FormData` instances directly for URL-encoding.
---

## 7. Related Terms
- [Content-Type & MIME Types](../level_02/content_type.md) — The media type descriptors.
- [Base64 Encoding](../level_07/base64.md) — The alternative text-based binary transport encoding method.

---

## 8. Key Takeaways
- FormData allows sending text fields and binary files together in a single request body.
- It is significantly more performance-efficient than converting files to Base64 JSON text.
- The `multipart/form-data` format isolates fields using distinct boundary delimiters.
- Always omit the `Content-Type` header when sending `FormData` to let the browser configure the boundary parameter automatically.
- Read files on the client using file input nodes and append them directly to the `FormData` object.
