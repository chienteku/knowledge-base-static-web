# The fs Module (File System)

> **Level 2 — Core Modules & Globals**
> A core module built into Node.js that gives your JavaScript code the superpower to read, write, update, and delete physical files on the computer's hard drive.

---

## 1. Prerequisites
- [Non-Blocking I/O](../level_01/non_blocking_io.md) — The `fs` module is the classic example of why Non-Blocking I/O is critical.
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — This module is impossible in the browser for security reasons.

---

## 2. Term Category

**Node.js Core Module (Node.js Only)**: The fs Module (File System) is a fundamental concept in this technology stack. **Level 2 — Core Modules & Globals**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you are building a Web Server, you eventually need to save data. Sometimes you don't need a massive Postgres database; you just want to save a user's uploaded profile picture, write a log file, or read a configuration JSON file.
Because standard JavaScript in the browser is explicitly banned from touching the hard drive (to stop malicious websites from stealing your files), Node.js had to invent a completely new API for file manipulation. This is the `fs` (File System) module.

### (2) The Three Flavors of `fs`
The `fs` module has evolved over the years, and now offers three different ways to interact with files:
1. **Synchronous (Blocking):** Halts the entire server until the file is read. ONLY use this during initial server startup.
   ```javascript
   const fs = require('fs');
   const data = fs.readFileSync('config.txt', 'utf8');
   ```
2. **Callbacks (Non-Blocking):** The old, legacy way. It doesn't block the server, but it creates messy "Callback Hell".
   ```javascript
   fs.readFile('data.txt', 'utf8', (err, data) => {
     console.log(data);
   });
   ```
3. **Promises (The Modern Way):** Uses modern `async/await`. This is the industry standard today.
   ```javascript
   const fs = require('fs/promises');
   const data = await fs.readFile('data.txt', 'utf8');
   ```

### (3) Core Methods
- `fs.readFile()`: Reads the entire contents of a file into memory.
- `fs.writeFile()`: Overwrites a file completely.
- `fs.appendFile()`: Adds text to the end of a file (great for logging).
- `fs.unlink()`: Deletes a file.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the Character Encoding (`utf8`)

**The mistake:** A developer writes: `const text = await fs.readFile('poem.txt'); console.log(text);`
The terminal prints `<Buffer 48 65 6c 6c 6f 20 57 6f ...>` instead of the poem.

**Why it's wrong:** The computer doesn't know if the file is a text file, an image, or a video! By default, Node.js returns raw binary `Buffer` data. 
**Golden Rule:** If you are reading a text file or JSON file, you MUST pass `'utf8'` as the second argument: `fs.readFile('poem.txt', 'utf8')`. This tells Node.js to translate the binary into human-readable English characters.

---



### Mistake 2: Loading Massive Files into Memory via `fs.readFile` Instead of Streaming

**The mistake:** Reading a 5GB log file into memory using `fs.promises.readFile('huge.log')`.

**Why it's wrong:** Reading huge files entirely into memory exceeds V8 max heap allocation limits, causing Out Of Memory crashes. Use `fs.createReadStream()`.

*Incorrect:*
```javascript
const data = await fs.promises.readFile('5gb_video.mp4'); // ❌ Memory heap crash!
```

*Fix:*
```javascript
const stream = fs.createReadStream('5gb_video.mp4');
stream.pipe(res);
```

### Mistake 3: Using `fs.exists()` (Deprecated API)

**The mistake:** Checking file existence with `fs.exists(path)` before reading.

**Why it's wrong:** `fs.exists()` is deprecated because checking existence before opening creates race conditions (TOCTOU: time-of-check to time-of-use). Open the file directly and handle `ENOENT` error.

*Incorrect:*
```javascript
if (fs.existsSync('file.txt')) {
  fs.readFileSync('file.txt'); // ❌ Race condition risk!
}
```

*Fix:*
```javascript
try {
  const data = await fs.promises.readFile('file.txt');
} catch (err) {
  if (err.code === 'ENOENT') console.log('File does not exist');
}
```

## 5. Practice Exercises

### Exercise 1: The Logger

**Problem:** You want to write a function that records every time a user logs in by adding a new line to `log.txt`. Should you use `writeFile` or `appendFile`?

**Expected output:**
> [!check]- Answer
> ```text
> `fs.appendFile`. 
> If you use `writeFile`, it will instantly erase all previous logs in the file and replace it with just the newest login event. `appendFile` preserves the existing file and safely adds the new data to the bottom.
> ```
> - Which one overwrites? Which one adds?
> 
---



### Exercise 2: Appending Text to File Asynchronously

**Problem:** Append string `'Log entry\n'` to file `app.log` using `fs.promises`.

**Expected output:**
> [!check]- Answer
> ```text
> await fs.promises.appendFile('app.log', 'Log entry\n');
> ```
> ```javascript
> await fs.promises.appendFile('app.log', 'Log entry\n');
> ```
>
> **Explanation:** `appendFile` appends data to a file, creating the file if it does not exist.
> 
---

### Exercise 3: Checking File Stats

**Problem:** Get size in bytes of `data.txt` using `fs.promises.stat`.

**Expected output:**
> [!check]- Answer
> ```text
> const stats = await fs.promises.stat('data.txt'); console.log(stats.size);
> ```
> ```javascript
> const stats = await fs.promises.stat('data.txt');
> console.log(stats.size);
> ```
>
> **Explanation:** `fs.promises.stat` returns metadata objects containing `size`, `mtime`, `isFile()`, etc.
> 
## 6. Related Terms
- [Buffers](../level_06/buffers.md) — What the `fs` module returns if you forget to specify `utf8`.
- [Streams (General Concept)](../level_06/streams.md) — If a file is 10 Gigabytes, `fs.readFile` will crash your RAM. You must use `fs.createReadStream` instead.
- [The path Module](path_module.md) — Related concept: The path Module.
- [Promisification (util.promisify)](../level_05/promisification.md) — Related concept: Promisification (util.promisify).

---

## 7. Key Takeaways
- The **`fs`** module allows Node.js to interact with the hard drive.
- It is explicitly banned in the browser for security reasons.
- You should always use the modern **`fs/promises`** version combined with `async/await`.
- Never use the `*Sync` methods (like `readFileSync`) in a live web server, as they block the Event Loop.
- Always remember to specify `'utf8'` when reading text or JSON.
