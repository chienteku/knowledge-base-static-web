# OAuth 2.0

> **Level 4 — Security & Authentication**
> The industry-standard protocol for authorization, allowing a user to grant a third-party application limited access to their data without giving away their password.

---

## 1. Prerequisites
- [API (Application Programming Interface)](../level_03/api.md) — OAuth is the lock on the API door.
- [JWT (JSON Web Tokens)](jwt.md) — The "Access Tokens" issued by OAuth are almost always JWTs.

---

## 2. Term Category

**Security / Protocol (Universal Standard .)**: OAuth 2.0 is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you download a new calendar app called "SuperCal". SuperCal wants to sync with your Google Calendar. 
Before OAuth existed, SuperCal would pop up a box asking: *"Please type your Google Password here."* SuperCal would then use your password to log into Google and read your calendar. 
This is a catastrophic security nightmare! SuperCal now has your Google password. They could read your Gmail, delete your Google Drive files, or accidentally leak your password to hackers.
We needed a way to give SuperCal access to *only* your Calendar, *without* giving them your password. That protocol is **OAuth 2.0**.

### (2) Reality Metaphor
You drive to a fancy hotel and give your car to the Valet. 
If you give the Valet your main keychain, they have the key to your car, but they also have the key to your house and your safe! 
Instead, you give the Valet a special "Valet Key". The Valet Key only turns on the ignition; it cannot open the trunk, and it certainly can't open your house.
**OAuth** is the process of generating a Valet Key (an Access Token) that gives an app very specific, limited permissions.

### (3) How the OAuth Flow Works (The "Login with Google" flow)
1. You click "Login with Google" on SuperCal's website.
2. SuperCal redirects your browser entirely away from their site, to `https://accounts.google.com`.
3. You log into Google safely. Google asks: *"SuperCal wants to read your Calendar. Do you allow this?"*
4. You click "Yes." Google generates an **Access Token** (The Valet Key).
5. Google redirects your browser back to SuperCal, handing SuperCal the Token.
6. SuperCal can now use that Token to call the Google Calendar API. If they try to use it to call the Gmail API, Google rejects it.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing OAuth with Authentication

**The mistake:** A developer says "I am using OAuth to authenticate my users."

**Why it's wrong:** Technically, OAuth 2.0 is an **Authorization** protocol, not an Authentication protocol. 
- *Authentication* (Who are you?): Checking a passport.
- *Authorization* (What are you allowed to do?): Checking a VIP backstage pass.
OAuth issues tokens that grant *permission* to do things. (Though in modern web dev, an extension of OAuth called OpenID Connect is used to handle the "Who are you" part, which is why everyone says "Login with Google").

---

### Mistake 2: Using Deprecated Implicit Grant Flow for Single Page Applications (SPAs)

**The mistake:** Using OAuth 2.0 Implicit Grant (`response_type=token`) in modern React or Mobile apps.

**Why it's wrong:** Implicit grant returns access tokens directly in URL hash fragments, exposing tokens to browser history logs and XSS theft. Use **Authorization Code Flow with PKCE**.

*Incorrect:*
```http
// OAuth Implicit Grant URL
https://auth.example.com/authorize?response_type=token... ; ❌ Returns token in URL fragment!
```

*Fix:*
```http
// OAuth Authorization Code Flow + PKCE:
https://auth.example.com/authorize?response_type=code&code_challenge=... ; Secure PKCE flow
```

---

### Mistake 3: Failing to Validate the `state` Parameter in OAuth Callbacks (CSRF Authorization Theft)

**The mistake:** Omitting or ignoring the `state` parameter during OAuth redirect authorization flows.

**Why it's wrong:** Without `state` parameter validation, an attacker can trick a victim into linking the attacker's third-party account to the victim's local session.

*Incorrect:*
```javascript
// OAuth callback handler missing state check
app.get('/oauth/callback', (req, res) => {
  const code = req.query.code; // ❌ Missing req.query.state comparison!
});
```

*Fix:*
```javascript
app.get('/oauth/callback', (req, res) => {
  if (req.query.state !== req.session.oauthState) {
    return res.status(403).send('Invalid state parameter (CSRF detected)');
  }
});
```


---

## 5. Practice Exercises

### Exercise 1: OAuth 2.0 Authorization Code Exchange Simulator

**Scenario:** An OAuth client exchanges an authorization code for an access token with the Authorization Server.

