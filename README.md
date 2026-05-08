# Geek New Tab

<p align="center">
  <strong>极客风格新标签页 — 终端美学 × 赛博朋克</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-green?style=flat-square" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/version-1.0.0-orange?style=flat-square" alt="Version">
</p>

---

## Features

- **Terminal Aesthetic** — 真实终端风格界面，RGB 窗口控制按钮
- **Matrix Background** — Canvas 动态矩阵雨效果，可开关
- **Real-time Clock** — 大字号时钟 + 日期显示
- **Weather Widget** — 基于地理位置的实时天气（Open-Meteo API）
- **Multi-engine Search** — 支持切换 Google / Bing / DuckDuckGo / Baidu
- **Search Suggestions** — 实时搜索联想
- **Quick Links** — 自定义快捷网站（localStorage 持久化）
- **Inspirational Quotes** — 随机极客励志短句
- **Scanline Effect** — CRT 扫描线视觉增强
- **Uptime Counter** — 会话运行时间统计

## Preview

```
╭──────────────────────────────────────────────╮
│ ● ● ●  root@geek:~          [22°C] system ready │
├──────────────────────────────────────────────┤
│                                              │
│ $ Hello, Hacker █                            │
│                    ┌─────────┐               │
│                    │ 14:32:08 │               │
│                    │2024/01/15│               │
│                    └─────────┘               │
│                                              │
│   [D ▼] search the web...        [EXECUTE]  │
│                                              │
│   [GitHub]  [Stack Overflow]  [MDN]  [+添加] │
│                                              │
│ UPTIME: 0d 2h 15m | SESSION: active | MODE: HACKER │
│ "The code you write is a reflection of you."         │
╰──────────────────────────────────────────────╯
```

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `geek-newtab` folder
6. Open a new tab to see the effect

## Usage Guide

| Feature | Description |
|---------|-------------|
| **Search** | Type in search box, press Enter or click EXECUTE |
| **Switch Engine** | Click engine button (D/G/B/B) to switch |
| **Add Link** | Click `+` button, enter URL and name |
| **Delete Link** | Hover over link, click delete icon |
| **Weather** | Click weather area to enable location access |
| **Toggle Matrix** | Click matrix background to pause/resume |

## Project Structure

```
geek-newtab/
├── manifest.json      # Manifest V3 - overrides new tab page
├── newtab.html        # Main page structure
├── newtab.css         # Terminal / cyberpunk styles
├── newtab.js          # All logic: clock, weather, search, links
└── icons/             # Extension icons (16/48/128px)
```

## Technical Details

- **Manifest Version**: V3
- **Permissions**: None required (privacy-friendly)
- **External APIs**:
  - Open-Meteo (weather) — free, no API key needed
  - Search suggestion via XHR to search engines
- **Data Storage**: localStorage for user preferences & custom links
- **Animations**: Canvas-based Matrix rain (requestAnimationFrame)
- **Responsive**: Adapts to different screen sizes

## Customization

All settings are stored in `localStorage`:

```javascript
// Custom links format
[{ title: "GitHub", url: "https://github.com" }]

// Preferences
searchEngine: "duckduckgo" | "google" | "bing" | "baidu"
matrixEnabled: true | false
weatherEnabled: true | false
```

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome 88+ | Full support |
| Edge 88+ | Full support |
| Brave | Full support |
| Firefox | Not supported (uses chrome_url_overrides) |

## License

MIT
