# Access Token vs Refresh Token

> **Level 4 — Security & Authentication**
> Short-lived access token + long-lived refresh token pattern.

---

## 1. Prerequisites
- [Session vs Token Authentication](session_vs_token_auth.md) — The core stateful/stateless auth structures.
- [JWT (JSON Web Tokens)](jwt.md) — The signed token data format.

---

## 2. Term Category
- **Security**

---

## 3. Environment Context
- **Universal**: Implemented across secure web portals, mobile apps, and single-page apps.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Stateless JWT tokens present a security dilemma:
- If a token is valid for a long time (e.g. 30 days) and is stolen by a hacker, they have open access to the user's account because stateless tokens cannot be easily revoked.
- If a token is valid for a very short time (e.g. 15 minutes) to minimize damage, the user is logged out and forced to re-authenticate every 15 minutes, causing a poor user experience.

To solve this, the security industry developed the **Access Token + Refresh Token** design pattern.

---

### (2) Roles & Properties of the Tokens

#### 1. Access Token (The Door Key)
- **Lifespan:** Very short (typically 10 to 15 minutes).
- **Type:** Stateless signed JWT.
- **Storage:** Client-side memory or local state (never stored permanently).
- **Usage:** Sent in the `Authorization: Bearer <token>` header of every API request. It is checked by the server to authorize resources immediately.

#### 2. Refresh Token (The Voucher)
- **Lifespan:** Long (typically 7 to 30 days).
- **Type:** Stateful string identifier or signed token.
- **Storage:** Stored in a secure, **`HttpOnly` cookie** on the client to prevent access from malicious scripts.
- **Usage:** Kept idle and only sent to the `/api/refresh` endpoint when the client needs to request a new access token.

---

### (3) Request Lifecycle Flow

When the client's short-lived access token expires, the application refreshes it seamlessly behind the scenes:

```text
Client                                                   Server
  │                                                        │
  │ ── 1. GET /profile (Authorization: Expired JWT) ─────> │
  │                                                        │ [Token verification fails]
  │ <─ 2. Response (401 Unauthorized) ──────────────────── │
  │                                                        │
  │ ── 3. POST /refresh (Includes HTTP-Only Refresh Cookie) > │
  │                                                        │ [Verifies refresh token in DB]
  │ <─ 4. Response (New Access Token JWT) ──────────────── │
  │                                                        │
  │ ── 5. GET /profile (Authorization: New JWT) ─────────> │ [Authorized!]
  ▼                                                        ▼
```

#### Refresh Token Rotation (RTR)
To prevent stolen refresh tokens from being used indefinitely, servers use **token rotation**. Every time a client sends a refresh token, the server invalidates it, issuing a new refresh token alongside the new access token. If a refresh token is used twice, the server flags it as a theft attempt and invalidates the entire session family.

---

### (4) Reality Metaphor
- An **Access Token** is like a **plastic hotel room keycard**. It grants immediate entry to your room. However, for security, keycards are programmed to automatically deactivate after 24 hours. If you drop it, the finder only has a short window of time to exploit it.
- A **Refresh Token** is like a **VIP Booking Voucher** locked in your wallet. It cannot open any hotel doors directly, but if you take it to the front desk reception (**the `/refresh` endpoint**), the receptionist checks your voucher (**validates the token**) and hands you a brand-new 24-hour room keycard.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing the Refresh Token in `localStorage`

**The mistake:** Storing both the access token and the long-lived refresh token in browser `localStorage`.

**Why it's wrong:** `localStorage` is accessible by any JavaScript running on your page. If your site is compromised by a Cross-Site Scripting (XSS) attack, a hacker's script can read the refresh token and maintain unauthorized access to the user's account for weeks.

*Fix:* Keep the refresh token in an **`HttpOnly`** and **`Secure`** cookie. This prevents client-side JavaScript from accessing it, protecting it from theft.

---

### Mistake 2: Setting Long Lifespans on JWT Access Tokens

**The mistake:** Issuing JWT access tokens with a 30-day expiration time.

**Why it's wrong:** JWT access tokens are stateless and cannot be revoked without custom blacklists. If compromised, a 30-day token gives attackers a 30-day window. Use short-lived access tokens (15 mins) and long-lived refresh tokens.

*Incorrect:*
```javascript
// Generating access token with 30-day lifespan
jwt.sign({ userId: 123 }, SECRET, { expiresIn: '30d' }); // ❌ High vulnerability window!
```

*Fix:*
```javascript
// Short access token (15m) + secure refresh token strategy
jwt.sign({ userId: 123 }, ACCESS_SECRET, { expiresIn: '15m' });
```

---

### Mistake 3: Storing Refresh Tokens in LocalStorage (XSS Vulnerability)

**The mistake:** Saving refresh tokens in browser `localStorage` or `sessionStorage`.

**Why it's wrong:** Any Cross-Site Scripting (XSS) vulnerability allows malicious scripts to extract refresh tokens from `localStorage`. Store refresh tokens in `HttpOnly`, `SameSite=Strict` cookies.

*Incorrect:*
```javascript
localStorage.setItem('refreshToken', token); // ❌ Vulnerable to XSS token theft!
```

*Fix:*
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true, // Prevents JS access
  secure: true,   // Requires HTTPS
  sameSite: 'strict'
});
```


---

## 6. Practice Exercises

### Exercise 1: Interceptor Builder

**Problem:** Complete the logic for a client-side HTTP request interceptor to handle token refresh when receiving a `401` response:

```javascript
// Axios response interceptor pseudocode
api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 1. Request a new access token from the refresh route
        const { accessToken } = await api.post('/api/refresh');
        
        // 2. Update default authorization headers for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // 3. Update current request header with new token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // 4. Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid -> log user out
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Dual Token Rotation Flow

**Problem:** Explain the step-by-step token rotation flow when an access token expires.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Client makes API call with access token -> Server returns 401 Unauthorized
> 2. Client sends refresh token to `/api/refresh`
> 3. Server verifies refresh token in DB/Redis -> Issues new short-lived access token + new refresh token
> 4. Client retries original request with new access token
> ```
> ```text
> 1. Client calls API -> Server returns 401 Unauthorized (token expired)
> 2. Client posts refresh token to /api/refresh
> 3. Server validates refresh token -> Returns new access token (+ rotated refresh token)
> 4. Client retries original request
> ```
> - **Explanation:** Refresh token rotation revokes stolen refresh tokens upon reuse.
---

### Exercise 3: HttpOnly Cookie Benefit

**Problem:** Why are `HttpOnly` cookies immune to XSS token theft?

**Expected output:**
> [!check]- Answer
> ```text
> HttpOnly cookies are inaccessible to browser JavaScript (document.cookie), preventing malicious scripts from reading the token string.
> ```
> ```text
> HttpOnly cookies are inaccessible to browser JavaScript (document.cookie), preventing malicious scripts from reading the token string.
> ```
> - **Explanation:** `HttpOnly` blocks JavaScript reading access to cookie tokens.
---

## 7. Related Terms
- [Basic & Bearer Authentication](basic_bearer_auth.md) — The HTTP headers formatting access tokens.
- [OAuth 2.0](oauth.md) — The authorization framework standardizing access and refresh flows.

---

## 8. Key Takeaways
- The access/refresh pattern balances API performance with account security.
- Access tokens are short-lived, stateless JWTs used for every API call.
- Refresh tokens are long-lived, stateful strings stored in secure cookies to obtain new access tokens.
- Token rotation invalidates used refresh tokens to mitigate theft.
- Never store long-lived tokens in localStorage; use `HttpOnly` cookies to protect them from XSS scripts.
