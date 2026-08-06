# Readable & Writable Streams

> **Level 6 — Data Handling**
> The two fundamental types of Streams in Node.js. One is used as a source of data, and the other is used as a destination for data.

---

## 1. Prerequisites
- [Streams (General Concept)](streams.md) — You must understand what a stream is before using these specific classes.
- [Event Emitter](../level_05/event_emitter.md) — These streams inherit from `EventEmitter`.

---

## 2. Term Category
- **Node.js Core API**

---

## 3. Environment Context
- **Node.js Server Code**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Identify the Stream

**Problem:** In a standard Node.js Express server, you have `req` (the incoming request) and `res` (the outgoing response). Which one is the Readable Stream, and which one is the Writable Stream?

**Expected output:**
> [!check]- Answer
> ```text
> - `req` is a Readable Stream. (Data is coming FROM the user TO your server).
> - `res` is a Writable Stream. (Data is going FROM your server TO the user).
> ```
> - Where is the data originating, and where is it landing?
> 
---



### Exercise 2: Matching Stream Types to Concrete Examples

**Problem:** Match concrete object to Readable or Writable:
1. `process.stdin`
2. `process.stdout`
3. `http.IncomingMessage` (`req`)
4. `http.ServerResponse` (`res`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. Readable
> 2. Writable
> 3. Readable
> 4. Writable
> ```
> ```text
> 1. process.stdin -> Readable
> 2. process.stdout -> Writable
> 3. req -> Readable
> 4. res -> Writable
> ```
>
> **Explanation:** Requests and stdin are readable inputs; responses and stdout are writable outputs.
> 
---

### Exercise 3: Writing Data to Writable Stream

**Problem:** Write string `'Log'` to writable file stream and close it.

**Expected output:**
> [!check]- Answer
> ```text
> writer.write('Log'); writer.end();
> ```
> ```javascript
> const writer = fs.createWriteStream('log.txt');
> writer.write('Log');
> writer.end();
> ```
>
> **Explanation:** `.write()` pushes data to the writable buffer; `.end()` flushes and closes the stream.
> 
## 7. Related Terms
- [Piping (.pipe())](piping.md) — The magical method used to connect a Readable Stream directly to a Writable Stream.
- [Backpressure](backpressure.md) — Related concept: Backpressure.
- [Duplex & Transform Streams](duplex_transform_streams.md) — Related concept: Duplex & Transform Streams.
- [Streams (General Concept)](streams.md) — Related concept: Streams (General Concept).

---

## 8. Key Takeaways
- **Readable Streams** are sources of data. You read them by listening to the `'data'` event.
- **Writable Streams** are destinations for data. You send data using `.write()` and close them with `.end()`.
- HTTP Requests (`req`) are Readable. HTTP Responses (`res`) are Writable.
