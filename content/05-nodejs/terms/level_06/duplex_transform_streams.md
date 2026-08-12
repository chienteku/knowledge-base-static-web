# Duplex & Transform Streams

> **Level 6 — Data Handling**
> Streams that both read and write / transform data mid-flow (e.g. gzip).

---

## 1. Prerequisites
- [Readable & Writable Streams](readable_writable.md) — The fundamental unidirectional stream classes.
- [Piping (.pipe())](piping.md) — The pipeline chaining mechanisms.

---

## 2. Term Category

**Data Handling (Node.js Core Architecture .)**: Duplex & Transform Streams is a fundamental concept in this technology stack. **Level 6 — Data Handling**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Custom Line Transform Stream

**Scenario:** Creates a Node.js `Transform` stream subclass that converts text stream chunks to uppercase on the fly.

**Requirements:**
1. Write createUppercaseTransformStream(TransformClass).
2. Override `_transform(chunk, encoding, callback)`.
3. Push uppercase chunk.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createUppercaseTransformStream(TransformClass) {
>   const Transform = TransformClass || require("stream").Transform;
>
>   class UppercaseTransform extends Transform {
>     _transform(chunk, encoding, callback) {
>       try {
>         const uppercaseText = chunk.toString("utf-8").toUpperCase();
>         this.push(Buffer.from(uppercaseText));
>         callback();
>       } catch (err) {
>         callback(err);
>       }
>     }
>   }
>
>   return new UppercaseTransform();
> }
>
> // Verification tests
> const Transform = require("stream").Transform;
> const transformStream = createUppercaseTransformStream(Transform);
>
> let output = "";
> transformStream.on("data", (chunk) => { output += chunk.toString(); });
> transformStream.write("hello world");
> transformStream.end();
>
> setImmediate(() => {
>   console.assert(output === "HELLO WORLD", "Test 1 Failed: Uppercase transform failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Transform Stream Concept**: A Duplex stream where output is computed directly from input (e.g., zlib compression, crypto encryption).
> 2. **`_transform` Method**: Receives incoming chunk, modifies it, and calls `this.push(modifiedChunk)` before invoking `callback()`.
> 3. **Stream Chaining**: Transform streams sit in the middle of `.pipe()` chains (Readable -> Transform -> Writable).
> 
---

### Exercise 2: TCP Socket Duplex Stream Channel

**Scenario:** Simulates a Duplex stream (e.g. `net.Socket`) that supports reading and writing independently over a single TCP connection.

**Requirements:**
1. Write createDuplexSocketSimulator(DuplexClass).
2. Simulate independent read/write operations.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createDuplexSocketSimulator(DuplexClass) {
>   const Duplex = DuplexClass || require("stream").Duplex;
>
>   const writtenData = [];
>   const duplexStream = new Duplex({
>     read(size) {},
>     write(chunk, encoding, callback) {
>       writtenData.push(chunk.toString("utf-8"));
>       callback();
>     }
>   });
>
>   return {
>     duplexStream,
>     getWrittenData: () => writtenData,
>     pushIncomingData: (dataStr) => duplexStream.push(Buffer.from(dataStr))
>   };
> }
>
> // Verification tests
> const Duplex = require("stream").Duplex;
> const sim = createDuplexSocketSimulator(Duplex);
>
> let readText = "";
> sim.duplexStream.on("data", (chunk) => { readText += chunk.toString(); });
>
> sim.duplexStream.write("Outgoing Command");
> sim.pushIncomingData("Incoming Response");
>
> setImmediate(() => {
>   console.assert(sim.getWrittenData()[0] === "Outgoing Command", "Test 1 Failed");
>   console.assert(readText === "Incoming Response", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Duplex Stream Concept**: Implements both Readable and Writable interfaces simultaneously (e.g. TCP sockets, WebSockets).
> 2. **Independent Read/Write Channels**: Reading and writing operate on independent internal buffers.
> 3. **Full-Duplex Networking**: Allows two-way concurrent communication between client and server.
> 
---

### Exercise 3: PassThrough Stream Inspection & Logging

**Scenario:** Uses a `PassThrough` stream to tap into a video/file stream for byte counting without altering the data stream.

**Requirements:**
1. Write createPassThroughMeter(PassThroughClass).
2. Track total bytes passed through stream.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createPassThroughMeter(PassThroughClass) {
>   const PassThrough = PassThroughClass || require("stream").PassThrough;
>   const meterStream = new PassThrough();
>
>   let totalBytes = 0;
>   meterStream.on("data", (chunk) => {
>     totalBytes += chunk.length;
>   });
>
>   return {
>     meterStream,
>     getTotalBytes: () => totalBytes
>   };
> }
>
> // Verification tests
> const PassThrough = require("stream").PassThrough;
> const meter = createPassThroughMeter(PassThrough);
>
> meter.meterStream.write("12345");
> meter.meterStream.write("67890");
>
> setImmediate(() => {
>   console.assert(meter.getTotalBytes() === 10, "Test 1 Failed: Byte meter must count 10 bytes");
> });
> ```
>
> #### Technical Explanation
>
> 1. **PassThrough Stream**: Trivial implementation of Transform stream that passes input bytes to output without modification.
> 2. **Stream Tapping**: Used for logging, byte counting, or splitting streams into multiple outputs (`stream.pipe(meter1)`, `stream.pipe(meter2)`).
> 3. **Zero Overhead Inspection**: Allows monitoring stream metrics without corrupting binary data payloads.
## 6. Related Terms
- [Piping (.pipe())](piping.md) — The method used to link readable, transform, and writable streams together.
- [Readable & Writable Streams](readable_writable.md) — The base classes for unidirectional data streams.

---

## 7. Key Takeaways
- Duplex streams combine independent reading and writing channels into one class (e.g. TCP sockets).
- Transform streams are Duplex streams that modify data on the fly (e.g. Gzip compression, cryptography).
- Duplex streams have separate read/write paths; writing to them does not populate their read buffer.
- Transform streams link input and output using a `_transform()` function.
- Transform streams allow memory-efficient, chunk-by-chunk data processing.
