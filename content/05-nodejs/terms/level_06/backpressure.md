# Backpressure

> **Level 6 — Data Handling**
> Flow control that pauses a fast reader when a slow writer can't keep up (why `.pipe()` is safe).

---

## 1. Prerequisites
- [Readable & Writable Streams](readable_writable.md) — The source reader and target writer classes.
- [Piping (.pipe())](piping.md) — The stream linking method that manages backpressure.

---

## 2. Term Category
- **Data Handling**

---

## 3. Environment Context
- **Node.js Core Architecture** (Governs stream memory buffer limits inside the Libuv I/O lifecycle).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When piping data between streams, the source (Readable Stream) and destination (Writable Stream) often process data at different speeds. 
- **The Bottleneck:** Imagine reading a file from a high-speed SSD (1000MB/s) and writing it over a slow 3G cellular network connection (1MB/s). 
- **Memory Bloat:** If the reader reads the file at full speed and continues dumping data chunks into memory, while the writer can only send it out slowly, the unwritten data will accumulate in the system's RAM buffer.
- **The Crash:** If you transfer a large file (e.g. 5GB), the server will quickly run out of memory (OOM) and crash.

To prevent memory exhaustion during mismatched stream speeds, Node.js implements **Backpressure**:
- **Backpressure:** A flow-control mechanism where the Writable Stream signals the Readable Stream to pause reading until the writer finishes processing its current queue.
- **How it works:**
  1.  **Buffer Limits (`highWaterMark`):** Writable streams have a buffer limit (default is **16KB** for object streams and **64KB** for standard buffers).
  2.  **Pause Signal:** When you write a chunk to a Writable Stream using `.write(chunk)`, if the buffer is full, the method returns `false` (meaning: *"Stop writing, my buffer is full"*).
  3.  **Pausing the Reader:** The Readable Stream receives this `false` value and calls `.pause()`, stopping further disk reads.
  4.  **Resuming after Drain:** Once the writer clears its buffer (e.g., sending the data over the network), it fires a `'drain'` event. The reader catches this event and calls `.resume()`, starting the data flow again.

---

### (2) Why `.pipe()` is Safe
Manually managing backpressure (pausing, resuming, and listening for drain events) requires complex boilerplate code. Node's built-in `.pipe()` method handles all backpressure logic under the hood automatically, ensuring your app's RAM usage remains low and flat during massive transfers.

---

### (3) Reality Metaphor
Imagine pouring water from a bucket into a narrow funnel.
- **The Bucket** is the fast Readable Stream.
- **The Funnel** is the Writable Stream.
- **The Narrow Spout** at the bottom of the funnel is the slow network connection.
- **Without Backpressure:** You continue to dump the bucket at full speed. The funnel overflows, spilling water onto the floor (**RAM memory crash**).
- **With Backpressure:** The funnel has a float sensor (**`highWaterMark`**). When the water rises near the top, the sensor signals you to stop pouring (**`.write()` returns `false`**). Once the funnel drains (**the `'drain'` event**), the sensor signals you to resume pouring.

---

### (4) Manual Backpressure Implementation Example

This is the low-level logic that `.pipe()` handles for you automatically:

