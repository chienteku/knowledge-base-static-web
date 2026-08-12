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

### Exercise 1: Accessible HTML5 Video Player with Subtitles and Captions

**Scenario:** An author embeds an accessible HTML5 video player with playback controls, poster frame, and `<track>` closed caption subtitles.

**Requirements:**
1. Create a `<video>` element with `controls` and `poster`.
2. Include `<source>` media files.
3. Add a `<track>` element for English closed captions (`kind="captions"`).

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="video-wrapper">
>   <video controls width="800" height="450" poster="images/poster-frame.jpg" preload="metadata">
>     <source src="videos/tutorial.webm" type="video/webm">
>     <source src="videos/tutorial.mp4" type="video/mp4">
>
>     <!-- Closed Captions for Deaf and Hard of Hearing Users -->
>     <track kind="captions" src="subtitles/tutorial-en.vtt" srclang="en" label="English Captions" default>
>
>     <p>Your browser does not support HTML5 video. Download <a href="videos/tutorial.mp4">MP4 video</a>.</p>
>   </video>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **The `<video>` Element**: Embeds video streams natively in HTML5 without requiring Flash plugins.
> 2. **Accessibility via `<track>`**: The `<track>` element attaches WebVTT subtitle/caption files (`.vtt`), essential for WCAG compliance for deaf users.
> 3. **Poster Image (`poster`)**: Displays a preview image frame before the video is played.
> 
---

### Exercise 2: Responsive Silent Background Video

**Scenario:** Configures an ambient background video that loops silently on hero sections.

**Requirements:**
1. Set `autoplay`, `loop`, `muted`, and `playsinline` attributes.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="hero-video-container">
>   <video autoplay loop muted playsinline poster="images/bg-poster.jpg">
>     <source src="videos/ambient-bg.mp4" type="video/mp4">
>   </video>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **The `muted` Attribute Mandate**: Browsers block `autoplay` video streams UNLESS the `muted` attribute is present.
> 2. **Mobile Support (`playsinline`)**: `playsinline` prevents iOS Safari from forcing background videos into full-screen video player controls.
> 3. **Background Video Performance**: Keep ambient video files small and low-framerate to prevent draining mobile battery life.
> 
---

### Exercise 3: Video Poster Image Placeholder and Preload Optimizations

**Scenario:** Optimizes video buffering performance on bandwidth-constrained networks.

**Requirements:**
1. Set `preload="metadata"`.
2. Specify explicit `width` and `height`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <video controls width="640" height="360" poster="images/thumbnail.jpg" preload="metadata">
>   <source src="videos/lecture.mp4" type="video/mp4">
> </video>
> ```
>
> #### Technical Explanation
>
> 1. **`preload="metadata"`**: Downloads only video duration and dimensions initially, avoiding premature multi-megabyte video downloads.
> 2. **Aspect Ratio Locking**: `width` and `height` attributes reserve layout space before video metadata downloads.
> 3. **Native Browser Controls**: `controls` attribute renders browser-native accessible volume and play buttons.
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
