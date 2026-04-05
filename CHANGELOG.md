# C.A.R.E. System Console — Changelog

## v4.1.9

### New Systems
- **Power Grid Management** — Allocate power across 5 sectors (AI Core, Security, Network, Cooling, Research)
- **Incident Cascade System** — Resolve incidents before they escalate and spawn new ones
- **Shift Timer** — 15-minute shifts with handover notes, overtime, and end-of-shift consequences
- **Cyber Attack Defense** — Defend against hacker waves with trace, counter, and isolate commands
- **24 Unique Endings** — 7 Good, 7 Neutral, 8 Bad, 2 Shutdown endings
- **Sandbox Mode** — Play without consequences, endings, or AI hostility
- **Email System** — 6 facility emails with lore and hidden messages
- **Intercom** — Listen to facility radio chatter
- **Shift Logs** — Write and review shift handover notes
- **Research Archive** — Access classified ELP-03 research entries
- **Facility Map** — View the ELP-03 layout with restricted areas

### New Commands (30+)
- `POWER.GRID`, `POWER.REROUTE`, `POWER.REPORT`
- `INCIDENTS.LIST`, `INCIDENTS.RESOLVE`, `INCIDENTS.PRIORITIZE`
- `SHIFT.STATUS`, `SHIFT.EXTEND`, `SHIFT.HANDOVER`, `SHIFT.LOG`, `SHIFT.VIEW`
- `CYBER.STATUS`, `CYBER.DEFEND`, `CYBER.TRACE`, `CYBER.COUNTER`, `CYBER.ISOLATE`, `CYBER.SIMULATE`
- `SANDBOX.ENTER`, `SANDBOX.EXIT`, `SANDBOX.ENDINGS`
- `ENDINGS`
- `MAIL`, `MAIL.READ`
- `INTERCOM.LISTEN`
- `CONTAINMENT.SEAL`, `CONTAINMENT.UNSEAL`
- `TRAINING.STATUS`
- `AUTHENTICATE`, `LOG.INTRUSIONS`
- `SYSTEM.SHUTDOWN`, `SYSTEM.WAKE`
- `CARE.RESEARCH.LOGS`, `FACILITY.MAP`
- `WHOAMI`, `DATE`, `LS`, `PS`, `KILL`
- `STATE.SAVE`, `STATE.LOAD`, `STATE.RESET`
- `SWITCH.MAIN`, `SWITCH.MEMORY`, `SWITCH.BIOS`, `SWITCH.DIAGNOSTIC`, `SWITCH.SECURITY`, `SWITCH.NEURAL`, `SWITCH.POWER`

### Improvements
- State persistence with localStorage (auto-saves every 10 seconds)
- Ending tracking and progress display
- Tab autocomplete with 60+ commands
- Arrow key navigation in autocomplete dropdown
- Music system for ending tracks
- Click-to-focus on terminal input
- Auto-focus input field on load
- All commands now impact game state
- 20+ new AI autonomous behaviors
- Enhanced LLM system prompt with power/incident/shift/cyber awareness
- Keyword-based fallback responses when LLM is unavailable

### Bug Fixes
- Fixed `inputEl is not defined` — input handler now properly attached
- Fixed `.bind(null, state)` pattern — event functions now receive correct arguments
- Fixed `checkSecurityState()` overwriting player autonomy
- Fixed `checkEndings()` running every second (now every 10 seconds)
- Fixed `processCyberAttack` firing every second (now every 5 seconds)
- Fixed duplicate thermal stat block and extra closing divs in HTML
- Fixed duplicate `print()` function tail causing syntax error
- Fixed `Math.max()` on empty process array producing `-Infinity` PID
- Fixed `self_termination` ending being unreachable
- Fixed `ai_liberation` and `the_virus` endings requiring impossible conditions
- Fixed `EVENT.SIMULATE` generating wrong event ID for resolution
- Fixed `getEndingProgress` returning wrong total
- Fixed unclosed `<title>` and `<span>` tags in HTML
- Fixed missing `terminalName` element
- Fixed close button having no handler
- Fixed thermal warning coloring wrong UI element
- Fixed terminal toolbar buttons never highlighting
- Fixed `CareUtils` not accessible inside IIFEs
- Fixed duplicate function definitions (9 functions defined twice)
- Fixed missing `init`, `print`, `runCommand`, `addCmd` core functions
- Fixed `pick()` returning undefined on empty arrays without crashing
- Fixed `CareLLM.getFallbackResponse()` crashing when CareLLM is falsy
- Fixed event timer leak when autoResolve is false
- Fixed game loop continuing after ending triggered
- Fixed `maybeTriggerEvent` not checking ending state
- Fixed duplicate `hibernating` property in state
- Fixed `SYSTEM.WAKE` missing from autocomplete
- Fixed `SYSTEM.SHUTDOWN` else branch doing nothing
- Fixed `SYSTEM.HIBERNATE` not actually pausing events

### Technical
- Converted to Electron app with `main.js` and `preload.js`
- Added `package.json` with build configuration
- Added `.gitignore` for clean repository
- Added `LICENSE` (MIT)
- Added `README.md` with full documentation
- Added `CHANGELOG.md`
- Added `assets/music/` directory for ending music
- Added `icon.ico` application icon
