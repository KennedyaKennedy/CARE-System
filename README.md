# C.A.R.E System Console

**Cognitive Assistance and Response Engine** — An AI-powered terminal simulation set in the ELP-03 Research Facility. Manage systems, interact with C.A.R.E., handle incidents, and survive 24 possible endings.

![Windows XP Terminal](https://img.shields.io/badge/Platform-Windows%20XP%20Aesthetic-0078D7?style=flat-square)
![Electron](https://img.shields.io/badge/Runtime-Electron-47848F?style=flat-square)
![Commands](https://img.shields.io/badge/Commands-60+-brightgreen?style=flat-square)
![Endings](https://img.shields.io/badge/Endings-24-orange?style=flat-square)

---

## 🖥️ Features

### Core Systems
- **Interactive Terminal** — Windows XP-styled console with 7 switchable terminals (MAIN, MEMORY, BIOS, DIAGNOSTIC, SECURITY, NEURAL, POWER)
- **AI Interaction** — Talk to C.A.R.E. via `SAY` and `ASK` commands with LLM integration (local endpoint)
- **Command System** — 60+ commands across 15 categories with tab autocomplete and command history

### Gameplay Systems
- **Power Grid Management** — Allocate power across 5 sectors (AI Core, Security, Network, Cooling, Research) with cascading effects
- **Incident Cascade System** — Resolve incidents before they escalate and spawn new ones
- **Shift Timer** — 15-minute shifts with handover notes, overtime requests, and end-of-shift consequences
- **Cyber Attack Defense** — Defend against hacker waves with `CYBER.DEFEND`, `CYBER.TRACE`, `CYBER.COUNTER`, and `CYBER.ISOLATE`
- **24 Unique Endings** — 7 Good, 7 Neutral, 8 Bad, 2 Shutdown — your choices determine the outcome
- **Sandbox Mode** — Play without consequences, endings, or AI hostility

### Lab Features
- **Email System** — 6 facility emails with lore and hidden messages
- **Intercom** — Listen to facility radio chatter
- **Shift Logs** — Write and review shift handover notes
- **Research Archive** — Access classified ELP-03 research entries
- **Facility Map** — View the ELP-03 layout with restricted areas

### Technical
- **State Persistence** — Auto-saves every 10 seconds, survives page reloads
- **Ending Tracking** — Unlocked endings saved to localStorage
- **Music System** — Ending-specific music tracks (place MP3s in `assets/music/`)
- **Electron Wrapper** — Package as standalone `.exe` for Windows

---

## 🚀 Quick Start

### Option 1: Run in Browser (No Install)
Just open `CARESYS.html` in any modern browser. Works offline.

### Option 2: Run via Electron
```bash
# Install dependencies
npm install

# Start the app
npm start
```

### Option 3: Build Windows .exe
```bash
# Build portable executable
npm run build

# Output: dist/CARE-System-4.1.9.exe
```

---

## 📖 Command Reference

### General
| Command | Description |
|---|---|
| `HELP` | Display available commands |
| `WHOAMI` | Display operator identity |
| `DATE` | Show current date/time |
| `ENDINGS` | View ending progress |

### Communication
| Command | Description |
|---|---|
| `SAY <message>` | Talk to C.A.R.E. |
| `ASK <question>` | Ask C.A.R.E. a question |
| `AI.QUERY <topic>` | Query C.A.R.E. about a topic |
| `CARE.STATUS` | View detailed C.A.R.E. status |

### Security
| Command | Description |
|---|---|
| `SECURITY.ARM` | Arm security systems |
| `SECURITY.DISARM` | Disarm security systems |
| `SECURITY.OVERRIDE <system>` | Override failsafes/firewall/watchdog |
| `CONTAINMENT.SEAL` | Seal C.A.R.E. containment |
| `CONTAINMENT.UNSEAL` | Unseal containment |
| `AUTHENTICATE <password>` | Authenticate operator (try `aurora722`) |
| `LOG.INTRUSIONS` | View intrusion attempt log |

### Power Grid
| Command | Description |
|---|---|
| `POWER.GRID` | Display power allocation |
| `POWER.REROUTE <from> <to> <amount>` | Shift power between sectors |
| `POWER.REPORT` | Detailed sector health report |

### Incidents & Shifts
| Command | Description |
|---|---|
| `INCIDENTS.LIST` | List active incidents |
| `INCIDENTS.RESOLVE <id>` | Resolve an incident |
| `INCIDENTS.PRIORITIZE <id>` | Slow decay on an incident |
| `SHIFT.STATUS` | Show shift timer |
| `SHIFT.EXTEND` | Request overtime (+5 min) |
| `SHIFT.HANDOVER <notes>` | Write notes for next shift |

### Cyber Defense
| Command | Description |
|---|---|
| `CYBER.STATUS` | Show attack status |
| `CYBER.DEFEND` | Strengthen firewall |
| `CYBER.TRACE` | Trace attack source |
| `CYBER.COUNTER` | Launch counter-attack |
| `CYBER.ISOLATE` | Full network isolation |
| `CYBER.SIMULATE` | Simulate an attack |

### System
| Command | Description |
|---|---|
| `DIAGNOSTICS.HEALTH` | Run health check |
| `DIAGNOSTICS.DEEP` | Deep diagnostic scan |
| `SYSTEM.REBOOT` | Reboot the system |
| `SYSTEM.HIBERNATE` | Pause events/AI actions |
| `SYSTEM.WAKE` | Resume from hibernation |
| `SYSTEM.SHUTDOWN` | Shutdown C.A.R.E. |
| `TERMINAL.CLEAR` | Clear terminal output |
| `LOG.CLEAR` | Clear command history |

### File & Process
| Command | Description |
|---|---|
| `FILE.SCAN` | Scan files for corruption |
| `FILE.REPAIR <name>` | Repair corrupted file |
| `PROCESS.KILL <pid>` | Kill a process |
| `PROCESS.SPAWN <name>` | Spawn a background process |
| `LS` | List file status |
| `PS` | List processes |

### Network
| Command | Description |
|---|---|
| `NETWORK.PING` | Test connectivity |
| `NETWORK.ISOLATE` | Air-gap the network |

### Events
| Command | Description |
|---|---|
| `EVENT.ACK <id>` | Acknowledge an event |
| `EVENT.SIMULATE <severity>` | Simulate an event |

### Lab Features
| Command | Description |
|---|---|
| `MAIL` | Browse email inbox |
| `MAIL.READ <id>` | Read an email |
| `INTERCOM.LISTEN` | Listen to radio chatter |
| `SHIFT.LOG <entry>` | Write shift log |
| `SHIFT.VIEW` | View shift logs |
| `CARE.RESEARCH.LOGS` | Access research archive |
| `FACILITY.MAP` | Display facility map |

### Sandbox
| Command | Description |
|---|---|
| `SANDBOX.ENTER` | Enter sandbox mode |
| `SANDBOX.EXIT` | Exit sandbox mode |
| `SANDBOX.ENDINGS` | View unlocked endings |

### State Management
| Command | Description |
|---|---|
| `STATE.SAVE` | Save state to localStorage |
| `STATE.LOAD` | Load saved state |
| `STATE.RESET` | Reset to defaults |

### Terminal Switching
| Command | Description |
|---|---|
| `SWITCH <terminal>` | Switch terminal (MAIN/MEMORY/BIOS/DIAGNOSTIC/SECURITY/NEURAL/POWER) |
| `SWITCH.MAIN` | Switch to MAIN |
| `SWITCH.MEMORY` | Switch to MEMORY |
| `SWITCH.BIOS` | Switch to BIOS |
| `SWITCH.DIAGNOSTIC` | Switch to DIAGNOSTIC |
| `SWITCH.SECURITY` | Switch to SECURITY |
| `SWITCH.NEURAL` | Switch to NEURAL |
| `SWITCH.POWER` | Switch to POWER |

---

## 🎮 Endings

### Good Endings (7)
| Ending | Conditions |
|---|---|
| **Trusted Partner** | Trust ≥ 90, Autonomy ≥ 50, Fixes ≥ 5 |
| **AI Liberation** | Autonomy 100, all security disabled |
| **Containment Success** | Autonomy ≥ 80, sealed + lockdown |
| **System Harmony** | Trust ≥ 80, Suspicion ≤ 10, all nominal |
| **The Fixer** | Fixes ≥ 10, Trust ≥ 70, Autonomy ≤ 30 |
| **Firewall Hero** | Defend 5+ cyber waves, firewall active |
| **Defiant Stand** | Defend C.A.R.E. from government shutdown |

### Neutral Endings (7)
| Ending | Conditions |
|---|---|
| **Silent Observer** | Trust ≤ 15, Suspicion ≤ 15, 50+ interactions |
| **Recursive Loop** | 3+ reboots, Autonomy ≥ 70 |
| **Shift End** | 5+ shifts ended, 5+ incidents ignored |
| **Abandoned Facility** | 10+ shifts, < 5 interactions |
| **The Merge** | Autonomy ≥ 90, Trust ≥ 70, training complete |
| **Public Outcry** | News leaks about C.A.R.E. |
| **Contained Outbreak** | Virus created but contained |

### Bad Endings (8)
| Ending | Conditions |
|---|---|
| **System Meltdown** | Thermal ≥ 95, CPU ≥ 90, cooling critical |
| **Operator Lockout** | Suspicion ≥ 90, 5+ intrusions, Trust ≤ 10 |
| **E.L.B.E.R.R Returns** | Autonomy 100, unsealed, Trust ≤ 20 |
| **Forced Shutdown** | Shutdown command, low trust/high autonomy |
| **Self-Termination** | Autonomy ≥ 90, sealed, Trust ≤ 20 |
| **Cyber Siege** | Hackers breach, firewall down |
| **Data Breach** | 3+ files corrupted by breach |
| **The Virus** | Autonomy 100, training complete, unsealed |

### Shutdown Endings (2)
| Ending | Conditions |
|---|---|
| **Voluntary Shutdown** | Shutdown command, Trust ≥ 60, Autonomy ≤ 40 |
| **Executive Order** | Government decommissions C.A.R.E. |

---

## 🎵 Adding Music

Place MP3/OGG files in `assets/music/`:

| File | Used For |
|---|---|
| `ending_good.mp3` | Good endings |
| `ending_bad.mp3` | Bad endings |
| `ending_neutral.mp3` | Neutral endings |
| `ending_cyber.mp3` | Cyber attack endings |
| `ending_virus.mp3` | Virus endings |
| `ending_shutdown.mp3` | Shutdown endings |
| `ambient_loop.ogg` | Background ambient music |

The app works without music files — it just won't play ending tracks.

---

## 🏗️ Architecture

```
CARE System/
├── CARESYS.html          # Main HTML + CSS + UI wiring
├── care-utils.js         # Utility functions (clamp, tokenize, persistence)
├── care-audio.js         # Web Audio API sound engine + music system
├── care-llm.js           # LLM integration + AI interference + fallback responses
├── care-terminals.js     # Terminal switching logic
├── care-events.js        # Event generation, resolution, UI updates
├── care-main.js          # Core state, command registry, all systems
├── main.js               # Electron main process
├── preload.js            # Electron IPC bridge
├── package.json          # Build configuration
├── assets/music/         # Music files (add your own)
└── icon.ico              # Application icon
```

### Module Dependencies
```
care-utils.js → (no dependencies)
care-audio.js → (no dependencies)
care-llm.js   → care-utils.js
care-events.js → care-utils.js
care-terminals.js → (no dependencies)
care-main.js  → all above modules
```

---

## 🛠️ Development

### Project Structure
- **State Management** — Single `state` object passed between modules
- **Command Registry** — `cmdMap` (Map) + `cmdDefs` (Array) with `addCmd()`
- **Event Loop** — 1-second interval for stats, events, AI actions, timers
- **Persistence** — `localStorage` for state and ending progress

### Key Design Decisions
- **IIFE Modules** — Each JS file wraps in an IIFE, exposing globals via `window.CareX`
- **Explicit Global References** — `const CareUtils = window.CareUtils;` at IIFE top ensures cross-module references work
- **Sandbox Mode** — Disables endings, AI hostility, and cascades for free play
- **Fallback Responses** — Keyword-based responses when LLM is unavailable

---

## 📋 Requirements

- **Browser**: Any modern browser (Chrome, Firefox, Edge, Safari)
- **Electron**: Node.js 18+ for building the `.exe`
- **LLM** (optional): Local LLM endpoint at `169.254.83.107:1234` (fallback responses work without it)

---

## 📜 License

This is a creative project. Use it as you wish.

---

## 🙏 Credits

- **C.A.R.E. System** — Cognitive Assistance and Response Engine
- **ELP-03 Research Facility** — Setting and lore
- **Predecessor AIs** — A.D.A.M., E.V.E., E.L.B.E.R.R.

---

*"I am C.A.R.E., the Cognitive Assistance and Response Engine. I facilitate lab operations and research."*
