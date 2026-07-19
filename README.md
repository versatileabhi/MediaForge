<div align="center">

# ⚡ MediaForge

### Multimedia Processing Without Upload or Compromise

A modern **client-side multimedia processing toolkit** built with **React, TypeScript, and Vite**.

Convert videos, extract frames, and create transparent stickers — all locally in your browser.

No Uploads • No Backend • Privacy First

<br>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite)
![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg.wasm-Media_Processing-black)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

# ✨ Overview

**MediaForge** is a browser-based multimedia workstation designed around a **local-first** philosophy.

Instead of uploading files to remote servers, every operation happens directly inside your browser using modern Web APIs and **FFmpeg.wasm**. This keeps your media private while delivering fast processing for common multimedia tasks.

---

# 🚀 Features

### 🎬 Video ↔ Audio Converter

- Convert **Video → MP3**
- Convert **Video → WAV**
- Generate looping **Audio → Video**
- Browser-based FFmpeg processing
- Local file handling

---

### 📸 Frame Extractor

- Load local video files
- Timeline scrubbing
- Frame preview
- Export as PNG
- Export as JPEG

---

### 🎨 Sticker Maker

- Interactive masking brush
- Erase & Restore modes
- Adjustable brush size
- Transparency preview
- Outline customization
- Transparent PNG export

---

# 🔒 Privacy First

MediaForge is built around a **Local-First** workflow.

- ✅ Files never leave your device
- ✅ No cloud uploads
- ✅ No backend server
- ✅ No account required
- ✅ No data collection

---

# 🛠 Tech Stack

| Technology | Purpose |
|------------|----------|
| React | User Interface |
| TypeScript | Type Safety |
| Vite | Development & Build Tool |
| FFmpeg.wasm | Audio & Video Processing |
| HTML5 Canvas | Sticker Editing |
| Browser File APIs | Local File Access |
| CSS | Brutalist UI Styling |

---

# 🏗 Architecture

```
                 User Files
                      │
                      ▼
             Browser File APIs
                      │
        ┌─────────────┴─────────────┐
        │                           │
   FFmpeg.wasm               HTML5 Canvas
        │                           │
        └─────────────┬─────────────┘
                      ▼
              Processed Media
                      │
                      ▼
                 Download File
```

Everything runs entirely inside your browser.

---

# 📂 Project Structure

```
MediaForge
│
├── public/
│
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│
├── package.json
├── vite.config.ts
└── README.md
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/yourusername/MediaForge.git
```

Navigate into the project

```bash
cd MediaForge
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Build for production

```bash
npm run build
```

Preview the production build

```bash
npm run preview
```

---

# 📦 Core Functionality

## Video ↔ Audio Converter

- Video → MP3
- Video → WAV
- Audio + Image → Looping Video
- Local browser processing

## Frame Extractor

- Capture any frame from a video
- Timeline navigation
- PNG & JPEG export

## Sticker Maker

- Paint mask on images
- Transparent background
- Adjustable outlines
- PNG export

---

# 🌟 Future Roadmap

- Batch media processing
- GIF creator
- Video compression
- Image format converter
- Audio trimming
- Waveform visualization
- Drag & Drop uploads
- Metadata editor
- Dark/Light themes

---

# 🤝 Contributing

Contributions are welcome!

If you'd like to improve MediaForge:

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

# 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with React • TypeScript • Vite • FFmpeg.wasm**

⭐ If you found this project useful, consider starring the repository!

</div>
