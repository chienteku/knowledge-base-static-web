# Webhooks

> **Level 6 — Advanced API Concepts**
> A "Reverse API." Instead of the Client asking the Server for data, the Server automatically pushes data to the Client the exact moment an event happens.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Webhooks completely flip who initiates this lifecycle.
- [HTTP Methods](../level_02/http_methods.md) — Webhooks are almost always `POST` requests.

---

## 2. Term Category
- **API Architecture / Event-Driven Pattern**

---

## 3. Environment Context
- **Server-to-Server** (Primarily used for backend integrations, like Stripe or GitHub).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Polling vs Webhooks

**Problem:** You are building a GitHub integration. You want to trigger a code deployment the exact millisecond a developer merges a Pull Request. Which approach is better?
A) Write a script that uses the standard GitHub API to `GET /pulls` every 60 seconds.
B) Register a Webhook URL in the GitHub repository settings.

**Expected output:**
> [!check]- Answer
> ```text
> B) Webhooks! 
> If you poll every 60 seconds, your deployment might be delayed by up to 59 seconds. Furthermore, GitHub heavily Rate Limits their API, so polling constantly will likely get you temporarily banned. A Webhook is instant and costs zero CPU cycles while waiting.
> ```
> - Which one is instant? Which one wastes network bandwidth?

---

### Exercise 2: Webhook Delivery Retry Policy Pattern

**Problem:** Describe an exponential backoff retry policy for delivering webhooks when a receiver server returns 500 Server Error.

**Expected output:**
> [!check]- Answer
> ```text
> Retry initial delivery up to 5-10 times over 24 hours (e.g. 1m, 5m, 15m, 1h, 6h, 24h), moving failed webhooks to a Dead-Letter Queue (DLQ) upon final failure.
> ```
> ```text
> Retry schedule: 1m -> 5m -> 15m -> 1h -> 6h -> 24h.
> Final failure moves webhook event to Dead-Letter Queue (DLQ) for manual inspection.
> ```
> - **Explanation:** Webhook systems implement asynchronous retries with DLQ fallback.
---

### Exercise 3: HMAC Verification Math

**Problem:** How does a webhook receiver verify an incoming signature header `X-Signature: sha256=...`?

**Expected output:**
> [!check]- Answer
> ```text
> Receiver calculates `HMAC-SHA256(rawRequestBody, sharedSecret)` and compares it against the incoming header using timing-safe string comparison.
> ```
> ```javascript
> const expectedSig = crypto
> .createHmac('sha256', secret)
> .update(rawBody)
> .digest('hex');
> const isValid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
> ```
> - **Explanation:** HMAC verification proves payload origin and integrity.
---

## 7. Related Terms
- [Rate Limiting](../level_06/rate_limiting.md) — Webhooks are the primary solution to avoid hitting Rate Limits caused by aggressive polling.
- [WebSockets](../level_08/websockets.md) — A different real-time technology usually used for Client-to-Server, whereas Webhooks are Server-to-Server.

---

## 8. Key Takeaways
- A **Webhook** is an HTTP request triggered by an event, sent from one server to another.
- It eliminates the need for "Polling" (constantly asking "Is it done yet?").
- The roles are reversed: The 3rd-party service (like Stripe) acts as the Client, and *your* backend acts as the Server listening for the data.
- **Security is critical:** You must cryptographically verify that incoming webhook requests actually came from the trusted provider.
