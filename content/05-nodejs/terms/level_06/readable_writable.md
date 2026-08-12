# Readable & Writable Streams

> **Level 6 — Data Handling**
> The two fundamental types of Streams in Node.js. One is used as a source of data, and the other is used as a destination for data.

---

## 1. Prerequisites
- [Streams (General Concept)](streams.md) — You must understand what a stream is before using these specific classes.
- [Event Emitter](../level_05/event_emitter.md) — These streams inherit from `EventEmitter`.

---

## 2. Term Category

**Node.js Core API (Node.js Server Code)**: Readable & Writable Streams is a fundamental concept in this technology stack. **Level 6 — Data Handling**

---

## 3. Explanation

### (1) Readable Streams (The Source)
A Readable Stream is where data *comes from*. 
Common examples: 
- `fs.createReadStream('huge-video.mp4')`
- `process.stdin` (typing in the terminal)
- An incoming HTTP Request (`req` in Express).

Because they are Event Emitters, you read the data by listening to the `'data'` event. Every time the stream grabs a chunk of data (usually 64KB), the event fires:
```javascript
const fs = require('fs');
const readStream = fs.createReadStream('huge-log.txt');

readStream.on('data', (chunk) => {
  console.log(`Received a chunk of ${chunk.length} bytes!`);
});

readStream.on('end', () => {
  console.log('Finished reading the entire file.');
});
```

### (2) Writable Streams (The Destination)
A Writable Stream is where data *goes to*.
Common examples:
- `fs.createWriteStream('copy.mp4')`
- `process.stdout` (printing to the terminal)
- An outgoing HTTP Response (`res` in Express).

