# `<video>`

> **Level 3 — Media & Embedding**
> Embeds video content.

---

## 1. Prerequisites
- [`<audio>`](audio.md) — The video tag works almost exactly like the audio tag.
- [`src` Attribute](src.md) — The source loader used to point to the video file resource.

---

## 2. Term Category

**Media Element (Modern Browsers)**: `<video>` is a fundamental concept in this technology stack. **Level 3 — Media & Embedding**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Exactly like the `<audio>` tag, early web video was completely dependent on third-party plugins like Adobe Flash. This caused massive security vulnerabilities, crashed browsers frequently, and drained laptop batteries because it was highly inefficient.
The W3C introduced the `<video>` tag in HTML5 to allow browsers to handle video decoding natively. It uses the exact same API and structure as the `<audio>` tag, but with added visual attributes like `width`, `height`, and `poster`.

### (2) Reality Metaphor
If the `<audio>` tag is a built-in record player, the `<video>` tag is a built-in TV screen. You just mount the TV on the wall (in your HTML), plug in a movie file (the `src`), and the TV handles the rest.

### (3) Code Examples

#### Short Snippet
```html
<!-- A simple video player with controls -->
<video src="vacation.mp4" controls width="640"></video>
```

#### Fuller Example
```html
<!-- 
  controls: shows play/pause UI
  poster: shows an image BEFORE the user clicks play (like a YouTube thumbnail)
  width: sets the horizontal size
-->
<video controls poster="thumbnail.jpg" width="800">
  <!-- Provide multiple formats for different browsers -->
  <source src="movie.webm" type="video/webm">
  <source src="movie.mp4" type="video/mp4">
  
  <!-- Fallback for ancient browsers -->
  Sorry, your browser doesn't support embedded videos.
</video>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to autoplay video *with* sound

**The mistake:** Writing `<video src="ad.mp4" autoplay>`.

**Why it's wrong:** Just like audio, browsers hate unexpected noise. Most modern mobile and desktop browsers will immediately block any video that tries to autoplay if it has an audio track. 
If you want to use a video as a silent, looping background (like a cool hero header on a website), you MUST include the `muted` attribute. Browsers will allow muted videos to autoplay.

*Incorrect:*
```html
<!-- Will likely be blocked by the browser -->
<video src="background.mp4" autoplay loop></video>
```

*Fix:*
```html
<!-- Muted videos are allowed to autoplay safely -->
<video src="background.mp4" autoplay loop muted playsinline></video>
```

---



### Mistake 2: Enabling `autoplay` Without `muted` Attribute (Browser Autoplay Block)

**The mistake:** Writing `<video src="promo.mp4" autoplay>`.

**Why it's wrong:** Modern web browsers block un-muted autoplay video playback to prevent unexpected audio output. To enable autoplay, the video MUST include `muted`.

*Incorrect:*
```html
<video src="clip.mp4" autoplay></video> <!-- ❌ Blocked by browser autoplay policy! -->
```

*Fix:*
```html
<video src="clip.mp4" autoplay muted playsinline></video> <!-- Muted autoplay succeeds -->
```

### Mistake 3: Omitting `playsinline` Attribute for Mobile Web Browsers

**The mistake:** Omitting `playsinline` attribute on inline video background elements on iOS devices.

**Why it's wrong:** On iOS Safari, videos playing without `playsinline` automatically force fullscreen playback when started, breaking inline UI layout designs.

*Incorrect:*
```html
<video src="bg.mp4" autoplay muted></video> <!-- ❌ Forces fullscreen mode on iOS! -->
```

*Fix:*
```html
<video src="bg.mp4" autoplay muted playsinline></video>
```

## 5. Practice Exercises

### Exercise 1: The Poster Attribute

**Problem:** What is the purpose of the `poster` attribute on a `<video>` tag?

**Expected output:**
> [!check]- Answer
> ```text
> It acts like a YouTube thumbnail. It displays a static image in the video player area while the video is downloading, or before the user has clicked the "Play" button.
> ```
> - Think about what you see on Netflix before you actually hit play.
> 
---



### Exercise 2: Accessible Video Setup with Subtitles

**Problem:** Write `<video>` with `controls`, poster `'thumb.jpg'`, and `<track>` element for English subtitles (`subtitles.vtt`).

**Expected output:**
> [!check]- Answer
> ```text
> <video controls poster="thumb.jpg"><source src="video.mp4" type="video/mp4"><track src="subtitles.vtt" kind="subtitles" srclang="en" label="English"></video>
> ```
> ```html
> <video controls poster="thumb.jpg">
>   <source src="video.mp4" type="video/mp4">
>   <track src="subtitles.vtt" kind="subtitles" srclang="en" label="English">
> </video>
> ```
>
> **Explanation:** `<track>` element provides WebVTT closed captions and subtitles for accessibility.
> 
---

### Exercise 3: Poster Attribute Function

**Problem:** What is the purpose of the `poster` attribute on `<video>` elements?

**Expected output:**
> [!check]- Answer
> ```text
> Displays a preview thumbnail image before the video is played or downloaded.
> ```
> ```html
> <video poster="thumbnail.jpg" controls></video>
> ```
>
> **Explanation:** `poster` specifies image preview displayed before video playback begins.
> 
## 6. Related Terms
- [`src` Attribute](src.md) — The attribute defining the video source.
- [`<source>` Element](source.md) — The child element used for multi-format video sources.
- [`<audio>`](audio.md) — The sound-only sibling to the video tag.
- [`<img>`](img.md) — The image tag related to the `poster` thumbnail.

---

## 7. Key Takeaways
- The `<video>` tag natively plays video files (like MP4 or WebM) without plugins.
- Use the `controls` attribute to give the user play/pause and volume buttons.
- Use the `poster` attribute to show a thumbnail image before playback starts.
- If you want a video to `autoplay`, you almost always must also include the `muted` attribute to prevent the browser from blocking it.
