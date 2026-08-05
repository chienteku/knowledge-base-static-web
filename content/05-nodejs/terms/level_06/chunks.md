# Data Chunks

> **Level 6 — Data Handling**
> A fragment of raw binary data (a Buffer) emitted by a Stream. It represents a single puzzle piece of a larger file.

---

## 1. Prerequisites
- [Buffers](buffers.md) — A chunk is literally just a Buffer object.
- [Streams (General Concept)](streams.md) — Streams produce these chunks.
---

## 2. Term Category
- **Concept / Data Structure**

---

## 3. Environment Context
- **Stream Processing**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The True Identity

**Problem:** You write `readStream.on('data', (chunk) => { console.log(typeof chunk); });`. What exact data structure does Node.js output to the console?

**Expected output:**
> [!check]- Answer
> ```text
> An `object` (Specifically, an instance of the `Buffer` class). 
> A chunk is not a String! It is raw binary Buffer data.
> ```
> - Remember what streams are made of (1s and 0s).

---



### Exercise 2: Configuring highWaterMark Chunk Threshold

**Problem:** Write code to create a file read stream with a small 1KB (1024 bytes) `highWaterMark` chunk threshold.

**Expected output:**
> [!check]- Answer
> ```text
> const stream = fs.createReadStream('file.txt', { highWaterMark: 1024 });
> ```
> ```javascript
> const stream = fs.createReadStream('file.txt', { highWaterMark: 1024 });
> ```
>
> **Explanation:** `highWaterMark` configures internal buffer size limits for stream chunks.

---

### Exercise 3: Default Stream highWaterMark Sizes

**Problem:** What are default `highWaterMark` buffer sizes for binary file streams vs objectMode streams in Node.js?

**Expected output:**
> [!check]- Answer
> ```text
> Binary streams: 64KB (65536 bytes); ObjectMode streams: 16 objects.
> ```
> ```text
> Binary streams: 64KB (65536 bytes)
> ObjectMode streams: 16 objects
> ```
>
> **Explanation:** Default highWaterMark specifies byte thresholds for binary buffers vs item count for object streams.

## 7. Related Terms
- [Buffers](buffers.md) — What a chunk actually is.
- [Streams (General Concept)](streams.md) — The system that produces chunks.
- [Character Encoding & Buffer ↔ String](buffer_encoding.md) — Related concept: Character Encoding & Buffer ↔ String.
---

## 8. Key Takeaways
- A **Chunk** is a small piece of a larger file, emitted by a Stream.
- Under the hood, a chunk is just a **Buffer** object.
- By default, Node.js file streams use a 64KB chunk size.
- Be careful when parsing text streams, as words and JSON objects can be cut in half across two different chunks.
- Never save all chunks into an array, as this defeats the purpose of streaming and crashes your RAM.
