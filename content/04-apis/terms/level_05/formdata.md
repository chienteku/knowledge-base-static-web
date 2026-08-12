# FormData & Multipart Uploads

> **Level 5 — Fetching Data (Client-Side)**
> Sending files/binary instead of JSON.

---

## 1. Prerequisites
- [Request Body & Payloads](../level_02/request_body.md) — The request message container formats.
- [The fetch() API](fetch.md) — The network query tool.

---

## 2. Term Category

**Data Format (Universal: Supported in browsers and modern server-side environment parsers .)**: FormData & Multipart Uploads is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Multipart File Upload FormData Constructor

**Scenario:** A file upload module constructs a native `FormData` payload containing binary file buffers and text metadata fields.

**Requirements:**
1. Write buildFileUploadFormData(fileBuffer, filename, metadata).
2. Append file blob/buffer.
3. Append key-value metadata strings.
4. Return FormData instance.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildFileUploadFormData(fileBuffer, filename, metadata = {}) {
>   const formData = new FormData();
>
>   if (fileBuffer) {
>     const blob = new Blob([fileBuffer], { type: "application/octet-stream" });
>     formData.append("file", blob, filename);
>   }
>
>   for (const [key, val] of Object.entries(metadata)) {
>     formData.append(key, String(val));
>   }
>
>   return formData;
> }
>
> // Verification tests
> const buf = Buffer.from("sample image data");
> const fd = buildFileUploadFormData(buf, "avatar.png", { userId: "usr-42" });
>
> console.assert(fd.has("file") === true, "Test 1 Failed: Must append file");
> console.assert(fd.get("userId") === "usr-42", "Test 2 Failed: Must append metadata");
> ```
>
> #### Technical Explanation
>
> 1. **FormData Object Purpose**: Compiles key-value pairs formatted as multipart/form-data for API submission.
> 2. **File Append Syntax**: formData.append(name, blob/file, filename) attaches binary files to payload.
> 3. **Automatic Content-Type Boundary**: When sending FormData via fetch, DO NOT manually set Content-Type header; browser must auto-generate boundary delimiter.
> 
---

### Exercise 2: FormData to URLSearchParams Serialization Adapter

**Scenario:** Converts a FormData instance into a URLSearchParams query string for form-urlencoded endpoints.

**Requirements:**
1. Write formDataToUrlEncoded(formData).
2. Iterate entries.
3. Return url-encoded string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formDataToUrlEncoded(formData) {
>   if (!formData) return "";
>   const params = new URLSearchParams();
>
>   for (const [key, value] of formData.entries()) {
>     if (typeof value === "string") {
>       params.append(key, value);
>     }
>   }
>
>   return params.toString();
> }
>
> // Verification tests
> const fd = new FormData();
> fd.append("username", "alice");
> fd.append("role", "admin");
>
> const encoded = formDataToUrlEncoded(fd);
> console.assert(encoded === "username=alice&role=admin", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **FormData Iteration**: formData.entries() returns an iterator over key/value pairs in the payload.
> 2. **URLSearchParams Conversion**: Converts form fields to application/x-www-form-urlencoded string format.
> 3. **Ignoring Binary Files**: Binary Blob/File entries cannot be serialized to text url-encoded strings.
> 
---

### Exercise 3: FormData Inspection & Validation Linter

**Scenario:** An API validator inspects FormData entries before submission, verifying file size and required field presence.

**Requirements:**
1. Write validateFormDataPayload(formData, requiredFields, maxFileBytes).
2. Validate required text fields.
3. Check file byte sizes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateFormDataPayload(formData, requiredFields = [], maxFileBytes = 5_000_000) {
>   if (!formData) return { valid: false, errors: ["Missing FormData"] };
>
>   const errors = [];
>
>   for (const field of requiredFields) {
>     if (!formData.has(field) || String(formData.get(field)).trim() === "") {
>       errors.push(`Field '${field}' is required`);
>     }
>   }
>
>   for (const [key, value] of formData.entries()) {
>     if (value && typeof value === "object" && typeof value.size === "number") {
>       if (value.size > maxFileBytes) {
>         errors.push(`File '${key}' exceeds max size of ${maxFileBytes} bytes`);
>       }
>     }
>   }
>
>   return { valid: errors.length === 0, errors };
> }
>
> // Verification tests
> const fd = new FormData();
> fd.append("title", "Report");
>
> const res1 = validateFormDataPayload(fd, ["title", "author"]);
> console.assert(res1.valid === false && res1.errors[0].includes("author"), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Pre-Submit Client Validation**: Validates FormData inputs in browser memory before initiating large network uploads.
> 2. **Blob Size Inspection**: File objects in FormData expose size property in bytes for client-side file size guards.
> 3. **Improved User Feedback**: Provides immediate validation feedback without waiting for server response timeouts.
---

## 6. Related Terms
- [Content-Type & MIME Types](../level_02/content_type.md) — The media type descriptors.
- [Base64 Encoding](../level_07/base64.md) — The alternative text-based binary transport encoding method.
- [Blob & ArrayBuffer](../level_07/blob_arraybuffer.md) — Related concept: Blob & ArrayBuffer.

---

## 7. Key Takeaways
- FormData allows sending text fields and binary files together in a single request body.
- It is significantly more performance-efficient than converting files to Base64 JSON text.
- The `multipart/form-data` format isolates fields using distinct boundary delimiters.
- Always omit the `Content-Type` header when sending `FormData` to let the browser configure the boundary parameter automatically.
- Read files on the client using file input nodes and append them directly to the `FormData` object.
