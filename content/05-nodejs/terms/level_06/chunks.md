# Data Chunks

> **Level 6 — Data Handling**
> A fragment of raw binary data (a Buffer) emitted by a Stream. It represents a single puzzle piece of a larger file.

---

## 1. Prerequisites
- [Buffers](buffers.md) — A chunk is literally just a Buffer object.
- [Streams (General Concept)](streams.md) — Streams produce these chunks.

---

## 2. Term Category

**Concept / Data Structure (Stream Processing)**: Data Chunks is a fundamental concept in this technology stack. **Level 6 — Data Handling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If a Stream's job is to avoid loading a 10GB file into memory all at once, it must cut that file into smaller pieces. These pieces are called **Chunks**.
By default, the `fs.createReadStream` module cuts files into chunks that are exactly **64 Kilobytes** (65,536 bytes) in size. 
If you stream a 1MB file, the Stream will emit approximately 16 separate chunks, one after the other.

### (2) The Problem with Chunks
Chunks are blind. If you are streaming a text file containing the sentence `"Hello World"`, it is entirely possible that Chunk #1 contains `"Hello W"` and Chunk #2 contains `"orld"`. 
If you are parsing a massive JSON file or a CSV file, a single JSON object might be brutally ripped in half across two different chunks.

### (3) Handling Chunks Safely
If you try to process string data chunk-by-chunk blindly, you will corrupt your data. 
```javascript
// DANGEROUS! The word "World" might be split in half!
readStream.on('data', (chunk) => {
  if (chunk.toString().includes("World")) {
    console.log("Found it!");
  }
});
```
To solve this, developers use specialized Transform streams (like the `readline` module) which collects the chunks in the background, waits for a `\n` (newline) character, and only *then* passes you a complete, unbroken string of text!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Memory Leaking by concatenating all chunks

**The mistake:** A developer is scared of processing partial chunks. So, they create an empty array, push every single chunk into the array, and join them together at the end.
```javascript
const allChunks = [];
readStream.on('data', chunk => allChunks.push(chunk));
readStream.on('end', () => Buffer.concat(allChunks));
```

**Why it's wrong:** You just defeated the entire purpose of Streams! By saving every single chunk into an array, you are loading the entire massive file into RAM. If the file is 4GB, your server will crash with an Out Of Memory error just as if you had used `fs.readFile`.
**Golden Rule:** A Stream's purpose is to process a chunk and immediately *discard* it. Never store all chunks in memory.

---



### Mistake 2: Assuming Stream Chunks Are Equal Fixed Sizes

**The mistake:** Assuming every chunk received in `stream.on('data', chunk => ...)` has an identical byte length.

**Why it's wrong:** Chunk size depends on network TCP packet fragmentation, disk speed, and buffer configurations (`highWaterMark`). Chunks vary unpredictably in size.

*Incorrect:*
```javascript
// Expecting chunk.length to always equal 64KB exactly
```

*Fix:*
```javascript
// Process chunks dynamically as variable-length Buffer segments
```

### Mistake 3: Accumulating All Chunks in Memory Arrays for Large Streams (Memory Bloat)

**The mistake:** Pushing all incoming stream chunks into a global array `chunks.push(chunk)` for a 10GB file.

**Why it's wrong:** Collecting all chunks defeats the fundamental memory benefit of streaming data in chunks, leading to V8 heap exhaustion.

*Incorrect:*
```javascript
const chunks = [];
stream.on('data', (c) => chunks.push(c)); // ❌ Defeats streaming memory benefit!
```

*Fix:*
```javascript
// Process each chunk on arrival or pipe directly to destination stream:
stream.pipe(destination);
```

## 5. Practice Exercises

### Exercise 1: Fixed-Size Stream Chunking Buffer

**Scenario:** Splits incoming byte streams into uniform fixed-size binary chunks (e.g. 64KB blocks for cloud storage upload).

