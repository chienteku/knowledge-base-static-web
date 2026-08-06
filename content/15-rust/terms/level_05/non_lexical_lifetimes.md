# Non-Lexical Lifetimes (NLL)

> **Level 5 — Lifetimes**
> The borrow checker's current model, where a borrow ends at its *last actual use*, not at the end of its enclosing lexical scope.

---

## 1. Prerequisites


- [Borrow Checker](../level_03/borrow_checker.md) — The system NLL is the current operating model of.
- [Lifetime (`'a`)](lifetime.md) — What NLL changed the precise meaning of.
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The rule NLL's flexibility is most noticeable around.

---

## 2. Term Category



**Rust Borrow Checker Feature (control-flow-aware reference scopes)**: Non-Lexical Lifetimes (NLL) is the borrow checking analysis engine introduced in Rust 2018 (and stabilized for all editions in 2021). Instead of tying a borrow's validity duration to textual block scopes (`{ ... }`), NLL analyzes the program's **Control Flow Graph (CFG)** on Mid-level Intermediate Representation (MIR) nodes. A borrow's effective lifetime ends at the exact location of its **last actual point of use**.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In early Rust (pre-2018 edition), the borrow checker evaluated lifetimes using **lexical scoping**. A borrow was considered active from its declaration point until the closing brace `}` of its enclosing block, regardless of whether the borrowed reference was used after an early statement.

This produced frustrating false-positive compiler errors for clean, valid code:

```rust
// PRE-2018 RUST (Lexical Borrow Checker False Positive)
fn main() {
    let mut data = vec![1, 2, 3];
    let r = &data[0]; // Immutable borrow begins
    println!("{r}");  // LAST USE of `r`
    
    data.push(4);     // ❌ Pre-2018 Error: `data` borrowed as immutable until end of main!
} // `r`'s lexical scope ends here
```

In the snippet above, `r` is never accessed after `println!`. Under lexical rules, the borrow persisted until `main` exited, blocking `data.push(4)`. Developers had to introduce artificial inner blocks `{ let r = ...; }` to force early drop.

NLL eliminated this friction by tracking borrows across MIR control flow points. The borrow for `r` automatically ends immediately after `println!("{r}")`, allowing `data.push(4)` to compile without artificial scoping hacks.

### (2) Deep Dive — How NLL Operates on MIR

The compiler converts high-level Rust code into Mid-level Intermediate Representation (MIR), a Control Flow Graph consisting of basic blocks and statements:

1. **Point-Based Lifetimes**: Lifetimes are represented as sets of MIR statement locations rather than block spans.
2. **Liveness Analysis**: At every MIR location, the borrow checker calculates whether a variable or reference will be read or written in any execution path reachable from that point.
3. **Early Expiration**: Once a borrow is no longer reachable by future reads, the borrow checker releases the loan, permitting new shared (`&T`) or exclusive (`&mut T`) borrows of the underlying data.

### (3) Reality Metaphor

- **Lexical Lifetimes (Old Model)**: A valet parking service that locks your car keys until the hotel checkout time at 11:00 AM tomorrow, even if you paid for 1 hour of parking and left the hotel at 2:00 PM today.
- **Non-Lexical Lifetimes (NLL)**: A smart parking meter equipped with motion sensors. The moment your car pulls out of the parking spot (**last actual use**), the meter instantly releases the spot for the next driver.

### (4) Rust Code Examples

#### Short Snippet (NLL Early Borrow Termination)
```rust
fn main() {
    let mut scores = vec![10, 20, 30];
    
    let first = scores.first();
    println!("First score: {:?}", first); // Borrow ends HERE!
    
    scores.push(40); // Legal under NLL!
    assert_eq!(scores.len(), 4);
}
```