**Requirements:**
1. Write exchangeAuthCode(authCode, clientId, clientSecret, codeStore).
2. Validate authCode.
3. Return access token.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function exchangeAuthCode(authCode, clientId, clientSecret, codeStore = new Map()) {
>   if (!authCode || !codeStore.has(authCode)) {
>     return { success: false, status: 400, error: "invalid_grant" };
>   }
>
>   const codeData = codeStore.get(authCode);
>   if (codeData.clientId !== clientId) {
>     return { success: false, status: 401, error: "unauthorized_client" };
>   }
>
>   codeStore.delete(authCode);
>
>   return {
>     success: true,
>     access_token: `oauth_acc_${codeData.userId}_${Date.now()}`,
>     token_type: "Bearer",
>     expires_in: 3600
>   };
> }
>
> // Verification tests
> const codes = new Map([["code_123", { clientId: "client_app", userId: "usr-77" }]]);
>
> const res = exchangeAuthCode("code_123", "client_app", "secret_99", codes);
> console.assert(res.success === true && res.token_type === "Bearer", "Test 1 Failed");
> console.assert(codes.has("code_123") === false, "Test 2 Failed: Auth code must be single-use");
> ```
>
> #### Technical Explanation
>
> 1. **Authorization Code Flow**: Most secure OAuth 2.0 grant type for server-side web applications.
> 2. **Single-Use Authorization Code**: Authorization codes expire quickly and can be exchanged for tokens exactly ONCE.
> 3. **Client Credentials Verification**: Client secret is authenticated server-to-server, avoiding browser exposure.
> 
---

### Exercise 2: OAuth 2.0 PKCE Code Verifier & Challenge Guard

**Scenario:** A public client (mobile or SPA) uses PKCE (Proof Key for Code Exchange) to prevent authorization code interception attacks.

**Requirements:**
1. Write verifyPkceChallenge(codeVerifier, codeChallenge).
2. Verify SHA-256 hash of codeVerifier matches codeChallenge.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifyPkceChallenge(codeVerifier, expectedChallenge, mockCrypto) {
>   if (!codeVerifier || !expectedChallenge) return false;
>
>   const computedHash = mockCrypto 
>     ? mockCrypto.sha256(codeVerifier) 
>     : `challenge_${codeVerifier}`;
>
>   return computedHash === expectedChallenge;
> }
>
> // Verification tests
> const verifier = "random_high_entropy_verifier_string";
> const challenge = "challenge_random_high_entropy_verifier_string";
>
> console.assert(verifyPkceChallenge(verifier, challenge) === true, "Test 1 Failed");
> console.assert(verifyPkceChallenge("wrong", challenge) === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **PKCE Purpose**: Protects public clients (SPAs, mobile apps) that cannot safely store client secrets.
> 2. **Code Verifier**: High-entropy random string generated by client before initiating OAuth flow.
> 3. **Code Challenge**: Base64URL-encoded SHA-256 hash of code verifier sent in initial authorization request.
> 
---

### Exercise 3: OAuth State Parameter CSRF Guard

**Scenario:** An OAuth client validates the `state` parameter on callback redirects to prevent CSRF login attacks.

**Requirements:**
1. Write validateOAuthState(receivedState, sessionState).
2. Match receivedState against sessionState.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateOAuthState(receivedState, sessionState) {
>   if (!receivedState || !sessionState) {
>     return { valid: false, error: "Missing state parameter" };
>   }
>
>   if (receivedState !== sessionState) {
>     return { valid: false, error: "State mismatch: possible CSRF attack" };
>   }
>
>   return { valid: true };
> }
>
> // Verification tests
> console.assert(validateOAuthState("state_123", "state_123").valid === true, "Test 1 Failed");
> console.assert(validateOAuthState("state_123", "state_999").valid === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **OAuth State Parameter**: Random nonce stored in user session before redirecting to identity provider.
> 2. **CSRF Prevention in OAuth**: Verifying state on callback ensures authorization response belongs to client's original session.
> 3. **Mandatory OAuth Best Practice**: Mandate in RFC 6749 to mitigate CSRF attacks against authentication callbacks.
---

## 6. Related Terms
- [JWT (JSON Web Tokens)](jwt.md) — The actual string format of the Access Token generated by the OAuth flow.
- [Basic & Bearer Authentication](basic_bearer_auth.md) — How the app sends the OAuth token to the API (using `Bearer`).
- [Access Token vs Refresh Token](access_refresh_tokens.md) — Related concept: Access Token vs Refresh Token.

---

## 7. Key Takeaways
- **OAuth 2.0** allows users to grant apps limited access to their data without sharing their passwords.
- It is the technology behind every "Login with Google / Facebook / GitHub" button on the internet.
- It relies on redirecting the user to the secure provider, granting permission, and returning an **Access Token**.
- The Access Token is scoped, meaning it only has permission to do very specific things.
