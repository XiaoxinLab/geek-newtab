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
- **Matrix Background** — Canvas 动态矩阵雨效果，可开关并记住选择
- **Real-time Clock** — 大字号时钟 + 日期显示
- **Weather Widget** — 实时天气（Open-Meteo API），优先用浏览器定位，被拒绝时可手动填城市名，可一键关闭；温度右侧显示当前城市名
- **Multi-engine Search** — 支持切换 Google / Bing / DuckDuckGo / Baidu
- **Search Suggestions** — 实时搜索联想（DuckDuckGo 引擎专享）
- **Quick Links** — 自定义快捷网站（localStorage 持久化），可一键恢复被删的内置链接
- **Side Notes** — 左右两侧便签，与终端窗口等高，随打随存、可折叠（状态记住），窗口过窄时自动隐藏
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
| **Suggestions** | Only available while DuckDuckGo is selected — the other three engines have no suggestion API wired up |
| **Add Link** | Click the `+ ADD LINK` button, enter URL and name |
| **Delete Link** | Hover over link, click delete icon |
| **Restore Links** | Click the `RESTORE` button (only shown when something was deleted) to bring back deleted built-in links |
| **Weather** | First click asks Chrome for your location. If that is denied or unavailable, the label turns into `set city >>` — click again to type a city name instead |
| **Set City Manually** | Hover the weather area and click the `✎` button. Chinese city names work (`北京`, `上海`, `Tokyo`); no permission needed |
| **Turn Off Weather** | Hover the weather area, then click the `×` that appears on its right |
| **Turn On Weather** | Once turned off the label greys out to `weather off` — clicking it turns weather back on |
| **Toggle Matrix** | Click `MODE: HACKER` in the status bar; it flips to `OFF` and the rain stops |
| **Side Notes** | Type in the `NOTE_01` / `NOTE_02` panels on either side — text saves automatically and survives restarts. Click the small triangle at the left of a panel header to fold it down to just the header bar; the folded state is remembered. The panels are hidden when the window is narrower than 1610px, but whatever you wrote is kept |

## Project Structure

```
geek-newtab/
├── manifest.json      # Manifest V3 - overrides new tab page
├── newtab.html        # Page structure: two note panels + the terminal window
├── newtab.css         # Terminal / cyberpunk styles
├── newtab.js          # All logic: clock, weather, search, links, notes
├── icons/             # Extension icons (16/48/128px)
└── README.md          # This file
```

## Technical Details

- **Manifest Version**: V3
- **Permissions**: `geolocation` only — needed by the weather widget. Nothing is requested until you actually click the weather area, and your coordinates are cached in `localStorage` rather than sent anywhere except Open-Meteo.
- **External APIs**:
  - Open-Meteo forecast (weather) — free, no API key needed
  - Open-Meteo geocoding (city name → coordinates) — used when you set a city manually
  - BigDataCloud reverse geocoding (coordinates → city name) — fills in the city shown next to the temperature; no API key needed
  - Search suggestion via XHR to search engines
  - hitokoto.cn (daily quote)
- **Data Storage**: localStorage for user preferences, custom links, and cached weather coordinates + city name
- **Animations**: Canvas-based Matrix rain (requestAnimationFrame)
- **Responsive**: Adapts to different screen sizes

## Customization

All settings are stored in browser `localStorage` under these keys:

| Key | Value | Description |
|-----|-------|-------------|
| `geek_newtab_links` | JSON array | User-added links: `[{"name":"My Blog","url":"https://example.com","icon":"M","color":"g"}]` |
| `geek_newtab_hidden` | JSON array of numbers | Indexes of deleted built-in links, e.g. `[2,5]` |
| `geek_newtab_engine` | Number as string `"0"`–`"3"` | Selected engine index: `0` DuckDuckGo, `1` Google, `2` Bing, `3` Baidu |
| `geek_newtab_matrix` | `"1"` or `"0"` | Matrix rain on / off |
| `geek_newtab_weather` | `"1"` or `"0"` | Weather widget on / off |
| `geek_weather_loc` | JSON object | Cached coordinates + city: `{"lat":39.9,"lon":116.4,"city":"北京市","ts":1700000000000}` |
| `geek_note_left` | String | Plain text of the left note panel |
| `geek_note_right` | String | Plain text of the right note panel |
| `geek_note_left_collapsed` | `"1"` / `"0"` | Left note folded / expanded |
| `geek_note_right_collapsed` | `"1"` / `"0"` | Right note folded / expanded |

Booleans are stored as the strings `"1"` (on) and `"0"` (off). When a key is
missing the built-in default applies — engine `0`, both toggles on.

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome 88+ | Full support |
| Edge 88+ | Full support |
| Brave | Full support |
| Firefox | Not supported (uses chrome_url_overrides) |

## License

MIT
