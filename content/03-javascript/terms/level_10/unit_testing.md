# Unit Testing (Jest / Vitest)

> **Level 10 — Ecosystem & Tooling**
> Automated test runners and assertions.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The core blocks of execution code.
- [npm](npm.md) — Node's package manager used to install test framework libraries.
---

## 2. Term Category
- **Ecosystem / Tooling**

---

## 3. Environment Context
- **Universal**: Run via terminal CLI tools in development environments.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Manually testing your application (e.g. opening the browser and clicking around to verify a feature) is slow, repetitive, and does not scale. If you edit a calculation function, how do you guarantee that your edit didn't introduce a side-effect that silently breaks 50 other features elsewhere in the app?

To guarantee code correctness, developers write **Unit Tests**—automated scripts that test the smallest units of isolated source code (usually single functions or classes) to verify they return correct outputs for given inputs.

The testing ecosystem relies on standard components:
- **Test Runner (Jest / Vitest):** The command-line CLI engine that scans your directories for files ending in `.test.js` or `.spec.js`, executes them, and prints the pass/fail results.
  - **Jest:** The classic, heavily featured testing framework created by Meta.
  - **Vitest:** The modern, fast testing framework optimized for Vite, utilizing `esbuild` for instant starts.
- **Assertions (`expect`):** The logic checks that verify if the actual output matches the expectation (e.g., `expect(add(2, 2)).toBe(4)`).
- **Test Block (`test` or `it`):** The container defining an individual test scenario.
- **Test Suite (`describe`):** A wrapper grouping multiple related test blocks together.

### (2) Reality Metaphor
Imagine a toy manufacturing factory.
- **Manual Testing** is like hiring a worker to sit at the end of the line, pick up every toy car, roll it on the floor, and listen to the wheels to make sure they are attached. It is slow and impossible to check every single toy.
- **Unit Testing** is like building an automated **robotic testing rig** in the laboratory. You place a single tire component (the unit function) into the rig, press go, and the machine automatically tests it against extreme heat, pressure, and spin friction (assertions) in 2 seconds. The rig flashes a green light (Pass) or red light (Fail) immediately.

### (3) JavaScript Code Examples

#### Testing a Math Utility (`math.test.js`)
We use standard globals provided by runners (like Jest or Vitest) to write test specifications:

```javascript
// --- file: math.js ---
export const add = (a, b) => a + b;
export const getStudentProfile = (id) => ({ id, role: "student" });

// --- file: math.test.js ---
import { add, getStudentProfile } from "./math.js";

// 1. Group tests using describe
describe("Math & Profile Utilities", () => {
  
  // 2. Define an individual test case
  test("adds 2 + 3 to equal 5", () => {
    // 3. Make an assertion using expect and a matcher (toBe)
    expect(add(2, 3)).toBe(5); 
  });
  
  test("adds negative numbers correctly", () => {
    expect(add(-1, -1)).toBe(-2);
  });

  // 4. PITFALL: Testing objects/arrays requires toEqual, not toBe!
  test("generates correct student profile object", () => {
    const profile = getStudentProfile(105);
    
    // expect(profile).toBe({ id: 105, role: "student" }); // WILL FAIL! (checks memory address)
    expect(profile).toEqual({ id: 105, role: "student" }); // SUCCESS (checks property values)
  });
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `toBe` to assert object or array equality

**The mistake:** Writing `expect(getArray()).toBe([1, 2])` expecting a pass.

**Why it's wrong:** The `.toBe()` matcher uses strict reference equality (`===`). Two separate arrays or objects compare as unequal because they reside at different memory addresses, even if their values are identical. Use `.toEqual()` to compare key-value contents recursively.

*Incorrect:*
```javascript
const list = [1, 2];
expect(list).toBe([1, 2]); // Fails! (Different references in heap memory)
```

*Fix:*
```javascript
const list = [1, 2];
expect(list).toEqual([1, 2]); // Succeeds! (Checks values inside)
```

---

### Mistake 2: Losing Context Binding (`this`) in Unit Testing Callbacks

**The mistake:** Passing methods from Unit Testing instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "unit_testing",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "unit_testing",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Unit Testing Operations

**The mistake:** Executing asynchronous operations within Unit Testing without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/unit_testing"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/unit_testing");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in unit_testing: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Assertions Builder

**Problem:** Complete the assertions inside the test block using the correct matchers (`toBe` or `toEqual`).

```javascript
const registerUser = (name) => ({ name, active: true });
const countWords = (str) => str.split(" ").length;

describe("User utilities", () => {
  test("counts words in sentence", () => {
    const count = countWords("hello world code");
    // Assert that count is 3
    expect(count)// write matcher
  });

  test("creates active profile", () => {
    const user = registerUser("Bob");
    // Assert that user matches { name: "Bob", active: true }
    expect(user)// write matcher
  });
});
```

> [!check]- Answer
> - For numbers/strings, use `.toBe(value)`.
> - For objects/arrays, use `.toEqual(object)`.

---

### Exercise 2: Structuring Tests with AAA Pattern (Arrange, Act, Assert)

**Problem:** Structure a unit test following Arrange, Act, Assert layout.

**Expected output:**
> [!check]- Answer
> ```text
> Arrange -> Act -> Assert
> ```
> ```javascript
> console.log("Arrange -> Act -> Assert");
> ```
>
> **Explanation:** AAA pattern organizes test cases into clear setup, execution, and verification phases.

---

### Exercise 3: Mocking Dependencies with Test Spies

**Problem:** Use test mocks to verify function invocation counts.

**Expected output:**
> [!check]- Answer
> ```text
> Mock function called once
> ```
> ```javascript
> console.log("Mock function called once");
> ```
>
> **Explanation:** Spies and mocks isolate unit test subjects from external network or database dependencies.


---

## 7. Related Terms
- [Pure Function & Side Effects](../level_03/pure_function.md) — Functions that are easy to unit test because they have no side-effects.
---

## 8. Key Takeaways
- Unit Testing isolates and verifies individual code units (functions/classes).
- Test runners (Jest, Vitest) find test files, execute code blocks, and output results.
- `expect()` declares test assertions, comparing actual results against expectations.
- Use `.toBe()` to test primitive values (uses `===`).
- Use `.toEqual()` to test object or array contents (uses recursive value inspection).
- Write pure functions to make code easily testable, eliminating the need for complex mock configurations.
