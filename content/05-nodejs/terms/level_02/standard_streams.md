# stdin / stdout / stderr (Standard Streams)

> **Level 2 — Core Modules & Globals**
> The process's built-in streams — the first real streams a learner meets.

---

## 1. Prerequisites
- [The process Object](process_object.md) — Standard streams are accessed as properties of `process`.

---

## 2. Term Category

**Core Module / Computer Science Concept (Node.js Core Architecture .)**: stdin / stdout / stderr (Standard Streams) is a fundamental concept in this technology stack. **Level 2 — Core Modules & Globals**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern operating systems, every running process is allocated three communication channels by default. These channels handle character streams entering and leaving the process, and are known as the **Standard Streams**:

#### 1. `process.stdin` (Standard Input)
- **Behavior:** A **Readable Stream** used by the process to receive input data (usually characters typed by a developer in the terminal, or data piped from another command).

#### 2. `process.stdout` (Standard Output)
- **Behavior:** A **Writable Stream** used by the process to write normal outbound message data (which appears in the terminal).
- **V8 Connection:** Calling `console.log()` is actually just a wrapper around `process.stdout.write(message + '\n')`.

#### 3. `process.stderr` (Standard Error)
- **Behavior:** A **Writable Stream** used strictly to write error diagnostic logs and stack traces.
- **Why keep them separate?** In production environments, it is crucial to isolate normal operational logs from application crashes. Because `stdout` and `stderr` are separate streams, shell commands can redirect them to separate files:
  ```bash
  # Redirect stdout to logs.txt, redirect stderr (file descriptor 2) to errors.txt
  node server.js > logs.txt 2> errors.txt
  ```

---

### (2) Reality Metaphor
Imagine a clerk sitting at a processing desk.
- **`stdin` (The Inbox Tray):** The tray where the mail carrier places incoming forms for the clerk to read and process.
- **`stdout` (The Standard Outbox):** A tray where the clerk puts normal output documents, like completed invoices.
- **`stderr` (The Red Alert Outbox):** A separate, bright red tray where the clerk places urgent crash reports or warning flags. By separating them, the office manager can route normal invoices directly to the file archives, while sending red alerts straight to the supervisor's desk.

---

### (3) JavaScript Command-Line Implementation

Here is how to create an interactive command-line prompt by reading and writing standard streams directly:

