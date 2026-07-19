# MediaForge

MediaForge is a client-side multimedia processing web app built with React, TypeScript, and Vite. It offers three local-first tools in a single-page experience: a video/audio converter, a frame extractor, and a sticker maker.

## What the app does

- Video → Audio conversion with WAV or MP3 export
- Audio → Video looping export using a local still image and audio track
- Local video frame capture and export as PNG or JPEG
- Sticker editing with a mask brush, transparency preview, outline controls, and export

## Architecture overview

- Frontend: React + TypeScript + Vite
- Styling: custom CSS with a brutalist editorial aesthetic
- Media processing: browser APIs for local file handling and ffmpeg.wasm for actual audio transcoding
- Storage: none required; everything is local to the browser session

## Project structure

- src/App.tsx: main application shell, tool state, and all tool implementations
- src/App.css: visual design and layout styling
- src/index.css: global resets and typography setup
- package.json: scripts and dependencies

## Core features

### 1. Video ↔ Audio converter
- Select a local video file and export audio as WAV or MP3
- Select an audio file plus a still image to build a looped video preview
- Uses ffmpeg.wasm for audio transcoding in the browser

### 2. Frame extractor
- Load a local video file
- Scrub through frames with a seek slider and time jump controls
- Capture a current frame and export it as PNG or JPEG

### 3. Sticker maker
- Import an image and paint a mask directly on a canvas
- Toggle erase/restore brush modes, brush size, transparency preview, and outline styling
- Export the final sticker as a transparent PNG

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Notes

- The app is intentionally client-side and does not depend on a backend.
- ffmpeg.wasm downloads its core assets from CDN URLs the first time it runs, so the first export may take a few moments.
- Browser support for some media APIs varies, so the experience is best in modern Chromium-based browsers.
