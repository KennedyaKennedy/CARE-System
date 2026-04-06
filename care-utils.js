// care-utils.js - Utility functions for C.A.R.E system
console.log('care-utils.js loaded');

const CareUtils = (() => {
  'use strict';

  // Pad number to 2 digits
  const pad2 = n => String(n).padStart(2, '0');

  // Current timestamp
  const nowTS = () => {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  };

  // Sleep promise
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Random integer
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

  // Pick random from array (returns undefined for empty arrays)
  const pick = arr => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

  // Clamp value
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // Escape HTML
  const escHtml = s => { if (s == null) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); };

  // Format bytes
  function formatBytes(b) {
    if (b <= 0) return '0 B';
    const u = ['B','KB','MB','GB'];
    let i = 0;
    while (b >= 1024 && i < u.length-1) { b /= 1024; i++; }
    return `${b.toFixed(i?1:0)} ${u[i]}`;
  }

  // Tokenize input
  function tokenize(input) {
    const s = input.trim();
    if (!s) return [];
    const re = /\s*(["'])(.*?)\1|\S+/g;
    const out = [];
    let m;
    while ((m = re.exec(s))) {
      out.push(m[2] !== undefined ? m[2] : m[0].trim());
    }
    return out;
  }

  function saveState(state) {
    try {
      const serializable = JSON.parse(JSON.stringify(state));
      if (serializable.care && serializable.care.llm) {
        serializable.care.llm.history = [];
      }
      // Remove non-serializable properties from events
      if (serializable.events && serializable.events.active) {
        serializable.events.active.forEach(evt => {
          delete evt._timer;
          delete evt._timeout;
        });
      }
      // Remove functions and non-serializable objects
      if (serializable.processes) {
        serializable.processes = serializable.processes.filter(p => p && typeof p === 'object');
      }
      localStorage.setItem('care_state', JSON.stringify(serializable));
      return true;
    } catch (e) { return false; }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('care_state');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function resetState() {
    localStorage.removeItem('care_state');
  }

  function saveEnding(endingId, stats) {
    try {
      const raw = localStorage.getItem('care_endings');
      const data = raw ? JSON.parse(raw) : { unlocked: [], sessions: [], totalSessions: 0 };
      if (!data.unlocked.includes(endingId)) data.unlocked.push(endingId);
      data.sessions.push({ ending: endingId, timestamp: new Date().toISOString(), stats });
      data.totalSessions++;
      localStorage.setItem('care_endings', JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  function loadEndings() {
    try {
      const raw = localStorage.getItem('care_endings');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function getEndingProgress(totalEndings) {
    const data = loadEndings();
    if (!data) return { unlocked: 0, total: totalEndings || 24, list: [] };
    return { unlocked: data.unlocked.length, total: totalEndings || 24, list: data.unlocked };
  }

  return { pad2, nowTS, sleep, randInt, pick, clamp, escHtml, formatBytes, tokenize, saveState, loadState, resetState, saveEnding, loadEndings, getEndingProgress };
})();

window.CareUtils = CareUtils;