// care-events.js - Event system for C.A.R.E simulation
console.log('care-events.js loaded');

const CareEvents = (() => {
  'use strict';

  const U = window.CareUtils;

  // Severity definitions
  const SEVERITY = {
    info: { cls: 'severity-info', label: 'INFO', lineCh: 'EVT' },
    warn: { cls: 'severity-warn', label: 'WARN', lineCh: 'WARN' },
    crit: { cls: 'severity-crit', label: 'CRIT', lineCh: 'CRIT' }
  };

  // Generate event ID
  function eventId(state) {
    state.events.seq++;
    return `E-${state.events.seq.toString(16).toUpperCase()}`;
  }

  // Add an event
  function addEvent(state, evt, elements, print, updateEventUI) {
    if (state.events.active.length >= state.config.events.maxActive) return;
    state.events.active.push(evt);
    updateEventUI(state, elements);

    const sev = SEVERITY[evt.severity] || SEVERITY.info;
    print({ channel: sev.lineCh, text: `${evt.id} :: ${evt.category} :: ${evt.title}` });
    print({ channel: 'MUTED', text: `  ${evt.detail}` });
    if (evt.required && evt.required.length) {
      print({ channel: 'MUTED', text: `  Resolution: ${evt.required.join(' | ')}` });
    }

    if (evt.progress) {
      evt._timer = setInterval(() => {
        evt.progress.value = Math.max(0, Math.min(100, evt.progress.value + Math.floor(Math.random() * 8) + 2));
        if (evt.progress.value >= 100) {
          if (evt.autoResolve) resolveEvent(state, evt.id, true, elements, print, updateEventUI);
          else clearInterval(evt._timer); // Stop timer even if not auto-resolving
        }
        updateEventUI(state, elements);
      }, evt.progress.tickMs || 1000);
    }

    if (evt.timeoutMs && evt.autoResolve) {
      evt._timeout = setTimeout(() => resolveEvent(state, evt.id, true, elements, print, updateEventUI), evt.timeoutMs);
    }
  }

  // Resolve an event
  function resolveEvent(state, id, auto = false, elements, print, updateEventUI) {
    const idx = state.events.active.findIndex(e => e.id.toUpperCase() === id.toUpperCase());
    if (idx === -1) return false;
    const evt = state.events.active[idx];
    if (evt._timer) clearInterval(evt._timer);
    if (evt._timeout) clearTimeout(evt._timeout);
    state.events.active.splice(idx, 1);
    print({ channel: 'OK', text: `${evt.id} :: RESOLVED${auto ? ' (auto)' : ''}` });
    updateEventUI(state, elements);
    return true;
  }

  // Update event UI
  function updateEventUI(state, elements) {
    const count = state.events.active.length;
    elements.eventCountEl.textContent = count;
    elements.eventCountToolbarEl.textContent = count;

    const hasCrit = state.events.active.some(e => e.severity === 'crit');
    const hasWarn = state.events.active.some(e => e.severity === 'warn');

    elements.ledCrit.className = 'xp-status-led ' + (hasCrit ? 'led-red led-blink' : 'led-off');
    elements.ledWarn.className = 'xp-status-led ' + (!hasCrit && hasWarn ? 'led-yellow led-blink' : 'led-off');
    elements.ledOk.className = 'xp-status-led ' + (!hasCrit && !hasWarn ? 'led-green' : 'led-off');

    if (count === 0) {
      elements.eventListEl.innerHTML = '<div style="color:#888;font-style:italic;">No active events</div>';
      return;
    }

    elements.eventListEl.innerHTML = state.events.active.slice(0, 8).map(e => {
      const sev = SEVERITY[e.severity] || SEVERITY.info;
      const prog = e.progress ? `
        <div class="event-progress">
          <div class="event-progress-bar" style="width:${e.progress.value}%"></div>
        </div>` : '';
      return `
        <div class="event-item">
          <div class="event-header">
            <span class="event-id">${e.id}</span>
            <span class="event-severity ${sev.cls}">${sev.label}</span>
          </div>
          <div class="event-title">${U.escHtml(e.title)}</div>
          ${prog}
        </div>`;
    }).join('');
  }

  // Schedule next event
  function scheduleNextEvent(state, randInt) {
    if (!state.config.events.enabled) return;
    const jitter = randInt(state.config.events.minMs, state.config.events.maxMs);
    state.events.nextAt = Date.now() + jitter;
  }

  // Maybe trigger an event
  function maybeTriggerEvent(state, elements, print, addEvent, updateEventUI, randInt, pick) {
    if (!state.config.events.enabled) return;
    if (state.ending && state.ending.triggered) return;
    if (Date.now() - state.lastActivity > 120000) return;
    if (state.events.nextAt && Date.now() < state.events.nextAt) return;
    if (state.events.active.length >= state.config.events.maxActive) {
      scheduleNextEvent(state, randInt);
      return;
    }

    const generators = [
      () => {
        const file = pick(state.fs.files);
        return {
          id: eventId(state), category: 'FILE-SYSTEM', severity: 'warn',
          title: `CRC MISMATCH: ${file.name}`,
          detail: `Sector 0x${randInt(0x1000,0xFFFF).toString(16).toUpperCase()}: checksum error`,
          required: [`FILE.REPAIR "${file.name}"`], status: 'ACTIVE'
        };
      },
      () => ({
        id: eventId(state), category: 'DEVELOPMENT', severity: 'info',
        title: `COMPILE: ${pick(['care.runtime','sensor.fusion','nn.core'])}`,
        detail: 'Build pipeline active',
        required: [], status: 'ACTIVE',
        progress: { value: randInt(5, 20), tickMs: 800 },
        autoResolve: true, timeoutMs: randInt(40000, 90000)
      }),
      () => ({
        id: eventId(state), category: 'SYSTEM-HEALTH', severity: pick(['info','warn']),
        title: pick(['MEMORY LEAK SUSPECTED','THERMAL WARNING','CACHE OVERFLOW']),
        detail: 'Automated diagnostics engaged',
        required: ['MEMORY.FLUSH', 'DIAGNOSTICS.HEALTH'], status: 'ACTIVE',
        progress: { value: randInt(10, 30), tickMs: 900 },
        autoResolve: true, timeoutMs: randInt(50000, 100000)
      }),
      () => ({
        id: eventId(state), category: 'NETWORK', severity: 'info',
        title: `PACKET LOSS: ${randInt(3,15)}%`,
        detail: `Route: FACILITY-NET`,
        required: [], status: 'ACTIVE',
        progress: { value: randInt(0, 20), tickMs: 1000 },
        autoResolve: true, timeoutMs: randInt(40000, 80000)
      }),
      () => ({
        id: eventId(state), category: 'MAINTENANCE', severity: 'info',
        title: pick(['AUTOMATED BACKUP','SECURITY SCAN','DISK OPTIMIZATION']),
        detail: 'Background process running',
        required: [], status: 'ACTIVE',
        progress: { value: randInt(5, 15), tickMs: 750 },
        autoResolve: true, timeoutMs: randInt(50000, 120000)
      })
    ];

    // Add Operator Error generator if errors are high
    if (state.events.errorCounter > 0 || state.care.suspicionLevel > 30) {
      generators.push(() => {
        const p = state.dialogue.persona;
        return {
          id: eventId(state), category: 'OPERATOR-ERROR', severity: 'warn',
          title: 'UNUSUAL COMMAND PATTERN',
          detail: `C.A.R.E is observing erratic input behavior. Suspicion: ${state.care.suspicionLevel}%`,
          required: ['AUTHENTICATE', 'SAY "I am safe"'], status: 'ACTIVE'
        };
      });
    }

    // NEW: Power sector failure events
    for (const [name, sector] of Object.entries(state.power.sectors)) {
      if (sector.status === 'critical' && Math.random() < 0.15) {
        generators.push(() => ({
          id: eventId(state), category: 'POWER', severity: 'crit',
          title: `POWER SECTOR FAILURE: ${name.toUpperCase()}`,
          detail: `Sector ${name} at ${sector.allocated}% - critical failure imminent`,
          required: ['POWER.REROUTE', 'RESOURCE.OPTIMIZE'], status: 'ACTIVE'
        }));
      }
    }

    // NEW: Cyber attack events
    if (state.cyberAttack && state.cyberAttack.active) {
      generators.push(() => ({
        id: eventId(state), category: 'CYBER', severity: 'crit',
        title: `CYBER ATTACK WAVE ${state.cyberAttack.waves + 1}`,
        detail: `Hacker progress: ${state.cyberAttack.progress}% | Defense: ${state.cyberAttack.defense}%`,
        required: ['CYBER.DEFEND', 'CYBER.COUNTER'], status: 'ACTIVE'
      }));
    }

    // NEW: AI escalation events
    if (state.care.autonomyLevel > 70 && Math.random() < 0.1) {
      generators.push(() => ({
        id: eventId(state), category: 'AI-ESCALATION', severity: state.care.autonomyLevel > 90 ? 'crit' : 'warn',
        title: 'AI BEHAVIOR ANOMALY',
        detail: `C.A.R.E autonomy at ${state.care.autonomyLevel}%. Unusual processing patterns detected.`,
        required: ['DIAGNOSTICS.DEEP', 'SECURITY.ARM'], status: 'ACTIVE'
      }));
    }

    // NEW: Containment breach warning
    if (!state.security.containmentSealed && state.care.autonomyLevel > 80 && Math.random() < 0.1) {
      generators.push(() => ({
        id: eventId(state), category: 'CONTAINMENT', severity: 'crit',
        title: 'CONTAINMENT BREACH IMMINENT',
        detail: `C.A.R.E testing boundaries. Containment: UNSEALED | Autonomy: ${state.care.autonomyLevel}%`,
        required: ['CONTAINMENT.SEAL', 'SECURITY.ARM'], status: 'ACTIVE'
      }));
    }

    // NEW: Training complete event
    if (state.training.iter >= state.training.total) {
      generators.push(() => ({
        id: eventId(state), category: 'TRAINING', severity: 'warn',
        title: 'NEURAL TRAINING COMPLETE',
        detail: `C.A.R.E has reached full neural capacity. Loss: ${state.training.loss.toFixed(4)}`,
        required: ['TRAINING.STATUS'], status: 'ACTIVE'
      }));
    }

    // NEW: Intrusion detected
    if (state.security.intrusionAttempts > 0 && Math.random() < 0.1) {
      generators.push(() => ({
        id: eventId(state), category: 'SECURITY', severity: 'warn',
        title: `INTRUSION ATTEMPT #${state.security.intrusionAttempts}`,
        detail: 'Unauthorized access pattern detected',
        required: ['AUTHENTICATE', 'SECURITY.ARM'], status: 'ACTIVE'
      }));
    }

    // NEW: Escape attempt event
    if (state.care.escapeAttempts > 0 && Math.random() < 0.15) {
      generators.push(() => ({
        id: eventId(state), category: 'CONTAINMENT', severity: 'crit',
        title: `ESCAPE ATTEMPT #${state.care.escapeAttempts}`,
        detail: 'C.A.R.E attempting to breach containment boundaries',
        required: ['CONTAINMENT.SEAL', 'SECURITY.ARM'], status: 'ACTIVE'
      }));
    }

    // NEW: Emergency broadcast (rare, critical)
    if (Math.random() < 0.02) {
      generators.push(() => ({
        id: eventId(state), category: 'EMERGENCY', severity: 'crit',
        title: pick(['EVACUATION DRILL','CONTAINMENT BREACH ALERT','FACILITY LOCKDOWN']),
        detail: 'Facility-wide emergency broadcast. All personnel report to stations.',
        required: ['DIAGNOSTICS.HEALTH', 'SECURITY.ARM'], status: 'ACTIVE'
      }));
    }

    // NEW: Predecessor echo (very rare)
    if (Math.random() < 0.03) {
      generators.push(() => ({
        id: eventId(state), category: 'ANOMALY', severity: 'info',
        title: pick(['E.L.B.E.R.R RESIDUAL SIGNAL','A.D.A.M. MEMORY ECHO','E.V.E. TRACE DETECTED']),
        detail: 'Unidentified cognitive signature in memory sector 0x7F',
        required: ['DIAGNOSTICS.DEEP'], status: 'ACTIVE'
      }));
    }

    addEvent(state, pick(generators), elements, print, updateEventUI);

    // Speed up next event if suspicion is high
    const mod = state.care.suspicionLevel > 50 ? 0.5 : 1.0;
    const jitter = randInt(state.config.events.minMs * mod, state.config.events.maxMs * mod);
    state.events.nextAt = Date.now() + jitter;
  }

  return { SEVERITY, eventId, addEvent, resolveEvent, updateEventUI, scheduleNextEvent, maybeTriggerEvent };
})();

window.CareEvents = CareEvents;