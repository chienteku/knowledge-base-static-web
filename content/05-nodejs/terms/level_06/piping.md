# Piping (.pipe())

> **Level 6 — Data Handling**
> A powerful Node.js method that automatically attaches a Readable Stream to a Writable Stream, managing the flow of data perfectly without overwhelming the server's RAM.

---

## 1. Prerequisites
- [Readable & Writable Streams](readable_writable.md) — You are connecting these two exact things.
---

## 2. Term Category
- **Node.js API Method**

---

## 3. Environment Context
- **Node.js Server Code**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Express Download

**Problem:** You are building an Express API. A user hits `GET /download/video`. You want to stream `video.mp4` directly to their browser using `.pipe()`. Write the one line of code that connects the file to the user.

**Expected output:**
> [!check]- Answer
> ```javascript
> fs.createReadStream('video.mp4').pipe(res);
> ```
> - Source `.pipe(` Destination `)`

---



### Exercise 2: Piping File Read Stream to HTTP Response

**Problem:** Write code to pipe read stream of `video.mp4` to HTTP response `res`.

**Expected output:**
> [!check]- Answer
> ```text
> fs.createReadStream('video.mp4').pipe(res);
> ```
> ```javascript
> const stream = fs.createReadStream('video.mp4');
> stream.pipe(res);
> ```
>
> **Explanation:** `.pipe()` streams file chunks directly to the network socket with minimal RAM usage.

---

### Exercise 3: Chaining Gzip Compression Pipe

**Problem:** Pipe read stream `file.txt` through `zlib.createGzip()` to write stream `file.txt.gz`.

**Expected output:**
> [!check]- Answer
> ```text
> fs.createReadStream('file.txt').pipe(zlib.createGzip()).pipe(fs.createWriteStream('file.txt.gz'));
> ```
> ```javascript
> const zlib = require('zlib');
> fs.createReadStream('file.txt')
>   .pipe(zlib.createGzip())
>   .pipe(fs.createWriteStream('file.txt.gz'));
> ```
>
> **Explanation:** Stream piping chains multiple transformation steps efficiently.

## 7. Related Terms
- [Readable & Writable Streams](readable_writable.md) — The two ends of the pipe.
- [Backpressure](backpressure.md) — Related concept: Backpressure.
- [Duplex & Transform Streams](duplex_transform_streams.md) — Related concept: Duplex & Transform Streams.
- [Streams (General Concept)](streams.md) — Related concept: Streams (General Concept).
---

## 8. Key Takeaways
- **`.pipe()`** connects a Readable stream directly to a Writable stream.
- It automatically manages **Backpressure** (pausing the reader if the writer is too slow).
- It automatically closes the Writable stream when the Readable stream is finished.
- You can chain multiple `.pipe()` calls together if you use Transform streams (like compressors).
