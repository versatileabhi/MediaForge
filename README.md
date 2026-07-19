<div align="center">

# ⚡ MediaForge

### Multimedia Processing Without Upload or Compromise

Client-side multimedia toolkit built with **React + TypeScript + Vite**.

Convert videos, extract frames, and create stickers entirely inside your browser.

No uploads • No servers • No privacy concerns

---

<img src="./screenshots/demo.gif" width="100%" alt="MediaForge Demo">

<br>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite)
![FFmpeg](https://img.shields.io/badge/FFmpeg.wasm-black)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

# ✨ Overview

**MediaForge** is a browser-based multimedia workstation designed around a **local-first workflow**.

Unlike traditional online converters, every operation runs directly inside your browser using modern Web APIs and **FFmpeg.wasm**, meaning your files never leave your computer.

Whether you need to extract audio from videos, capture perfect frames, or generate transparent stickers, MediaForge provides everything inside one clean brutalist interface.

---

# 🖥️ Preview

## Home

<p align="center">
<img src="./screenshots/home.png" width="95%">
</p>

---

## 🎬 Video ↔ Audio Converter

Convert local videos into audio or combine an image with audio into a looping video.

<p align="center">
<img src="./screenshots/converter.png" width="95%">
</p>

### Features

- Video → MP3
- Video → WAV
- Audio → Video
- Client-side FFmpeg processing
- Zero uploads

---

## 📸 Frame Extractor

Capture high-quality frames from any local video.

<p align="center">
<img src="./screenshots/extractor.png" width="95%">
</p>

### Features

- Timeline seeking
- Jump controls
- PNG export
- JPEG export
- Instant preview

---

## 🎨 Sticker Maker

Turn any image into a transparent sticker using an interactive masking brush.

<p align="center">
<img src="./screenshots/sticker.png" width="95%">
</p>

### Features

- Brush masking
- Erase mode
- Transparency preview
- Outline customization
- PNG export

---

# 🚀 Features

- 🎥 Video → Audio Conversion
- 🎵 Audio → Video Generation
- 🖼️ Frame Extraction
- ✂️ Sticker Creation
- 🔒 Completely Client-side
- ⚡ Fast Browser Processing
- 📦 No Backend Required
- 💾 No File Uploads
- 🎨 Brutalist UI Design
- 📱 Responsive Layout

---

# 🛠 Tech Stack

| Technology | Purpose |
|------------|----------|
| React | UI |
| TypeScript | Type Safety |
| Vite | Build Tool |
| FFmpeg.wasm | Media Processing |
| HTML5 Canvas | Sticker Editor |
| Browser APIs | File Handling |
| CSS | Brutalist Styling |

---

# 🏗 Architecture

```
            User Files
                 │
                 ▼
      Browser File APIs
                 │
      ┌──────────┴──────────┐
      │                     │
 FFmpeg.wasm          HTML Canvas
      │                     │
      └──────────┬──────────┘
                 ▼
          Download Result
```

Everything runs **inside the browser**.

No backend.

No cloud storage.

No tracking.

---

# 📂 Project Structure

```
MediaForge
│
├── src
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│
├── screenshots
│
├── public
│
├── package.json
│
└── README.md
```

---

# ⚙ Installation

Clone the repository

```bash
git clone https://github.com/yourusername/MediaForge.git
```

Move into the project

```bash
cd MediaForge
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

Build production version

```bash
npm run build
```

Preview production build

```bash
npm run preview
```

---

# 🔐 Privacy First

MediaForge is designed with a **Local-First** philosophy.

✔ Files never leave your computer

✔ No server processing

✔ No cloud uploads

✔ No account required

✔ No data collection

---

# 🌟 Future Improvements

- Batch Processing
- GIF Creator
- Video Compression
- Background Removal
- Metadata Editor
- Image Format Converter
- OCR Support
- Audio Trimming
- Waveform Preview
- Drag & Drop Uploads

---

# 🤝 Contributing

Contributions, feature requests, and bug reports are welcome.

Feel free to fork the repository and submit a Pull Request.

---

# 📄 License

This project is licensed under the MIT License.

---

<div align="center">

Made with ❤️ using React + TypeScript + FFmpeg.wasm

If you like this project, consider giving it a ⭐

</div>
