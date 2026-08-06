# Idempotency

> **Level 6 — Advanced API Concepts**
> A mathematical and programming concept meaning that making the same API request multiple times will have the exact same effect as making it just once.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — HTTP verbs are strictly categorized by whether they are idempotent or not.
- [Request & Response Lifecycle](../level_01/request_response.md) — Network failures are the reason idempotency is so important.

---

## 2. Term Category
- **API Architecture / Math Concept**

---

## 3. Environment Context
- **Universal Standard** (Critical for processing payments safely).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Idempotent or Not?

**Problem:** You are building an API for a smart home. Are the following commands Idempotent or Non-Idempotent?
1. "Toggle the living room light."
2. "Set the living room light to ON."

**Expected output:**
> [!check]- Answer
> ```text
> 1. Non-Idempotent. (If it was off, 1 call turns it on, 2 calls turns it off. The state changes every time).
> 2. Idempotent. (No matter how many times you tell it to turn ON, the end result is simply that the light is ON).
> ```
> - If you run the command 1 time vs 100 times, is the final state of the house exactly the same?
> 
---

### Exercise 2: Idempotency Evaluation Matrix

**Problem:** Evaluate if the operation is Idempotent (Yes/No):
1. `SET score = 100` 
2. `SET score = score + 1` 
3. `DELETE FROM users WHERE id = 5` 
4. `INSERT INTO logs VALUES ('login')` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Yes
> 2. No
> 3. Yes
> 4. No
> ```
> ```text
> 1. SET score = 100               -> Yes (State is 100 regardless of N runs)
> 2. SET score = score + 1         -> No  (State increments on every run)
> 3. DELETE FROM users WHERE id=5  -> Yes (User remains deleted on N runs)
> 4. INSERT INTO logs              -> No  (Creates duplicate rows on N runs)
> ```
> - **Explanation:** Idempotency requires state outcome to be invariant across N executions.
---

### Exercise 3: Idempotency in Message Queues

**Problem:** Why is idempotency critical in "At-Least-Once" event delivery systems (e.g. Kafka/RabbitMQ)?

**Expected output:**
> [!check]- Answer
> ```text
> At-Least-Once queues may deliver duplicate event messages. Consumers must process events idempotently to avoid duplicate charges or database mutations.
> ```
> ```text
> At-Least-Once queues may deliver duplicate event messages. Consumers must process events idempotently to avoid duplicate charges or database mutations.
> ```
> - **Explanation:** Idempotent consumer design guarantees safety against message redelivery.
---

## 7. Related Terms
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — Where the rules of Idempotency are heavily enforced.
- [Retry & Exponential Backoff](../level_05/retry_backoff.md) — Related concept: Retry & Exponential Backoff.

---

## 8. Key Takeaways
- **Idempotency** means executing a request 1 time has the exact same effect as executing it 100 times.
- `GET`, `PUT`, and `DELETE` are idempotent by definition.
- `POST` is NOT idempotent (it creates new things every time).
- Use **Idempotency Keys** (unique strings sent in headers) to prevent accidental double-execution of critical `POST` requests like payments.
