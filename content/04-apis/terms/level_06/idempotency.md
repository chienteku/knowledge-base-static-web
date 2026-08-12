# Idempotency

> **Level 6 — Advanced API Concepts**
> A mathematical and programming concept meaning that making the same API request multiple times will have the exact same effect as making it just once.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — HTTP verbs are strictly categorized by whether they are idempotent or not.
- [Request & Response Lifecycle](../level_01/request_response.md) — Network failures are the reason idempotency is so important.

---

## 2. Term Category

**API Architecture / Math Concept (Universal Standard .)**: Idempotency is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you click "Pay $50" on an e-commerce website. Your browser sends the API request to the server. The server successfully charges your credit card $50. But before the server can send the `200 OK` response back to you, your Wi-Fi drops!
Your browser didn't get the `200 OK`, so it assumes the request failed. It shows a red "Network Error - Click to Retry" button. You click the button again. 
If the API is poorly designed, it charges you *another* $50. You just paid $100 for a $50 shirt! 
**Idempotency** is the concept that prevents this. An Idempotent API guarantees that no matter how many times you retry the exact same request, the database will only be altered *once*.

### (2) Reality Metaphor
**Not Idempotent (Addition):** "Add 5 to my score." If you say this three times, your score increases by 15. The result changes every time you speak.
**Idempotent (Assignment):** "Set my score to 5." If you say this three times, your score is still 5. The result after the first time is identical to the result after the 100th time.

### (3) HTTP Methods & Idempotency
The HTTP specification defines exactly which methods must be Idempotent:
- **`GET`**: Idempotent. Reading a user's profile 10 times doesn't change the database.
- **`PUT`**: Idempotent. "Set User 5's email to `bob@gmail.com`". Doing this 10 times results in the email being `bob@gmail.com`.
- **`DELETE`**: Idempotent. "Delete User 5." The first time, it deletes it. The next 9 times, it returns `404 Not Found`, but the *state of the database* remains exactly the same (User 5 does not exist).
- **`POST`**: **NOT Idempotent**. "Create a new user named Bob." If you send this 10 times, you will create 10 different clones of Bob in the database!

### (4) How to make POST requests safe (Idempotency Keys)
If `POST` is not idempotent, how does Stripe prevent double-charging credit cards? 
They use **Idempotency Keys**. The Frontend generates a random, unique string (e.g., `key=9876xyz`) and sends it in the HTTP Headers with the `POST` request. 
The Server charges the card and saves `9876xyz` in the database. When the Frontend drops Wi-Fi and hits "Retry," it sends the exact same `key=9876xyz`. The Server looks at the key, realizes it already processed it, and simply returns the old `200 OK` success message *without* charging the card again!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `PUT` for relative updates

**The mistake:** A developer builds an endpoint `PUT /api/bank/deposit` and the payload is `{ "amount": 100 }`. The backend logic takes the current balance and *adds* $100 to it.

**Why it's wrong:** You just broke the rules of HTTP! `PUT` is strictly defined as an **Idempotent** method. Adding $100 to a balance is a relative, non-idempotent action (running it 3 times adds $300). 
**Golden Rule:** If the action changes the state repeatedly upon multiple calls, it MUST be a `POST` request. `PUT` should only be used for absolute replacement.

---

### Mistake 2: Assuming Non-Safe Operations Are Automatically Non-Idempotent

**The mistake:** Believing `PUT` and `DELETE` operations cannot be idempotent because they alter database state.

**Why it's wrong:** Idempotency means N identical calls produce the EXACT same server state as 1 call. `PUT` (full replacement) and `DELETE` (resource removal) ARE idempotent.

*Incorrect:*
```http
/* Treating PUT and DELETE as non-idempotent methods */
```

*Fix:*
```http
/* Recognize GET, HEAD, PUT, DELETE, and OPTIONS as inherently idempotent methods */
```

---

### Mistake 3: Implementing Non-Idempotent Resource Deletion Endpoints

**The mistake:** Creating `DELETE /api/notifications/pop` to remove the latest notification.

**Why it's wrong:** Popping an item off a stack changes state on EVERY execution. Dedicated idempotent endpoints must target specific explicit identifiers (`DELETE /api/notifications/45`).

*Incorrect:*
```http
DELETE /api/notifications/pop HTTP/1.1 ; ❌ Non-idempotent delete!
```

*Fix:*
```http
DELETE /api/notifications/45 HTTP/1.1 ; Idempotent target deletion
```


---

## 5. Practice Exercises

### Exercise 1: Idempotent PUT vs Non-Idempotent POST Request Disambiguator

**Scenario:** An API controller enforces idempotency semantics for resource updates (`PUT`) vs resource creations (`POST`).

