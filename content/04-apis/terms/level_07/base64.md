# Base64 Encoding

> **Level 7 — Data Formats & Serialization**
> A simple mathematical algorithm used to convert complex binary data (like images or files) into a safe string of standard ASCII text so it can be transmitted over HTTP.

---

## 1. Prerequisites
- [Serialization](../level_07/serialization.md) — Base64 is essentially a form of serialization specifically for binary files.
- [JSON](../level_01/json.md) — JSON can only hold text, so if you want to put an image in JSON, you must Base64 encode it.

---

## 2. Term Category
- **Computer Science Concept / Data Formatting**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Encoding vs Encryption

**Problem:** You are building a login system. You don't want the database admin to see the user's passwords. You run the passwords through a Base64 encoder and save the resulting string (`cGFzc3dvcmQxMjM=`) in the database. Why are you fired the next day?

**Expected output:**
```text
Because Base64 is not encryption! 
Any hacker (or the database admin) can take that string, paste it into an online Base64 Decoder, and instantly see the original password ("password123"). You must use a one-way hashing algorithm (like bcrypt) for passwords!
```

> [!check]- Answer
> - Does Base64 require a secret key to decode? (No).

---

### Exercise 2: Base64 Overhead Size Calculation

**Problem:** Calculate the approximate size increase percentage when converting binary data into Base64 encoded text.

**Expected output:**
```text
33% size increase (4 bytes of text generated for every 3 bytes of binary data).
```

> [!check]- Answer
> ```text
> 33% size increase (Ratio of 4:3 -> 4/3 = 133.3%).
> ```
> - **Explanation:** Base64 expands binary size by ~33% due to encoding 6 bits per character.
---

### Exercise 3: Base64 Padding Character

**Problem:** What is the purpose of the trailing equals sign (`=`) padding characters in Base64 strings?

**Expected output:**
```text
Padding (`=` or `==`) pads the input to a multiple of 4 output characters when the binary byte length is not divisible by 3.
```

> [!check]- Answer
> ```text
> Padding (`=` or `==`) pads the input to a multiple of 4 output characters when the binary byte length is not divisible by 3.
> ```
> - **Explanation:** Equals signs pad Base64 character blocks to align with 4-byte boundaries.
---

## 7. Related Terms
- [Basic Authentication](../level_04/basic_bearer_auth.md) — Basic Auth literally uses Base64 to combine the username and password into the header.
- [JWT](../level_04/jwt.md) — The Header and Payload of a JSON Web Token are Base64 encoded (which is why anyone can read them!).

---

## 8. Key Takeaways
- **Base64** converts raw binary files (images, PDFs) into a safe string of text.
- It allows non-text data to be sent inside JSON payloads.
- It increases file size by ~33%, so it should only be used for small files.
- **It is NOT encryption.** It provides zero security.
