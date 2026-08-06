# Child Processes (child_process)

> **Level 10 — Security & Production**
> Spawning separate OS processes to run other programs / offload work.

---

## 1. Prerequisites
- [The process Object](../level_02/process_object.md) — The parent process managing the OS lifecycle.
- [The Event Loop & Libuv](../level_01/event_loop.md) — The single-threaded context we want to avoid blocking.

---

## 2. Term Category
- **Production / DevOps**

---

## 3. Environment Context
- **Operating System Layer** (Directly interface with the host OS kernel process tables).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Because JavaScript executes in a single-threaded runtime, running a long, CPU-bound task (like video processing or heavy file compression) inside the main thread will block the Call Stack. While the stack is blocked, the Event Loop cannot process incoming client requests, causing the server to hang for all other users.

Additionally, Node.js applications often need to execute system shell utilities (e.g. `ffmpeg` or `git`) or run programs written in other languages (C++, Python).

To solve this, Node.js provides the built-in **`child_process` module**, allowing your application to spawn separate, isolated operating system processes. Each child process runs independently with its own V8 instance, call stack, and memory pool.

#### Spawning APIs
-   **`exec(command, callback)`:** Spawns a shell and runs the command. It buffers the command's complete stdout/stderr output in memory before passing it to the callback.
    -   *Risk:* Can trigger buffer overflows if the command returns a massive output.
-   **`spawn(command, args)`:** Spawns a child process asynchronously. It returns stream handles (`stdout`, `stderr`) representing the child's output, allowing you to process gigabytes of data chunk-by-chunk in real time.
-   **`fork(modulePath)`:** A specialized version of `spawn` designed specifically to run other Node.js scripts. It sets up an Inter-Process Communication (IPC) channel, allowing the parent and child to exchange message objects using `send()` and `on('message')`.

---

### (2) Reality Metaphor
Imagine running a small retail storefront.
- **Single-Threaded Execution (In-house):** You try to pack 1,000 shipping boxes yourself. While your hands are busy packing, you cannot answer phone calls or open the door for walk-in customers. The business freezes.
- **Child Processes (Outside Contractor):** You hire a separate packing company (**the child process**). The contractor packs the boxes in their own warehouse down the street (**separate OS memory**). The contractor texts you updates (**IPC messages**) and calls you when done. While they work, you remain at the storefront register, serving customers without interruption.

---

### (3) JavaScript Implementation Example

An Express route that uses `spawn` to list directory contents asynchronously without blocking the event loop:

```javascript
const express = require('express');
const { spawn } = require('child_process');
const app = express();

app.get('/api/files', (req, res) => {
  // Spawns 'ls -la' command asynchronously
  const ls = spawn('ls', ['-la']);

  // Stream output directly back to HTTP client response
  ls.stdout.pipe(res);

  // Catch errors in execution
  ls.stderr.on('data', (data) => {
    console.error(`Command error: ${data}`);
  });

  ls.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
  });
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Shell Injection vulnerabilities using `exec`

**The mistake:** Concatenating untrusted user input directly into an `exec` shell command:

```javascript
const { exec } = require('child_process');

// DANGER: Malicious input can execute arbitrary commands!
app.get('/view', (req, res) => {
  const file = req.query.filename;
  exec(`cat /var/logs/${file}`, (err, stdout) => {
    res.send(stdout);
  });
});
```

**Why it's wrong:** If a user passes `test.txt; rm -rf /` in the query parameter, the shell parses the semicolon as a command separator, executing `cat` first and then executing the deletion command.

*Fix:* Use `spawn` instead of `exec`. The `spawn` API does not launch a shell by default and forces parameters to be passed inside a strict arguments array, preventing command execution:

```javascript
// SECURE: spawn treats arguments strictly as input strings, not commands
const ls = spawn('cat', [`/var/logs/${req.query.filename}`]);
```

---



### Mistake 2: Using `exec()` for Commands Producing Large Output Buffers (`maxBuffer` Exceeded)

**The mistake:** Calling `child_process.exec('find /')` for long output scripts.

**Why it's wrong:** `exec()` buffers all stdout/stderr output entirely in memory. Exceeding default `maxBuffer` limit (1MB) throws `maxBuffer length exceeded` error. Use `spawn()` for streaming outputs.

*Incorrect:*
```javascript
exec('cat huge_video.mp4', (err, stdout) => {}); // ❌ Exceeds maxBuffer memory limit!
```

*Fix:*
```javascript
const child = spawn('cat', ['huge_video.mp4']); // Streams output in chunks
child.stdout.pipe(res);
```

### Mistake 3: Command Injection Vulnerabilities via Un-Sanitized `exec()` Inputs

**The mistake:** Executing `exec('ping ' + req.query.host)` with un-sanitized user input.

**Why it's wrong:** `exec()` runs commands inside a shell. Attackers can append command separators (e.g. `8.8.8.8; rm -rf /`) to execute malicious shell commands. Use `execFile()` or `spawn()` without shell.

*Incorrect:*
```javascript
exec(`ls ${req.query.dir}`, (err, stdout) => {}); // ❌ Critical Command Injection!
```

*Fix:*
```javascript
execFile('ls', [req.query.dir], (err, stdout) => {}); // Safe parameter array execution
```

## 6. Practice Exercises

### Exercise 1: Multi-Process Node Forking

**Problem:** You have a CPU-intensive calculations script located at `./math_worker.js`. Write a parent script that forks this worker, sends it a payload `{ number: 42 }`, and logs the result returned by the worker:

```javascript
const { fork } = require('child_process');

// 1. Fork the child script
const child = fork('./math_worker.js');

// 2. Send the number payload
child.send({ number: 42 });

// 3. Listen for the response
child.on('message', (result) => {
  console.log("Calculated output:", result.value);
  child.kill(); // Terminate child when done
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Spawning Long-Running Child Process

**Problem:** Spawn `ping -c 4 google.com` using `child_process.spawn` and log stdout chunks.

**Expected output:**
> [!check]- Answer
> ```text
> const child = spawn('ping', ['-c', '4', 'google.com']); child.stdout.on('data', chunk => console.log(chunk.toString()));
> ```
> ```javascript
> const { spawn } = require('child_process');
> const child = spawn('ping', ['-c', '4', 'google.com']);
> child.stdout.on('data', (chunk) => {
>   console.log(`Stdout: ${chunk.toString()}`);
> });
> ```
>
> **Explanation:** `spawn()` returns child process object with readable stdout/stderr streams.
> 
---

### Exercise 3: Forking Node.js Child Scripts

**Problem:** Which `child_process` method spawns a new Node.js V8 process with a built-in IPC communication channel? (`child_process.fork()`).

**Expected output:**
> [!check]- Answer
> ```text
> child_process.fork()
> ```
> ```text
> child_process.fork()
> ```
>
> **Explanation:** `fork()` is a specialized `spawn()` variant that opens an IPC channel between parent and child Node processes.
> 
## 7. Related Terms
- [Worker Threads](worker_threads.md) — Multi-threading inside a single OS process.
- [The cluster Module](cluster_module.md) — Forking duplicate server instances across CPU cores.

---

## 8. Key Takeaways
- Child processes offload CPU-heavy or system-level tasks to prevent blocking Node's main thread.
- Each child process has its own isolated OS memory pool and V8 instance.
- `exec` buffers command output in memory; `spawn` streams output asynchronously.
- `fork` runs Node-specific scripts and sets up a built-in IPC communication channel.
- Never pass unsanitized user inputs to `exec`, as it is vulnerable to shell injection; use `spawn` instead.
