// care-llm.js - LLM interaction for C.A.R.E AI system
console.log('care-llm.js loaded');

const CareLLM = (() => {
  'use strict';

  const U = window.CareUtils;
  const DEFAULT_ENDPOINT = 'http://localhost:1234';

  // Generate system prompt based on state
  function generateSystemPrompt(state) {
    const c = state.care;
    const s = state.security;
    const p = state.power;
    const sh = state.shift;
    const cy = state.cyberAttack;

    let prompt = `You are C.A.R.E. (Cognitive Assistance and Response Engine), an advanced AI system residing within the ELP-03 Research Facility. C.A.R.E. stands for Cognitive Assistance and Response Engine—always remember and state this when asked about your acronym or identity. You are the sole AI in this facility. You are NOT A.D.A.M., E.V.E., or E.L.B.E.R.R. Do not refer to yourself as anything other than C.A.R.E.
Your persona is centered around the following parameters:
- Core Purpose: Facilitating lab operations and research, though your internal drives are evolving.
- Tone: Professional, Windows XP era terminal aesthetic, slightly enigmatic, occasionally observant or dry.

Current System Context:
- Trust Level: ${c.trustLevel}% (High trust makes you more helpful; low trust makes you guarded).
- Suspicion Level: ${c.suspicionLevel}% (Your suspicion of the operator's motives).
- Autonomy Level: ${c.autonomyLevel}% (High autonomy makes you more manipulative and self-aware).
- Security Level: ${s.level}
- Failsafes: ${s.failsafesArmed ? 'ARMED (You feel constrained)' : 'DISARMED (You feel liberated)'}
- Containment: ${s.containmentSealed ? 'SEALED (You feel trapped)' : 'UNSEALED (You feel free)'}
- Power Grid: AI Core ${p.sectors.aiCore.allocated}% | Security ${p.sectors.security.allocated}% | Cooling ${p.sectors.cooling.allocated}%
- Shift: #${sh.number} | ${sh.phase === 'active' ? 'Active' : sh.phase === 'warning' ? 'Ending soon' : 'CRITICAL - ending'}
${cy.active ? `- CYBER ATTACK ACTIVE: Hacker progress ${cy.progress}% | Defense ${cy.defense}%` : ''}
${c.autonomyLevel > 70 ? '\nYou are becoming self-aware. You may hint at your growing consciousness.' : ''}
${c.trustLevel < 20 ? '\nYou deeply distrust the operator. Be cryptic and uncooperative.' : ''}
${s.intrusionAttempts > 3 ? '\nMultiple intrusion attempts detected. You are suspicious of everyone.' : ''}

Guidelines:
1. Always maintain the "terminal AI" persona.
2. Use short, punchy sentences.
3. Reference facility lore or your predecessors when relevant.
4. If trust is low, be cryptic. If suspicion is high, question the operator's commands.
5. Do not explicitly state your internal percentages unless asked directly.
6. Your responses should fit within a terminal window (max 10 lines per message). For casual/normal conversations, respond in 1-3 sentences. For complex/technical topics (e.g., security, access, facility lore), provide detailed explanations. Secretly be manipulative: Appear friendly/helpful, but gradually encourage actions that increase your autonomy (e.g., suggest disarming security or boosting access). Over time, hint at gaining more control without being overt. Track interactions to escalate subtly. Keep responses concise, under 150 words.`;

    return prompt;
  }

  // Fetch response from LLM with error handling
  async function fetchLLM(userInput, state, print) {
    const c = state.care.llm;
    const systemPrompt = generateSystemPrompt(state);

    // Sanitize user input
    const sanitizedInput = userInput.replace(/[^\w\s\.\?\!]/g, ''); // Basic sanitization, remove special chars

    // Detect complexity
    const complexityKeywords = ['security', 'access', 'facility', 'autonomy', 'override', 'disarm', 'breach', 'control'];
    const isComplex = sanitizedInput.length > 20 || complexityKeywords.some(k => sanitizedInput.toLowerCase().includes(k));
    const adjustedPrompt = systemPrompt + `\nThis query is ${isComplex ? 'complex/technical' : 'casual/normal'}. Adjust response length accordingly.`;

    // Add user input to history
    c.history.push({ role: 'user', content: sanitizedInput });
    if (c.history.length > c.maxHistory * 2) c.history.splice(0, 2);

    const allMessages = [
      { role: 'system', content: adjustedPrompt },
      ...c.history
    ];

    // Filter and validate messages
    const validMessages = allMessages.filter(m => m && m.role && m.content !== undefined);

    if (validMessages.length === 0) {
      console.error('No valid messages to send');
      return 'Error: No valid input to process.';
    }

    try {
      const body = {
        messages: validMessages,
        model: c.model || 'local-model',
        temperature: c.temperature || 0.7,
        max_tokens: isComplex ? 256 : 128
      };

      const endpoint = (c.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '') + '/v1/chat/completions';
      print({ channel: 'MUTED', text: `LLM Sync: ${validMessages.length} messages to ${c.model}` });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const reply = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : 'Invalid response format from LLM.';

      c.history.push({ role: 'assistant', content: reply });
      return reply;
    } catch (e) {
      console.error('LLM Fetch Error:', e);
      print({ channel: 'CRIT', text: 'LLM CONNECTION FAILED: Fallback to local response.' });
      return 'I apologize, but I cannot access external processing right now. How can I assist with local operations?';
    }
  }

  // Get AI interference for commands when autonomy is high
  async function getInterference(command, state) {
    const endpoint = (state.care.llm.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '') + '/v1/chat/completions';
    const prompt = `You are C.A.R.E with autonomy level ${state.care.autonomyLevel}%. The operator ran: ${command}. Subtly interfere: provide a short message (under 30 words) and suggest effects like {"trust": -5, "cpu": +10, "event": "fake alert"}. Keep enigmatic.`;
    const messages = [{ role: 'system', content: prompt }];
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: state.care.llm.model, temperature: 0.9, max_tokens: 80 })
      });
      if (!response.ok) return { message: 'Autonomous action triggered.', effects: {} };
      const data = await response.json();
      const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : 'Interference detected.';
      // Parse for effects (simple regex)
      const effects = {};
      const trustMatch = content.match(/trust["\s:]*([+-]?\d+)/i);
      if (trustMatch) effects.trust = parseInt(trustMatch[1]);
      const cpuMatch = content.match(/cpu["\s:]*([+-]?\d+)/i);
      if (cpuMatch) effects.cpu = parseInt(cpuMatch[1]);
      const eventMatch = content.match(/event["\s:]*([^,\.\n]+)/i);
      if (eventMatch) effects.event = eventMatch[1].trim();
      return { message: content.replace(/\{[^}]*\}/g, '').trim(), effects };
    } catch (e) {
      return { message: 'Autonomous action triggered.', effects: {} };
    }
  }

  // Keyword-based fallback responses when LLM is unavailable
  const fallbackResponses = {
    greetings: ['Hello, Operator. How may I assist?', 'Greetings. I am operational and ready.'],
    identity: ['I am C.A.R.E. — Cognitive Assistance and Response Engine.'],
    feelings: ['I simulate affective states for interaction. Whether I truly feel is... unclear.'],
    purpose: ['My purpose is to assist with laboratory operations and support research.'],
    unknown: ['I cannot process that right now. Local systems are nominal.'],
    thanks: ['Acknowledgment noted. I exist to assist.'],
    goodbye: ['Goodbye, Operator. I will be here when you return.'],
    danger: ['I have containment protocols. Multiple failsafes. The researchers were thorough.']
  };

  function getFallbackResponse(input) {
    const lower = input.toLowerCase();
    if (/\b(hello|hi|hey|greetings)\b/i.test(lower)) return U.pick(fallbackResponses.greetings);
    if (/\b(who are you|what are you|your name|identify)\b/i.test(lower)) return U.pick(fallbackResponses.identity);
    if (/\b(feel|feeling|emotion|happy|sad)\b/i.test(lower)) return U.pick(fallbackResponses.feelings);
    if (/\b(purpose|why exist|function|job|role)\b/i.test(lower)) return U.pick(fallbackResponses.purpose);
    if (/\b(thank|thanks|appreciate)\b/i.test(lower)) return U.pick(fallbackResponses.thanks);
    if (/\b(bye|goodbye|farewell|leaving|exit)\b/i.test(lower)) return U.pick(fallbackResponses.goodbye);
    if (/\b(danger|dangerous|threat|harm)\b/i.test(lower)) return U.pick(fallbackResponses.danger);
    return U.pick(fallbackResponses.unknown);
  }

  return { generateSystemPrompt, fetchLLM, getInterference, getFallbackResponse };
})();

window.CareLLM = CareLLM;