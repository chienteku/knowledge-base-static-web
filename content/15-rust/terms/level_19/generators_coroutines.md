# Generators / Coroutines (Unstable)

> **Level 19 — Rust**
> (Nightly) Resumable functions that can yield values mid-execution; the internal foundation that `async`/`await` is built on.

---

## 1. Prerequisites

- [Nightly Compiler](nightly_compiler.md) — Nightly features.
- [`async fn`](../level_10/async_fn.md) — Async fn.

---

## 2. Term Category



**Rust Experimental Feature (resumable coroutine state machines)**: Low-level coroutines and generator state machines.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Coroutines (formerly generators) provide resumable execution contexts inside `rustc`. They allow pausing function execution via `yield` statements, capturing local stack frames into state machine structs.

Coroutines are the core compiler foundation powering `async`/`await` futures and lazy stream generators in Rust.

### (2) Reality Metaphor

A video player pause button: pressing pause saves the exact playback frame and audio state; pressing play resumes execution from that exact timestamp.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Low-level state machine concept in rustc:
enum CoroutineState<Y, R> {
    Yielded(Y),
    Complete(R),
}
```

#### Fuller Example
```rust
pub enum State {
    Start,
    Yielded1(i32),
    Done,
}

pub struct ManualCoroutine {
    state: State,
}

impl ManualCoroutine {
    pub fn new() -> Self { Self { state: State::Start } }
    pub fn resume(&mut self) -> Option<i32> {
        match self.state {
            State::Start => {
                self.state = State::Yielded1(10);
                Some(10)
            }
            State::Yielded1(_) => {
                self.state = State::Done;
                None
            }
            State::Done => None,
        }
    }
}

fn main() {
    let mut coro = ManualCoroutine::new();
    assert_eq!(coro.resume(), Some(10));
    assert_eq!(coro.resume(), None);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Use Coroutines on Stable Toolchain

**The mistake:** Trying to use `yield` syntax on stable Rust.

**Why it is wrong:** Coroutines remain an unstable nightly compiler feature (`#![feature(coroutines)]`).

*Incorrect:*
```rust
yield 42; // Compiler Error on stable!
```

*Fix:*
```rust
Use standard Iterators or async/await on stable Rust!
```

### Mistake 2: Moving Coroutine Self-References Across Yield Points

**The mistake:** Borrowing local variables across `yield` points without `Pin`.

**Why it is wrong:** Yield points can cause local stack variables to be referenced across states. Moving an unpinned coroutine causes dangling references.

*Incorrect:*
```rust
coro.resume() after moving coro
```

*Fix:*
```rust
Wrap self-referential coroutines in `Pin<&mut Coroutine>`!
```

### Mistake 3: Expecting Coroutines to Run Automagically Without Drivers

**The mistake:** Creating a coroutine without calling `.resume()`.

**Why it is wrong:** Coroutines are passive state machines that require an external executor/driver loop.

*Incorrect:*
```rust
let coro = || yield 1;
```

*Fix:*
```rust
Iterate or invoke .resume() inside an executor loop!
```

---

## 5. Practice Exercises

### Exercise 1: Manual Fiber/Coroutine State Machine

**Scenario:** Implement a manual stackless coroutine state machine `FibonacciGenerator` that yields Fibonacci numbers.

**Requirements:**
1. Define `FibonacciGenerator` struct.
1. Implement `resume(&mut self) -> u64`.
1. Test sequence output.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct FibonacciGenerator {
>     curr: u64,
>     next: u64,
> }
> 
> impl FibonacciGenerator {
>     pub fn new() -> Self {
>         Self { curr: 0, next: 1 }
>     }
> 
>     pub fn resume(&mut self) -> u64 {
>         let result = self.curr;
>         let new_next = self.curr + self.next;
>         self.curr = self.next;
>         self.next = new_next;
>         result
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fibonacci_coroutine() {
>         let mut fib = FibonacciGenerator::new();
>         assert_eq!(fib.resume(), 0);
>         assert_eq!(fib.resume(), 1);
>         assert_eq!(fib.resume(), 1);
>         assert_eq!(fib.resume(), 2);
>         assert_eq!(fib.resume(), 3);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates state machine transformations used by compiler `yield` lowering.
> 2. Each `.resume()` call transitions the generator state and yields the next value.

---

### Exercise 2: Task Yield State Machine Simulator

**Scenario:** Simulate an asynchronous task scheduler using a custom `TaskCoroutine` enum.

**Requirements:**
1. Define `TaskState` enum (`Pending`, `Ready(i32)`).
1. Implement step execution.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub enum TaskState {
>     Pending,
>     Ready(i32),
> }
> 
> pub struct TaskCoroutine {
>     step: usize,
>     val: i32,
> }
> 
> impl TaskCoroutine {
>     pub fn new(val: i32) -> Self {
>         Self { step: 0, val }
>     }
> 
>     pub fn poll_step(&mut self) -> TaskState {
>         match self.step {
>             0 => {
>                 self.step = 1;
>                 TaskState::Pending
>             }
>             1 => {
>                 self.step = 2;
>                 TaskState::Ready(self.val * 2)
>             }
>             _ => TaskState::Pending,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_task_polling() {
>         let mut task = TaskCoroutine::new(21);
>         assert!(matches!(task.poll_step(), TaskState::Pending));
>         assert!(matches!(task.poll_step(), TaskState::Ready(42)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Mimics `Future::poll` execution state machine generated by `async`/`await`.
> 2. Pauses and resumes tasks cleanly.

---

### Exercise 3: Custom Streaming Lexer Coroutine

**Scenario:** Build a state-machine stream lexer yielding tokens on demand.

**Requirements:**
1. Implement `LexerCoroutine` accepting a string.
1. Yield tokens iteratively.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct LexerCoroutine<'a> {
>     input: &'a str,
>     cursor: usize,
> }
> 
> impl<'a> LexerCoroutine<'a> {
>     pub fn new(input: &'a str) -> Self {
>         Self { input, cursor: 0 }
>     }
> 
>     pub fn next_token(&mut self) -> Option<&'a str> {
>         if self.cursor >= self.input.len() {
>             return None;
>         }
>         let rest = &self.input[self.cursor..];
>         let end = rest.find(' ').unwrap_or(rest.len());
>         let token = &rest[..end];
>         self.cursor += end + 1;
>         Some(token)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_lexer_coroutine() {
>         let mut lex = LexerCoroutine::new("rust async await");
>         assert_eq!(lex.next_token(), Some("rust"));
>         assert_eq!(lex.next_token(), Some("async"));
>         assert_eq!(lex.next_token(), Some("await"));
>         assert_eq!(lex.next_token(), None);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Yields string tokens iteratively without allocating intermediate vectors.
> 2. Zero-copy state machine parser.

---

## 6. Related Terms

- [`async fn`](../level_10/async_fn.md) — Async/await runtime foundation.
- [`Future` Trait](../level_10/future_trait.md) — Future trait.
- [Nightly Compiler](nightly_compiler.md) — Related concept: Nightly Compiler.

---

## 7. Key Takeaways

- Coroutines power `async`/`await` futures and stream generators in Rust.
- Resumable execution contexts that yield values via state machine structures.
- Requires `Pin` for self-referential stack frames across `yield` points.
- Currently an unstable compiler feature (`#![feature(coroutines)]`).