**Requirements:**
1. Write processResourceMethod(method, resourceId, payload, dbStore).
2. PUT produces identical state regardless of invocation count.
3. POST creates unique new entity on each call.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processResourceMethod(method, resourceId, payload, dbStore = new Map()) {
>   const m = method.toUpperCase();
>
>   if (m === "PUT") {
>     // Idempotent: replaces entity with exact payload at resourceId
>     dbStore.set(resourceId, { id: resourceId, ...payload });
>     return { status: 200, isIdempotent: true, data: dbStore.get(resourceId) };
>   }
>
>   if (m === "POST") {
>     // Non-idempotent: creates a brand new unique record every time
>     const newId = `id_${Date.now()}_${Math.random().toString(36).substring(2)}`;
>     const newRecord = { id: newId, ...payload };
>     dbStore.set(newId, newRecord);
>     return { status: 201, isIdempotent: false, data: newRecord };
>   }
>
>   throw new Error(`Unsupported method: ${method}`);
> }
>
> // Verification tests
> const db = new Map();
>
> // Repeated PUTs produce identical state
> processResourceMethod("PUT", "res-1", { name: "Alice" }, db);
> processResourceMethod("PUT", "res-1", { name: "Alice" }, db);
> console.assert(db.get("res-1").name === "Alice" && db.size === 1, "Test 1 Failed: PUT must be idempotent");
>
> // Repeated POSTs create multiple records
> processResourceMethod("POST", null, { name: "Bob" }, db);
> processResourceMethod("POST", null, { name: "Bob" }, db);
> console.assert(db.size === 3, "Test 2 Failed: POST creates duplicate records");
> ```
>
> #### Technical Explanation
>
> 1. **Idempotency Definition**: An operation is idempotent if executing it 1 time or N times produces identical server state.
> 2. **Idempotent Verbs**: GET, PUT, DELETE, HEAD, OPTIONS are idempotent by RFC specification.
> 3. **Non-Idempotent Verbs**: POST and PATCH (when adding elements to lists) are non-idempotent.
> 
---

### Exercise 2: Safe Retry Policy for Idempotent Methods

**Scenario:** An HTTP retry engine automatically retries failed network requests ONLY for idempotent HTTP methods.

**Requirements:**
1. Write shouldRetryHttpRequest(method, errorStatus).
2. Return true for GET, PUT, DELETE; false for POST.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function shouldRetryHttpRequest(method, errorStatus) {
>   const m = method.toUpperCase();
>   const idempotentMethods = ["GET", "PUT", "DELETE", "HEAD", "OPTIONS"];
>
>   // Retry on transient server errors (5xx) or network disconnect (0)
>   const isTransient = errorStatus === 0 || (errorStatus >= 500 && errorStatus <= 599);
>
>   return isTransient && idempotentMethods.includes(m);
> }
>
> // Verification tests
> console.assert(shouldRetryHttpRequest("PUT", 503) === true, "Test 1 Failed: PUT is idempotent and retryable");
> console.assert(shouldRetryHttpRequest("DELETE", 500) === true, "Test 2 Failed: DELETE is idempotent");
> console.assert(shouldRetryHttpRequest("POST", 503) === false, "Test 3 Failed: POST retry risks duplicate mutations");
> ```
>
> #### Technical Explanation
>
> 1. **Safe Network Retries**: Retrying idempotent methods (PUT, DELETE) is guaranteed safe against duplicate side-effects.
> 2. **Non-Idempotent Danger**: Retrying POST requests carries risk of double charges or duplicate database records.
> 3. **Idempotency Keys Solution**: Non-idempotent POST requests can be made idempotent using Idempotency-Key headers.
> 
---

### Exercise 3: Idempotent State Mutation Guard

**Scenario:** A state manager ensures data update handlers set state deterministically rather than performing incremental counter increments.

**Requirements:**
1. Write updateCounterState(currentState, patch, isIdempotent).
2. If isIdempotent: state = patch.value; else state += patch.value.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function updateCounterState(currentVal, patchVal, isIdempotent = true) {
>   if (isIdempotent) {
>     // Idempotent: set absolute state value
>     return patchVal;
>   }
>   // Non-idempotent: incremental relative mutation
>   return currentVal + patchVal;
> }
>
> // Verification tests
> let state = 10;
>
> // Idempotent set: calling 3 times yields 25
> state = updateCounterState(state, 25, true);
> state = updateCounterState(state, 25, true);
> state = updateCounterState(state, 25, true);
> console.assert(state === 25, "Test 1 Failed");
>
> // Non-idempotent increment: calling 3 times yields +15
> state = 10;
> state = updateCounterState(state, 5, false);
> state = updateCounterState(state, 5, false);
> console.assert(state === 20, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Absolute vs Relative Mutations**: Absolute state assignments (= 25) are idempotent; relative increments (+= 5) are non-idempotent.
> 2. **API Parameter Design**: Prefer sending absolute target state in API payloads to ensure idempotency.
> 3. **Event Sourcing Idempotency**: Deduplicating event streams by event ID preserves idempotent state replay.
---

## 6. Related Terms
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — Where the rules of Idempotency are heavily enforced.
- [Retry & Exponential Backoff](../level_05/retry_backoff.md) — Related concept: Retry & Exponential Backoff.

---

## 7. Key Takeaways
- **Idempotency** means executing a request 1 time has the exact same effect as executing it 100 times.
- `GET`, `PUT`, and `DELETE` are idempotent by definition.
- `POST` is NOT idempotent (it creates new things every time).
- Use **Idempotency Keys** (unique strings sent in headers) to prevent accidental double-execution of critical `POST` requests like payments.
