# Child Processes (child_process)

> **Level 10 — Security & Production**
> Spawning separate OS processes to run other programs / offload work.

---

## 1. Prerequisites
- [The process Object](../level_02/process_object.md) — The parent process managing the OS lifecycle.
- [The Event Loop & Libuv](../level_01/event_loop.md) — The single-threaded context we want to avoid blocking.

---

## 2. Term Category

**Production / DevOps (Operating System Layer .)**: Child Processes (child_process) is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Secure Command Spawner with Input Escaping

**Scenario:** A background worker spawns system commands (`child_process.spawn`) safely without opening shell vulnerability vectors (`shell: false`).

**Requirements:**
1. Write executeChildProcessCommand(command, argsArray, mockSpawn).
2. Use spawn with array arguments.
3. Collect stdout/stderr buffers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function executeChildProcessCommand(command, argsArray = [], mockSpawn) {
>   const spawnFn = mockSpawn || require("child_process").spawn;
>
>   return new Promise((resolve, reject) => {
>     const child = spawnFn(command, argsArray, { shell: false });
>
>     let stdoutText = "";
>     let stderrText = "";
>
>     if (child.stdout) {
>       child.stdout.on("data", (chunk) => { stdoutText += chunk.toString(); });
>     }
>     if (child.stderr) {
>       child.stderr.on("data", (chunk) => { stderrText += chunk.toString(); });
>     }
>
>     child.on("close", (code) => {
>       if (code === 0) {
>         resolve({ code, stdout: stdoutText.trim(), stderr: stderrText.trim() });
>       } else {
>         reject(new Error(`Command failed with exit code ${code}: ${stderrText}`));
>       }
>     });
>
>     child.on("error", (err) => reject(err));
>   });
> }
>
> // Verification tests
> const events = {};
> const mockSpawn = () => ({
>   stdout: { on: (e, fn) => { if (e === "data") fn(Buffer.from("OUTPUT")); } },
>   stderr: { on: () => {} },
>   on: (e, fn) => { events[e] = fn; }
> });
>
> const promise = executeChildProcessCommand("ls", ["-la"], mockSpawn);
> events["close"](0);
>
> promise.then(res => {
>   console.assert(res.stdout === "OUTPUT", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **`spawn()` vs `exec()`**: `spawn()` streams data in chunks without memory limits; `exec()` buffers output in a fixed maxBuffer size.
> 2. **Shell Injection Defense**: Setting `shell: false` and passing arguments as an array (`['arg1', 'arg2']`) prevents shell injection attacks.
> 3. **Non-Blocking Subprocesses**: Child processes execute concurrently in separate OS processes without blocking Node.js main thread.
> 
---

### Exercise 2: Inter-Process Communication IPC Messaging via fork()

**Scenario:** Forks a dedicated Node.js child process (`child_process.fork()`) communicating via bi-directional JSON IPC message events.

**Requirements:**
1. Write executeForkedTask(workerPath, payload, mockFork).
2. Send message via `child.send()`.
3. Listen to `child.on('message')`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function executeForkedTask(workerPath, payload, mockFork) {
>   const forkFn = mockFork || require("child_process").fork;
>
>   return new Promise((resolve, reject) => {
>     const child = forkFn(workerPath);
>
>     child.on("message", (response) => {
>       child.kill();
>       resolve(response);
>     });
>
>     child.on("error", (err) => reject(err));
>
>     child.send(payload);
>   });
> }
>
> // Verification tests
> const events = {};
> const mockFork = () => ({
>   send: (data) => {
>     setImmediate(() => {
>       if (events["message"]) events["message"]({ status: "SUCCESS", result: data.num * 2 });
>     });
>   },
>   on: (e, fn) => { events[e] = fn; },
>   kill: () => {}
> });
>
> executeForkedTask("./worker.js", { num: 21 }, mockFork).then(res => {
>   console.assert(res.result === 42, "Test 1 Failed: IPC message returned result 42");
> });
> ```
>
> #### Technical Explanation
>
> 1. **`child_process.fork()`**: Specialized version of `spawn()` that instantiates a new V8 Node.js instance with built-in IPC channel.
> 2. **IPC Messaging Protocol**: `child.send(json)` serializes data and passes it over IPC channel without socket overhead.
> 3. **Child Process Isolation**: If a forked child process crashes, the main parent Node.js process remains stable.
> 
---

### Exercise 3: Shell Execution Output Collector with Timeout

**Scenario:** Executes shell commands using `child_process.exec` with strict execution timeouts to prevent hanging child processes.

**Requirements:**
1. Write executeShellWithTimeout(cmdStr, timeoutMs, mockExec).
2. Set `timeout` option.
3. Return stdout.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function executeShellWithTimeout(cmdStr, timeoutMs = 5000, mockExec) {
>   const execFn = mockExec || require("child_process").exec;
>
>   return new Promise((resolve, reject) => {
>     execFn(cmdStr, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
>       if (err) return reject(err);
>       resolve(stdout.trim());
>     });
>   });
> }
>
> // Verification tests
> const mockExec = (cmd, opts, cb) => cb(null, "VERSION 1.0", "");
>
> executeShellWithTimeout("node -v", 1000, mockExec).then(out => {
>   console.assert(out === "VERSION 1.0", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **`exec()` maxBuffer Limit**: Default `maxBuffer` is 1MB; if subprocess output exceeds maxBuffer, process is terminated with `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`.
> 2. **Subprocess Execution Timeout**: Passing `timeout: 5000` automatically sends SIGTERM if subprocess exceeds execution time limit.
> 3. **Use Case**: Executing brief CLI scripts (e.g. `git status`, `node -v`).
## 6. Related Terms
- [Worker Threads](worker_threads.md) — Multi-threading inside a single OS process.
- [The cluster Module](cluster_module.md) — Forking duplicate server instances across CPU cores.

---

## 7. Key Takeaways
- Child processes offload CPU-heavy or system-level tasks to prevent blocking Node's main thread.
- Each child process has its own isolated OS memory pool and V8 instance.
- `exec` buffers command output in memory; `spawn` streams output asynchronously.
- `fork` runs Node-specific scripts and sets up a built-in IPC communication channel.
- Never pass unsanitized user inputs to `exec`, as it is vulnerable to shell injection; use `spawn` instead.
