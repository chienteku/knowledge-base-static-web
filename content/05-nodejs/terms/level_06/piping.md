# Piping (.pipe())

> **Level 6 — Data Handling**
> A powerful Node.js method that automatically attaches a Readable Stream to a Writable Stream, managing the flow of data perfectly without overwhelming the server's RAM.

---

## 1. Prerequisites
- [Readable & Writable Streams](readable_writable.md) — You are connecting these two exact things.

---

## 2. Term Category

**Node.js API Method (Node.js Server Code)**: Piping (.pipe()) is a fundamental concept in this technology stack. **Level 6 — Data Handling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you want to copy a massive 10GB file, you could manually write code to listen to the `'data'` event on a Readable Stream, and then immediately call `.write()` on a Writable Stream.
```javascript
readStream.on('data', (chunk) => {
  writeStream.write(chunk);
});
```
However, this creates a massive problem called **Backpressure**. If your hard drive reads data at 500MB/s, but your network connection can only write data at 5MB/s, the Readable Stream will overwhelm the Writable Stream. The excess data gets stuck in RAM, and your server crashes.
Node.js invented **`.pipe()`** to solve this. It acts like a smart valve. If the Writable Stream is too slow, `.pipe()` automatically pauses the Readable Stream until the writer catches up!

### (2) The Syntax
Piping is beautifully simple. You take the Source (Readable), and you `.pipe()` it to the Destination (Writable).
```javascript
const fs = require('fs');

const readStream = fs.createReadStream('massive-movie.mp4');
const writeStream = fs.createWriteStream('copy-of-movie.mp4');

// The magic one-liner:
readStream.pipe(writeStream);
```
Node.js handles reading the chunks, writing the chunks, managing Backpressure, and even automatically calling `.end()` when the file is finished!

