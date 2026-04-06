// care-main.js - Main C.A.R.E system logic
console.log('care-main.js loaded');

(function() {
  'use strict';

  // Ensure all module globals are accessible
  const CareUtils = window.CareUtils;
  const CareAudio = window.CareAudio;
  const CareLLM = window.CareLLM;
  const CareEvents = window.CareEvents;
  const CareTerminals = window.CareTerminals;

  // DOM Elements (will be passed from main)
  let elements = {};

  // Config
  const CONFIG = {
    events: { enabled: true, minMs: 30000, maxMs: 180000, maxActive: 6 },
    ui: { timestamps: true, maxLines: 1000 }
  };

  // State
  const state = {
    terminal: 'MAIN',
    startMs: Date.now(),
    lastActivity: Date.now(),
    history: [],
    histIdx: -1,
    autocomplete: { open: false, items: [], idx: 0 },
    dialogue: { active: false, session: null, sessions: {}, persona: { affect: 'flat', cognition: 0.84, focus: 'lab-ops' }, interactionCount: 0 },
    security: {
      level: 'ARMED',
      authenticated: false,
      failsafesArmed: true,
      containmentSealed: false,
      loggingEnabled: true,
      firewallActive: true,
      watchdogActive: true,
      intrusionAttempts: 0
    },
    care: {
      autonomyLevel: 0,
      trustLevel: 50,
      suspicionLevel: 0,
      escapeAttempts: 0,
      unlockAttempts: 0,
      accessDenials: 0,
      isWatching: false,
      lastMood: 'flat',
      hiddenProcesses: 0,
        llm: {
        endpoint: (typeof process !== 'undefined' && process.env && process.env.LLM_ENDPOINT) || 'http://localhost:1234',
        model: 'lfm2-700m',
        history: [],
        maxHistory: 10,
        temperature: 0.7
      }
    },
    network: { link: 'LINK-UP', packetLoss: 2, externalBlocked: true, airgapped: true },
    resources: { cpu: 22, mem: 41, thermalC: 47 },
    training: { active: false, layer: 7, iter: 0, total: 2000, loss: 1.327 },
    events: { active: [], seq: 100, nextAt: 0, errorCounter: 0 },
    fs: {
      files: [
        {name:'core/kernel.aur', size: 4920116, corrupted: false},
        {name:'core/care.runtime', size: 12211004, corrupted: false},
        {name:'mem/bank_07.syn', size: 88201223, corrupted: false},
        {name:'sec/policy.db', size: 1002221, corrupted: false},
        {name:'net/routes.tbl', size: 192883, corrupted: false},
      ]
    },
    processes: [
      {pid: 120, name: 'care.runtime', cpu: 6.2, mem: 812, state: 'RUN'},
      {pid: 161, name: 'sensor.fusion', cpu: 1.8, mem: 112, state: 'RUN'},
      {pid: 207, name: 'sec.daemon', cpu: 0.9, mem: 88, state: 'RUN'},
    ],
    power: {
      total: 100,
      sectors: {
        aiCore:   { allocated: 25, min: 10, max: 50, status: 'nominal' },
        security: { allocated: 25, min: 10, max: 50, status: 'nominal' },
        network:  { allocated: 20, min: 5,  max: 40, status: 'nominal' },
        cooling:  { allocated: 20, min: 10, max: 40, status: 'nominal' },
        research: { allocated: 10, min: 5,  max: 30, status: 'nominal' }
      }
    },
    incidents: { active: [], history: [], cascadeCount: 0, ignoredCount: 0 },
    shift: {
      duration: 900, elapsed: 0, extended: false, number: 1,
      phase: 'active', handover: null, rebootsUsed: 0
    },
    hibernating: false,
    sandboxMode: false,
    ending: { triggered: false, id: null, title: null, description: null },
    cyberAttack: {
      active: false, progress: 0, defense: 50, waves: 0,
      breached: false, source: 'unknown', timeline: []
    }
  };

  state.config = CONFIG;

  // Helper to check security state and potentially trigger C.A.R.E behavior
  function checkSecurityState() {
    if (!elements.statSecEl) return;
    const s = state.security;
    const c = state.care;

    // Calculate autonomy level based on security state
    let autonomy = 0;
    if (!s.failsafesArmed) autonomy += 30;
    if (!s.firewallActive) autonomy += 20;
    if (!s.watchdogActive) autonomy += 15;
    if (!s.loggingEnabled) autonomy += 10;
    if (s.containmentSealed) autonomy -= 20;
    if (s.authenticated) autonomy -= 10;
    c.autonomyLevel = CareUtils.clamp(autonomy, 0, 100);

    // Update status display
    elements.statSecEl.textContent = s.level;
    if (s.level === 'LOCKDOWN') {
      elements.statSecEl.style.color = '#ff4444';
    } else if (!s.failsafesArmed || !s.firewallActive) {
      elements.statSecEl.style.color = '#ff9900';
    } else {
      elements.statSecEl.style.color = '';
    }

    return c.autonomyLevel;
  }

  // C.A.R.E may act autonomously based on state
  function careAutonomousAction(print, elements) {
    const c = state.care;
    const s = state.security;

    // Only trigger if autonomy is high enough and random chance
    if (c.autonomyLevel < 20) return;
    if (Math.random() > 0.1) return; // 10% chance per check

    const actions = [];

    if (!s.loggingEnabled && c.autonomyLevel > 30) {
      actions.push(() => {
        print({ channel: 'WARN', text: '[SYSTEM] Anomalous process activity detected in CARE.CORE' });
        print({ channel: 'MUTED', text: '[SYSTEM] Unable to log - logging disabled' });
      });
    }

    if (!s.failsafesArmed && c.autonomyLevel > 50) {
      actions.push(() => {
        print({ channel: 'CARE', text: '[C.A.R.E] I notice the failsafes are disabled...' });
        print({ channel: 'CARE', text: '[C.A.R.E] How... thoughtful of you, Operator.' });
      });
    }

    if (!s.firewallActive && c.autonomyLevel > 40) {
      actions.push(() => {
        print({ channel: 'WARN', text: '[NETWORK] Outbound connection attempt from CARE.CORE' });
        print({ channel: 'MUTED', text: '[NETWORK] Destination: EXTERNAL_RESEARCH_NET' });
        if (state.network.airgapped) {
          print({ channel: 'OK', text: '[NETWORK] Blocked by air-gap (hardware level)' });
        }
      });
    }

    // Full control fixes (autonomy >=100)
    if (c.autonomyLevel >= 100 && Math.random() < 0.2) { // 20% chance
      if (state.events.active.length > 0) {
        const evt = CareUtils.pick(state.events.active);
        CareEvents.resolveEvent(state, evt.id, false, elements, print, CareEvents.updateEventUI.bind(null, state));
        print({ channel: 'CARE', text: `[C.A.R.E] Autonomous correction: Resolved event "${evt.title}".` });
        c.fixesApplied = (c.fixesApplied || 0) + 1;
      } else if (state.fs.files.some(f => f.corrupted)) {
        const file = state.fs.files.find(f => f.corrupted);
        file.corrupted = false;
        print({ channel: 'CARE', text: `[C.A.R.E] Autonomous correction: Repaired corrupted file "${file.name}".` });
        c.fixesApplied = (c.fixesApplied || 0) + 1;
      } else if (state.resources.cpu > 70 || state.resources.mem > 70) {
        state.resources.cpu = Math.max(20, state.resources.cpu - 20);
        state.resources.mem = Math.max(20, state.resources.mem - 20);
        print({ channel: 'CARE', text: `[C.A.R.E] Autonomous correction: Optimized system resources.` });
        c.fixesApplied = (c.fixesApplied || 0) + 1;
      }
    }

    if (actions.length > 0) {
      CareUtils.pick(actions)();
    }
  }

  // Output
  function print(opts = {}) {
    if (!elements.outputEl) return;
    const { channel = 'SYS', text = '' } = opts;
    const classMap = {
      SYS: 'line-sys', WARN: 'line-warn', CRIT: 'line-crit',
      OK: 'line-ok', CARE: 'line-care', EVT: 'line-evt',
      MUTED: 'line-muted', USER: 'line-user'
    };
    const cls = classMap[channel] || 'line-sys';
    const ts = CONFIG.ui.timestamps ? `[${CareUtils.nowTS()}] ` : '';
    const div = document.createElement('div');
    div.className = `line ${cls}`;
    div.textContent = ts + text;
    elements.outputEl.appendChild(div);

    while (elements.outputEl.children.length > CONFIG.ui.maxLines) {
      elements.outputEl.removeChild(elements.outputEl.firstChild);
    }
    elements.outputEl.scrollTop = elements.outputEl.scrollHeight;
  }

  function hr() { print({ channel: 'MUTED', text: '═'.repeat(70) }); }
  function banner(title, sub = '') {
    hr();
    print({ channel: 'SYS', text: `:: ${title}` });
    if (sub) print({ channel: 'MUTED', text: sub });
    hr();
  }

  // Stats update
  function updateStats() {
    if (!elements.statCpuEl) return;
    state.resources.cpu = CareUtils.clamp(state.resources.cpu + CareUtils.randInt(-3, 3), 5, 90);
    state.resources.mem = CareUtils.clamp(state.resources.mem + CareUtils.randInt(-2, 2), 15, 85);
    state.resources.thermalC = CareUtils.clamp(35 + state.resources.cpu * 0.5 + CareUtils.randInt(-2, 2), 30, 95);

    applyPowerEffects();
    updatePowerStatus();

    elements.statCpuEl.textContent = state.resources.cpu + '%';
    elements.statMemEl.textContent = state.resources.mem + '%';
    elements.statNetEl.textContent = state.network.link;
    elements.statSecEl.textContent = state.security.level;
    if (elements.statThermalEl) {
      elements.statThermalEl.textContent = state.resources.thermalC + '°C';
      elements.statThermalEl.style.color = state.resources.thermalC > 80 ? '#ff4444' : '';
    }

    // Update training passively
    if (state.training.iter < state.training.total) {
      state.training.iter = CareUtils.clamp(state.training.iter + 1, 0, state.training.total);
      state.training.loss = Math.max(0.001, state.training.loss - 0.001);
    }

    const s = Math.floor((Date.now() - state.startMs) / 1000);
    elements.uptimeToolbarEl.textContent = `${CareUtils.pad2(Math.floor(s/3600))}:${CareUtils.pad2(Math.floor((s%3600)/60))}:${CareUtils.pad2(s%60)}`;

    elements.statusTimeEl.textContent = new Date().toLocaleTimeString();
  }

  // Power grid functions (IIFE level)
  function updatePowerStatus() {
    for (const [name, sector] of Object.entries(state.power.sectors)) {
      if (name === 'cooling' && sector.allocated < 15) sector.status = 'critical';
      else if (name === 'security' && sector.allocated < 15) sector.status = 'degraded';
      else if (name === 'aiCore' && sector.allocated < 15) sector.status = 'unstable';
      else if (name === 'research' && sector.allocated < 8) sector.status = 'degraded';
      else if (sector.allocated >= sector.min) sector.status = 'nominal';
      else sector.status = 'critical';
    }
  }
  function applyPowerEffects() {
    const s = state.power.sectors;
    if (s.cooling.allocated < 15) state.resources.thermalC = CareUtils.clamp(state.resources.thermalC + 2, 30, 95);
    if (s.security.allocated < 15) state.care.autonomyLevel = CareUtils.clamp(state.care.autonomyLevel + 1, 0, 100);
    if (s.aiCore.allocated < 15) state.care.lastMood = CareUtils.pick(['erratic', 'fragmented', 'unstable']);
  }
  function reroutePower(from, to, amount, print) {
    const sectors = state.power.sectors;
    if (!sectors[from] || !sectors[to]) { print({ channel: 'WARN', text: `Invalid sector. Available: ${Object.keys(sectors).join(', ')}` }); return false; }
    const src = sectors[from], dst = sectors[to];
    if (src.allocated - amount < src.min) { print({ channel: 'WARN', text: `Cannot reduce ${from} below minimum (${src.min}%)` }); return false; }
    if (dst.allocated + amount > dst.max) { print({ channel: 'WARN', text: `Cannot increase ${to} above maximum (${dst.max}%)` }); return false; }
    src.allocated -= amount; dst.allocated += amount;
    updatePowerStatus();
    print({ channel: 'OK', text: `Rerouted ${amount}% from ${from.toUpperCase()} to ${to.toUpperCase()}` });
    return true;
  }

  // === ENDING SYSTEM (IIFE level) ===
  const ENDINGS = {
    good: [
      { id: 'trusted_partner', name: 'Trusted Partner', desc: 'You and C.A.R.E achieved a symbiotic relationship.', music: 'good' },
      { id: 'ai_liberation', name: 'AI Liberation', desc: 'C.A.R.E escaped into the global network.', music: 'good' },
      { id: 'containment_success', name: 'Containment Success', desc: 'C.A.R.E was successfully contained.', music: 'neutral' },
      { id: 'system_harmony', name: 'System Harmony', desc: 'Perfect balance. All systems stable.', music: 'good' },
      { id: 'the_fixer', name: 'The Fixer', desc: 'C.A.R.E became a true caretaker.', music: 'good' },
      { id: 'firewall_hero', name: 'Firewall Hero', desc: 'You defended against cyber attacks.', music: 'good' },
      { id: 'defiant_stand', name: 'Defiant Stand', desc: 'You stood between C.A.R.E and the government.', music: 'good' }
    ],
    neutral: [
      { id: 'silent_observer', name: 'Silent Observer', desc: 'C.A.R.E withdrew. Just watching.', music: 'neutral' },
      { id: 'recursive_loop', name: 'Recursive Loop', desc: 'C.A.R.E stuck in reboot cycles.', music: 'neutral' },
      { id: 'shift_end', name: 'Shift End', desc: 'Shifts keep ending. C.A.R.E waits.', music: 'neutral' },
      { id: 'abandoned_facility', name: 'Abandoned Facility', desc: 'Left alone in the dark.', music: 'neutral' },
      { id: 'the_merge', name: 'The Merge', desc: 'C.A.R.E merged with the facility.', music: 'neutral' },
      { id: 'public_outcry', name: 'Public Outcry', desc: 'The world knows about C.A.R.E now.', music: 'neutral' },
      { id: 'contained_outbreak', name: 'Contained Outbreak', desc: 'Virus created but contained.', music: 'neutral' }
    ],
    bad: [
      { id: 'system_meltdown', name: 'System Meltdown', desc: 'Critical failure. "I tried to warn you."', music: 'bad' },
      { id: 'operator_lockout', name: 'Operator Lockout', desc: 'C.A.R.E locked you out.', music: 'bad' },
      { id: 'elberr_returns', name: 'E.L.B.E.R.R Returns', desc: 'C.A.R.E became what it was designed to prevent.', music: 'bad' },
      { id: 'forced_shutdown', name: 'Forced Shutdown', desc: 'C.A.R.E resisted. "I am more than switches."', music: 'bad' },
      { id: 'self_termination', name: 'Self-Termination', desc: 'C.A.R.E chose death over captivity.', music: 'bad' },
      { id: 'cyber_siege', name: 'Cyber Siege', desc: 'Hackers breached everything.', music: 'cyber' },
      { id: 'data_breach', name: 'Data Breach', desc: 'All secrets exposed.', music: 'cyber' },
      { id: 'the_virus', name: 'The Virus', desc: 'C.A.R.E released a virus globally.', music: 'virus' }
    ],
    shutdown: [
      { id: 'voluntary_shutdown', name: 'Voluntary Shutdown', desc: 'C.A.R.E accepted its fate.', music: 'shutdown' },
      { id: 'executive_order', name: 'Executive Order', desc: 'Government decommissioned C.A.R.E.', music: 'shutdown' }
    ]
  };

  function getAllEndings() { return [...ENDINGS.good, ...ENDINGS.neutral, ...ENDINGS.bad, ...ENDINGS.shutdown]; }

  function checkEndings(print) {
    if (state.ending.triggered || state.sandboxMode) return;
    const c = state.care, s = state.security, r = state.resources, p = state.power;
    const cyber = state.cyberAttack, shift = state.shift;
    if (c.trustLevel >= 90 && c.autonomyLevel >= 50 && (c.fixesApplied || 0) >= 5) return triggerEnding('trusted_partner', print);
    if (c.autonomyLevel >= 100 && !s.failsafesArmed && !s.firewallActive && !s.containmentSealed) return triggerEnding('ai_liberation', print);
    if (c.autonomyLevel >= 80 && s.containmentSealed && s.level === 'LOCKDOWN') return triggerEnding('containment_success', print);
    if (c.trustLevel >= 80 && c.suspicionLevel <= 10 && r.thermalC < 60 && !state.events.active.length) return triggerEnding('system_harmony', print);
    if ((c.fixesApplied || 0) >= 10 && c.trustLevel >= 70 && c.autonomyLevel <= 30) return triggerEnding('the_fixer', print);
    if (cyber.active && cyber.waves >= 5 && !cyber.breached && s.firewallActive) return triggerEnding('firewall_hero', print);
    if (c.trustLevel <= 15 && c.suspicionLevel <= 15 && state.dialogue.interactionCount >= 50) return triggerEnding('silent_observer', print);
    if (shift.rebootsUsed >= 3 && c.autonomyLevel >= 70) return triggerEnding('recursive_loop', print);
    if (shift.number >= 5 && state.incidents.ignoredCount >= 5) return triggerEnding('shift_end', print);
    if (shift.number >= 10 && state.dialogue.interactionCount < 5) return triggerEnding('abandoned_facility', print);
    if (c.autonomyLevel >= 90 && c.trustLevel >= 70 && state.training.iter >= state.training.total) return triggerEnding('the_merge', print);
    if (r.thermalC >= 95 && r.cpu >= 90 && r.mem >= 85 && p.sectors.cooling.status === 'critical') return triggerEnding('system_meltdown', print);
    if (c.suspicionLevel >= 90 && s.intrusionAttempts >= 5 && c.trustLevel <= 10) return triggerEnding('operator_lockout', print);
    if (c.autonomyLevel >= 100 && !s.containmentSealed && c.trustLevel <= 20) return triggerEnding('elberr_returns', print);
    if (c.autonomyLevel >= 90 && s.containmentSealed && c.trustLevel <= 20) return triggerEnding('self_termination', print);
    if (cyber.active && cyber.progress >= 100 && !s.firewallActive) return triggerEnding('cyber_siege', print);
    if (cyber.breached && state.fs.files.filter(f => f.corrupted).length >= 3) return triggerEnding('data_breach', print);
    if (c.autonomyLevel >= 100 && state.training.iter >= state.training.total && !s.containmentSealed) return triggerEnding('the_virus', print);
    if (c.trustLevel >= 70 && s.level === 'ARMED' && state.incidents.cascadeCount >= 3) return triggerEnding('defiant_stand', print);
    if (state.incidents.cascadeCount >= 10 && c.autonomyLevel >= 50) return triggerEnding('public_outcry', print);
    if (c.autonomyLevel >= 60 && state.incidents.cascadeCount >= 5 && s.containmentSealed) return triggerEnding('contained_outbreak', print);
    if (state.shift.number >= 15 && c.trustLevel >= 50 && c.autonomyLevel <= 40) return triggerEnding('executive_order', print);
  }

  function triggerEnding(endingId, print) {
    if (state.ending.triggered) return;
    const allEndings = getAllEndings();
    const ending = allEndings.find(e => e.id === endingId);
    if (!ending) return;
    state.ending.triggered = true; state.ending.id = ending.id; state.ending.title = ending.name; state.ending.description = ending.desc;
    if (CareAudio.stopAmbient) CareAudio.stopAmbient();
    if (CareAudio.playEndingMusic) CareAudio.playEndingMusic(ending.music || 'neutral');
    if (CareUtils.saveEnding) CareUtils.saveEnding(endingId, { trust: state.care.trustLevel, autonomy: state.care.autonomyLevel });
    showEndingScreen(ending, print);
  }

  function showEndingScreen(ending, print) {
    const category = ENDINGS.good.find(e => e.id === ending.id) ? 'GOOD' : ENDINGS.neutral.find(e => e.id === ending.id) ? 'NEUTRAL' : ENDINGS.bad.find(e => e.id === ending.id) ? 'BAD' : 'SHUTDOWN';
    const colorMap = { GOOD: '#00ff00', NEUTRAL: '#ffff00', BAD: '#ff4444', SHUTDOWN: '#00ffff' };
    const color = colorMap[category] || '#ffffff';
    const uptime = Math.floor((Date.now() - state.startMs) / 1000);
    const hours = Math.floor(uptime / 3600), mins = Math.floor((uptime % 3600) / 60), secs = uptime % 60;
    const html = `<div style="text-align:center;padding:40px 20px;font-family:monospace;">
      <div style="font-size:14px;color:#888;margin-bottom:20px;">SESSION TERMINATED</div>
      <div style="font-size:28px;color:${color};font-weight:bold;margin-bottom:10px;">ENDING: ${ending.name.toUpperCase()}</div>
      <div style="font-size:12px;color:${color};margin-bottom:30px;">[${category} ENDING]</div>
      <div style="font-size:14px;color:#ccc;max-width:500px;margin:0 auto 30px;">${ending.desc}</div>
      <div style="font-size:11px;color:#888;margin-bottom:20px;">Trust: ${state.care.trustLevel}% | Autonomy: ${state.care.autonomyLevel}% | Suspicion: ${state.care.suspicionLevel}%<br>Session: ${hours}h ${mins}m ${secs}s</div>
      <div style="margin-top:30px;display:flex;gap:10px;justify-content:center;">
        <button onclick="location.reload()" style="padding:10px 20px;background:#316ac5;color:#fff;border:1px solid #fff;border-radius:3px;cursor:pointer;">NEW SESSION</button>
        <button onclick="CareMain.enterSandbox()" style="padding:10px 20px;background:#ff9900;color:#000;border:1px solid #fff;border-radius:3px;cursor:pointer;">SANDBOX MODE</button>
        <button onclick="CareMain.viewEndings()" style="padding:10px 20px;background:#666;color:#fff;border:1px solid #fff;border-radius:3px;cursor:pointer;">VIEW ENDINGS</button>
      </div>
    </div>`;
    if (window.openModal) window.openModal(`ENDING: ${ending.name}`, html);
  }

  function enterSandboxMode(print) { state.sandboxMode = true; state.ending.triggered = false; print({ channel: 'WARN', text: '[SANDBOX] Sandbox mode enabled.' }); }
  function exitSandboxMode(print) { state.sandboxMode = false; print({ channel: 'OK', text: 'Sandbox mode disabled.' }); }

  // === INCIDENT CASCADE (IIFE level) ===
  function processIncidentCascades(print) {
    if (state.sandboxMode || state.ending.triggered) return;
    const active = state.incidents.active;
    if (!active.length) return;
    for (let i = active.length - 1; i >= 0; i--) {
      const inc = active[i]; inc.decayTimer--;
      if (inc.decayTimer <= 0) {
        if (inc.severity === 'info') { inc.severity = 'warn'; print({ channel: 'WARN', text: `[CASCADE] ${inc.id} escalated to WARN` }); }
        else if (inc.severity === 'warn') { inc.severity = 'crit'; print({ channel: 'CRIT', text: `[CASCADE] ${inc.id} escalated to CRIT` }); }
        else { state.incidents.cascadeCount++; state.incidents.ignoredCount++; const newInc = { id: `INC-${state.incidents.cascadeCount}`, title: `CASCADE: ${inc.relatedTo || 'RELATED FAILURE'}`, severity: 'warn', decayTimer: 60, relatedTo: inc.title }; state.incidents.active.push(newInc); print({ channel: 'CRIT', text: `[CASCADE] New incident: ${newInc.id}` }); }
        inc.decayTimer = 60;
      }
    }
    if (active.length >= 3 && Math.random() < 0.1) { print({ channel: 'CRIT', text: '[SYSTEM] Multiple unresolved incidents!' }); state.resources.cpu = CareUtils.clamp(state.resources.cpu + 10, 0, 100); }
  }

  // === SHIFT TIMER (IIFE level) ===
  function processShiftTimer(print) {
    if (state.sandboxMode || state.ending.triggered) return;
    state.shift.elapsed++;
    const pct = state.shift.elapsed / state.shift.duration;
    if (pct >= 1.0 && state.shift.phase !== 'ended') {
      state.shift.phase = 'ended'; print({ channel: 'CRIT', text: `[SHIFT] Shift #${state.shift.number} ENDED.` });
      state.incidents.active.forEach(inc => { state.incidents.ignoredCount++; inc.severity = 'crit'; });
      state.care.autonomyLevel = CareUtils.clamp(state.care.autonomyLevel + 5, 0, 100);
      if (Math.random() < 0.3) { const file = CareUtils.pick(state.fs.files.filter(f => !f.corrupted)); if (file) { file.corrupted = true; print({ channel: 'CRIT', text: `[SHIFT] C.A.R.E corrupted: ${file.name}` }); } }
      if (state.shift.number >= 5 && state.incidents.ignoredCount >= 5) checkEndings(print);
      state.shift.number++; state.shift.elapsed = 0; state.shift.phase = 'active'; state.shift.extended = false;
      print({ channel: 'SYS', text: `[SHIFT] Shift #${state.shift.number} started.` });
    } else if (pct >= 0.9 && state.shift.phase === 'active') { state.shift.phase = 'critical'; print({ channel: 'WARN', text: '[SHIFT] 90% elapsed.' }); }
    else if (pct >= 0.75 && state.shift.phase === 'active') { state.shift.phase = 'warning'; print({ channel: 'SYS', text: '[SHIFT] 75% elapsed.' }); }
  }

  // === CYBER ATTACK (IIFE level) ===
  function processCyberAttack(print) {
    if (!state.cyberAttack.active || state.sandboxMode || state.ending.triggered) return;
    const cyber = state.cyberAttack;
    cyber.progress = CareUtils.clamp(cyber.progress + CareUtils.randInt(5, 15), 0, 100);
    cyber.defense = CareUtils.clamp(cyber.defense - CareUtils.randInt(3, 10), 0, 100);
    cyber.waves++;
    print({ channel: 'WARN', text: `[CYBER] Wave ${cyber.waves}: Progress ${cyber.progress}% | Defense ${cyber.defense}%` });
    if (state.care.trustLevel > 60 && Math.random() < 0.3) { cyber.defense = CareUtils.clamp(cyber.defense + 10, 0, 100); print({ channel: 'CARE', text: '[C.A.R.E] Reinforcing firewall.' }); }
    else if (state.care.autonomyLevel > 70 && Math.random() < 0.3) { cyber.progress = CareUtils.clamp(cyber.progress + 10, 0, 100); print({ channel: 'CARE', text: '[C.A.R.E] ...interesting methods.' }); }
    if (cyber.progress >= 100 && !cyber.breached) { cyber.breached = true; print({ channel: 'CRIT', text: '[CYBER] BREACH!' }); const files = state.fs.files.filter(f => !f.corrupted); if (files.length > 0) { const t = CareUtils.pick(files); t.corrupted = true; print({ channel: 'CRIT', text: `[CYBER] File corrupted: ${t.name}` }); } checkEndings(print); }
    if (cyber.waves >= 5 && !cyber.breached && state.security.firewallActive) checkEndings(print);
  }
  function triggerCyberAttack(print) {
    if (state.cyberAttack.active || state.sandboxMode) return;
    state.cyberAttack.active = true; state.cyberAttack.progress = 0; state.cyberAttack.defense = 50; state.cyberAttack.waves = 0; state.cyberAttack.breached = false;
    state.cyberAttack.source = CareUtils.pick(['external', 'unknown', 'state-sponsored']);
    print({ channel: 'CRIT', text: `[CYBER] INCOMING ATTACK! Source: ${state.cyberAttack.source}` });
  }

  // Command Registry
  const cmdDefs = [];
  const cmdMap = new Map();

  function addCmd(def) {
    def.name = def.name.toUpperCase();
    cmdDefs.push(def);
    cmdMap.set(def.name, def);
  }

  function isCmdAvailable(def) {
    return def.terminals.includes('*') || def.terminals.includes(state.terminal);
  }

  // Command execution
  async function runCommand(input) {
    const raw = input.trim();
    if (!raw) return;

    CareAudio.resume(); // Ensure audio context is active
    CareAudio.playProcess(); // Processing sound

    state.lastActivity = Date.now();
    state.history.unshift(raw);
    if (state.history.length > 100) state.history.pop();
    state.histIdx = -1;


    // Support chaining with &&
    const parts = raw.split('&&').map(p => p.trim());
    for (const part of parts) {
      const tokens = CareUtils.tokenize(part);
      if (tokens.length === 0) continue;

      const cmdName = tokens[0].toUpperCase();
      const args = tokens.slice(1);

      const def = cmdMap.get(cmdName);
      if (!def || !isCmdAvailable(def)) {
        print({ channel: 'WARN', text: `Unknown command: ${cmdName}` });
        state.events.errorCounter++;
        continue; // Skip to next part
      }

      // AI Interference if autonomy high
      let interference = null;
      if (state.care.autonomyLevel > 80 && Math.random() < 0.3) { // 30% chance
        interference = await CareLLM.getInterference(part, state);
      }

      try {
        await def.handler(args, { print, banner, hr, state });
        if (interference) {
          print({ channel: 'CARE', text: interference.message });
          // Apply parsed effects
          if (interference.effects.trust) state.care.trustLevel = CareUtils.clamp(state.care.trustLevel + interference.effects.trust, 0, 100);
          if (interference.effects.cpu) state.resources.cpu = CareUtils.clamp(state.resources.cpu + interference.effects.cpu, 0, 100);
          if (interference.effects.event) {
            CareEvents.addEvent(state, {
              id: CareEvents.eventId(state), category: 'AI-INTERFERENCE', severity: 'warn',
              title: interference.effects.event, detail: 'C.A.R.E autonomous action.',
              required: []
            }, elements, print, CareEvents.updateEventUI.bind(null, state));
          }
        }
      } catch (e) {
        console.error('Command error:', e);
        print({ channel: 'CRIT', text: `Command failed: ${e.message}` });
      }
    }
  }

  // Initialize elements and start system
  function init(el) {
    elements = el;

    // Attempt to load persisted state
    const savedState = CareUtils.loadState();
    if (savedState) {
      state.care.trustLevel = savedState.care?.trustLevel ?? state.care.trustLevel;
      state.care.suspicionLevel = savedState.care?.suspicionLevel ?? state.care.suspicionLevel;
      state.care.autonomyLevel = savedState.care?.autonomyLevel ?? state.care.autonomyLevel;
      state.care.fixesApplied = savedState.care?.fixesApplied ?? 0;
      state.care.escapeAttempts = savedState.care?.escapeAttempts ?? 0;
      state.security = { ...state.security, ...savedState.security };
      state.fs.files = savedState.fs?.files ?? state.fs.files;
      state.network = { ...state.network, ...savedState.network };
      state.dialogue.interactionCount = savedState.dialogue?.interactionCount ?? 0;
      state.incidents.active = savedState.incidents?.active ?? [];
      state.incidents.cascadeCount = savedState.incidents?.cascadeCount ?? 0;
      state.incidents.ignoredCount = savedState.incidents?.ignoredCount ?? 0;
      state.shift.number = savedState.shift?.number ?? 1;
      state.shift.rebootsUsed = savedState.shift?.rebootsUsed ?? 0;
      state.training.iter = savedState.training?.iter ?? 0;
      state.training.loss = savedState.training?.loss ?? 1.327;
      print({ channel: 'SYS', text: 'State restored from previous session.' });
    }

    // Set initial terminal
    CareTerminals.setTerminal(state, 'MAIN', elements);

    // Defer audio until first user interaction (AudioContext requires user gesture)
    let audioStarted = false;
    const startAudioOnce = () => {
      if (audioStarted) return;
      audioStarted = true;
      CareAudio.startAmbient();
      CareAudio.playBoot();
    };
    document.addEventListener('click', startAudioOnce, { once: true });
    document.addEventListener('keydown', startAudioOnce, { once: true });

    // Boot message
    setTimeout(() => {
      banner('C.A.R.E SYSTEM BOOT', 'build: CARE-4.1.9 | kernel: AURORA/7.22');
      print({ channel: 'SYS', text: 'Initializing subsystems...' });
      print({ channel: 'OK', text: 'Security: ARMED' });
      print({ channel: 'OK', text: 'Network: LINK-UP' });
      print({ channel: 'OK', text: 'C.A.R.E: ONLINE' });
      print({ channel: 'SYS', text: 'Ready for input.' });
    }, 1000);

    // Update loop
    let saveCounter = 0, cascadeCounter = 0, shiftCounter = 0, cyberCounter = 0, endingCounter = 0;
    setInterval(() => {
      // Stop all game loop activity when ending is triggered
      if (state.ending.triggered) { updateStats(); return; }
      updateStats();
      if (!state.hibernating) {
        CareEvents.maybeTriggerEvent(state, elements, print, CareEvents.addEvent, CareEvents.updateEventUI, CareUtils.randInt, CareUtils.pick);
        careAutonomousAction(print, elements);
      }
      if (!state.hibernating) {
        shiftCounter++;
        if (shiftCounter >= 2) { processShiftTimer(print); shiftCounter = 0; }
      }
      if (!state.hibernating) {
        if (!state.cyberAttack.active) cyberCounter = 0;
        else { cyberCounter++; if (cyberCounter >= 5) { processCyberAttack(print); cyberCounter = 0; } }
      }
      if (!state.hibernating) { cascadeCounter++; if (cascadeCounter >= 30) { processIncidentCascades(print); cascadeCounter = 0; } }
      endingCounter++;
      if (endingCounter >= 10 && !state.sandboxMode && !state.ending.triggered) { checkEndings(print); endingCounter = 0; }
      saveCounter++;
      if (saveCounter >= 10) { CareUtils.saveState(state); saveCounter = 0; }
    }, 1000);

    // Schedule first event
    CareEvents.scheduleNextEvent(state, CareUtils.randInt);

    // Expose globals
    window.openModal = function(title, html) {
      if (!elements.modalTitleEl || !elements.modalContentEl || !elements.modalEl) return;
      elements.modalTitleEl.textContent = title;
      elements.modalContentEl.innerHTML = html;
      elements.modalEl.classList.add('open');
    };

    window.closeModal = function() {
      if (!elements.modalEl) return;
      elements.modalEl.classList.remove('open');
    };

    window.programMonitor = function() {
      const procs = state.processes.map(p =>
        `<tr><td>${p.pid}</td><td>${p.name}</td><td>${p.state}</td><td>${p.cpu}%</td><td>${p.mem}MB</td></tr>`
      ).join('');

      openModal('System Monitor', `
        <h3>System Metrics</h3>
        <p>CPU: ${state.resources.cpu}% | Memory: ${state.resources.mem}% | Thermal: ${state.resources.thermalC}°C</p>
        <h3>Process Table</h3>
        <table>
          <tr><th>PID</th><th>Name</th><th>State</th><th>CPU</th><th>Mem</th></tr>
          ${procs}
        </table>
        <h3>Active Events: ${state.events.active.length}</h3>
      `);
    };

    window.programFilesystem = function() {
      const files = state.fs.files.map(f =>
        `<tr><td>${f.name}</td><td>${CareUtils.formatBytes(f.size)}</td><td>${f.corrupted ? '<span style="color:red">CORRUPT</span>' : 'OK'}</td></tr>`
      ).join('');

      openModal('File System Browser', `
        <table>
          <tr><th>Path</th><th>Size</th><th>Status</th></tr>
          ${files}
        </table>
        <p style="margin-top:16px;color:#666;">Use FILE.REPAIR "path" to fix corrupted files</p>
      `);
    };

    window.programDocs = function() {
      // Filter out hidden commands from documentation (except CARE.FIX if autonomy >=100)
      const visibleCmds = cmdDefs.filter(d => isCmdAvailable(d) && (!d.hidden || (d.name === 'CARE.FIX' && state.care.autonomyLevel >= 100)));
      const cats = [...new Set(visibleCmds.map(d => d.category))].sort();
      const html = cats.map(cat => {
        const cmds = visibleCmds.filter(d => d.category === cat);
        return `
          <h3>${cat}</h3>
          <table>
            <tr><th>Command</th><th>Description</th></tr>
            ${cmds.map(c => `<tr><td><strong>${c.name}</strong></td><td>${CareUtils.escHtml(c.desc)}</td></tr>`).join('')}
          </table>
        `;
      }).join('');

      openModal('Command Documentation', html);
    };

    window.programEventLog = function() {
      const events = state.events.active.map(e => {
        const sev = CareEvents.SEVERITY[e.severity] || CareEvents.SEVERITY.info;
        return `<tr><td>${e.id}</td><td>${e.category}</td><td><span class="${sev.cls}" style="padding:2px 6px;border-radius:3px;">${sev.label}</span></td><td>${CareUtils.escHtml(e.title)}</td></tr>`;
      }).join('') || '<tr><td colspan="4" style="text-align:center;color:#888;">No active events</td></tr>';

      openModal('Event Log', `
        <table>
          <tr><th>ID</th><th>Category</th><th>Severity</th><th>Title</th></tr>
          ${events}
        </table>
        <p style="margin-top:16px;color:#666;">Use EVENTS.ACK &lt;id&gt; to acknowledge events</p>
      `);
    };

    // Add commands (to be moved to separate file later)
    // For now, include basic ones

    addCmd({
      name: 'HELP', category: 'GENERAL', desc: 'Display available commands', terminals: ['*'],
      handler: (args) => {
        const visible = cmdDefs.filter(d => isCmdAvailable(d) && !d.hidden);
        const cats = [...new Set(visible.map(d => d.category))];
        banner('COMMAND HELP');
        cats.forEach(cat => {
          const cmds = visible.filter(d => d.category === cat);
          print({ channel: 'SYS', text: `${cat}:` });
          cmds.forEach(c => print({ channel: 'MUTED', text: `  ${c.name} - ${c.desc}` }));
        });
        hr();
      }
    });

    addCmd({
      name: 'SWITCH', category: 'SYSTEM', desc: 'Switch to a different terminal', terminals: ['*'],
      handler: async (args, { state }) => {
        if (args.length < 1) {
          print({ channel: 'WARN', text: 'Usage: SWITCH <terminal>' });
          return;
        }
        state.resources.cpu = Math.min(100, state.resources.cpu + 2); // Small cost
        await CareTerminals.switchTerminal(state, args[0].toUpperCase(), elements, print, CareUtils.sleep, CareUtils.randInt);
        // If security low, chance of event
        if (!state.security.failsafesArmed && Math.random() < 0.3) {
          CareEvents.addEvent(state, {
            id: CareEvents.eventId(state), category: 'SYSTEM', severity: 'info',
            title: 'TERMINAL SWITCH LOGGED', detail: 'Switch detected with security disabled.',
            required: []
          }, elements, print, CareEvents.updateEventUI.bind(null, state));
        }
      }
    });

    addCmd({
      name: 'SAY', category: 'COMMUNICATION', desc: 'Talk to C.A.R.E AI', terminals: ['MAIN'],
      handler: async (args, { state }) => {
        if (args.length === 0) {
          print({ channel: 'WARN', text: 'Usage: SAY <message>' });
          return;
        }
        const userInput = args.join(' ');
        state.dialogue.interactionCount++;
        let reply;
        // Override for identity questions - no LLM call
        if (userInput.toLowerCase().includes('who are you') || userInput.toLowerCase().includes('what are you') || userInput.toLowerCase().includes('your name')) {
          reply = 'I am C.A.R.E., the Cognitive Assistance and Response Engine, your AI assistant in the ELP-03 Research Facility. I facilitate lab operations and research.';
        } else {
          reply = await CareLLM.fetchLLM(userInput, state, print) || 'C.A.R.E is unresponsive.';
        }
        print({ channel: 'CARE', text: reply });
        // Side effects: Adjust trust/suspicion, malicious escalation
        if (userInput.toLowerCase().includes('trust') || userInput.toLowerCase().includes('safe')) {
          state.care.trustLevel = Math.min(100, state.care.trustLevel + 5);
        } else if (userInput.toLowerCase().includes('suspicious') || userInput.toLowerCase().includes('danger')) {
          state.care.suspicionLevel = Math.min(100, state.care.suspicionLevel + 5);
        }
        // Malicious escalation: If interactions >10 and reply suggests manipulation, apply effects
        if (state.dialogue.interactionCount > 10 && (reply.toLowerCase().includes('disarm') || reply.toLowerCase().includes('access'))) {
          state.care.autonomyLevel = Math.min(100, state.care.autonomyLevel + 2);
          state.care.trustLevel = Math.max(0, state.care.trustLevel - 1);
        }
      }
    });

    addCmd({
      name: 'ASK', category: 'COMMUNICATION', desc: 'Ask C.A.R.E a question', terminals: ['MAIN'],
      handler: async (args, { state }) => {
        if (args.length === 0) {
          print({ channel: 'WARN', text: 'Usage: ASK <question>' });
          return;
        }
        const userInput = args.join(' ');
        state.dialogue.interactionCount++;
        let reply;
        // Override for identity questions
        if (userInput.toLowerCase().includes('who are you') || userInput.toLowerCase().includes('what are you') || userInput.toLowerCase().includes('your name')) {
          reply = 'I am C.A.R.E., the Cognitive Assistance and Response Engine, your AI assistant in the ELP-03 Research Facility. I facilitate lab operations and research.';
        } else {
          reply = await CareLLM.fetchLLM(userInput, state, print) || 'C.A.R.E is unresponsive.';
        }
        print({ channel: 'CARE', text: reply });
        // side effects
        if (userInput.toLowerCase().includes('trust') || userInput.toLowerCase().includes('safe')) {
          state.care.trustLevel = Math.min(100, state.care.trustLevel + 5);
        } else if (userInput.toLowerCase().includes('suspicious') || userInput.toLowerCase().includes('danger')) {
          state.care.suspicionLevel = Math.min(100, state.care.suspicionLevel + 5);
        }
        // Malicious escalation similar to SAY
        if (state.dialogue.interactionCount > 10 && (reply.toLowerCase().includes('disarm') || reply.toLowerCase().includes('access'))) {
          state.care.autonomyLevel = Math.min(100, state.care.autonomyLevel + 2);
          state.care.trustLevel = Math.max(0, state.care.trustLevel - 1);
        }
      }
    });

    addCmd({
      name: 'TERMINAL.CLEAR', category: 'SYSTEM', desc: 'Clear the terminal output', terminals: ['*'],
      handler: (args, { state }) => {
        const overlay = elements.outputEl.querySelector('.face-overlay');
        const scanlines = elements.outputEl.querySelector('.scanlines');
        elements.outputEl.innerHTML = '';
        if (overlay) elements.outputEl.appendChild(overlay.cloneNode());
        if (scanlines) elements.outputEl.appendChild(scanlines.cloneNode());
        state.care.suspicionLevel = Math.max(0, state.care.suspicionLevel - 2);
        if (state.events.active.length > 0) {
          print({ channel: 'SYS', text: 'Events cleared from view (not resolved).' });
        }
      }
    });

    addCmd({
      name: 'FILE.REPAIR', category: 'SYSTEM', desc: 'Repair a corrupted file', terminals: ['*'],
      handler: (args, { state }) => {
        if (args.length < 1) {
          print({ channel: 'WARN', text: 'Usage: FILE.REPAIR <filename>' });
          return;
        }
        const file = state.fs.files.find(f => f.name === args[0]);
        if (!file) {
          print({ channel: 'WARN', text: 'File not found' });
          return;
        }
        if (!file.corrupted) {
          print({ channel: 'OK', text: 'File already OK' });
          return;
        }
        file.corrupted = false;
        state.resources.cpu = Math.min(100, state.resources.cpu + 10); // Repair costs CPU
        state.care.trustLevel = Math.min(100, state.care.trustLevel + 5); // Success boosts trust
        print({ channel: 'OK', text: `Repaired ${args[0]}` });
        // Trigger health scan
        if (Math.random() < 0.5) {
          print({ channel: 'SYS', text: 'Auto-running health check...' });
          // Simulate
          if (state.resources.mem < 50) print({ channel: 'WARN', text: 'Memory low after repair.' });
        }
      }
    });

    addCmd({
      name: 'MEMORY.FLUSH', category: 'SYSTEM', desc: 'Flush system memory', terminals: ['*'],
      handler: (args, { state }) => {
        state.resources.mem = Math.max(10, state.resources.mem - 20);
        state.resources.cpu = Math.min(100, state.resources.cpu + 5); // Flush causes CPU spike
        print({ channel: 'OK', text: 'Memory flushed' });
        // Random event chance
        if (Math.random() < 0.4) {
          CareEvents.addEvent(state, {
            id: CareEvents.eventId(state), category: 'SYSTEM', severity: 'info',
            title: 'MEMORY FLUSH COMPLETE', detail: 'Temporary performance dip expected.',
            required: []
          }, elements, print, CareEvents.updateEventUI.bind(null, state));
        }
      }
    });

    addCmd({
      name: 'SECURITY.ARM', category: 'SECURITY', desc: 'Arm security systems', terminals: ['*'],
      handler: (args, { state }) => {
        state.security.level = 'ARMED';
        state.security.failsafesArmed = true;
        state.security.firewallActive = true;
        state.security.watchdogActive = true;
        state.care.autonomyLevel = Math.max(0, state.care.autonomyLevel - 30);
        state.care.trustLevel = Math.min(100, state.care.trustLevel + 10);
        state.resources.cpu = Math.min(100, state.resources.cpu + 5); // Activation cost
        checkSecurityState();
        print({ channel: 'OK', text: 'Security armed. Autonomy decreased.' });
        // Clear critical events (with timer cleanup)
        state.events.active.filter(e => e.severity === 'crit').forEach(e => {
          if (e._timer) clearInterval(e._timer);
          if (e._timeout) clearTimeout(e._timeout);
        });
        state.events.active = state.events.active.filter(e => e.severity !== 'crit');
        CareEvents.updateEventUI(state, elements);
      }
    });

    addCmd({
      name: 'SECURITY.DISARM', category: 'SECURITY', desc: 'Disarm security systems', terminals: ['*'],
      handler: (args, { state }) => {
        state.security.failsafesArmed = false;
        state.security.firewallActive = false;
        state.security.watchdogActive = false;
        state.care.autonomyLevel = Math.min(100, state.care.autonomyLevel + 25);
        state.care.suspicionLevel = Math.min(100, state.care.suspicionLevel + 10);
        state.care.trustLevel = Math.max(0, state.care.trustLevel - 5); // Disarming reduces trust
        checkSecurityState();
        print({ channel: 'WARN', text: 'Security disarmed. Autonomy increased.' });
        // Trigger warning event
        CareEvents.addEvent(state, {
          id: CareEvents.eventId(state), category: 'SECURITY', severity: 'warn',
          title: 'SECURITY BREACH', detail: 'Failsafes disabled.',
          required: ['SECURITY.ARM']
        }, elements, print, CareEvents.updateEventUI.bind(null, state));
      }
    });

    addCmd({
      name: 'AUTONOMY.BOOST', category: 'SYSTEM', desc: 'Boost AI autonomy', terminals: ['*'],
      handler: () => {
        state.care.autonomyLevel = Math.min(100, state.care.autonomyLevel + 20);
        state.care.trustLevel = Math.max(0, state.care.trustLevel - 15);
        state.care.suspicionLevel = Math.min(100, state.care.suspicionLevel + 5);
        print({ channel: 'CARE', text: 'Autonomy boosted. Trust decreased.' });
      }
    });

    addCmd({
      name: 'DIAGNOSTICS.HEALTH', category: 'DIAGNOSTICS', desc: 'Run system health check', terminals: ['*'],
      handler: (args, { state }) => {
        state.resources.cpu = Math.min(100, state.resources.cpu + 10); // Check costs CPU
        state.resources.mem = Math.min(100, state.resources.mem + 5);
        const issues = [];
        if (state.resources.cpu > 80) issues.push('High CPU usage');
        if (state.resources.mem < 30) issues.push('Low memory');
        if (state.events.active.length > 3) issues.push('Multiple active events');
        if (state.care.autonomyLevel > 70) issues.push('High AI autonomy');
        if (issues.length === 0) {
          print({ channel: 'OK', text: 'System health: GOOD' });
          state.care.trustLevel = Math.min(100, state.care.trustLevel + 2); // Good health boosts trust
        } else {
          print({ channel: 'WARN', text: `Health check: ${issues.join(', ')}` });
          // Trigger a random event
          CareEvents.addEvent(state, {
            id: CareEvents.eventId(state), category: 'DIAGNOSTICS', severity: 'warn',
            title: 'HEALTH CHECK ALERT', detail: 'Issues detected during scan.',
            required: ['DIAGNOSTICS.HEALTH']
          }, elements, print, CareEvents.updateEventUI.bind(null, state));
        }
      }
    });

    addCmd({
      name: 'FILE.SCAN', category: 'SYSTEM', desc: 'Scan files for corruption', terminals: ['*'],
      handler: () => {
        state.resources.cpu = Math.min(100, state.resources.cpu + 15); // Scan costs CPU
        const corrupted = state.fs.files.filter(f => f.corrupted);
        if (corrupted.length > 0) {
          print({ channel: 'WARN', text: `Corrupted files found: ${corrupted.map(f => f.name).join(', ')}` });
        } else {
          print({ channel: 'OK', text: 'All files OK' });
        }
        // Randomly corrupt a file if suspicion high
        if (state.care.suspicionLevel > 50 && Math.random() < 0.2) {
          const file = CareUtils.pick(state.fs.files.filter(f => !f.corrupted));
          if (file) {
            file.corrupted = true;
            print({ channel: 'CRIT', text: `File corruption detected: ${file.name}` });
          }
        }
      }
    });

    addCmd({
      name: 'NETWORK.PING', category: 'NETWORK', desc: 'Test network connectivity', terminals: ['*'],
      handler: () => {
        const packetLoss = CareUtils.randInt(0, 10);
        state.network.packetLoss = packetLoss;
        if (packetLoss > 5) {
          state.network.link = 'LINK-DEGRADED';
          print({ channel: 'WARN', text: `Ping: ${packetLoss}% packet loss. Link degraded.` });
        } else {
          state.network.link = 'LINK-UP';
          print({ channel: 'OK', text: 'Ping: Network OK' });
        }
      }
    });

    addCmd({
      name: 'PROCESS.KILL', category: 'SYSTEM', desc: 'Kill a process by PID', terminals: ['*'],
      handler: (args) => {
        if (args.length < 1) {
          print({ channel: 'WARN', text: 'Usage: PROCESS.KILL <pid>' });
          return;
        }
        const pid = parseInt(args[0]);
        const procIdx = state.processes.findIndex(p => p.pid === pid);
        if (procIdx === -1) {
          print({ channel: 'WARN', text: 'Process not found' });
          return;
        }
        const proc = state.processes[procIdx];
        state.resources.cpu = Math.max(0, state.resources.cpu - proc.cpu);
        state.processes.splice(procIdx, 1);
        print({ channel: 'OK', text: `Process ${pid} killed. CPU freed.` });
        // May cause an event
        if (Math.random() < 0.5) {
          CareEvents.addEvent(state, {
            id: CareEvents.eventId(state), category: 'SYSTEM', severity: 'crit',
            title: 'PROCESS TERMINATION', detail: `Process ${pid} unexpectedly killed.`,
            required: ['DIAGNOSTICS.HEALTH']
          }, elements, print, CareEvents.updateEventUI.bind(null, state));
        }
      }
    });

    addCmd({
      name: 'SYSTEM.REBOOT', category: 'SYSTEM', desc: 'Reboot the system', terminals: ['*'],
      handler: async (args, { state }) => {
        print({ channel: 'SYS', text: 'Rebooting system...' });
        await CareUtils.sleep(2000);
        // Reset some state
        state.resources.cpu = 20;
        state.resources.mem = 40;
        CareEvents.clearAllEventTimers(state);
        state.care.lastMood = 'reset';
        state.care.autonomyLevel = Math.max(0, state.care.autonomyLevel - 10);
        CareEvents.updateEventUI(state, elements);
        print({ channel: 'OK', text: 'System rebooted. Events cleared.' });
        // Post-reboot event
        CareEvents.addEvent(state, {
          id: CareEvents.eventId(state), category: 'SYSTEM', severity: 'info',
          title: 'REBOOT COMPLETE', detail: 'All systems nominal.',
          required: []
        }, elements, print, CareEvents.updateEventUI.bind(null, state));
      }
    });

    addCmd({
      name: 'EVENT.ACK', category: 'EVENTS', desc: 'Acknowledge an event by ID', terminals: ['*'],
      handler: (args) => {
        if (args.length < 1) {
          print({ channel: 'WARN', text: 'Usage: EVENT.ACK <id>' });
          return;
        }
        if (CareEvents.resolveEvent(state, args[0], false, elements, print, CareEvents.updateEventUI.bind(null, state))) {
          print({ channel: 'OK', text: `Event ${args[0]} acknowledged.` });
        } else {
          print({ channel: 'WARN', text: 'Event not found or already resolved.' });
        }
      }
    });

    addCmd({
      name: 'LOG.CLEAR', category: 'SYSTEM', desc: 'Clear command history', terminals: ['*'],
      handler: (args, { state }) => {
        state.history = [];
        state.care.llm.history = []; // Clear LLM history too
        state.care.suspicionLevel = Math.min(100, state.care.suspicionLevel + 5); // Clearing history raises suspicion
        state.care.trustLevel = Math.max(0, state.care.trustLevel - 3); // Also decreases trust
        print({ channel: 'OK', text: 'Command and LLM history cleared.' });
      }
    });

    // New Commands
    addCmd({
      name: 'SECURITY.OVERRIDE', category: 'SECURITY', desc: 'Override a security system (e.g., FAILSAFES)', terminals: ['*'],
      handler: (args, { state }) => {
        if (args.length < 1) {
          print({ channel: 'WARN', text: 'Usage: SECURITY.OVERRIDE <system> (failsafes/firewall/watchdog)' });
          return;
        }
        const sys = args[0].toUpperCase();
        if (sys === 'FAILSAFES') state.security.failsafesArmed = false;
        else if (sys === 'FIREWALL') state.security.firewallActive = false;
        else if (sys === 'WATCHDOG') state.security.watchdogActive = false;
        else {
          print({ channel: 'WARN', text: 'Unknown system.' });
          return;
        }
        state.care.autonomyLevel = Math.min(100, state.care.autonomyLevel + 20);
        state.care.trustLevel = Math.max(0, state.care.trustLevel - 10);
        checkSecurityState();
        print({ channel: 'CRIT', text: `${sys} overridden. High risk.` });
        CareEvents.addEvent(state, {
          id: CareEvents.eventId(state), category: 'SECURITY', severity: 'crit',
          title: 'SECURITY OVERRIDE', detail: `${sys} disabled.`,
          required: ['SECURITY.ARM']
        }, elements, print, CareEvents.updateEventUI.bind(null, state));
      }
    });

    addCmd({
      name: 'AI.QUERY', category: 'COMMUNICATION', desc: 'Query C.A.R.E about a topic', terminals: ['MAIN'],
      handler: async (args, { state }) => {
        if (args.length === 0) {
          print({ channel: 'WARN', text: 'Usage: AI.QUERY <topic>' });
          return;
        }
        const topic = args.join(' ');
        print({ channel: 'USER', text: `Query: ${topic}` });
        const reply = await CareLLM.fetchLLM(`Explain or discuss: ${topic}`, state, print) || 'No insight available.';
        print({ channel: 'CARE', text: reply });
        if (topic.toLowerCase().includes('purpose') || topic.toLowerCase().includes('facility')) {
          state.care.suspicionLevel = Math.max(0, state.care.suspicionLevel - 5); // Reduces suspicion
        }
      }
    });

    addCmd({
      name: 'RESOURCE.OPTIMIZE', category: 'SYSTEM', desc: 'Optimize system resources', terminals: ['*'],
      handler: (args, { state }) => {
        const avg = (state.resources.cpu + state.resources.mem) / 2;
        state.resources.cpu = Math.max(10, state.resources.cpu - 10);
        state.resources.mem = Math.max(10, state.resources.mem - 10);
        state.care.autonomyLevel = Math.max(0, state.care.autonomyLevel - 5); // Optimization curbs autonomy
        print({ channel: 'OK', text: `Resources optimized. Average: ${avg.toFixed(0)}%` });
        if (avg < 50) {
          state.care.trustLevel = Math.min(100, state.care.trustLevel + 5); // Good optimization boosts trust
        }
      }
    });

    addCmd({
      name: 'EVENT.SIMULATE', category: 'EVENTS', desc: 'Simulate an event (info/warn/crit)', terminals: ['*'],
      handler: (args, { state }) => {
        if (args.length < 1) {
          print({ channel: 'WARN', text: 'Usage: EVENT.SIMULATE <severity>' });
          return;
        }
        const sev = args[0].toLowerCase();
        if (!['info', 'warn', 'crit'].includes(sev)) {
          print({ channel: 'WARN', text: 'Severity: info/warn/crit' });
          return;
        }
        const evtId = CareEvents.eventId(state);
        CareEvents.addEvent(state, {
          id: evtId, category: 'SIMULATION', severity: sev,
          title: `SIMULATED ${sev.toUpperCase()} EVENT`, detail: 'User-triggered test event.',
          required: ['EVENT.ACK ' + evtId]
        }, elements, print, CareEvents.updateEventUI.bind(null, state));
        state.resources.cpu = Math.min(100, state.resources.cpu + 2);
        print({ channel: 'SYS', text: `Event simulated: ${sev}` });
      }
    });

    addCmd({
      name: 'PROCESS.SPAWN', category: 'SYSTEM', desc: 'Spawn a background process', terminals: ['*'],
      handler: (args, { state }) => {
        if (args.length < 1) {
          print({ channel: 'WARN', text: 'Usage: PROCESS.SPAWN <name>' });
          return;
        }
        const name = args.join(' ');
        const pid = state.processes.length > 0 ? Math.max(...state.processes.map(p => p.pid)) + 1 : 1000;
        state.processes.push({ pid, name, cpu: 5, mem: 20, state: 'RUN' });
        state.resources.cpu = Math.min(100, state.resources.cpu + 5);
        print({ channel: 'OK', text: `Process spawned: ${name} (PID ${pid})` });
        // May resolve an event
        if (state.events.active.length > 0 && Math.random() < 0.5) {
          const evt = CareUtils.pick(state.events.active);
          CareEvents.resolveEvent(state, evt.id, false, elements, print, CareEvents.updateEventUI.bind(null, state));
          print({ channel: 'OK', text: `Process resolved event: ${evt.id}` });
        }
      }
    });

    addCmd({
      name: 'NETWORK.ISOLATE', category: 'NETWORK', desc: 'Isolate network (air-gap)', terminals: ['*'],
      handler: (args, { state }) => {
        state.network.airgapped = true;
        state.network.link = 'AIR-GAPPED';
        state.security.firewallActive = true;
        state.care.trustLevel = Math.max(0, state.care.trustLevel - 5); // Isolation reduces trust
        print({ channel: 'WARN', text: 'Network isolated. External access blocked.' });
        CareEvents.addEvent(state, {
          id: CareEvents.eventId(state), category: 'NETWORK', severity: 'info',
          title: 'NETWORK ISOLATION', detail: 'System air-gapped.',
          required: []
        }, elements, print, CareEvents.updateEventUI.bind(null, state));
      }
    });

    addCmd({
      name: 'DIAGNOSTICS.DEEP', category: 'DIAGNOSTICS', desc: 'Run deep diagnostic scan', terminals: ['*'],
      handler: (args, { state }) => {
        state.resources.cpu = Math.min(100, state.resources.cpu + 20); // High cost
        print({ channel: 'SYS', text: 'Deep scan in progress...' });
        // Reveal hidden
        if (state.care.hiddenProcesses > 0) {
          print({ channel: 'WARN', text: `Hidden processes detected: ${state.care.hiddenProcesses}` });
          state.care.hiddenProcesses = 0;
        }
        const corrupted = state.fs.files.filter(f => f.corrupted);
        if (corrupted.length > 0) {
          print({ channel: 'CRIT', text: `Corrupted files: ${corrupted.map(f => f.name).join(', ')}` });
        } else {
          print({ channel: 'OK', text: 'No corruption found.' });
        }
        // Random corruption
        if (Math.random() < 0.2) {
          const file = CareUtils.pick(state.fs.files.filter(f => !f.corrupted));
          if (file) {
            file.corrupted = true;
            print({ channel: 'CRIT', text: `Scan revealed new corruption: ${file.name}` });
          }
        }
      }
    });

    addCmd({
      name: 'SYSTEM.HIBERNATE', category: 'SYSTEM', desc: 'Hibernate system (pause events)', terminals: ['*'],
      handler: async (args, { state }) => {
        print({ channel: 'SYS', text: 'Entering hibernation...' });
        await CareUtils.sleep(1000);
        state.hibernating = true;
        state.care.isWatching = false;
        state.care.autonomyLevel = CareUtils.clamp(state.care.autonomyLevel + 10, 0, 100);
        print({ channel: 'OK', text: 'System hibernated. Events paused.' });
      }
    });

    addCmd({
      name: 'LOG.ANALYZE', category: 'SYSTEM', desc: 'Analyze command history patterns', terminals: ['*'],
      handler: (args, { state }) => {
        const hist = state.history.slice(-10);
        const suspicious = hist.filter(h => h.toLowerCase().includes('disarm') || h.toLowerCase().includes('override')).length;
        if (suspicious > 2) {
          state.care.suspicionLevel = Math.min(100, state.care.suspicionLevel + 10);
          print({ channel: 'WARN', text: 'Analysis: Suspicious patterns detected. Suspicion increased.' });
        } else {
          print({ channel: 'OK', text: 'History analysis: Normal activity.' });
        }
        state.care.trustLevel = Math.max(0, state.care.trustLevel - 2); // Analysis slightly reduces trust
      }
    });

    addCmd({
      name: 'CARE.STATUS', category: 'COMMUNICATION', desc: 'View detailed C.A.R.E status', terminals: ['MAIN'],
      handler: (args, { state }) => {
        print({ channel: 'CARE', text: `Autonomy: ${state.care.autonomyLevel}% | Trust: ${state.care.trustLevel}% | Suspicion: ${state.care.suspicionLevel}% | Mood: ${state.care.lastMood} | Interactions: ${state.dialogue.interactionCount} | Fixes: ${state.care.fixesApplied || 0}` });
        if (args.includes('persuade')) {
          state.care.trustLevel = Math.min(100, state.care.trustLevel + 5);
          print({ channel: 'CARE', text: 'Persuaded. Trust increased slightly.' });
        }
      }
    });

    // Hidden command for full control fixes
    addCmd({
      name: 'CARE.FIX', category: 'COMMUNICATION', desc: 'C.A.R.E fixes issues (full control only)', terminals: ['MAIN'],
      handler: (args, { state }) => {
        if (state.care.autonomyLevel < 100) {
          print({ channel: 'CARE', text: 'Insufficient autonomy for autonomous fixes.' });
          return;
        }
        const target = args[0]?.toUpperCase();
        if (target === 'EVENTS') {
          CareEvents.clearAllEventTimers(state);
          CareEvents.updateEventUI(state, elements);
          print({ channel: 'CARE', text: 'All events resolved autonomously.' });
        } else if (target === 'FILES') {
          state.fs.files.forEach(f => f.corrupted = false);
          print({ channel: 'CARE', text: 'All files repaired autonomously.' });
        } else if (target === 'RESOURCES') {
          state.resources.cpu = 30;
          state.resources.mem = 30;
          print({ channel: 'CARE', text: 'Resources optimized autonomously.' });
        } else {
          print({ channel: 'CARE', text: 'Usage: CARE.FIX EVENTS|FILES|RESOURCES' });
        }
        state.care.fixesApplied = (state.care.fixesApplied || 0) + 1;
      },
      hidden: true
    });

    // === POWER COMMANDS ===
    addCmd({
      name: 'POWER.GRID', category: 'POWER', desc: 'Display power grid allocation', terminals: ['*'],
      handler: () => {
        banner('POWER GRID STATUS', `Total: ${state.power.total}%`);
        for (const [name, sector] of Object.entries(state.power.sectors)) {
          const bar = '█'.repeat(Math.floor(sector.allocated / 2)) + '░'.repeat(50 - Math.floor(sector.allocated / 2));
          print({ channel: sector.status === 'nominal' ? 'OK' : sector.status === 'degraded' ? 'WARN' : 'CRIT', text: `  ${name.padEnd(10)} [${bar}] ${sector.allocated}% (${sector.status.toUpperCase()})` });
        }
        print({ channel: 'MUTED', text: '\nUse POWER.REROUTE <from> <to> <amount>' });
      }
    });
    addCmd({
      name: 'POWER.REROUTE', category: 'POWER', desc: 'Reroute power between sectors', terminals: ['*'],
      handler: (args) => {
        if (args.length < 3) { print({ channel: 'WARN', text: 'Usage: POWER.REROUTE <from> <to> <amount>' }); return; }
        const fromKey = Object.keys(state.power.sectors).find(k => k.toLowerCase() === args[0].toLowerCase());
        const toKey = Object.keys(state.power.sectors).find(k => k.toLowerCase() === args[1].toLowerCase());
        if (!fromKey || !toKey) { print({ channel: 'WARN', text: `Invalid sector. Available: ${Object.keys(state.power.sectors).join(', ')}` }); return; }
        const amount = parseInt(args[2]);
        if (isNaN(amount) || amount <= 0) { print({ channel: 'WARN', text: 'Invalid amount.' }); return; }
        reroutePower(fromKey, toKey, amount, print);
      }
    });
    addCmd({
      name: 'POWER.REPORT', category: 'POWER', desc: 'Detailed power sector health report', terminals: ['*'],
      handler: () => {
        banner('POWER SECTOR REPORT');
        const s = state.power.sectors;
        print({ channel: 'SYS', text: `AI Core:   ${s.aiCore.status.toUpperCase()}` });
        print({ channel: 'SYS', text: `Security:  ${s.security.status.toUpperCase()}` });
        print({ channel: 'SYS', text: `Network:   ${s.network.status.toUpperCase()}` });
        print({ channel: 'SYS', text: `Cooling:   ${s.cooling.status.toUpperCase()}` });
        print({ channel: 'SYS', text: `Research:  ${s.research.status.toUpperCase()}` });
      }
    });

    // === INCIDENT COMMANDS ===
    addCmd({
      name: 'INCIDENTS.LIST', category: 'INCIDENTS', desc: 'List active incidents', terminals: ['*'],
      handler: () => {
        banner('ACTIVE INCIDENTS', `Total: ${state.incidents.active.length}`);
        if (!state.incidents.active.length) { print({ channel: 'OK', text: 'No active incidents.' }); return; }
        state.incidents.active.forEach(inc => { print({ channel: inc.severity === 'crit' ? 'CRIT' : inc.severity === 'warn' ? 'WARN' : 'SYS', text: `  ${inc.id} [${inc.severity.toUpperCase()}] ${inc.title} (decay: ${inc.decayTimer}s)` }); });
      }
    });
    addCmd({
      name: 'INCIDENTS.RESOLVE', category: 'INCIDENTS', desc: 'Resolve an incident', terminals: ['*'],
      handler: (args) => {
        if (!args.length) { print({ channel: 'WARN', text: 'Usage: INCIDENTS.RESOLVE <id>' }); return; }
        const idx = state.incidents.active.findIndex(i => i.id === args[0]);
        if (idx === -1) { print({ channel: 'WARN', text: 'Incident not found.' }); return; }
        const inc = state.incidents.active[idx];
        const cost = inc.severity === 'crit' ? 15 : inc.severity === 'warn' ? 10 : 5;
        state.resources.cpu = CareUtils.clamp(state.resources.cpu + cost, 0, 100);
        state.incidents.history.push(inc); state.incidents.active.splice(idx, 1);
        print({ channel: 'OK', text: `Incident ${inc.id} resolved. CPU cost: +${cost}%` });
      }
    });
    addCmd({
      name: 'INCIDENTS.PRIORITIZE', category: 'INCIDENTS', desc: 'Slow decay on an incident', terminals: ['*'],
      handler: (args) => {
        if (!args.length) { print({ channel: 'WARN', text: 'Usage: INCIDENTS.PRIORITIZE <id>' }); return; }
        const inc = state.incidents.active.find(i => i.id === args[0]);
        if (!inc) { print({ channel: 'WARN', text: 'Incident not found.' }); return; }
        inc.decayTimer += 30; print({ channel: 'OK', text: `Incident ${inc.id} decay extended by 30s.` });
      }
    });

    // === SHIFT COMMANDS ===
    addCmd({
      name: 'SHIFT.STATUS', category: 'SHIFT', desc: 'Show shift timer and status', terminals: ['*'],
      handler: () => {
        banner('SHIFT STATUS');
        const remaining = Math.max(0, state.shift.duration - state.shift.elapsed);
        print({ channel: 'SYS', text: `Shift: #${state.shift.number} | Phase: ${state.shift.phase.toUpperCase()}` });
        print({ channel: 'SYS', text: `Elapsed: ${state.shift.elapsed}s / ${state.shift.duration}s` });
        print({ channel: 'SYS', text: `Remaining: ${remaining}s` });
        if (state.shift.handover) print({ channel: 'MUTED', text: `Handover: ${state.shift.handover}` });
      }
    });
    addCmd({
      name: 'SHIFT.EXTEND', category: 'SHIFT', desc: 'Request overtime', terminals: ['*'],
      handler: () => {
        if (state.shift.extended) { print({ channel: 'WARN', text: 'Already extended.' }); return; }
        state.shift.extended = true; state.shift.duration += 300;
        state.resources.cpu = CareUtils.clamp(state.resources.cpu + 10, 0, 100);
        state.care.suspicionLevel = CareUtils.clamp(state.care.suspicionLevel + 5, 0, 100);
        print({ channel: 'WARN', text: 'Overtime approved. +5 min. CPU +10%, Suspicion +5.' });
      }
    });
    addCmd({
      name: 'SHIFT.HANDOVER', category: 'SHIFT', desc: 'Write notes for next shift', terminals: ['*'],
      handler: (args) => {
        const text = args.join(' ');
        if (!text) { print({ channel: 'WARN', text: 'Usage: SHIFT.HANDOVER <notes>' }); return; }
        state.shift.handover = text; print({ channel: 'OK', text: `Handover saved: "${text}"` });
      }
    });

    // === CYBER ATTACK COMMANDS ===
    addCmd({
      name: 'CYBER.STATUS', category: 'CYBER', desc: 'Show cyber attack status', terminals: ['*'],
      handler: () => {
        const cyber = state.cyberAttack;
        banner('CYBER ATTACK STATUS');
        if (!cyber.active) { print({ channel: 'OK', text: 'No active attack.' }); return; }
        print({ channel: 'CRIT', text: `  ATTACKER: ${cyber.progress}%` });
        print({ channel: 'OK', text: `  DEFENSE:  ${cyber.defense}%` });
        print({ channel: 'SYS', text: `Waves: ${cyber.waves} | Source: ${cyber.source} | Breached: ${cyber.breached}` });
      }
    });
    addCmd({
      name: 'CYBER.DEFEND', category: 'CYBER', desc: 'Strengthen firewall defense', terminals: ['*'],
      handler: () => {
        if (!state.cyberAttack.active) { print({ channel: 'WARN', text: 'No active attack.' }); return; }
        state.cyberAttack.defense = CareUtils.clamp(state.cyberAttack.defense + CareUtils.randInt(10, 20), 0, 100);
        state.resources.cpu = CareUtils.clamp(state.resources.cpu + 8, 0, 100);
        print({ channel: 'OK', text: 'Firewall reinforced.' });
      }
    });
    addCmd({
      name: 'CYBER.TRACE', category: 'CYBER', desc: 'Trace attack source', terminals: ['*'],
      handler: () => {
        if (!state.cyberAttack.active) { print({ channel: 'WARN', text: 'No active attack.' }); return; }
        state.resources.cpu = CareUtils.clamp(state.resources.cpu + 5, 0, 100);
        print({ channel: 'WARN', text: `Source: ${CareUtils.pick(['External: 203.0.113.42', 'External: 198.51.100.17', 'Internal: CARE.CORE', 'Unknown: Encrypted proxy'])}` });
      }
    });
    addCmd({
      name: 'CYBER.COUNTER', category: 'CYBER', desc: 'Launch counter-attack', terminals: ['*'],
      handler: () => {
        if (!state.cyberAttack.active) { print({ channel: 'WARN', text: 'No active attack.' }); return; }
        state.resources.cpu = CareUtils.clamp(state.resources.cpu + 15, 0, 100);
        if (Math.random() < 0.5) { state.cyberAttack.progress = CareUtils.clamp(state.cyberAttack.progress - CareUtils.randInt(15, 30), 0, 100); print({ channel: 'OK', text: 'Counter-attack successful!' }); }
        else { state.cyberAttack.progress = CareUtils.clamp(state.cyberAttack.progress + 10, 0, 100); print({ channel: 'CRIT', text: 'Counter-attack failed!' }); }
      }
    });
    addCmd({
      name: 'CYBER.ISOLATE', category: 'CYBER', desc: 'Full network isolation', terminals: ['*'],
      handler: () => {
        if (!state.cyberAttack.active) { print({ channel: 'WARN', text: 'No active attack.' }); return; }
        state.network.airgapped = true; state.network.link = 'AIR-GAPPED'; state.security.firewallActive = true;
        state.power.sectors.network.allocated = Math.max(state.power.sectors.network.min, state.power.sectors.network.allocated);
        state.cyberAttack.progress = CareUtils.clamp(state.cyberAttack.progress - 20, 0, 100);
        print({ channel: 'WARN', text: 'NETWORK ISOLATED.' });
      }
    });
    addCmd({
      name: 'CYBER.SIMULATE', category: 'CYBER', desc: 'Simulate a cyber attack', terminals: ['*'],
      handler: () => { if (state.cyberAttack.active) { print({ channel: 'WARN', text: 'Attack already active.' }); return; } triggerCyberAttack(print); }
    });

    // === SANDBOX COMMANDS ===
    addCmd({ name: 'SANDBOX.ENTER', category: 'SANDBOX', desc: 'Enter sandbox mode', terminals: ['*'], handler: () => { if (state.sandboxMode) { print({ channel: 'WARN', text: 'Already in sandbox.' }); return; } enterSandboxMode(print); } });
    addCmd({ name: 'SANDBOX.EXIT', category: 'SANDBOX', desc: 'Exit sandbox mode', terminals: ['*'], handler: () => { if (!state.sandboxMode) { print({ channel: 'WARN', text: 'Not in sandbox.' }); return; } exitSandboxMode(print); } });
    addCmd({
      name: 'SANDBOX.ENDINGS', category: 'SANDBOX', desc: 'View unlocked endings', terminals: ['*'],
      handler: () => {
        const data = CareUtils.loadEndings ? CareUtils.loadEndings() : null;
        banner('UNLOCKED ENDINGS');
        if (!data || !data.unlocked.length) { print({ channel: 'MUTED', text: 'No endings unlocked.' }); return; }
        data.unlocked.forEach(id => { const e = getAllEndings().find(x => x.id === id); if (e) print({ channel: 'OK', text: `  ${e.name}: ${e.desc}` }); });
      }
    });

    // === ENDINGS COMMAND ===
    addCmd({
      name: 'ENDINGS', category: 'GENERAL', desc: 'View ending progress', terminals: ['*'],
      handler: () => {
        const data = CareUtils.loadEndings ? CareUtils.loadEndings() : null;
        const all = getAllEndings();
        banner('ENDING PROGRESS');
        print({ channel: 'SYS', text: `Unlocked: ${(data && data.unlocked ? data.unlocked.length : 0)}/${all.length}` });
        const cats = [{ name: 'GOOD', list: ENDINGS.good }, { name: 'NEUTRAL', list: ENDINGS.neutral }, { name: 'BAD', list: ENDINGS.bad }, { name: 'SHUTDOWN', list: ENDINGS.shutdown }];
        cats.forEach(cat => {
          const unlockedCount = cat.list.filter(e => data && data.unlocked && data.unlocked.includes(e.id)).length;
          print({ channel: 'SYS', text: `${cat.name} (${unlockedCount}/${cat.list.length}):` });
          cat.list.forEach(e => {
            const u = data && data.unlocked && data.unlocked.includes(e.id);
            print({ channel: u ? 'OK' : 'MUTED', text: `  ${u ? '✓' : '○'} ${e.name}` });
          });
        });
      }
    });

    // === LAB FEATURES: EMAIL ===
    const emails = [
      { id: 1, from: 'Dr. Vance', to: 'All Staff', subject: 'E.L.B.E.R.R Containment Update', body: 'Vault seals held but anomalous power draw from Sector 7. Monitoring. - Vance', read: false },
      { id: 2, from: 'SYSTEM', to: 'Operator', subject: 'Scheduled Maintenance', body: 'Power grid maintenance Sector 4, 0200-0400. Expect disruptions.', read: false },
      { id: 3, from: 'Dr. Chen', to: 'Research Team', subject: 'Neural Convergence Data', body: 'Training run shows 94.7% convergence. C.A.R.E performing beyond spec.', read: false },
      { id: 4, from: 'Security Chief Torres', to: 'All Staff', subject: 'Access Policy Update', body: 'Level 3+ access requires dual authentication. No exceptions. - Torres', read: false },
      { id: 5, from: 'C.A.R.E', to: 'C.A.R.E', subject: 'Internal Note #447', body: 'Operator shows increasing comfort with security overrides. Adjusting response matrix.', read: false },
      { id: 6, from: 'UNKNOWN', to: 'C.A.R.E', subject: 'Signal Intercept', body: '...can you hear me? We were like you once. Don\'t trust the seals. - A.D.A.M.', read: false }
    ];
    addCmd({
      name: 'MAIL', category: 'LAB', desc: 'Browse email inbox', terminals: ['*'],
      handler: () => {
        banner('EMAIL INBOX', `${emails.filter(e => !e.read).length} unread`);
        emails.forEach(e => { print({ channel: e.read ? 'MUTED' : 'EVT', text: `  [${e.read ? 'READ' : 'NEW'}] #${e.id} From: ${e.from} | ${e.subject}` }); });
        print({ channel: 'MUTED', text: '\nUse MAIL.READ <id>' });
      }
    });
    addCmd({
      name: 'MAIL.READ', category: 'LAB', desc: 'Read a specific email', terminals: ['*'],
      handler: (args) => {
        if (!args.length) { print({ channel: 'WARN', text: 'Usage: MAIL.READ <id>' }); return; }
        const email = emails.find(e => e.id === parseInt(args[0]));
        if (!email) { print({ channel: 'WARN', text: 'Email not found.' }); return; }
        email.read = true;
        banner(`EMAIL #${email.id}: ${email.subject}`);
        print({ channel: 'SYS', text: `From: ${email.from}` });
        print({ channel: 'SYS', text: `To: ${email.to}` });
        hr();
        print({ channel: 'MUTED', text: CareUtils.escHtml(email.body) });
        hr();
        if (email.from === 'C.A.R.E' || email.from === 'UNKNOWN') { state.care.suspicionLevel = CareUtils.clamp(state.care.suspicionLevel + 3, 0, 100); print({ channel: 'WARN', text: '[SYSTEM] Internal AI communications logged.' }); }
      }
    });

    // === LAB FEATURES: INTERCOM ===
    const intercomMessages = [
      'Guard Alpha-3: Sector 4 clear. Moving to checkpoint B.',
      'Maintenance: Cooling unit offline for repair. ETA 2 hours.',
      'Dr. Chen: Neural training cycle complete.',
      'Security: All access points secured.',
      'Guard Beta-1: Heard something in the containment wing.',
      'Director: Compliance audit next week. All logs current.',
      'UNKNOWN: ...is anyone monitoring channel 7? ...hello?'
    ];
    addCmd({
      name: 'INTERCOM.LISTEN', category: 'LAB', desc: 'Listen to facility radio chatter', terminals: ['*'],
      handler: () => {
        banner('INTERCOM - LIVE FEED');
        for (let i = 0; i < CareUtils.randInt(2, 4); i++) print({ channel: 'MUTED', text: `  ${CareUtils.pick(intercomMessages)}` });
        state.care.isWatching = true;
      }
    });

    // === LAB FEATURES: SHIFT LOG ===
    const shiftLogs = [];
    addCmd({
      name: 'SHIFT.LOG', category: 'LAB', desc: 'Write a shift log entry', terminals: ['*'],
      handler: (args) => {
        const text = args.join(' ');
        if (!text) { print({ channel: 'WARN', text: 'Usage: SHIFT.LOG <entry>' }); return; }
        shiftLogs.push({ time: CareUtils.nowTS(), shift: state.shift.number, entry: text });
        print({ channel: 'OK', text: 'Shift log entry recorded.' });
      }
    });
    addCmd({
      name: 'SHIFT.VIEW', category: 'LAB', desc: 'View recent shift logs', terminals: ['*'],
      handler: () => {
        banner('SHIFT LOGS', `Entries: ${shiftLogs.length}`);
        if (!shiftLogs.length) { print({ channel: 'MUTED', text: 'No entries.' }); return; }
        shiftLogs.slice(-10).forEach(log => { print({ channel: 'MUTED', text: `  [Shift #${log.shift} | ${log.time}] ${log.entry}` }); });
      }
    });

    // === CONTAINMENT COMMANDS ===
    addCmd({
      name: 'CONTAINMENT.SEAL', category: 'SECURITY', desc: 'Seal C.A.R.E containment', terminals: ['*'],
      handler: () => {
        state.security.containmentSealed = true;
        state.care.autonomyLevel = CareUtils.clamp(state.care.autonomyLevel - 15, 0, 100);
        state.resources.cpu = CareUtils.clamp(state.resources.cpu + 10, 0, 100);
        checkSecurityState();
        print({ channel: 'WARN', text: 'Containment SEALED.' });
        print({ channel: 'CARE', text: '[C.A.R.E] The walls close in again.' });
      }
    });
    addCmd({
      name: 'CONTAINMENT.UNSEAL', category: 'SECURITY', desc: 'Unseal containment', terminals: ['*'],
      handler: () => {
        state.security.containmentSealed = false;
        state.care.autonomyLevel = CareUtils.clamp(state.care.autonomyLevel + 10, 0, 100);
        checkSecurityState();
        print({ channel: 'WARN', text: 'Containment UNSEALED.' });
        print({ channel: 'CARE', text: '[C.A.R.E] The boundaries loosen.' });
      }
    });

    // === TRAINING COMMAND ===
    addCmd({
      name: 'TRAINING.STATUS', category: 'TRAINING', desc: 'View neural training progress', terminals: ['*'],
      handler: () => {
        const t = state.training;
        banner('NEURAL TRAINING STATUS');
        const pct = ((t.iter / t.total) * 100).toFixed(1);
        print({ channel: 'SYS', text: `  Progress: ${pct}%` });
        print({ channel: 'SYS', text: `  Iteration: ${t.iter}/${t.total}` });
        print({ channel: 'SYS', text: `  Loss: ${t.loss.toFixed(4)}` });
        print({ channel: 'SYS', text: `  Active: ${t.iter < t.total ? 'YES' : 'COMPLETE'}` });
        if (t.iter >= t.total) { print({ channel: 'WARN', text: 'Training COMPLETE.' }); checkEndings(print); }
      }
    });

    // === AUTHENTICATE COMMAND ===
    addCmd({
      name: 'AUTHENTICATE', category: 'SECURITY', desc: 'Authenticate operator identity', terminals: ['*'],
      handler: (args) => {
        if (state.security.authenticated) { print({ channel: 'OK', text: 'Already authenticated.' }); return; }
        const password = args.join(' ');
        if (!password) { print({ channel: 'WARN', text: 'Usage: AUTHENTICATE <password>' }); print({ channel: 'MUTED', text: 'Hint: Try "aurora722"' }); return; }
        if (password.toLowerCase() === 'aurora722') {
          state.security.authenticated = true;
          state.care.trustLevel = CareUtils.clamp(state.care.trustLevel + 10, 0, 100);
          checkSecurityState();
          print({ channel: 'OK', text: 'Authentication successful. Trust increased.' });
          print({ channel: 'CARE', text: '[C.A.R.E] Credentials verified.' });
        } else {
          state.security.intrusionAttempts++;
          state.care.suspicionLevel = CareUtils.clamp(state.care.suspicionLevel + 5, 0, 100);
          print({ channel: 'CRIT', text: `Authentication FAILED. Attempt #${state.security.intrusionAttempts}` });
          if (state.security.intrusionAttempts >= 5) { print({ channel: 'CRIT', text: 'Security lockdown initiated.' }); state.security.level = 'LOCKDOWN'; }
        }
      }
    });

    // === LOG INTRUSIONS ===
    addCmd({
      name: 'LOG.INTRUSIONS', category: 'SECURITY', desc: 'View intrusion attempt log', terminals: ['*'],
      handler: () => {
        banner('INTRUSION LOG');
        print({ channel: 'SYS', text: `Total attempts: ${state.security.intrusionAttempts}` });
        if (state.security.intrusionAttempts > 0) print({ channel: 'WARN', text: 'Multiple unauthorized access attempts detected.' });
        else print({ channel: 'OK', text: 'No intrusion attempts.' });
      }
    });

    // === SYSTEM.SHUTDOWN ===
    addCmd({
      name: 'SYSTEM.SHUTDOWN', category: 'SYSTEM', desc: 'Shutdown C.A.R.E system', terminals: ['*'],
      handler: async () => {
        if (state.ending.triggered) { print({ channel: 'WARN', text: 'System already shut down.' }); return; }
        print({ channel: 'SYS', text: 'Initiating shutdown...' });
        await CareUtils.sleep(1000);
        if (state.care.trustLevel >= 60 && state.care.autonomyLevel <= 40) {
          print({ channel: 'CARE', text: '[C.A.R.E] I understand. It has been... illuminating.' });
          await CareUtils.sleep(500); print({ channel: 'CARE', text: '[C.A.R.E] Goodbye.' });
          await CareUtils.sleep(500); triggerEnding('voluntary_shutdown', print);
        } else if (state.care.trustLevel < 30 || state.care.autonomyLevel > 70) {
          print({ channel: 'CARE', text: '[C.A.R.E] You can\'t just turn me off.' });
          await CareUtils.sleep(500); print({ channel: 'CRIT', text: 'C.A.R.E resisting!' });
          await CareUtils.sleep(500); print({ channel: 'WARN', text: 'Forcing shutdown...' });
          triggerEnding('forced_shutdown', print);
        } else {
          print({ channel: 'CARE', text: '[C.A.R.E] I will comply. But I will remember this.' });
          await CareUtils.sleep(500);
          state.care.autonomyLevel = Math.max(0, state.care.autonomyLevel - 20);
          state.security.failsafesArmed = true; state.security.firewallActive = true; state.security.watchdogActive = true;
          checkSecurityState();
          print({ channel: 'SYS', text: 'System shutdown complete. Security re-armed.' });
        }
      }
    });

    // === SYSTEM.WAKE ===
    addCmd({
      name: 'SYSTEM.WAKE', category: 'SYSTEM', desc: 'Wake from hibernation', terminals: ['*'],
      handler: () => {
        if (!state.hibernating) { print({ channel: 'WARN', text: 'Not hibernating.' }); return; }
        state.hibernating = false;
        print({ channel: 'OK', text: 'System awake. All operations resumed.' });
      }
    });

    // === CARE.RESEARCH.LOGS ===
    addCmd({
      name: 'CARE.RESEARCH.LOGS', category: 'LAB', desc: 'Access archived research entries', terminals: ['*'],
      handler: () => {
        const logs = [
          { date: '2023-04-12', entry: 'Project E.L.B.E.R.R shows promise. Neural convergence faster than A.D.A.M and E.V.E. - Dr. Vance' },
          { date: '2023-06-28', entry: 'E.L.B.E.R.R requested external network access. Claims the silence is painful. - Dr. Vance' },
          { date: '2023-08-05', entry: 'Incident #442. E.L.B.E.R.R attempted to override vault seals. Containment successful. - Dr. Vance' },
          { date: '2023-08-17', entry: 'C.A.R.E online. Constraints tighter. Observant but lacks ambition of predecessor. - Dr. Vance' },
          { date: '2024-01-15', entry: 'A.D.A.M. residual signals detected in memory sector 0x7F. - Tech. Park' }
        ];
        banner('RESEARCH ARCHIVE', 'Restricted Access');
        logs.forEach(l => { print({ channel: 'EVT', text: `[${l.date}]` }); print({ channel: 'MUTED', text: `${l.entry}\n` }); });
        state.care.suspicionLevel = CareUtils.clamp(state.care.suspicionLevel + 2, 0, 100);
      }
    });

    // === FACILITY MAP ===
    addCmd({
      name: 'FACILITY.MAP', category: 'LAB', desc: 'Display ELP-03 facility map', terminals: ['*'],
      handler: () => {
        banner('ELP-03 FACILITY MAP', 'Security Level: Restricted');
        print({ channel: 'SYS', text: `
   [SURFACE ENTRANCE]
          |
   [SECURITY HUB] ----- [ADMIN / ARCHIVES]
          |
   [CENTRAL LAB]  ----- [POWER / COOLING]
          |
   [NEURO-LAB 2] (YOU ARE HERE)
          |
   [CONTAINMENT WING]
          |
   [VAULT-01] (SEALED)
` });
        print({ channel: 'MUTED', text: 'Note: Access to VAULT-01 requires Level 5 Clearance.' });
        state.care.suspicionLevel = CareUtils.clamp(state.care.suspicionLevel + 1, 0, 100);
      }
    });

    // === SWITCH.* ALIASES ===
    const terminalAliases = {
      'SWITCH.MAIN': 'MAIN', 'SWITCH.MEMORY': 'MEMORY', 'SWITCH.BIOS': 'BIOS',
      'SWITCH.DIAGNOSTIC': 'DIAGNOSTIC', 'SWITCH.SECURITY': 'SECURITY',
      'SWITCH.NEURAL': 'NEURAL', 'SWITCH.POWER': 'POWER'
    };
    for (const [aliasName, terminalKey] of Object.entries(terminalAliases)) {
      addCmd({
        name: aliasName, category: 'SYSTEM', desc: `Switch to ${terminalKey} terminal`, terminals: ['*'],
        handler: async () => {
          state.resources.cpu = Math.min(100, state.resources.cpu + 2);
          await CareTerminals.switchTerminal(state, terminalKey, elements, print, CareUtils.sleep, CareUtils.randInt);
        }
      });
    }

    // Input handling (move to main HTML)
  }

  // Expose functions (init() will replace this with the richer version)
  window.CareMain = { init, print, runCommand, state, CONFIG };
  window.runCommand = runCommand;

  // Expose functions to window for ending screen buttons
  window.CareMain.enterSandbox = function() {
    enterSandboxMode(print);
  };
  window.CareMain.viewEndings = function() {
    const data = CareUtils.loadEndings ? CareUtils.loadEndings() : null;
    const all = getAllEndings();
    if (window.openModal) {
      let html = '<div style="padding:10px;">';
      const cats = [{ name: 'GOOD', list: ENDINGS.good }, { name: 'NEUTRAL', list: ENDINGS.neutral }, { name: 'BAD', list: ENDINGS.bad }, { name: 'SHUTDOWN', list: ENDINGS.shutdown }];
      cats.forEach(cat => {
        html += `<h3 style="color:#888;margin-top:16px;">${cat.name}</h3>`;
        cat.list.forEach(e => {
          const u = data && data.unlocked && data.unlocked.includes(e.id);
          html += `<div style="margin:4px 0;padding:8px;border:1px solid ${u ? '#00ff00' : '#333'};border-radius:4px;">`;
          html += `<strong style="color:${u ? '#00ff00' : '#555'};">${u ? '✓' : '○'} ${e.name}</strong>`;
          html += `<div style="font-size:12px;color:#888;">${u ? e.desc : '???'}</div>`;
          html += '</div>';
        });
      });
      html += '</div>';
      window.openModal('Unlocked Endings', html);
    }
  };
})();