# Webhooks

> **Level 6 — Advanced API Concepts**
> A "Reverse API." Instead of the Client asking the Server for data, the Server automatically pushes data to the Client the exact moment an event happens.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Webhooks completely flip who initiates this lifecycle.
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — Webhooks are almost always `POST` requests.

---

## 2. Term Category

**API Architecture / Event-Driven Pattern (Server-to-Server .)**: Webhooks is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you run an e-commerce store, and you use Stripe to process credit cards. Sometimes, a bank takes 2 hours to clear a fraud check. 
How do you know when the payment finally clears so you can ship the product?
**The bad way (Polling):** Your server runs a `while` loop, asking Stripe every 5 minutes: "Is it done yet? Is it done yet? Is it done yet?" This wastes a massive amount of API calls and CPU power.
**The smart way (Webhooks):** You give Stripe a specific URL on your server (e.g., `https://my-store.com/api/stripe-webhook`). You tell Stripe, "Don't call me, I'll call you. Actually, no, you call *me* when it's done." As soon as the payment clears, Stripe's servers actively send an HTTP `POST` request to *your* URL with the payment data. 

### (2) Reality Metaphor
**Standard API (Polling):** You order a custom suit from a tailor. You drive to the tailor's shop every single day and ask, "Is it done yet?" You waste a lot of gas.
**Webhook:** You give the tailor your phone number. You stay home. The exact minute the suit is finished, the tailor calls you. 

### (3) The Flipping of Roles
In a standard API call:
- **You (Your Backend)** = The Client sending the request.
- **Stripe** = The Server responding.

In a Webhook scenario:
- **Stripe** = The Client sending the request (triggered by an event).
- **You (Your Backend)** = The Server listening and responding with a `200 OK`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not verifying the Webhook Signature

**The mistake:** A developer sets up an endpoint `POST /api/ship-order`. When it receives data, it tells the warehouse to ship a $1,000 TV. They give this URL to Stripe as their Webhook URL.

**Why it's wrong:** Your webhook URL is sitting on the public internet. *Anyone* can send a POST request to it! A hacker could easily write a script to send `POST /api/ship-order` to your server, faking a Stripe payment, and your code would ship them a free TV!
**Golden Rule:** All major providers (Stripe, GitHub, Twilio) sign their webhook requests using a cryptographic secret. Your backend MUST verify this cryptographic signature to prove that the HTTP request *actually came from Stripe* and not a hacker in a basement.

---

### Mistake 2: Executing Webhook Deliveries Synchronously inside Primary API Transactions

**The mistake:** Sending HTTP POST webhook calls to customer endpoints synchronously during user checkout.

**Why it's wrong:** If a customer's webhook receiver is slow or offline, your primary API checkout request hangs and times out. Always queue webhook notifications asynchronously (via Redis/BullMQ).

*Incorrect:*
```javascript
app.post('/checkout', async (req, res) => {
  await db.completeOrder();
  await fetch(user.webhookUrl, { method: 'POST', body: orderData }); // ❌ Slow webhook blocks user checkout!
  res.json({ success: true });
});
```

*Fix:*
```javascript
app.post('/checkout', async (req, res) => {
  await db.completeOrder();
  await webhookQueue.add('sendWebhook', { url: user.webhookUrl, data: orderData }); // Queue async job
  res.json({ success: true });
});
```

---

### Mistake 3: Failing to Verify Webhook Cryptographic Signatures (`X-Hub-Signature-256`)

**The mistake:** Processing incoming webhook POST requests on a receiver endpoint without verifying HMAC signatures.

**Why it's wrong:** Webhook receiver endpoints are publicly accessible URLs. Anyone can send fake POST requests forging payment completion events unless HMAC signatures are verified using a shared secret.

*Incorrect:*
```javascript
// Webhook receiver endpoint accepting all POST payloads blindly
app.post('/webhooks/stripe', (req, res) => {
  markOrderAsPaid(req.body.orderId); // ❌ Forged payloads can trigger fake order fulfillments!
});
```

*Fix:*
```javascript
app.post('/webhooks/stripe', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET); // HMAC verification
  markOrderAsPaid(event.data.object.id);
});
```


---

## 5. Practice Exercises

### Exercise 1: HMAC-SHA256 Webhook Signature Verifier

**Scenario:** A webhook receiver verifies the HMAC-SHA256 signature header sent by an event publisher (e.g. Stripe, GitHub) before processing payload.