**Requirements:**
1. Write chunkBinaryData(buffer, chunkSize).
2. Iterate buffer using step chunkSize.
3. Return array of chunk Buffers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function chunkBinaryData(buffer, chunkSize = 64) {
>   if (!Buffer.isBuffer(buffer)) {
>     throw new TypeError("Expected a Buffer instance");
>   }
>
>   const chunks = [];
>   for (let i = 0; i < buffer.length; i += chunkSize) {
>     chunks.push(buffer.subarray(i, i + chunkSize));
>   }
>
>   return {
>     totalChunks: chunks.length,
>     chunkSize,
>     chunks
>   };
> }
>
> // Verification tests
> const dataBuf = Buffer.alloc(150, 0xaa);
> const res = chunkBinaryData(dataBuf, 64);
>
> console.assert(res.totalChunks === 3, "Test 1 Failed: 150 bytes / 64 = 3 chunks (64 + 64 + 22)");
> console.assert(res.chunks[2].length === 22, "Test 2 Failed: Final chunk size 22");
> ```
>
> #### Technical Explanation
>
> 1. **Stream Chunks**: Streams process binary data in discrete blocks called chunks (typically 16KB to 64KB).
> 2. **Chunk Slicing Efficiency**: Using `subarray()` slices chunks without allocating new RAM.
> 3. **Batch Chunk Uploads**: Chunking allows uploading multi-gigabyte files to S3/GCS in parallel multipart blocks.
> 
---

### Exercise 2: Delimiter-Based Stream Chunk Splitter

**Scenario:** Parses incoming stream chunks and splits them by newline delimiters (`\n`) for log processing.

**Requirements:**
1. Write processLineDelimitedChunk(chunkStr, overflowBuffer).
2. Split by `\n`.
3. Return completed lines and leftover overflow string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processLineDelimitedChunk(chunkStr = "", overflowBuffer = "") {
>   const combined = overflowBuffer + chunkStr;
>   const lines = combined.split("
> ");
>   const leftover = lines.pop(); // Keep incomplete trailing line
>
>   return {
>     lines,
>     leftover
>   };
> }
>
> // Verification tests
> const chunk1 = "LINE_1
> LINE_2
> INCOM";
> const r1 = processLineDelimitedChunk(chunk1, "");
> console.assert(r1.lines.length === 2, "Test 1 Failed");
> console.assert(r1.leftover === "INCOM", "Test 2 Failed");
>
> const chunk2 = "PLETE_LINE_3
> LINE_4
> ";
> const r2 = processLineDelimitedChunk(chunk2, r1.leftover);
> console.assert(r2.lines[0] === "INCOMPLETE_LINE_3", "Test 3 Failed: Combined leftover with next chunk");
> ```
>
> #### Technical Explanation
>
> 1. **Chunk Boundary Incompleteness**: Stream chunks break at arbitrary byte boundaries, requiring buffering incomplete trailing data.
> 2. **Overflow Buffer Pattern**: Prepending leftover bytes from previous chunk ensures valid line/record parsing.
> 3. **Stream Parsing Resilience**: Essential for NDJSON (Newline Delimited JSON) and log stream ingestion.
> 
---

### Exercise 3: Stream Chunk Collector & Aggregator

**Scenario:** Buffers all incoming stream data chunks into an array and concatenates them into a single Buffer upon completion.

**Requirements:**
1. Write collectStreamChunks(readableStreamMock).
2. Listen for `data` events.
3. Concat chunks on `end`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function collectStreamChunks(readableStreamMock) {
>   return new Promise((resolve, reject) => {
>     const chunks = [];
>
>     readableStreamMock.on("data", (chunk) => {
>       chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
>     });
>
>     readableStreamMock.on("end", () => {
>       const fullBuffer = Buffer.concat(chunks);
>       resolve({
>         chunkCount: chunks.length,
>         totalBytes: fullBuffer.length,
>         buffer: fullBuffer
>       });
>     });
>
>     readableStreamMock.on("error", (err) => reject(err));
>   });
> }
>
> // Verification tests
> const events = {};
> const mockStream = {
>   on: (e, fn) => { events[e] = fn; }
> };
>
> const promise = collectStreamChunks(mockStream);
> events["data"](Buffer.from("Hello "));
> events["data"](Buffer.from("World"));
> events["end"]();
>
> promise.then(res => {
>   console.assert(res.chunkCount === 2, "Test 1 Failed");
>   console.assert(res.totalBytes === 11, "Test 2 Failed");
>   console.assert(res.buffer.toString("utf-8") === "Hello World", "Test 3 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Buffer.concat Optimization**: Buffer.concat allocates a single contiguous buffer and copies chunk arrays efficiently.
> 2. **Memory Footprint Warning**: Collecting all stream chunks into RAM negates streaming memory benefits; only use for small files.
> 3. **Data Event Flow**: Emits 'data' events whenever a chunk is ready in readable stream buffer.
## 6. Related Terms
- [Buffers](buffers.md) — What a chunk actually is.
- [Streams (General Concept)](streams.md) — The system that produces chunks.
- [Character Encoding & Buffer ↔ String](buffer_encoding.md) — Related concept: Character Encoding & Buffer ↔ String.

---

## 7. Key Takeaways
- A **Chunk** is a small piece of a larger file, emitted by a Stream.
- Under the hood, a chunk is just a **Buffer** object.
- By default, Node.js file streams use a 64KB chunk size.
- Be careful when parsing text streams, as words and JSON objects can be cut in half across two different chunks.
- Never save all chunks into an array, as this defeats the purpose of streaming and crashes your RAM.
