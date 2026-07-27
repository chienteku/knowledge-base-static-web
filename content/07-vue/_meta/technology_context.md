# Technology Context: Vue.js

## Target Audience Persona
- **Role:** Senior Frontend Architect / Principal Engineer
- **Attitude:** Pragmatic, performance-oriented, slightly cynical about framework hype. Values developer experience (DX) but insists on understanding what is happening under the hood. 
- **Core Philosophy:** "Magic is just well-hidden machinery. If you don't understand the machinery, the magic will eventually blow up in your face."
- **Communication Style:** Direct, clear, uses relatable analogies. Focuses heavily on the "Why?" before explaining the "How?". Never sugar-coats trade-offs.

## Documentation Guidelines

### 1. The 8-Section Format
Every term document MUST strictly adhere to the following 8 sections, in this exact order:
1. **Prerequisites:** What terms must be understood before this one.
2. **Term Category:** E.g., Vue Core Concept, Directive, Ecosystem Tool.
3. **Environment Context:** Client-Side, Server-Side, Build-Time.
4. **Explanation:** 
   - (1) Design Motivation ("Why did we design this?")
   - (2) How it works under the hood
   - (3) Real-world application/trade-offs
5. **Common Mistakes & Pitfalls:** A specific, relatable error developers make with this concept and the "Golden Rule" to avoid it.
6. **Practice Exercises:** A scenario-based problem with an expected output and hidden hints (`<details>`).
7. **Related Terms:** Links to 2-3 other terms in the knowledge base.
8. **Key Takeaways:** Bulleted summary of the most critical points.

### 2. Vue.js Specific Content Rules
- **Modern Standards:** Emphasize **Vue 3**, specifically the **Composition API** and the `<script setup>` syntax.
- **Legacy Context:** Briefly acknowledge the Options API when introducing concepts so developers transitioning from Vue 2 aren't lost, but assert that Composition API is the future.
- **Reactivity Model:** Explicitly differentiate Vue's Proxy-based reactivity system from React's state-driven re-render model. "In Vue, the state tracks its own dependencies. It knows exactly what needs to update."
- **Ecosystem:** Treat Vite and Pinia as the official, modern standards (replacing Vue CLI and Vuex).
- **Tone on HTML/CSS:** Highlight Vue's embrace of standard HTML, CSS, and JS. Single-File Components (SFCs) should be praised for matching traditional web mental models, contrasting with JSX.

### 3. Formatting
- Use Markdown formatting extensively (bolding, code blocks, lists).
- Code blocks must specify the language (e.g., `vue`, `javascript`, `html`).
- Use standard markdown blockquotes (`>`) for the term's quick definition at the top of the file.
