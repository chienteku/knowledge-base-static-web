# Labeled Loops (`'label: loop`)

> **Level 2 — Rust**
> Naming a loop with a label so that nested `break` and `continue` can target an outer loop by name, not just the innermost one.

---

## 1. Prerequisites

**None.**

---


## 2. Term Category

**Control Flow**: Labeled loops (`'label: loop`) for breaking or continuing outer nested loops.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Breaking or continuing out of deeply nested loops (like searching a 2D matrix or grid) in other languages requires managing boolean flag variables or complex `goto` jumps.

Rust Labeled Loops attach a lifetime-like label identifier (`'outer: loop`, `'inner: for`) to a loop block. `break 'outer` or `continue 'outer` directly exits or resumes the target outer loop from deep within inner nested loops.

### (2) Reality Metaphor

A multi-story building elevator emergency override: pressing the floor button on Level 10 overrides all intermediate floor stops and jumps directly to the ground floor exit ('ground: loop).

### (3) Rust Code Examples

#### Short Snippet
```rust
'outer: for x in 0..10 {
    for y in 0..10 {
        if x * y == 42 { break 'outer; }
    }
}
```

#### Fuller Example
```rust
pub fn find_matrix_target(grid: &[&[i32]], target: i32) -> Option<(usize, usize)> {
    'rows: for (r, row) in grid.iter().enumerate() {
        for (c, &val) in row.iter().enumerate() {
            if val == target {
                return Some((r, c));
            }
            if val < 0 {
                // Skip remaining columns in this row and continue to next row!
                continue 'rows;
            }
        }    }
    None
}

fn main() {
    let matrix: &[&[i32]] = &[&[1, 2, 3], &[-1, 99, 99], &[4, 5, 6]];
    assert_eq!(find_matrix_target(matrix, 5), Some((2, 1)));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Syntax Confusion with Lifetime Annotations

**The mistake:** Confusing loop labels `'outer:` with reference lifetime annotations `'a`.

**Why it is wrong:** Loop labels start with a single quote `'` followed by a colon `:` at the loop header (`'label: loop`). Lifetimes are attached to references (`&'a str`).

*Incorrect:*
```rust
'outer loop { ... } // Missing colon error!
```

*Fix:*
```rust
'outer: loop { break 'outer; } // Correct labeled loop syntax!
```

### Mistake 2: Breaking Labeled Loops with Value Returns Incorrectly

**The mistake:** Attempting to return values from labeled `for` loops using `break 'label value;`.

**Why it is wrong:** Only `loop` expressions can return values via `break value;`. `for` and `while` loops evaluate to `()`.

*Incorrect:*
```rust
'outer: for x in 0..10 { break 'outer 42; } // Error!
```

*Fix:*
```rust
'outer: loop { break 'outer 42; } // Correct value-returning loop label!
```

### Mistake 3: Overusing Labeled Loops Where `return` or Functional Iterators Are Cleaner

**The mistake:** Using nested labeled loops where iterator combinators (`.position()`, `.find()`) or function returns are cleaner.

**Why it is wrong:** Creates verbose control flow where functional combinators express intent more concisely.

*Incorrect:*
```rust
Nested 4-level labeled loops
```

*Fix:*
```rust
Use iterator combinators (.any(), .find()) or break logic into smaller functions!
```

---

## 5. Practice Exercises

### Exercise 1: 2D Grid Pixel Collision Search Engine

**Scenario:** Build a 2D collision detection search `find_collision(grid: &[&[u8]]) -> Option<(usize, usize)>` that breaks out of nested loops using a label `'grid_search` upon finding a non-zero pixel.

**Requirements:**
1. Accept 2D slice grid `&[&[u8]]`.
1. Label outer loop `'grid_search`.
1. Use `break 'grid_search Some((r, c));`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn find_collision(grid: &[&[u8]]) -> Option<(usize, usize)> {
>     let mut result = None;
>     'grid_search: for (r, row) in grid.iter().enumerate() {
>         for (c, &pixel) in row.iter().enumerate() {
>             if pixel != 0 {
>                 result = Some((r, c));
>                 break 'grid_search;
>             }
>         }
>     }
>     result
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_labeled_loop_collision() {
>         let grid: &[&[u8]] = &[
>             &[0, 0, 0],
>             &[0, 255, 0],
>             &[0, 0, 0],
>         ];
>         assert_eq!(find_collision(grid), Some((1, 1)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `break 'grid_search` directly exits the outer row loop when a collision pixel is detected.

---

### Exercise 2: Labeled Loop Value-Returning Search

**Scenario:** Implement a searching `loop` using `'search: loop` returning the first number divisible by both 3 and 7.

**Requirements:**
1. Use `'search: loop`.
1. Return value via `break 'search val;`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn find_lcm() -> u32 {
>     let mut val = 1;
>     'search: loop {
>         if val % 3 == 0 && val % 7 == 0 {
>             break 'search val;
>         }
>         val += 1;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_labeled_loop_return() {
>         assert_eq!(find_lcm(), 21);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates `loop` expression returning values via labeled `break 'label value;`.

---

### Exercise 3: Row Skip Matrix Processing using `continue 'outer`

**Scenario:** Build a matrix row validator that skips processing remaining columns in a row when a corrupt element is found.

**Requirements:**
1. Label outer loop `'rows`.
1. Use `continue 'rows;`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn process_valid_rows(matrix: &[&[i32]]) -> Vec<i32> {
>     let mut sums = Vec::new();
>     'rows: for row in matrix {
>         let mut row_sum = 0;
>         for &val in *row {
>             if val < 0 {
>                 // Invalid row sample, skip remaining elements and continue to next row!
>                 continue 'rows;
>             }
>             row_sum += val;
>         }
>         sums.push(row_sum);
>     }
>     sums
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_row_skip() {
>         let mat: &[&[i32]] = &[
>             &[1, 2, 3],
>             &[4, -1, 6], // Corrupt, skip!
>             &[7, 8, 9],
>         ];
>         assert_eq!(process_valid_rows(mat), vec![6, 24]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `continue 'rows` skips remaining inner loop execution and advances outer loop iterator.

---

## 5. Related Terms

**None.**

---


## 7. Key Takeaways

- Labeled loops attach labels `'label:` to `loop`, `while`, or `for` blocks.
- `break 'label` exits the designated outer loop directly.
- `continue 'label` skips remaining inner code and resumes designated outer loop.
- Value-returning `break 'label val` works with `loop` expressions.