You write to them using the `.write()` method, and finish with `.end()`:
```javascript
const fs = require('fs');
const writeStream = fs.createWriteStream('output.txt');

writeStream.write("Hello, ");
writeStream.write("World!");
writeStream.end(); // Closes the file
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Memory Leaks from forgotten `.end()`

**The mistake:** A developer opens a Writable Stream to log user activity, writes the logs, but forgets to call `writeStream.end()`.

**Why it's wrong:** If you don't call `.end()`, the Operating System keeps the file "open" and locked forever, expecting more data. If your server runs for weeks, it will eventually hit the OS limit for "Max Open Files" and crash completely.
**Golden Rule:** Always explicitly `.end()` your writable streams, or use `.pipe()` which handles closing automatically.

---



### Mistake 2: Mixing Paused (`readable.read()`) and Flowing (`readable.on('data')`) Modes

**The mistake:** Attaching `on('data')` listener while also manually calling `readable.read()`.

**Why it's wrong:** Attaching a `'data'` listener puts the stream into Flowing mode. Manually calling `read()` simultaneously causes skipped or out-of-order chunks.

*Incorrect:*
```javascript
stream.on('data', (chunk) => {
  const extra = stream.read(); // ❌ Conflict between flowing and paused modes!
});
```

*Fix:*
```javascript
// Use flowing mode:
stream.on('data', (chunk) => console.log(chunk));
// OR paused mode:
stream.on('readable', () => { let chunk; while (null !== (chunk = stream.read())) {} });
```

### Mistake 3: Forgetting to Handle `finish` vs `end` Stream Events

**The mistake:** Listening for `end` event on a Writable stream.

**Why it's wrong:** Readable streams emit `'end'` when data finishes. Writable streams emit `'finish'` when writing completes. Listening for `'end'` on a Writable stream never triggers.

*Incorrect:*
```javascript
writable.on('end', () => console.log('Done')); // ❌ Writable streams emit 'finish', not 'end'!
```

*Fix:*
```javascript
writable.on('finish', () => console.log('Write complete'));
```

## 5. Practice Exercises

### Exercise 1: Custom Readable Array Stream Generator

**Scenario:** Creates a custom `Readable` stream instance that yields array elements sequentially.

**Requirements:**
1. Write createArrayReadableStream(itemsArray, ReadableClass).
2. Implement `_read()`.
3. Push array items to stream buffer.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createArrayReadableStream(itemsArray = [], ReadableClass) {
>   const Readable = ReadableClass || require("stream").Readable;
>
>   let index = 0;
>   return new Readable({
>     read() {
>       if (index < itemsArray.length) {
>         this.push(Buffer.from(String(itemsArray[index])));
>         index++;
>       } else {
>         this.push(null); // EOF (End Of File) signal!
>       }
>     }
>   });
> }
>
> // Verification tests
> const Readable = require("stream").Readable;
> const stream = createArrayReadableStream(["A", "B", "C"], Readable);
>
> let result = "";
> stream.on("data", (chunk) => { result += chunk.toString(); });
>
> setImmediate(() => {
>   console.assert(result === "ABC", "Test 1 Failed: Array readable stream output mismatch");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Custom Readable Streams**: Implemented by overriding `_read(size)` method and calling `this.push(chunk)`.
> 2. **EOF Signal (`null`)**: Pushing `null` signals End-Of-File / stream completion to downstream consumers.
> 3. **On-Demand Data Generation**: `_read()` is called automatically by Node.js when downstream consumers are ready for more data.
> 
---

### Exercise 2: Custom Writable Batch Log Stream

**Scenario:** Creates a custom `Writable` stream that buffers incoming log objects in RAM and flushes in batches of 3 to disk/database.

**Requirements:**
1. Write createBatchWritableStream(WritableClass, batchSize).
2. Override `_write(chunk, encoding, callback)`.
3. Flush batch when batchSize is reached.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createBatchWritableStream(WritableClass, batchSize = 3) {
>   const Writable = WritableClass || require("stream").Writable;
>
>   const batch = [];
>   const flushedBatches = [];
>
>   class BatchWritable extends Writable {
>     _write(chunk, encoding, callback) {
>       batch.push(chunk.toString("utf-8"));
>       if (batch.length >= batchSize) {
>         flushedBatches.push([...batch]);
>         batch.length = 0;
>       }
>       callback();
>     }
>   }
>
>   return {
>     writable: new BatchWritable(),
>     flushedBatches,
>     pendingBatch: batch
>   };
> }
>
> // Verification tests
> const Writable = require("stream").Writable;
> const service = createBatchWritableStream(Writable, 2);
>
> service.writable.write("item1");
> service.writable.write("item2");
> service.writable.write("item3");
>
> setImmediate(() => {
>   console.assert(service.flushedBatches.length === 1, "Test 1 Failed: 1 batch flushed");
>   console.assert(service.flushedBatches[0].length === 2, "Test 2 Failed");
>   console.assert(service.pendingBatch.length === 1, "Test 3 Failed: 1 pending item");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Custom Writable Streams**: Implemented by overriding `_write(chunk, encoding, callback)` method.
> 2. **Batch Processing**: Buffering stream writes reduces database query overhead by executing bulk inserts.
> 3. **Callback Signaling**: Calling `callback()` signals Node.js that the write operation completed and stream is ready for next chunk.
> 
---

### Exercise 3: Readable Stream Pause and Resume Flow Controller

**Scenario:** Manages stream execution states using `readable.pause()`, `readable.resume()`, and `readable.isPaused()`.

**Requirements:**
1. Write createPauseResumeController(readableStream).
2. Toggle pause and resume states.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createPauseResumeController(readableStream) {
>   return {
>     pause() {
>       readableStream.pause();
>       return readableStream.isPaused();
>     },
>     resume() {
>       readableStream.resume();
>       return readableStream.isPaused();
>     },
>     getStatus() {
>       return readableStream.isPaused() ? "PAUSED" : "FLOWING";
>     }
>   };
> }
>
> // Verification tests
> const mockReadable = {
>   pausedState: false,
>   pause() { this.pausedState = true; },
>   resume() { this.pausedState = false; },
>   isPaused() { return this.pausedState; }
> };
>
> const ctrl = createPauseResumeController(mockReadable);
> console.assert(ctrl.getStatus() === "FLOWING", "Test 1 Failed");
> ctrl.pause();
> console.assert(ctrl.getStatus() === "PAUSED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Flowing vs Paused Modes**: Readable streams operate in Flowing (emitting 'data' events) or Paused (manual `.read()` calls) modes.
> 2. **Automatic Mode Switching**: Attaching a `'data'` event listener switches readable stream to Flowing mode.
> 3. **Manual Flow Control**: `pause()` and `resume()` give applications fine-grained control over data arrival.
## 6. Related Terms
- [Piping (.pipe())](piping.md) — The magical method used to connect a Readable Stream directly to a Writable Stream.
- [Backpressure](backpressure.md) — Related concept: Backpressure.
- [Duplex & Transform Streams](duplex_transform_streams.md) — Related concept: Duplex & Transform Streams.
- [Streams (General Concept)](streams.md) — Related concept: Streams (General Concept).

---

## 7. Key Takeaways
- **Readable Streams** are sources of data. You read them by listening to the `'data'` event.
- **Writable Streams** are destinations for data. You send data using `.write()` and close them with `.end()`.
- HTTP Requests (`req`) are Readable. HTTP Responses (`res`) are Writable.