**Requirements:**
1. Write verifyWebhookSignature(rawPayload, signatureHeader, secret, mockCrypto).
2. Calculate expected HMAC.
3. Compare constant-time.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifyWebhookSignature(rawPayload, signatureHeader, secret, mockCrypto) {
>   if (!rawPayload || !signatureHeader || !secret) {
>     return { valid: false, error: "Missing payload, signature, or secret" };
>   }
>
>   const expectedSig = mockCrypto 
>     ? mockCrypto.hmacSha256(rawPayload, secret)
>     : `sha256_${rawPayload}_${secret}`;
>
>   if (signatureHeader !== expectedSig) {
>     return { valid: false, error: "Signature verification failed: unauthorized webhook sender" };
>   }
>
>   return { valid: true };
> }
>
> // Verification tests
> const payload = '{"event":"payment_intent.succeeded"}';
> const secret = "whsec_abc123";
> const sig = `sha256_${payload}_${secret}`;
>
> console.assert(verifyWebhookSignature(payload, sig, secret).valid === true, "Test 1 Failed");
> console.assert(verifyWebhookSignature(payload, "bad_sig", secret).valid === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Webhook Security Vulnerability**: Public webhook receiver endpoints can be spammed by attackers if signatures are not verified.
> 2. **HMAC-SHA256 Signatures**: Publisher signs payload bytes using shared secret; receiver recomputes hash to authenticate sender identity.
> 3. **Raw Body Verification**: Must compute signature using raw unparsed request body string to prevent payload formatting discrepancies.
> 
---

### Exercise 2: Webhook Delivery Dispatcher with Exponential Retry Queue

**Scenario:** An event publisher dispatches webhook notifications to subscriber URLs, automatically retrying with exponential backoff on failure.

**Requirements:**
1. Write dispatchWebhookEvent(targetUrl, eventData, maxRetries).
2. Attempt delivery.
3. Retry on failure up to maxRetries.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function dispatchWebhookEvent(targetUrl, eventData, maxRetries = 2, mockFetch) {
>   let attempt = 0;
>   const fetchFn = mockFetch || globalThis.fetch;
>
>   while (attempt <= maxRetries) {
>     try {
>       const response = await fetchFn(targetUrl, {
>         method: "POST",
>         headers: { "Content-Type": "application/json", "X-Event-Type": eventData.type },
>         body: JSON.stringify(eventData)
>       });
>
>       if (response.ok) {
>         return { success: true, attempts: attempt + 1 };
>       }
>     } catch (err) {
>       // Ignore and retry
>     }
>
>     attempt++;
>   }
>
>   return { success: false, attempts: attempt, error: "Delivery failed after max retries" };
> }
>
> // Verification tests
> let calls = 0;
> const mockFetch = async (url) => {
>   calls++;
>   if (calls === 1) return { ok: false, status: 500 };
>   return { ok: true, status: 200 };
> };
>
> dispatchWebhookEvent("https://client.com/webhook", { type: "order.created" }, 2, mockFetch).then(res => {
>   console.assert(res.success === true && res.attempts === 2, "Test 1 Failed: Must succeed on 2nd attempt");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Webhook Event Push Architecture**: Inverts API model: server pushes real-time events to client webhooks instead of client polling.
> 2. **Delivery Guarantees**: At-least-once delivery design requires retrying failed webhook dispatches.
> 3. **Fast 200 OK Acknowledgment**: Webhook receivers MUST return HTTP 200/202 instantly before running long background processing tasks.
> 
---

### Exercise 3: Webhook Event Deduplication & Idempotency Receiver

**Scenario:** A webhook receiver tracks processed `event_id` keys to ensure duplicate webhook deliveries do not trigger duplicate processing.

**Requirements:**
1. Write processWebhookEvent(eventObj, processedEventsSet).
2. Check event.id in set.
3. Skip processing if duplicate.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processWebhookEvent(eventObj, processedEventsSet = new Set()) {
>   if (!eventObj || !eventObj.id) {
>     return { status: 400, error: "Missing event.id" };
>   }
>
>   if (processedEventsSet.has(eventObj.id)) {
>     return {
>       status: 200,
>       duplicate: true,
>       message: `Event ${eventObj.id} already processed. Skipping.`
>     };
>   }
>
>   processedEventsSet.add(eventObj.id);
>
>   return {
>     status: 200,
>     duplicate: false,
>     message: `Event ${eventObj.id} processed successfully`
>   };
> }
>
> // Verification tests
> const processed = new Set();
> const evt = { id: "evt_1001", type: "invoice.paid" };
>
> const res1 = processWebhookEvent(evt, processed);
> console.assert(res1.duplicate === false, "Test 1 Failed");
>
> const res2 = processWebhookEvent(evt, processed);
> console.assert(res2.duplicate === true && res2.status === 200, "Test 2 Failed: Duplicate must return 200 but skip processing");
> ```
>
> #### Technical Explanation
>
> 1. **At-Least-Once Webhook Delivery**: Network retries mean receivers WILL occasionally receive duplicate event notifications.
> 2. **Event Idempotency**: Receivers MUST deduplicate events by event_id to keep processing safe.
> 3. **Acknowledge Duplicates with 200 OK**: Always return HTTP 200 OK for duplicate events so publisher stops retrying delivery.
---

## 6. Related Terms
- [Rate Limiting (429 Too Many Requests)](rate_limiting.md) — Webhooks are the primary solution to avoid hitting Rate Limits caused by aggressive polling.
- [WebSockets](../level_08/websockets.md) — A different real-time technology usually used for Client-to-Server, whereas Webhooks are Server-to-Server.
- [Cache Invalidation](cache_invalidation.md) — Related concept: Cache Invalidation.
- [Circuit Breaker](circuit_breaker.md) — Related concept: Circuit Breaker.
- [Polling vs Long Polling](../level_08/polling.md) — Related concept: Polling vs Long Polling.
- [Pub/Sub & Channels](../level_08/pub_sub_channels.md) — Related concept: Pub/Sub & Channels.

---

## 7. Key Takeaways
- A **Webhook** is an HTTP request triggered by an event, sent from one server to another.
- It eliminates the need for "Polling" (constantly asking "Is it done yet?").
- The roles are reversed: The 3rd-party service (like Stripe) acts as the Client, and *your* backend acts as the Server listening for the data.
- **Security is critical:** You must cryptographically verify that incoming webhook requests actually came from the trusted provider.
