# OAuth 2.0

> **Level 4 — Security & Authentication**
> The industry-standard protocol for authorization, allowing a user to grant a third-party application limited access to their data without giving away their password.

---

## 1. Prerequisites
- [API (Application Programming Interface)](../level_03/api.md) — OAuth is the lock on the API door.
- [JWT](../level_04/jwt.md) — The "Access Tokens" issued by OAuth are almost always JWTs.

---

## 2. Term Category
- **Security / Protocol**

---

## 3. Environment Context
- **Universal Standard** (Used heavily in "Login with Google/Facebook" flows).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Scope

**Problem:** You grant an app "Read" access to your GitHub repositories via OAuth. Later, you realize the app is malicious and trying to delete your code. Why will the malicious app fail to delete your code, even though they hold a valid OAuth token?

**Expected output:**
```text
Because of "Scopes"!
When Google/GitHub issues the token, they embed the "Scope" (permissions) directly into the token's signature. The token literally says `scope: read_only`. When the malicious app sends a `DELETE` request, GitHub reads the token's scope and blocks the action.
```

> [!check]- Answer
> - What kind of "Valet Key" did you give them?

---

### Exercise 2: OAuth 2.0 Actor Roles Mapping

**Problem:** Match OAuth 2.0 role to entity:
1. Resource Owner
2. Client
3. Authorization Server
4. Resource Server

**Expected output:**
```text
1. The User (human approving access)
2. The App requesting access (e.g. Spotify app)
3. Auth Provider issuing tokens (e.g. Google Login)
4. API hosting protected resources (e.g. Google Drive API)
```

> [!check]- Answer
> ```text
> 1. Resource Owner -> The End User
> 2. Client -> The Third-Party Application
> 3. Authorization Server -> The Auth Provider (IdP)
> 4. Resource Server -> The Protected Data API
> ```
> - **Explanation:** OAuth 2.0 defines relationships between 4 distinct actor roles.
---

### Exercise 3: PKCE Acronym and Purpose

**Problem:** What does PKCE stand for and what security vulnerability does it solve?

**Expected output:**
```text
Proof Key for Code Exchange. It prevents authorization code interception attacks on public SPA and mobile clients.
```

> [!check]- Answer
> ```text
> Proof Key for Code Exchange. It prevents authorization code interception attacks on public SPA and mobile clients.
> ```
> - **Explanation:** PKCE uses dynamically generated code verifiers to secure authorization code swaps.
---

## 7. Related Terms
- [JWT](../level_04/jwt.md) — The actual string format of the Access Token generated by the OAuth flow.
- [Basic & Bearer Auth](../level_04/basic_bearer_auth.md) — How the app sends the OAuth token to the API (using `Bearer`).

---

## 8. Key Takeaways
- **OAuth 2.0** allows users to grant apps limited access to their data without sharing their passwords.
- It is the technology behind every "Login with Google / Facebook / GitHub" button on the internet.
- It relies on redirecting the user to the secure provider, granting permission, and returning an **Access Token**.
- The Access Token is scoped, meaning it only has permission to do very specific things.
