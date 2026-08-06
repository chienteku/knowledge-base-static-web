# stdin / stdout / stderr (Standard Streams)

> **Level 2 — Core Modules & Globals**
> The process's built-in streams — the first real streams a learner meets.

---

## 1. Prerequisites
- [The process Object](process_object.md) — Standard streams are accessed as properties of `process`.

---

## 2. Term Category
- **Core Module / Computer Science Concept**

---

## 3. Environment Context
- **Node.js Core Architecture** (Directly connected to the operating system's standard I/O communication descriptors).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Custom Logger

**Problem:** Complete the code to build a simple logger function that writes debug messages to `stdout` and error logs to `stderr`:

```javascript
function logMessage(level, msg) {
  const timestamp = new Date().toISOString();
  if (level === 'ERROR') {
    process.stderr.write(`[${timestamp}] ERROR: ${msg}\n`);
  } else {
    process.stdout.write(`[${timestamp}] INFO: ${msg}\n`);
  }
}

logMessage('INFO', 'Server started on port 3000');
logMessage('ERROR', 'Failed to connect to database');
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Reading User Input from process.stdin

**Problem:** Read line input from user via `process.stdin` using `readline` module.

**Expected output:**
> [!check]- Answer
> ```text
> const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question('Name? ', (answer) => { ... });
> ```
> ```javascript
> const readline = require('readline');
> const rl = readline.createInterface({
>   input: process.stdin,
>   output: process.stdout
> });
> rl.question('Name? ', (answer) => {
>   console.log(`Hello ${answer}`);
>   rl.close();
> });
> ```
>
> **Explanation:** `readline` wraps `process.stdin` and `process.stdout` streams for interactive CLI prompts.
> 
---

### Exercise 3: Standard Streams File Descriptors

**Problem:** Match stream to numeric POSIX file descriptor:
1. `stdin` (0)
2. `stdout` (1)
3. `stderr` (2)

**Expected output:**
> [!check]- Answer
> ```text
> 1. stdin: 0
> 2. stdout: 1
> 3. stderr: 2
> ```
> ```text
> 1. stdin: 0
> 2. stdout: 1
> 3. stderr: 2
> ```
>
> **Explanation:** POSIX standards designate 0 for standard input, 1 for standard output, and 2 for standard error.
> 
## 7. Related Terms
- [Streams (General Concept)](../level_06/streams.md) — The core concepts behind readable and writable data channels.
- [The process Object](process_object.md) — The parent process object managing these streams.

---

## 8. Key Takeaways
- Every Node.js process is allocated three standard streams: `stdin`, `stdout`, and `stderr`.
- `process.stdin` is a Readable Stream that captures inputs (e.g. typing).
- `process.stdout` is a Writable Stream for standard output; it powers `console.log`.
- `process.stderr` is a Writable Stream for errors and logs; it powers `console.error`.
- Separating stdout and stderr allows production monitors to route logs and errors to different files.
- Always use `console.error` for errors so they can be filtered during analysis.