```javascript
const fs = require('fs');

const reader = fs.createReadStream('large-input.txt');
const writer = fs.createWriteStream('output.txt');

reader.on('data', (chunk) => {
  // 1. Write the chunk to the destination
  const canContinue = writer.write(chunk);
  
  // 2. If writer's buffer is full, pause reading
  if (!canContinue) {
    console.log("Buffer full! Pausing reader stream (Backpressure activated)...");
    reader.pause();
  }
});

// 3. When the writer drains its buffer, resume reading
writer.on('drain', () => {
  console.log("Buffer cleared! Resuming reader stream...");
  reader.resume();
});

reader.on('end', () => {
  writer.end();
  console.log("Data transfer complete.");
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing data directly in a `data` event listener without check values

**The mistake:** Manually mapping stream data events to writes without tracking backpressure feedback:

```javascript
// BAD: This bypasses all flow control, causing memory leaks!
readableStream.on('data', (chunk) => {
  writableStream.write(chunk); // Ignores the 'false' return value!
});
```

**Why it's wrong:** If the writable stream is slow, it will continue to accept chunks from the data event, buffering them in memory. The buffer will grow unchecked, consuming gigabytes of RAM until the Node process crashes.

*Fix:* Always use `.pipe()`, or check the return value of `.write()` and listen for the `'drain'` event to pause and resume.

---



### Mistake 2: Ignoring Writable Stream `write()` Return False Signals (Backpressure Memory Explosion)

**The mistake:** Continuously writing data to a Writable stream inside a fast loop without checking if `writable.write()` returns `false`.

**Why it's wrong:** When a Writable stream's internal buffer (`highWaterMark`) fills up, `write()` returns `false`. Ignoring this causes memory to accumulate in RAM buffer queues until out of memory.

*Incorrect:*
```javascript
readable.on('data', (chunk) => {
  writable.write(chunk); // ❌ Ignores backpressure when writable is slow!
});
```

*Fix:*
```javascript
readable.on('data', (chunk) => {
  const ok = writable.write(chunk);
  if (!ok) readable.pause(); // Pause readable when writable buffer fills
});
writable.on('drain', () => readable.resume()); // Resume on drain
```

### Mistake 3: Manual Stream Pipe Handling Without `stream.pipeline` Error Cleanup

**The mistake:** Using `readable.pipe(writable)` without attaching error listeners on both streams.

**Why it's wrong:** `pipe()` does NOT forward errors automatically between streams! If an error occurs in the readable stream, the writable stream is left un-closed in memory.

*Incorrect:*
```javascript
readable.pipe(transform).pipe(writable); // ❌ Unhandled stream error memory leak!
```

*Fix:*
```javascript
const { pipeline } = require('stream/promises');
await pipeline(readable, transform, writable); // Automatically manages errors & backpressure
```

## 6. Practice Exercises

### Exercise 1: Stream Analysis

**Problem:** You are building an Express endpoint that pipes video downloads to users. Under heavy loads, the server's RAM usage spikes and crashes. 
Review the two route implementations below. Explain which route is causing the crash and why:

```javascript
// Route A
app.get('/download-bad', (req, res) => {
  const fileStream = fs.createReadStream('movie.mp4');
  fileStream.on('data', (chunk) => {
    res.write(chunk); 
  });
  fileStream.on('end', () => res.end());
});

// Route B
app.get('/download-good', (req, res) => {
  const fileStream = fs.createReadStream('movie.mp4');
  fileStream.pipe(res); // Handles backpressure
});
```

> [!check]- Answer
> - **Route A** causes the crash. It reads the movie file at disk speed and writes it to the response object without checking for backpressure. If the user has a slow connection, the unwritten movie data will accumulate in Node's RAM. **Route B** is correct because `.pipe(res)` automatically manages backpressure, pausing the file reader when the network connection slows down.
> 
> 
---



### Exercise 2: Drain Event Listener Usage

**Problem:** Which stream event notifies code that a Writable stream's buffer has emptied after returning `false` from `write()`?

**Expected output:**
> [!check]- Answer
> ```text
> 'drain' event
> ```
> ```text
> 'drain' event
> ```
>
> **Explanation:** The `'drain'` event signals that a Writable stream is ready to receive more data.
> 
---

### Exercise 3: pipeline Utility Benefit

**Problem:** List 2 primary advantages of using `stream.pipeline` over `.pipe()`.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Automatic error handling and cleanup across all streams
> 2. Automatic backpressure management
> ```
> ```text
> 1. Automatic error handling and cleanup across all streams
> 2. Automatic backpressure management
> ```
>
> **Explanation:** `pipeline` manages stream lifecycle and closes open streams when errors occur.
> 
## 7. Related Terms
- [Piping (.pipe())](piping.md) — The abstraction layer that automates backpressure handling.
- [Readable & Writable Streams](readable_writable.md) — The components that exchange flow-control signals.
- [Streams (General Concept)](streams.md) — Related concept: Streams (General Concept).

---

## 8. Key Takeaways
- Backpressure regulates data flow when a reader is faster than a writer.
- Writable streams return `false` from `.write()` when their internal buffer is full.
- The `highWaterMark` setting defines the maximum buffer limit of a stream.
- When `.write()` returns `false`, the reader should pause using `.pause()`.
- Once the writer's buffer is cleared, it emits a `'drain'` event, signaling the reader to resume.
- Avoid raw `data` event writes without backpressure checks; always use `.pipe()` where possible.
