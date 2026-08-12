# do...while

> **Level 2 — Control Flow & Data Structures**
> Similar to `while`, but guaranteed to execute the code block at least once.

---

## 1. Prerequisites
- [while Loop](while_loop.md) — A loop that executes as long as a condition is true.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: do...while is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A standard `while` loop checks its condition *before* it runs its code block. If the condition is false from the very beginning, the loop's code will execute exactly zero times. 

However, there are scenarios where you absolutely must run the code at least once before you can even check the condition. For example, prompting a user for a password: you have to ask them *at least once* before you can check if the password they typed is correct. The `do...while` loop was designed to guarantee that the first iteration always runs.

### (2) Reality Metaphor
A normal `while` loop is like a bouncer at a club checking IDs. They check your ID *before* letting you in. If you aren't 21, you never step foot inside.
A `do...while` loop is like an all-you-can-eat buffet where you pay *after* you eat. You are guaranteed to eat at least one plate of food. After you finish that plate, the waiter asks if you want another (evaluating the condition).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
let count = 10;

// Even though the condition (count < 5) is false, 
// the block runs once before checking!
do {
  console.log(`Count is: ${count}`);
  count++;
} while (count < 5);

// Output: "Count is: 10"
```

#### Fuller Example
```javascript
// A classic pattern: generating a unique ID and checking if it exists
const existingIds = [12, 45, 88];
let newId;

do {
  // Generate a random ID between 1 and 100
  newId = Math.floor(Math.random() * 100) + 1;
  console.log(`Trying ID: ${newId}`);
  
// Keep looping AS LONG AS the ID already exists in our list
} while (existingIds.includes(newId));

console.log(`Success! Assigned new unique ID: ${newId}`);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the semicolon

**The mistake:** Leaving off the semicolon at the very end of the `do...while` statement.

**Why it's wrong:** Unlike `if` statements, `for` loops, or normal `while` loops, the `do...while` syntax ends with the condition in parentheses. By convention and strict syntax rules, it should be terminated with a semicolon to prevent the JavaScript engine from misinterpreting the next line of code as part of the loop.

*Incorrect:*
```javascript
let i = 0;
do {
  i++;
} while (i < 3) // Missing semicolon!
console.log("Done");
```

*Fix:*
```javascript
let i = 0;
do {
  i++;
} while (i < 3); // Better!
console.log("Done");
```

---

### Mistake 2: Losing Context Binding (`this`) in Do While Callbacks

**The mistake:** Passing methods from Do While instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "do_while",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "do_while",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Do While Operations

**The mistake:** Executing asynchronous operations within Do While without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/do_while"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/do_while");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in do_while: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Resilient Microservice API Retry Controller

**Scenario:** A microservice client dispatches an HTTP request at least once, retrying up to max attempts using a do...while loop until a success status is received or retry budget is spent.

**Requirements:**
1. Write executeWithRetry(requestFn, maxRetries).
2. Execute requestFn() at least once inside do block.
3. Retry while status is NOT 200 and attempt count < maxRetries.
4. Return execution response object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function executeWithRetry(requestFn, maxRetries) {
>   let attempts = 0;
>   let response;
>
>   do {
>     attempts++;
>     response = requestFn(attempts);
>   } while (response.status !== 200 && attempts < maxRetries);
>
>   return { response, totalAttempts: attempts };
> }
>
> // Verification tests
> let count = 0;
> const mockFn = (attempt) => ({ status: attempt === 2 ? 200 : 500 });
> const res = executeWithRetry(mockFn, 3);
> console.assert(res.totalAttempts === 2 && res.response.status === 200, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Guaranteed Initial Execution**: A do...while loop evaluates its body statement at least once before testing the condition.
> 2. **Post-Test Condition Evaluation**: The loop condition check occurs at the end of every iteration after body execution.
> 3. **Retry Control Flow**: Ideal for operations that must execute once before deciding whether to repeat (polling, retrying).
> 
---

### Exercise 2: CLI Interactive Port Prompt Validator

**Scenario:** An interactive setup wizard prompts for a valid server port number at least once, repeating the prompt until a port in the valid range 1024-65535 is provided.

**Requirements:**
1. Write promptForPort(inputMockArray).
2. Extract port inputs from array inside do block.
3. Repeat while port is out of range 1024-65535.
4. Return accepted port.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function promptForPort(inputMockArray) {
>   const inputs = [...inputMockArray];
>   let chosenPort;
>   let isValid = false;
>
>   do {
>     chosenPort = inputs.shift();
>     isValid = typeof chosenPort === "number" && chosenPort >= 1024 && chosenPort <= 65535;
>   } while (!isValid && inputs.length > 0);
>
>   return { chosenPort, isValid };
> }
>
> // Verification tests
> const res = promptForPort([80, 70000, 8080]);
> console.assert(res.chosenPort === 8080 && res.isValid === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Validation Post-Check**: Guarantees initial user input capture before checking validity conditions.
> 2. **Loop Variable Scope**: Variables tested in the while (condition) clause must be declared outside the do block.
> 3. **Difference from while Loop**: A standard while loop evaluates conditions pre-execution, potentially skipping the body completely.
> 
---

### Exercise 3: Random Token Unique Generation Guard

**Scenario:** A security token generator generates random tokens, using a do...while loop to generate tokens at least once and repeat generation if a collision with an existing active token set is detected.

**Requirements:**
1. Write generateUniqueToken(existingTokenSet, generatorFn).
2. Generate token in do block.
3. Repeat while existingTokenSet.has(token) is true.
4. Return unique token.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function generateUniqueToken(existingTokenSet, generatorFn) {
>   let token;
>   let attempts = 0;
>
>   do {
>     attempts++;
>     token = generatorFn();
>   } while (existingTokenSet.has(token));
>
>   return { token, attempts };
> }
>
> // Verification tests
> const set = new Set(["TOKEN_A", "TOKEN_B"]);
> let callCount = 0;
> const mockGen = () => {
>   callCount++;
>   return callCount === 1 ? "TOKEN_A" : "TOKEN_C";
> };
> const res = generateUniqueToken(set, mockGen);
> console.assert(res.token === "TOKEN_C" && res.attempts === 2, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Collision Avoidance Pattern**: Guarantees single initial generation without repeating code before entering validation checks.
> 2. **Set Collection Lookup**: Using Set.prototype.has() provides O(1) existence checks in loop conditions.
> 3. **Termination Assurance**: Ensure the generator function has finite randomness to avoid infinite do...while loops.
---

## 6. Related Terms
- [while Loop](while_loop.md) — The standard while loop that checks the condition first.
- [for Loop](for_loop.md) — A loop for iterating a specific number of times.

---

## 7. Key Takeaways
- The `do...while` loop executes the code block *before* evaluating the condition.
- It is guaranteed to run at least one time, even if the condition is false.
- Useful for user prompts or situations where the data needed for the condition is generated *inside* the loop.
