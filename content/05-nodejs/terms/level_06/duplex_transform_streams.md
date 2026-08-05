# Duplex & Transform Streams

> **Level 6 — Data Handling**
> Streams that both read and write / transform data mid-flow (e.g. gzip).

---

## 1. Prerequisites
- [Readable & Writable Streams](readable_writable.md) — The fundamental unidirectional stream classes.
- [Piping (.pipe())](piping.md) — The pipeline chaining mechanisms.

---

## 2. Term Category
- **Data Handling**

---

## 3. Environment Context
- **Node.js Core Architecture** (Native stream classes implemented within Node's built-in `stream` core module).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Readable streams are read-only (like reading a file) and Writable streams are write-only (like saving to a file). 

However, many operations require streams that support both reading and writing, or streams that modify data on the fly. To handle these use cases, Node.js provides **Duplex** and **Transform** streams:

#### 1. Duplex Streams
A stream that inherits from **both** Readable and Writable interfaces.
-   **Behavior:** It has independent read and write channels.
-   **Example:** A **TCP Socket connection** (`net.Socket`). You can write output bytes to the socket (sending a request) while simultaneously reading input bytes from the same socket (receiving responses). The incoming and outgoing data flows do not interfere with each other.

#### 2. Transform Streams
A specialized type of Duplex stream where the input and output are linked, but the data is **modified (transformed) mid-flow**.
-   **Behavior:** When you write data to the writable side, it runs through a custom `_transform()` function. The processed output is then pushed to the readable side for consumption.
-   **Common Examples:**
    -   `zlib.createGzip()`: Compresses a raw data stream into Gzip format on the fly.
    -   `crypto.createCipheriv()`: Encrypts incoming plain text bytes into ciphertext.

---

### (2) Data Flow Comparison

```text
  Duplex Stream:      [ Write Channel ] ────> ( Independent Outflow )
                      [ Read Channel  ] <──── ( Independent Inflow )
                      
  Transform Stream:   [ Write Chunks  ] ───> [ Transform Function ] ───> [ Read Chunks ]
```

---

### (3) Reality Metaphor
Imagine processing mail.
- **A Duplex Stream** is like a **telephone connection**. The phone has a microphone (**write**) and a speaker (**read**). You can talk into the microphone while listening to the speaker. What you say does not affect what you hear; they are independent channels.
- **A Transform Stream** is like a **translation desk**. On the left side of the desk, you place documents written in English (**write**). The translator translates them into Spanish on the fly (**the transform function**), and places the Spanish copies in a tray on the right side of the desk (**read**) for someone else to collect.

---

### (4) Implementation Example: Gzip Compression Pipeline

Piping a file through a Gzip transform stream to write a compressed archive directly to disk:

```javascript
const fs = require('fs');
const zlib = require('zlib');

const readStream = fs.createReadStream('input.txt');
const gzipStream = zlib.createGzip(); // Transform Stream
const writeStream = fs.createWriteStream('input.txt.gz');

// Pipe raw text -> Gzip compressor -> zipped file output
readStream
  .pipe(gzipStream)
  .pipe(writeStream)
  .on('finish', () => {
    console.log("File successfully compressed to Gzip format!");
  });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting a basic Duplex stream to automatically modify data

**The mistake:** Creating or using a standard Duplex stream (like a TCP socket) and assuming that writing data to it will automatically feed the same data (or modified data) into its readable channel.

**Why it's wrong:** In a standard Duplex stream, the read and write buffers are completely disconnected. Writing data to a socket sends it across the network; it does not loop back to your local read buffer. 

*Fix:* If you need to modify input data and output it dynamically, you must use a **Transform** stream (inheriting from `stream.Transform`), not a plain Duplex stream.

---



### Mistake 2: Forgetting to Call `callback()` in Custom Transform Stream `_transform` Methods

**The mistake:** Omitting `callback()` or `this.push()` inside custom `_transform(chunk, encoding, callback)` implementations.

**Why it's wrong:** Calling `callback()` informs the stream engine that the current chunk transformation is finished. Forgetting `callback()` halts stream processing permanently.

*Incorrect:*
```javascript
const transform = new Transform({
  transform(chunk, enc, cb) {
    this.push(chunk.toString().toUpperCase()); // ❌ Missing cb() call! Stream freezes!
  }
});
```

*Fix:*
```javascript
const transform = new Transform({
  transform(chunk, enc, cb) {
    this.push(chunk.toString().toUpperCase());
    cb(); // Inform stream engine chunk is processed
  }
});
```

### Mistake 3: Confusing Duplex Streams with Transform Streams

**The mistake:** Using a standard `Duplex` stream when expecting written input data to automatically transform into output data.

**Why it's wrong:** In a `Duplex` stream, readable and writable channels are independent (like a TCP socket). In a `Transform` stream, output is calculated directly from input data.

*Incorrect:*
```javascript
// Expecting Duplex stream write() to automatically mutate read() output
```

*Fix:*
```javascript
Use Transform stream when input data mutates into output data (e.g. gzip compression)
```

## 6. Practice Exercises

### Exercise 1: Custom Transform Stream

**Problem:** Complete the code below to build a custom Transform stream that converts all incoming text characters to uppercase mid-flow:

```javascript
const { Transform } = require('stream');

// Create custom transform stream
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    // Convert binary chunk to string, uppercase it
    const upperText = chunk.toString().toUpperCase();
    
    // Push the modified data to the readable output channel
    this.push(upperText);
    
    // Signal V8 that processing for this chunk is complete
    callback();
  }
});

// Test the stream
process.stdin.pipe(upperCaseTransform).pipe(process.stdout);
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Creating Uppercase Transform Stream

**Problem:** Create a `Transform` stream that converts text chunks to uppercase.

**Expected output:**
> [!check]- Answer
> ```text
> const upper = new Transform({ transform(chunk, enc, cb) { cb(null, chunk.toString().toUpperCase()); } });
> ```
> ```javascript
> const { Transform } = require('stream');
> const upper = new Transform({
>   transform(chunk, enc, cb) {
>     cb(null, chunk.toString().toUpperCase());
>   }
> });
> ```
>
> **Explanation:** `Transform` stream transforms written input chunks into read output chunks via callback.

---

### Exercise 3: Common Built-in Transform Streams

**Problem:** Name 2 built-in Node.js modules that provide Transform streams.

**Expected output:**
> [!check]- Answer
> ```text
> 1. `zlib` (zlib.createGzip())
> 2. `crypto` (crypto.createCipheriv())
> ```
> ```text
> 1. zlib (e.g. zlib.createGzip())
> 2. crypto (e.g. crypto.createCipheriv())
> ```
>
> **Explanation:** Compression and encryption modules rely on Transform streams to process data in transit.

## 7. Related Terms
- [Piping (.pipe())](piping.md) — The method used to link readable, transform, and writable streams together.
- [Readable & Writable Streams](readable_writable.md) — The base classes for unidirectional data streams.

---

## 8. Key Takeaways
- Duplex streams combine independent reading and writing channels into one class (e.g. TCP sockets).
- Transform streams are Duplex streams that modify data on the fly (e.g. Gzip compression, cryptography).
- Duplex streams have separate read/write paths; writing to them does not populate their read buffer.
- Transform streams link input and output using a `_transform()` function.
- Transform streams allow memory-efficient, chunk-by-chunk data processing.