### (3) Chaining Pipes
Because Transform Streams are both Readable and Writable, you can chain `.pipe()` together like a factory assembly line.
Example: Read a file $\rightarrow$ Zip it $\rightarrow$ Send it to the user.
```javascript
readStream
  .pipe(gzipCompressor)
  .pipe(res); // 'res' is the user's browser
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Ignoring Error Events on Pipes

**The mistake:** A developer writes `readStream.pipe(res)` to send a file to a user. Halfway through the download, the user's internet disconnects. The server crashes.

**Why it's wrong:** `pipe()` automatically handles closing the streams on success, but it does **not** automatically handle errors! If the destination disappears, the pipe breaks and throws an Unhandled Error, crashing the app.
**Golden Rule:** Always attach a `.on('error')` listener to your streams, or use the modern `pipeline()` utility from the `stream` module which safely handles errors automatically.

---



### Mistake 2: Omitting Error Handlers on Intermediate Pipe Streams

**The mistake:** Writing `src.pipe(gzip).pipe(dest)` without error handling.

**Why it's wrong:** `pipe()` only forwards data, not errors. Unhandled stream errors on `gzip` or `src` cause unhandled error crashes and leak open file descriptors.

*Incorrect:*
```javascript
fs.createReadStream('file.txt').pipe(res); // ❌ Unhandled read stream error crashes process!
```

*Fix:*
```javascript
const { pipeline } = require('stream');
pipeline(fs.createReadStream('file.txt'), res, (err) => {
  if (err) console.error('Pipeline failed:', err);
});
```

### Mistake 3: Attempting to Pipe to a Stream That Is Already Closed or Ended

**The mistake:** Piping a readable stream to an HTTP `res` object after `res.end()` has already been called.

**Why it's wrong:** Piping to a closed/finished stream throws `ERR_STREAM_WRITE_AFTER_END`.

*Incorrect:*
```javascript
res.end();
stream.pipe(res); // ❌ ERR_STREAM_WRITE_AFTER_END!
```

*Fix:*
```javascript
stream.pipe(res); // Pipe before ending response
```

## 5. Practice Exercises

### Exercise 1: Safe Stream Pipe Error Handling Helper

**Scenario:** Wraps Node.js `stream.pipeline()` to safely pipe streams with automatic error destruction and callback resolution.

**Requirements:**
1. Write safePipeline(readable, transform, writable, pipelineFn).
2. Pipe streams using `pipeline()`.
3. Ensure proper cleanup on error.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safePipeline(readable, transform, writable, pipelineFn) {
>   const pipeImpl = pipelineFn || require("stream").pipeline;
>
>   return new Promise((resolve, reject) => {
>     pipeImpl(readable, transform, writable, (err) => {
>       if (err) return reject(err);
>       resolve({ success: true });
>     });
>   });
> }
>
> // Verification tests
> const mockPipeline = (r, t, w, cb) => {
>   cb(null); // Success
> };
>
> safePipeline({}, {}, {}, mockPipeline).then(res => {
>   console.assert(res.success === true, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **`readable.pipe()` Limitation**: `src.pipe(dest)` does NOT forward errors; if `src` fails, `dest` stays open, leaking memory.
> 2. **`stream.pipeline()` Utility**: Safely pipes streams, destroying all streams in the chain if any stream emits an error.
> 3. **Resource Cleanup**: Guarantees file handles and sockets close cleanly on pipeline failures.
> 
---

### Exercise 2: Multi-Stream Compression & Encryption Pipeline

**Scenario:** Chains multiple transform streams together: `ReadStream -> Gzip -> Encrypt -> WriteStream`.

**Requirements:**
1. Write executeCompressionPipeline(srcStream, gzipStream, encryptStream, destStream, mockPipeline).
2. Chain 4 streams in sequence.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function executeCompressionPipeline(srcStream, gzipStream, encryptStream, destStream, mockPipeline) {
>   const pipelineFn = mockPipeline || require("stream").pipeline;
>
>   return new Promise((resolve, reject) => {
>     pipelineFn(srcStream, gzipStream, encryptStream, destStream, (err) => {
>       if (err) return reject(err);
>       resolve({ pipelineCompleted: true });
>     });
>   });
> }
>
> // Verification tests
> const mockPipeline = (s, g, e, d, cb) => cb(null);
>
> executeCompressionPipeline({}, {}, {}, {}, mockPipeline).then(res => {
>   console.assert(res.pipelineCompleted === true, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Stream Chaining**: Pipes output of one stream directly to input of next stream.
> 2. **Memory Efficiency**: Compresses and encrypts gigabytes of data on the fly using ~64KB of RAM.
> 3. **Composability**: Modular streams can be re-ordered or swapped easily.
> 
---

### Exercise 3: Dynamic Unpiping and Redirection

**Scenario:** Demonstrates unpiping a stream from an old destination and piping to a new destination dynamically.

**Requirements:**
1. Write redirectPipeOutput(readableMock, oldDestMock, newDestMock).
2. Unpipe oldDestMock.
3. Pipe to newDestMock.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function redirectPipeOutput(readableMock, oldDestMock, newDestMock) {
>   readableMock.unpipe(oldDestMock);
>   readableMock.pipe(newDestMock);
>
>   return {
>     redirected: true
>   };
> }
>
> // Verification tests
> let unpiped = false;
> let pipedNew = false;
>
> const mockR = {
>   unpipe: (d) => { unpiped = true; },
>   pipe: (d) => { pipedNew = true; }
> };
>
> redirectPipeOutput(mockR, {}, {});
> console.assert(unpiped === true && pipedNew === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **readable.unpipe()**: Disconnects writable stream from readable stream source.
> 2. **Dynamic Traffic Rerouting**: Allows redirecting live audio/video streams to backup recording destinations.
> 3. **Clean Disconnection**: Unpiping stops data flow to old destination without closing the readable stream.
## 6. Related Terms
- [Readable & Writable Streams](readable_writable.md) — The two ends of the pipe.
- [Backpressure](backpressure.md) — Related concept: Backpressure.
- [Duplex & Transform Streams](duplex_transform_streams.md) — Related concept: Duplex & Transform Streams.
- [Streams (General Concept)](streams.md) — Related concept: Streams (General Concept).

---

## 7. Key Takeaways
- **`.pipe()`** connects a Readable stream directly to a Writable stream.
- It automatically manages **Backpressure** (pausing the reader if the writer is too slow).
- It automatically closes the Writable stream when the Readable stream is finished.
- You can chain multiple `.pipe()` calls together if you use Transform streams (like compressors).
