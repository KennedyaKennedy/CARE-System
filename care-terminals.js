// care-terminals.js - Terminal management for C.A.R.E system
console.log('care-terminals.js loaded');

const CareTerminals = (() => {
  'use strict';

  // Terminal definitions
  const TERMINALS = {
    MAIN: { name: 'C.A.R.E MAIN CONSOLE', prompt: 'C:\\CARE\\MAIN>' },
    MEMORY: { name: 'C.A.R.E MEMORY TERMINAL', prompt: 'C:\\CARE\\MEM>' },
    BIOS: { name: 'C.A.R.E BIOS', prompt: 'C:\\CARE\\BIOS>' },
    DIAGNOSTIC: { name: 'DIAGNOSTIC TERMINAL', prompt: 'C:\\CARE\\DIAG>' },
    SECURITY: { name: 'SECURITY CONSOLE', prompt: 'C:\\CARE\\SEC>' },
    NEURAL: { name: 'NEURAL NETWORK VISUALIZER', prompt: 'C:\\CARE\\NNV>' },
    POWER: { name: 'POWER MANAGEMENT', prompt: 'C:\\CARE\\PWR>' }
  };

  // Switch to a specific terminal
  function setTerminal(state, key, elements) {
    if (!TERMINALS[key]) return;
    state.terminal = key;
    const t = TERMINALS[key];
    if (elements.terminalNameEl) elements.terminalNameEl.textContent = key;
    if (elements.terminalHeaderEl) elements.terminalHeaderEl.textContent = `[ ${t.name} ]`;
    if (elements.promptEl) elements.promptEl.textContent = t.prompt;
    if (elements.statusTerminalEl) elements.statusTerminalEl.textContent = key;

    // Update toolbar buttons
    document.querySelectorAll('.xp-toolbar-btn[data-terminal]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.terminal === key);
    });
  }

  // Asynchronously switch terminal with feedback
  async function switchTerminal(state, key, elements, print, sleep, randInt) {
    if (key === state.terminal) {
      print({ channel: 'MUTED', text: `Already in ${key}.` });
      return;
    }
    if (!TERMINALS[key]) {
      print({ channel: 'WARN', text: `Unknown terminal: ${key}` });
      return;
    }
    print({ channel: 'SYS', text: `SWITCH: Loading ${key}...` });
    await sleep(randInt(200, 400));
    setTerminal(state, key, elements);
    print({ channel: 'OK', text: `Terminal switched to ${TERMINALS[key].name}` });
  }

  return { TERMINALS, setTerminal, switchTerminal };
})();

window.CareTerminals = CareTerminals;