#### HashMap Match & Insert Pattern (Classic Pre-NLL Fix)
```rust
use std::collections::HashMap;

fn get_or_insert_default<'a>(map: &'a mut HashMap<String, String>, key: &str) -> &'a str {
    // Under NLL, `map.get(key)`'s borrow ends at the `if let` condition check if None!
    if let Some(val) = map.get(key) {
        return val;
    }
    
    map.insert(key.to_string(), "default_val".to_string());
    map.get(key).unwrap()
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming NLL Allows Overlapping Active Mutability within the Same Evaluation Statement

**The mistake:** Assuming NLL allows mutating a collection while simultaneously accessing a reference derived from it in the same statement.

**Why it is wrong:** NLL terminates borrows *after* their last point of use. If a reference is passed into a function call or expression alongside a call that mutates the collection, both borrows overlap in the statement evaluation span, causing `E0502`.

*Incorrect:*
```rust
let mut vec = vec![1, 2, 3];
// vec.push(vec[0]); // ❌ Error E0502: cannot borrow `vec` as mutable because it is also borrowed as immutable
```

*Fix:*
```rust
let mut vec = vec![1, 2, 3];
let val = vec[0]; // Copy or store value first!
vec.push(val);    // First borrow ended; push succeeds.
```

### Mistake 2: Expecting NLL to Infer Lifetime Bounds Across Function Signature Boundaries

**The mistake:** Expecting NLL analysis to automatically fix invalid function signature lifetime annotations.

**Why it is wrong:** NLL functions purely within local function bodies. Interface signatures across function boundaries are enforced statically based on explicit or elided lifetime parameters.

*Incorrect:*
```rust
fn get_dangling<'a>() -> &'a str {
    let s = String::from("local");
    &s // ❌ Error E0515: NLL cannot extend local stack frame lifetime!
}
```

### Mistake 3: Retaining Borrowed References Across Async Yield Points (`.await`)

**The mistake:** Expecting NLL to drop a borrow before an `.await` call when the reference is referenced after `.await`.

**Why it is wrong:** If a reference is held across an `.await` yield point, the state machine constructed by the async runtime must store the reference in the Future generator state, requiring it to remain valid across thread yield boundaries.

---

## 5. Practice Exercises

### Exercise 1: High-Throughput Cache Lookup & Insertion (`get_or_insert_with`)

**Scenario:** You are building an in-memory session cache `SessionCache`. Implement `get_or_create(&mut self, token: &str)` that performs a map lookup, returns a reference if present, or inserts a new session if missing, leveraging NLL to avoid double-lookup overhead.

**Requirements:**
1. Check `map.get_mut(token)`.
2. Return mutable reference if present.
3. If missing, insert new session and return reference.
4. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq)]
> pub struct UserSession {
>     pub user_id: u64,
>     pub active: bool,
> }
> 
> pub struct SessionCache {
>     sessions: HashMap<String, UserSession>,
> }
> 
> impl SessionCache {
>     pub fn new() -> Self {
>         Self { sessions: HashMap::new() }
>     }
> 
>     pub fn get_or_create(&mut self, token: &str, user_id: u64) -> &mut UserSession {
>         // NLL permits this: if `map.get_mut` returns None, the borrow ends!
>         if self.sessions.contains_key(token) {
>             return self.sessions.get_mut(token).unwrap();
>         }
>         
>         self.sessions.insert(token.to_string(), UserSession { user_id, active: true });
>         self.sessions.get_mut(token).unwrap()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_cache_nll() {
>         let mut cache = SessionCache::new();
>         let s1 = cache.get_or_create("token_abc", 42);
>         assert_eq!(s1.user_id, 42);
>         
>         s1.active = false;
>         let s2 = cache.get_or_create("token_abc", 42);
>         assert_eq!(s2.active, false);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. In `get_or_create`, checking `contains_key` or `get_mut` creates a temporary borrow.
> 2. Under NLL, when `if` condition evaluation finishes or returns, the initial borrow ends immediately.
> 3. Subsequent `insert` operations proceed safely without borrow checker conflict.

---

### Exercise 2: Zero-Copy String Buffer Replacer & In-Place Sanitizer

**Scenario:** Implement an in-place string sanitizer `sanitize_token(buffer: &mut String)` that inspects the buffer using a slice borrow, and if invalid characters are detected, clears and repopulates the buffer without allocating a secondary buffer.

**Requirements:**
1. Inspect `buffer.as_str()` for non-alphanumeric characters.
2. If clean, return early.
3. If dirty, clear `buffer` and retain only alphanumeric characters.
4. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn sanitize_token(buffer: &mut String) {
>     let needs_clean = buffer.chars().any(|c| !c.is_alphanumeric());
>     
>     // `buffer.chars()` borrow ends right HERE after `any(...)` completes!
>     if needs_clean {
>         let cleaned: String = buffer.chars().filter(|c| c.is_alphanumeric()).collect();
>         buffer.clear();
>         buffer.push_str(&cleaned);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sanitize_token() {
>         let mut token = String::from("usr_123#sec!");
>         sanitize_token(&mut token);
>         assert_eq!(token, "usr123sec");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `buffer.chars()` creates an immutable borrow of `buffer`.
> 2. Under NLL, the borrow ends immediately after `.any(...)` returns its boolean result.
> 3. `buffer.clear()` and `buffer.push_str()` acquire exclusive mutable access to `buffer` without compiler error.

---

### Exercise 3: Zero-Copy Token Stream Scanner with Fallback Mutation

**Scenario:** Build a stream token scanner `scan_next<'a>(input: &mut &'a str) -> Option<&'a str>` that pops the next space-delimited token from a string slice reference, updating `input` to point to the remainder.

**Requirements:**
1. Strip leading spaces.
2. Extract token slice up to whitespace.
3. Update `*input` to remaining slice.
4. Return extracted token.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn scan_next<'a>(input: &mut &'a str) -> Option<&'a str> {
>     *input = input.trim_start();
>     if input.is_empty() {
>         return None;
>     }
>     
>     let end = input.find(char::is_whitespace).unwrap_or(input.len());
>     let token = &input[..end];
>     *input = &input[end..];
>     Some(token)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_scan_next_tokens() {
>         let mut stream = "   alpha   beta  gamma  ";
>         let t1 = scan_next(&mut stream);
>         let t2 = scan_next(&mut stream);
>         
>         assert_eq!(t1, Some("alpha"));
>         assert_eq!(t2, Some("beta"));
>         assert_eq!(stream.trim(), "gamma");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `input.find(...)` borrows from `input`.
> 2. NLL ends the inspection borrow before `*input = &input[end..]` executes.
> 3. Tightly updates slice cursor while returning borrowed tokens tied to `'a`.

---

## 6. Related Terms


- [Borrow Checker](../level_03/borrow_checker.md) — The system NLL is the modern operating model for.
- [Lifetime (`'a`)](lifetime.md) — What NLL redefines the practical *ending point* of.
- [Reborrowing & Two-Phase Borrows](../level_03/reborrowing.md) — A closely related refinement that also loosened overly strict early borrow-checker behavior.
- [Polonius](../level_19/polonius.md) — Related concept: Polonius.

---

## 7. Key Takeaways

- NLL redefined borrow lifetimes to end at their **last actual point of use** in the Control Flow Graph.
- Eliminates artificial block scoping hacks (`{ ... }`) needed in pre-2018 Rust.
- NLL operates locally inside function bodies on MIR statements.
- Core borrow rules (aliasing XOR mutability) remain fully enforced; only borrow duration estimation is refined.