```javascript
// 1. Write a prompt to standard output (no automatic newline)
process.stdout.write("What is your name? > ");

// 2. Resume stdin to start listening for user input
process.stdin.resume();
process.stdin.setEncoding('utf8');

// 3. Listen for incoming data events on stdin
process.stdin.on('data', (text) => {
  // Input chunks include the Enter key newline character, so we trim it
  const name = text.trim();
  
  if (name === "") {
    // Write an error message to standard error stream
    process.stderr.write("Error: Name cannot be empty.\n");
    process.exit(1);
  }
  
  process.stdout.write(`Nice to meet you, ${name}!\n`);
  process.exit(0); // Exit process cleanly
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `console.log` for error reporting because it looks the same in the terminal

**The mistake:** Logging errors to `console.log` because, in local development, both `console.log` and `console.error` print directly to the same screen.

**Why it's wrong:** While they look the same on your screen, they output to different file descriptors (`1` vs `2`). Production logging aggregators (like AWS CloudWatch or ElasticSearch) separate standard output logs from errors. If you log crashes using standard output, your error monitors will not trigger, and finding bugs will be much harder.

*Fix:* Always use `console.error()` or `process.stderr.write()` for log errors and warning messages.

---



### Mistake 2: Writing Errors to `process.stdout` Instead of `process.stderr`

**The mistake:** Logging error messages via `console.log()` or `process.stdout.write()` in CLI tools.

**Why it's wrong:** `process.stdout` is intended for standard application output (pipeable to other tools). Logging errors to stdout corrupts CLI data piping pipelines (`node app.js | grep ok`). Write errors to `process.stderr` (or `console.error`).

*Incorrect:*
```javascript
process.stdout.write('ERROR: Database connection failed\n'); // ❌ Corrupts stdout pipe stream!
```

*Fix:*
```javascript
process.stderr.write('ERROR: Database connection failed\n'); // Correct stderr error stream
```

### Mistake 3: Blocking Terminal Output by Writing Huge Buffers Synchronously to `process.stdout`

**The mistake:** Calling `console.log()` inside a 1,000,000 iteration loop.

**Why it's wrong:** Terminal stdout streams have buffer capacities. High-frequency synchronous logging blocks execution waiting for terminal rendering.

*Incorrect:*
```javascript
for (let i = 0; i < 1e6; i++) console.log(i); // ❌ Freezes CLI terminal output stream!
```

*Fix:*
```javascript
Use buffered logger streams or stream pipeline chunks
```

## 5. Practice Exercises

### Exercise 1: Structured Stdout & Stderr Log Formatter

**Scenario:** A logging service formats log messages into JSON strings, routing standard logs to `process.stdout` and errors to `process.stderr`.

**Requirements:**
1. Write logToStdStream(level, message, metaObj, stdMock).
2. Route INFO/WARN to process.stdout.
3. Route ERROR to process.stderr.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function logToStdStream(level = "INFO", message = "", metaObj = {}, stdMock) {
>   const stdout = (stdMock && stdMock.stdout) || process.stdout;
>   const stderr = (stdMock && stdMock.stderr) || process.stderr;
>
>   const logPayload = JSON.stringify({
>     timestamp: new Date().toISOString(),
>     level: level.toUpperCase(),
>     message,
>     ...metaObj
>   }) + "
> ";
>
>   if (level.toUpperCase() === "ERROR" || level.toUpperCase() === "FATAL") {
>     stderr.write(logPayload);
>     return { stream: "STDERR", payload: logPayload };
>   } else {
>     stdout.write(logPayload);
>     return { stream: "STDOUT", payload: logPayload };
>   }
> }
>
> // Verification tests
> let stdoutData = "";
> let stderrData = "";
>
> const mockStd = {
>   stdout: { write: (msg) => { stdoutData = msg; } },
>   stderr: { write: (msg) => { stderrData = msg; } }
> };
>
> const r1 = logToStdStream("INFO", "Server listening", { port: 3000 }, mockStd);
> console.assert(r1.stream === "STDOUT" && stdoutData.includes("Server listening"), "Test 1 Failed");
>
> const r2 = logToStdStream("ERROR", "Database failure", {}, mockStd);
> console.assert(r2.stream === "STDERR" && stderrData.includes("Database failure"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Three Standard Streams**: process.stdin (fd 0, readable), process.stdout (fd 1, writable), process.stderr (fd 2, writable).
> 2. **12-Factor App Logging**: Twelve-Factor App principle: apps write raw unbuffered log streams to stdout/stderr; log routers (Fluentd) handle collection.
> 3. **stdout vs stderr Separation**: Container platforms (Docker, K8s) capture stdout and stderr separately for log aggregation.
> 
---

### Exercise 2: Standard Input process.stdin Line Reader

**Scenario:** A CLI utility reads lines interactively from `process.stdin` until user enters 'exit'.

**Requirements:**
1. Write createStdinLineReader(stdinMock).
2. Listen for data events.
3. Parse lines.
4. Emit line events.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createStdinLineReader(stdinMock) {
>   const stdin = stdinMock || process.stdin;
>   const lines = [];
>
>   let buffer = "";
>   stdin.on("data", (chunk) => {
>     buffer += chunk.toString("utf-8");
>     const parts = buffer.split("
> ");
>     buffer = parts.pop(); // Keep incomplete trailing chunk in buffer
>
>     for (const line of parts) {
>       lines.push(line.trim());
>     }
>   });
>
>   return {
>     getLines: () => lines,
>     getBufferedData: () => buffer
>   };
> }
>
> // Verification tests
> const handlers = {};
> const mockStdin = {
>   on: (evt, fn) => { handlers[evt] = fn; }
> };
>
> const reader = createStdinLineReader(mockStdin);
> handlers["data"]("hello
> world
> incomplete");
>
> console.assert(reader.getLines().length === 2, "Test 1 Failed");
> console.assert(reader.getLines()[0] === "hello", "Test 2 Failed");
> console.assert(reader.getBufferedData() === "incomplete", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **process.stdin Stream**: Readable stream capturing interactive user input or piped data from terminal shell.
> 2. **Stream Chunking**: Data arrives in arbitrary chunks; splitting on `\n` correctly reconstructs individual lines.
> 3. **readline Module**: Node.js core `readline` module wraps process.stdin for building interactive CLI prompts.
> 
---

### Exercise 3: Stream Pipe Redirector with Error Forwarding

**Scenario:** Pipes data from a readable stream to a writable stream, ensuring errors on either stream trigger proper cleanup.

**Requirements:**
1. Write pipeStreamsWithErrorHandling(readableMock, writableMock).
2. Pipe readable to writable.
3. Attach error handlers to both streams.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function pipeStreamsWithErrorHandling(readableMock, writableMock) {
>   let hasError = false;
>
>   function handleError(err) {
>     hasError = true;
>     if (typeof readableMock.destroy === "function") readableMock.destroy();
>     if (typeof writableMock.destroy === "function") writableMock.destroy();
>   }
>
>   readableMock.on("error", handleError);
>   writableMock.on("error", handleError);
>
>   readableMock.pipe(writableMock);
>
>   return {
>     hasError: () => hasError,
>     triggerError: (err) => handleError(err)
>   };
> }
>
> // Verification tests
> const handlersR = {};
> const handlersW = {};
>
> const mockR = { on: (e, fn) => { handlersR[e] = fn; }, pipe: () => {}, destroy: () => {} };
> const mockW = { on: (e, fn) => { handlersW[e] = fn; }, destroy: () => {} };
>
> const pipeCtrl = pipeStreamsWithErrorHandling(mockR, mockW);
> pipeCtrl.triggerError(new Error("Disk full"));
>
> console.assert(pipeCtrl.hasError() === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Stream.pipe Method**: Connects readable stream output to writable stream input automatically managing backpressure.
> 2. **stream.pipeline Alternative**: Modern Node.js `stream.pipeline()` helper automatically handles error cleanup across piped streams.
> 3. **Memory Efficiency**: Piping streams processes gigabyte files in small memory chunks (~64KB) without loading full files into RAM.
## 6. Related Terms
- [Streams (General Concept)](../level_06/streams.md) — The core concepts behind readable and writable data channels.
- [The process Object](process_object.md) — The parent process object managing these streams.

---

## 7. Key Takeaways
- Every Node.js process is allocated three standard streams: `stdin`, `stdout`, and `stderr`.
- `process.stdin` is a Readable Stream that captures inputs (e.g. typing).
- `process.stdout` is a Writable Stream for standard output; it powers `console.log`.
- `process.stderr` is a Writable Stream for errors and logs; it powers `console.error`.
- Separating stdout and stderr allows production monitors to route logs and errors to different files.
- Always use `console.error` for errors so they can be filtered during analysis.
