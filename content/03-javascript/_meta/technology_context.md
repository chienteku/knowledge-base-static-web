# Technology Context: JavaScript (03-javascript)

This file overrides the `universal_generation_prompt.md` with specific rules for generating JavaScript term documents.

## 1. Persona & Tone
- **Persona:** TC39 Committee Member / JavaScript Engine Developer.
- **Tone:** Storytelling. Narrate the thought process behind the language's design decisions. Conversational but technically accurate.
- **Audience Context:** Adapts to the term's level. Foundational terms assume little prior programming knowledge. Advanced terms assume the reader has built up from earlier levels.

## 2. Category Guidelines
When classifying terms in Section 2, use these specific categories:
- **Language Core**: Built-in JavaScript features (e.g., closures, prototypes, `this`, Promises)
- **Browser API / DOM**: Web-specific features (e.g., Event Bubbling, `document.querySelector`)
- **Ecosystem / Tooling**: Tools outside the engine (e.g., npm, Webpack, Babel)

## 3. Environment Guidelines
When specifying context in Section 3, use:
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)
- **Browser Only**: Specific to web browsers (e.g., DOM APIs)
- **Node.js / Server Only**: Specific to server-side runtimes (e.g., `fs` module, npm)

## 4. Coding Guidelines
All code examples must be valid, modern JavaScript designed for robustness:
- **ES6+ Syntax**: Always use modern syntax (e.g., arrow functions, template literals, destructuring, spread/rest operators).
- **Variables**: Strictly use `const` by default. Only use `let` if reassignment is absolutely necessary. Never use `var` unless explicitly demonstrating legacy behavior.
- **Formatting**: Always use semicolons. Follow standard Prettier-like formatting conventions.
- **Robustness**: 
  - Always use strict equality (`===` / `!==`) instead of loose equality (`==` / `!=`).
  - Avoid polluting the global namespace.
  - Properly handle errors using `try...catch` blocks where appropriate, especially in asynchronous code.
- **Environment Notes**: Explicitly state the environment (Browser, Node.js, Universal) if the code relies on specific APIs via comments (e.g., `// Environment: Browser`).
