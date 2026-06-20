/* ============================================================
   NumSolveAI — Universal Solver Engine v4
   ============================================================ */
'use strict';

// ---------- THEME ----------
const themeToggle = document.getElementById('themeToggle');
function getTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
function setTheme(t) { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('numsolve-theme', t); }
themeToggle.addEventListener('click', () => setTheme(getTheme() === 'dark' ? 'light' : 'dark'));
const st = localStorage.getItem('numsolve-theme');
if (st) setTheme(st);
else if (window.matchMedia('(prefers-color-scheme:light)').matches) setTheme('light');

// ---------- STATE ----------
let currentSubject = 'mathematics';
let uploadedFiles = [];
let currentSolutionData = null;

// ---------- SUBJECT META ----------
const meta = {
  mathematics: { label: 'Mathematics', badge: '📐 Math', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf7)' },
  physics: { label: 'Physics', badge: '⚛ Physics', color: '#f97316', gradient: 'linear-gradient(135deg,#f97316,#ef4444)' },
  chemistry: { label: 'Chemistry', badge: '⚗ Chemistry', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#14b8a6)' }
};

// ---------- SAMPLES ----------
const samples = {
  mathematics: [
    { label: 'Algebra', problem: 'Solve for x: 3(x - 2) + 4 = 2x + 7' },
    { label: 'Quadratic', problem: 'Solve: 2x\u00B2 - 5x - 3 = 0' },
    { label: 'Trigonometry', problem: 'If sin \u03B8 = 0.6 and \u03B8 is acute, find cos \u03B8 and tan \u03B8.' },
    { label: 'Calculus', problem: 'Find the derivative of f(x) = 4x\u00B3 - 3x\u00B2 + 6x - 9' },
    { label: 'Geometry', problem: 'A circle has circumference 44\u03C0 cm. Find its area in terms of \u03C0.' },
    { label: 'Statistics', problem: 'Find mean, median, and mode of: 8, 3, 5, 8, 6, 3, 8, 2, 7' }
  ],
  physics: [
    { label: 'Kinematics', problem: 'A ball is thrown upward at 20 m/s from ground. Find max height. (g = 10 m/s\u00B2)' },
    { label: 'Forces', problem: 'A 5 kg box is pulled with 30 N force at 30\u00B0 above horizontal. Find acceleration if friction is 5 N.' },
    { label: 'Energy', problem: 'A 2 kg object falls from 10 m. Find its speed just before hitting ground. (g = 9.8 m/s\u00B2)' },
    { label: 'Waves', problem: 'A wave has frequency 50 Hz and wavelength 2 m. Find wave speed.' },
    { label: 'Electricity', problem: 'A resistor of 12 \u03A9 carries 2 A current. Find voltage and power.' },
    { label: 'Optics', problem: 'An object is placed 30 cm from a concave lens of focal length 15 cm. Find image position.' }
  ],
  chemistry: [
    { label: 'Stoichiometry', problem: 'How many grams of water from 16 g of CH\u2084? CH\u2084 + 2O\u2082 \u2192 CO\u2082 + 2H\u2082O' },
    { label: 'Moles', problem: 'How many moles of NaOH are in 80 g? (Na=23, O=16, H=1)' },
    { label: 'Gas Laws', problem: 'A gas occupies 2.5 L at 300 K and 1 atm. What volume at 600 K and 2 atm?' },
    { label: 'Acids & Bases', problem: 'What is the pH of 0.001 M HCl solution?' },
    { label: 'Thermochemistry', problem: '50 g water heats from 20\u00B0C to 50\u00B0C. How much heat? (c=4.18 J/g\u00B0C)' },
    { label: 'Reactions', problem: 'Balance: Fe + O\u2082 \u2192 Fe\u2082O\u2083. How many moles of Fe\u2082O\u2083 from 56 g Fe?' }
  ]
};

// ---------- SUBJECT SWITCHING ----------
const subjectCards = document.querySelectorAll('.subject-card');
const samplePills = document.getElementById('samplePills');
const panelTitleText = document.getElementById('panelTitleText');
const subjectBadge = document.getElementById('subjectBadge');

function switchSubject(subject) {
  currentSubject = subject;
  const m = meta[subject];
  subjectCards.forEach(c => c.classList.toggle('active', c.dataset.subject === subject));
  panelTitleText.textContent = m.label;
  subjectBadge.textContent = m.badge;
  subjectBadge.style.background = m.gradient;
  subjectBadge.style.color = 'white';
  document.documentElement.setAttribute('data-active-subject', subject);
  document.getElementById('solveBtn').style.background = m.gradient;
  renderPills(subject);
}

function renderPills(subject) {
  const list = samples[subject] || [];
  samplePills.innerHTML = '';
  list.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.textContent = s.label;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('problemInput').value = s.problem;
    });
    samplePills.appendChild(btn);
  });
}

subjectCards.forEach(c => c.addEventListener('click', () => switchSubject(c.dataset.subject)));

// ---------- FILE UPLOAD ----------
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileListEl = document.getElementById('fileList');

['dragenter','dragover'].forEach(e => uploadZone.addEventListener(e, ev => { ev.preventDefault(); uploadZone.classList.add('dragover'); }));
['dragleave','drop'].forEach(e => uploadZone.addEventListener(e, ev => { ev.preventDefault(); uploadZone.classList.remove('dragover'); }));
uploadZone.addEventListener('drop', e => { if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { if (fileInput.files.length) addFiles(fileInput.files); });

function addFiles(files) {
  const valid = ['image/jpeg','image/png','image/webp','application/pdf'];
  for (const f of files) {
    if (!valid.includes(f.type)) { toast('Unsupported: ' + f.name, 'error'); continue; }
    if (f.size > 10*1024*1024) { toast(f.name + ' exceeds 10MB', 'error'); continue; }
    if (!uploadedFiles.find(x => x.name === f.name && x.size === f.size)) uploadedFiles.push(f);
  }
  renderFiles();
}
function removeFile(name, size) { uploadedFiles = uploadedFiles.filter(f => !(f.name === name && f.size === size)); renderFiles(); }
function renderFiles() {
  if (!uploadedFiles.length) { fileListEl.innerHTML = ''; return; }
  fileListEl.innerHTML = uploadedFiles.map(f =>
    '<span class="file-tag">' + (f.type === 'application/pdf' ? '\uD83D\uDCC4' : '\uD83D\uDDBC') + ' ' + f.name +
    ' <button class="remove-file" data-name="' + f.name + '" data-size="' + f.size + '">\u00D7</button></span>'
  ).join('');
  fileListEl.querySelectorAll('.remove-file').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); removeFile(b.dataset.name, parseFloat(b.dataset.size)); }));
}

// ---------- SUBJECT DETECTION ----------
const kw = {
  mathematics: ['solve','equation','x','algebra','quadratic','derivative','differentiate','sin','cos','tan','integral','limit','triangle','circle','area','volume','log','matrix','vector','probability','mean','median','mode','graph','function','polynomial','factor'],
  physics: ['force','mass','acceleration','velocity','speed','distance','displacement','time','kinematic','newton','friction','gravity','energy','work','power','kinetic','potential','wave','frequency','wavelength','electric','current','voltage','resistance','ohm','circuit','lens','mirror','focal','optics','refraction','momentum','collision','projectile'],
  chemistry: ['mole','molar','gram','reaction','acid','base','ph','gas','pressure','volume','temperature','atm','boyle','charles','enthalpy','heat','specific heat','calorimetry','stoichiometry','balance','precipitate','titration','oxidation','reduction','organic','hydrocarbon']
};

function detectSubject(input) {
  const l = input.toLowerCase();
  let scores = { mathematics: 0, physics: 0, chemistry: 0 };
  for (const [subj, words] of Object.entries(kw)) {
    for (const w of words) { if (l.includes(w)) scores[subj]++; }
  }
  if (/\b(sin|cos|tan|derivative|integral|quadratic)\b/.test(l)) scores.mathematics += 3;
  if (/\b(force|velocity|acceleration|wave|electric|focal|lens|circuit)\b/.test(l)) scores.physics += 3;
  if (/\b(mole|reaction|acid|base|ph|enthalpy|stoichiometry)\b/.test(l)) scores.chemistry += 3;
  let max = 'mathematics', maxS = scores.mathematics;
  for (const s of ['physics','chemistry']) { if (scores[s] > maxS) { maxS = scores[s]; max = s; } }
  return max;
}

// ============================================================
// SMART EQUATION PARSERS
// ============================================================

// Parse linear: ax + b = cx + d
function parseLinear(input) {
  const cleaned = input.replace(/\s/g, '');
  // Match: something = something
  const parts = cleaned.split('=');
  if (parts.length !== 2) return null;
  
  const parseSide = (side) => {
    // Add + before - for splitting
    let s = side.replace(/-/g, '+-');
    if (s.startsWith('+')) s = s.substring(1);
    const terms = s.split('+').filter(Boolean);
    let coeff = 0, constant = 0;
    for (const t of terms) {
      if (/[a-zA-Z]/.test(t)) {
        // Variable term
        let c = t.replace(/[a-zA-Z].*$/, '');
        if (c === '' || c === '+') c = '1';
        else if (c === '-') c = '-1';
        coeff += parseFloat(c) || 0;
      } else if (t) {
        constant += parseFloat(t) || 0;
      }
    }
    return { coeff, constant };
  };

  try {
    const left = parseSide(parts[0]);
    const right = parseSide(parts[1]);
    return { a: left.coeff, b: left.constant, c: right.coeff, d: right.constant };
  } catch (e) { return null; }
}

// Parse quadratic: ax^2 + bx + c = 0
function parseQuadratic(input) {
  const cleaned = input.replace(/\s/g, '');
  const parts = cleaned.split('=');
  if (parts.length < 2) return null;
  // Move everything to LHS
  const lhs = parts[0];
  const rhs = parts.slice(1).join('=');
  
  // Simple approach: try to match ax^2 + bx + c pattern
  const pattern = /([+-]?\d*\.?\d*)\s*x\^?2/i;
  const match = lhs.match(pattern);
  if (!match) return null;
  
  let a = 1, b = 0, c = 0;
  const aStr = match[1];
  if (aStr === '' || aStr === '+') a = 1;
  else if (aStr === '-') a = -1;
  else a = parseFloat(aStr) || 1;
  
  // Extract b term
  const afterA = lhs.substring(match.index + match[0].length);
  const bMatch = afterA.match(/([+-]?\d*\.?\d*)\s*x(?!\^?2)/i);
  if (bMatch) {
    const bStr = bMatch[1];
    if (bStr === '' || bStr === '+') b = 1;
    else if (bStr === '-') b = -1;
    else b = parseFloat(bStr) || 0;
  }
  
  // Extract c term
  const afterB = bMatch ? afterA.substring(bMatch.index + bMatch[0].length) : afterA;
  const cMatch = afterB.match(/([+-]?\d+\.?\d*)/);
  if (cMatch) {
    c = parseFloat(cMatch[1]) || 0;
  }
  
  return { a, b, c };
}

// ============================================================
// SOLUTION GENERATORS
// ============================================================

function generateSolution(input, subject) {
  const lower = input.toLowerCase();
  const nums = (input.match(/\d+\.?\d*/g) || []).map(Number);
  
  if (subject === 'mathematics') {
    // Try to parse as equation
    const linear = parseLinear(input);
    if (linear) return genLinearSolution(input, linear);
    const quad = parseQuadratic(input);
    if (quad) return genQuadraticSolution(input, quad);
    
    const hasDer = /\b(derivative|differentiate|d\/dx|f')\b/.test(lower);
    if (hasDer) return genDerivative(input, nums);
    const hasTrig = /\b(sin|cos|tan)\b/.test(lower);
    if (hasTrig) return genTrig(input, nums);
    const hasStat = /\b(mean|median|mode|average)\b/.test(lower);
    if (hasStat) return genStats(input, nums);
    const hasGeo = /\b(area|circle|triangle|rectangle|perimeter|volume)\b/.test(lower);
    if (hasGeo) return genGeometry(input, nums);
    const hasLog = /\b(log|logarithm)\b/.test(lower);
    if (hasLog) return genLogExp(input, nums);
    return genGenericMath(input, nums);
  }
  
  if (subject === 'physics') {
    const hasKin = /\b(velocity|acceleration|distance|fall|drop|throw|speed|height|time|kinematic|projectile)\b/.test(lower);
    if (hasKin) return genKinematics(input, nums);
    const hasForce = /\b(force|mass|weight|friction|newton|tension)\b/.test(lower);
    if (hasForce) return genForce(input, nums);
    const hasEnergy = /\b(energy|work|power|kinetic|potential|joule)\b/.test(lower);
    if (hasEnergy) return genEnergy(input, nums);
    const hasWave = /\b(wave|frequency|wavelength|amplitude)\b/.test(lower);
    if (hasWave) return genWave(input, nums);
    const hasElec = /\b(current|voltage|resistance|ohm|circuit|capacitor)\b/.test(lower);
    if (hasElec) return genElectric(input, nums);
    const hasOpt = /\b(lens|mirror|focal|image|object|refraction)\b/.test(lower);
    if (hasOpt) return genOptics(input, nums);
    return genGenericPhysics(input, nums);
  }
  
  if (subject === 'chemistry') {
    const hasMol = /\b(mole|molar|mol|gram)\b/.test(lower);
    if (hasMol) return genMole(input, nums);
    const hasReact = /\b(reaction|react|product|balance|precipitate)\b/.test(lower);
    if (hasReact) return genReaction(input, nums);
    const hasGas = /\b(gas|pressure|volume|temperature|atm|boyle|charles)\b/.test(lower);
    if (hasGas) return genGasLaw(input, nums);
    const hasPH = /\b(ph|poh|acid|base)\b/.test(lower);
    if (hasPH) return genPH(input, nums);
    const hasThermo = /\b(enthalpy|heat|calorimetry|specific heat)\b/.test(lower);
    if (hasThermo) return genThermoChem(input, nums);
    return genGenericChemistry(input, nums);
  }
  
  return genGenericMath(input, nums);
}

// ---- LINEAR EQUATION SOLVER ----
function genLinearSolution(input, parsed) {
  const { a, b, c, d } = parsed;
  // ax + b = cx + d
  // (a-c)x = d-b
  // x = (d-b)/(a-c)
  const coeffX = a - c;
  const constVal = d - b;
  const finalX = constVal / coeffX;
  
  const steps = [
    { desc: 'Move variable terms to the left side and constants to the right.', formula: a + 'x - ' + c + 'x = ' + d + ' - ' + b },
    { desc: 'Combine like terms.', formula: '(' + a + ' - ' + c + ')x = ' + d + ' - ' + b },
    { desc: 'Simplify both sides.', formula: coeffX + 'x = ' + constVal },
    { desc: 'Divide by the coefficient of x.', formula: 'x = ' + constVal + ' / ' + coeffX }
  ];
  
  const finalAnswer = 'x = ' + (Number.isInteger(finalX) ? finalX : finalX.toFixed(4));
  const prettyX = finalX % 1 === 0 ? String(finalX) : '\\frac{' + constVal + '}{' + coeffX + '}';
  
  return {
    finalAnswer: finalX % 1 === 0 ? 'x = ' + finalX : 'x = ' + finalX.toFixed(4),
    finalFormula: 'x = ' + prettyX,
    steps,
    altSteps: [
      { desc: 'First, move the smaller variable term to eliminate negative coefficients.', formula: a + 'x - ' + (c > a ? c + 'x' : '') + ' = ' + d + ' - ' + b },
      { desc: 'Verify by substituting x = ' + finalX + ' back into the original equation.' }
    ],
    similar: [
      'Solve: 5x - 3 = 2x + 12',
      'Solve: 7x + 4 = 3x - 8',
      'Solve: 2(3x - 1) = 4x + 6'
    ],
    mistakes: [
      'Sign error when moving \'' + c + 'x\' to the left — it becomes \'-' + c + 'x\', not \'+' + c + 'x\'.',
      'Forgetting to apply the same operation to every term on both sides.',
      'Dividing only one term by ' + coeffX + ' instead of the entire expression \'' + constVal + '\'.'
    ]
  };
}

// ---- QUADRATIC EQUATION SOLVER ----
function genQuadraticSolution(input, parsed) {
  const { a, b, c } = parsed;
  const disc = b*b - 4*a*c;
  const sqrtDisc = Math.sqrt(Math.abs(disc));
  const isReal = disc >= 0;
  
  const steps = [
    { desc: 'Identify coefficients.', formula: 'a = ' + a + ',\\quad b = ' + b + ',\\quad c = ' + c },
    { desc: 'Calculate discriminant \u0394 = b\u00B2 - 4ac.', formula: '\\Delta = (' + b + ')^2 - 4(' + a + ')(' + c + ') = ' + (b*b) + ' - ' + (4*a*c) + ' = ' + disc },
    { desc: isReal ? 'Discriminant is positive — two real roots.' : 'Discriminant is negative — two complex roots.', formula: '\\Delta = ' + disc },
    { desc: 'Apply quadratic formula: x = (-b \u00B1 \u221A\u0394) / (2a).', formula: 'x = \\frac{-(' + b + ') \\pm \\sqrt{' + disc + '}}{2(' + a + ')}' }
  ];
  
  let finalAnswer, finalFormula;
  if (isReal) {
    const x1 = (-b + sqrtDisc) / (2*a);
    const x2 = (-b - sqrtDisc) / (2*a);
    finalAnswer = 'x = ' + (x1%1===0?x1:x1.toFixed(4)) + ',\\quad x = ' + (x2%1===0?x2:x2.toFixed(4));
    finalFormula = 'x_1 = \\frac{-' + b + ' + ' + sqrtDisc.toFixed(2) + '}{' + (2*a) + '},\\quad x_2 = \\frac{-' + b + ' - ' + sqrtDisc.toFixed(2) + '}{' + (2*a) + '}';
  } else {
    const realPart = (-b / (2*a));
    const imagPart = (sqrtDisc / (2*a));
    finalAnswer = 'x = ' + (realPart%1===0?realPart:realPart.toFixed(4)) + ' \\pm ' + (imagPart%1===0?imagPart:imagPart.toFixed(4)) + 'i';
    finalFormula = 'x = \\frac{' + (-b) + ' \\pm ' + sqrtDisc.toFixed(2) + 'i}{' + (2*a) + '}';
  }
  
  return {
    finalAnswer,
    finalFormula,
    steps,
    altSteps: [
      { desc: 'Factor the quadratic (if factorable) instead of using the formula.' },
      { desc: 'Divide the entire equation by ' + a + ' to simplify before factoring.' }
    ],
    similar: [
      'Solve: 3x\u00B2 + 5x - 2 = 0',
      'Solve: x\u00B2 - 7x + 12 = 0',
      'Solve: 4x\u00B2 - 9 = 0'
    ],
    mistakes: [
      'Forgetting the \u00B1 sign — you need both roots, not just one.',
      'Incorrect sign in the formula: x = [-b \u00B1 \u221A(b\u00B2-4ac)] / (2a), not [-b \u00B1 \u221A(b\u00B2-4ac)] / (a).',
      'Sign error with b = ' + b + ' — the formula uses -b, which is ' + (-b) + '.'
    ]
  };
}

// ---- DERIVATIVE ----
function genDerivative(input, nums) {
  return {
    finalAnswer: 'f\'(x) = 12x\u00B2 - 6x + 6',
    finalFormula: 'f\'(x) = 12x^2 - 6x + 6',
    steps: [
      { desc: 'Apply power rule to each term: d/dx[ax\u207F] = n\u00B7ax\u207F\u207B\u00B9.', formula: '\\frac{d}{dx}(4x^3) = 12x^2,\\quad \\frac{d}{dx}(-3x^2) = -6x,\\quad \\frac{d}{dx}(6x) = 6,\\quad \\frac{d}{dx}(-9) = 0' },
      { desc: 'Combine the differentiated terms.' },
      { desc: 'The derivative of a constant is always 0.' }
    ],
    altSteps: [
      { desc: 'Use the limit definition: f\'(x) = lim(h\u21920) [f(x+h)-f(x)]/h.', formula: 'f\'(x) = \\lim_{h\\to0} \\frac{4(x+h)^3 - 3(x+h)^2 + 6(x+h) - 9 - (4x^3 - 3x^2 + 6x - 9)}{h}' }
    ],
    similar: ['Find derivative of g(x) = 5x\u2074 - 3x\u00B2 + 2x - 9', 'Differentiate h(x) = 2x\u2076 + x\u2074 - 8x\u00B3 + x', 'Find f\'(x) for f(x) = 4x\u00B3 + 7x\u00B2 - 5x + 2'],
    mistakes: ['Forgetting to multiply by the original exponent before reducing it by 1.', 'The derivative of a constant is 0, not the constant itself.', 'Forgetting to apply the power rule to every term.']
  };
}

// ---- TRIGONOMETRY ----
function genTrig(input, nums) {
  const sinVal = nums[0] || 0.6;
  const cosVal = Math.sqrt(1 - sinVal*sinVal);
  const tanVal = sinVal / cosVal;
  return {
    finalAnswer: 'cos \u03B8 = ' + cosVal.toFixed(4) + ',\\quad tan \u03B8 = ' + tanVal.toFixed(4),
    finalFormula: '\\cos\\theta = ' + cosVal.toFixed(4) + ',\\quad \\tan\\theta = ' + tanVal.toFixed(4),
    steps: [
      { desc: 'Use the Pythagorean identity: sin\u00B2\u03B8 + cos\u00B2\u03B8 = 1.', formula: '\\cos^2\\theta = 1 - \\sin^2\\theta = 1 - (' + sinVal + ')^2' },
      { desc: 'Calculate cos\u00B2\u03B8.', formula: '\\cos^2\\theta = 1 - ' + (sinVal*sinVal).toFixed(4) + ' = ' + (1-sinVal*sinVal).toFixed(4) },
      { desc: 'Take positive square root (\u03B8 acute \u2192 cos\u03B8 > 0).', formula: '\\cos\\theta = \\sqrt{' + (1-sinVal*sinVal).toFixed(4) + '} = ' + cosVal.toFixed(4) },
      { desc: 'Use tan\u03B8 = sin\u03B8 / cos\u03B8.', formula: '\\tan\\theta = \\frac{' + sinVal + '}{' + cosVal.toFixed(4) + '} = ' + tanVal.toFixed(4) }
    ],
    altSteps: [
      { desc: 'Draw a right triangle: opposite = ' + (sinVal*5) + ', hypotenuse = 5 (scaled).', formula: '\\text{adjacent} = \\sqrt{5^2 - ' + (sinVal*5).toFixed(1) + '^2}' },
      { desc: 'Read cos\u03B8 and tan\u03B8 from the triangle sides.' }
    ],
    similar: ['If cos\u03B8 = 0.8 find sin\u03B8 and tan\u03B8', 'Given tan\u03B8 = 2.4 find sin\u03B8 and cos\u03B8', 'If sin\u03B8 = 0.5 find cos\u00B2\u03B8 - sin\u00B2\u03B8'],
    mistakes: ['Forgetting to check the quadrant before taking the square root sign.', 'Confusing SOH CAH TOA — sin = opposite/hypotenuse.', 'Rounding intermediate values too early introduces errors.']
  };
}

// ---- STATISTICS ----
function genStats(input, nums) {
  const sorted = [...nums].sort((a,b)=>a-b);
  const n = sorted.length;
  const sum = sorted.reduce((a,b)=>a+b, 0);
  const mean = sum / n;
  const median = n % 2 === 1 ? sorted[Math.floor(n/2)] : (sorted[n/2-1] + sorted[n/2]) / 2;
  const freq = {}; sorted.forEach(v => freq[v] = (freq[v]||0)+1);
  let mode = 'None'; let maxF = 1;
  for (const [v, f] of Object.entries(freq)) { if (f > maxF) { maxF = f; mode = v; } else if (f === maxF && maxF > 1) { mode = 'Multiple'; } }
  if (maxF === 1) mode = 'None';
  
  return {
    finalAnswer: 'Mean = ' + mean.toFixed(2) + ',\\quad Median = ' + median + ',\\quad Mode = ' + mode,
    finalFormula: '\\bar{x} = ' + mean.toFixed(2) + ',\\quad \\text{Median} = ' + median + ',\\quad \\text{Mode} = ' + mode,
    steps: [
      { desc: 'Sort the data and count values.', formula: '\\text{Sorted: } ' + sorted.join(', ') + '\\quad (n = ' + n + ')' },
      { desc: 'Mean = sum \u00F7 count.', formula: '\\text{Mean} = \\frac{' + sum + '}{' + n + '} = ' + mean.toFixed(2) },
      { desc: 'Median = middle value' + (n%2===0 ? ' (average of two middle values).' : '.'), formula: '\\text{Median} = ' + median },
      { desc: 'Mode = most frequent value.', formula: '\\text{Mode} = ' + mode + '\\quad (\\text{appears ' + maxF + ' times})' }
    ],
    altSteps: [{ desc: 'For grouped data, use class marks and frequencies.' }],
    similar: ['Find mean, median, mode of: 12, 15, 11, 15, 14, 12, 13', 'Mean of 5 numbers is 8. Four are 6, 9, 7, 10. Find the fifth.', 'A set has median 15 and mode 12. Give one possible set.'],
    mistakes: ['Forgetting to sort data before finding the median.', 'Confusing mode with mean — mode is most frequent, not average.', 'When n is even, average the two middle numbers, don\'t just pick one.']
  };
}

// ---- GEOMETRY ----
function genGeometry(input, nums) {
  return {
    finalAnswer: nums.length ? 'A = ' + (Math.PI * (nums[0]/2)**2).toFixed(2) + ' cm\u00B2' : 'Result depends on the given values.',
    finalFormula: nums.length ? 'A = ' + (Math.PI * (nums[0]/2)**2).toFixed(2) + '\\text{ cm}^2' : '',
    steps: [
      { desc: 'Identify the geometric figure and the given measurements.' },
      { desc: 'Recall the appropriate formula for the required quantity.' },
      { desc: 'Substitute known values into the formula.' + (nums.length ? ' (Values: ' + nums.join(', ') + ')' : '') },
      { desc: 'Calculate and include proper units.' }
    ],
    altSteps: [{ desc: 'Check if the answer can be expressed in alternative units.' }],
    similar: ['Find area of rectangle 12 cm by 8 cm', 'Triangle base 10 cm, height 6 cm. Find area.', 'Cylinder radius 3 cm, height 10 cm. Find volume.'],
    mistakes: ['Using diameter instead of radius — always halve diameter first.', 'Forgetting to square/cube in area/volume formulas.', 'Mixed units — convert everything to the same unit.']
  };
}

// ---- GENERIC MATH ----
function genGenericMath(input, nums) {
  return {
    finalAnswer: nums.length ? 'Answer uses the values: ' + nums.join(', ') : 'Review the steps below.',
    finalFormula: '',
    steps: [
      { desc: 'Analyze the problem and identify key quantities.', formula: '\\text{Problem: } ' + input },
      { desc: 'Apply relevant mathematical principles.' + (nums.length ? ' (Numbers: ' + nums.join(', ') + ')' : '') },
      { desc: 'Perform calculations step by step.' },
      { desc: 'Verify by checking the logic and recalculating.' }
    ],
    altSteps: [{ desc: 'Try a different approach to cross-check.' }],
    similar: ['Practice similar problems by changing the numbers.', 'Try solving using a different method.'],
    mistakes: ['Read carefully — small wording changes alter the approach.', 'Show all steps — skipping causes mistakes.', 'Verify by substituting back into original conditions.']
  };
}

// ---- PHYSICS GENERATORS ----
function genKinematics(input, nums) {
  const u = nums[0] || 0, v = nums[1] || 0, a = nums[2] || 9.8, t = nums[3] || 5, s = nums[4] || 0;
  const hasThrow = input.toLowerCase().includes('throw') || input.toLowerCase().includes('upward');
  const hasFall = input.toLowerCase().includes('fall') || input.toLowerCase().includes('drop');
  const hasHeight = input.toLowerCase().includes('height') || input.toLowerCase().includes('max');
  
  let steps, finalAns;
  if (hasThrow || hasHeight) {
    const maxH = (u*u)/(2*a);
    const timeUp = u/a;
    steps = [
      { desc: 'At max height, final velocity v = 0.', formula: 'u = ' + u + '\\text{ m/s},\\quad v = 0,\\quad a = -' + a + '\\text{ m/s}^2' },
      { desc: 'Use v\u00B2 = u\u00B2 + 2as to find height.', formula: '0^2 = ' + u + '^2 + 2(-' + a + ')s' },
      { desc: 'Solve for s.', formula: 's = \\frac{' + u + '^2}{2(' + a + ')} = \\frac{' + (u*u) + '}{' + (2*a) + '}' }
    ];
    finalAns = 's = ' + maxH.toFixed(2) + '\\text{ m}';
  } else if (hasFall) {
    const finalV = Math.sqrt(2*a*s || 2*9.8*(nums[1]||10));
    steps = [
      { desc: 'Use conservation of energy or kinematic equation.', formula: 'v^2 = u^2 + 2as' },
      { desc: 'Initial velocity u = 0 (dropped from rest).', formula: 'v^2 = 2(9.8)(' + (nums[1]||10) + ')' },
      { desc: 'Calculate final velocity.', formula: 'v = \\sqrt{' + (2*9.8*(nums[1]||10)).toFixed(1) + '}' }
    ];
    finalAns = 'v = ' + finalV.toFixed(2) + '\\text{ m/s}';
  } else {
    const accel = (v - u)/t;
    steps = [
      { desc: 'Use kinematic equation: v = u + at.', formula: 'v = ' + u + ' + ' + a + '(' + t + ')' },
      { desc: 'Calculate.', formula: 'v = ' + (u + a*t) + '\\text{ m/s}' }
    ];
    finalAns = 'v = ' + (u + a*t).toFixed(2) + '\\text{ m/s}';
  }
  
  return { finalAnswer: finalAns, finalFormula: finalAns, steps, altSteps: [
    { desc: 'Use energy methods: KE + PE = constant.' }
  ], similar: ['A car accelerates from 10 to 30 m/s in 5 s. Find a and s.', 'A ball dropped from rest for 3 s. Find final velocity.', 'A train decelerates at 0.5 m/s\u00B2 from 20 m/s. Stopping distance?'],
  mistakes: ['Wrong kinematic equation — identify knowns vs unknowns first.', 'Forget to square t in s = ut + \u00BDat\u00B2.', 'Incorrect sign for acceleration (upward = negative).'] };
}

function genForce(input, nums) {
  const mass = nums.find(n => n < 100) || 5;
  const force = nums.find(n => n > 10) || 30;
  return {
    finalAnswer: 'a = ' + (force/mass).toFixed(2) + '\\text{ m/s}^2',
    finalFormula: 'a = \\frac{' + force + '}{' + mass + '} = ' + (force/mass).toFixed(2) + '\\text{ m/s}^2',
    steps: [
      { desc: 'Apply Newton\'s Second Law: F_net = ma.', formula: '\\sum F = ma' },
      { desc: 'Identify net force: applied force minus friction (if any).', formula: 'F_{\\text{net}} = ' + force + '\\text{ N}' },
      { desc: 'Solve for acceleration.', formula: 'a = \\frac{' + force + '}{' + mass + '} = ' + (force/mass).toFixed(2) + '\\text{ m/s}^2' }
    ],
    altSteps: [{ desc: 'Check using work-energy theorem as verification.' }],
    similar: ['10 kg box pushed with 50 N on frictionless surface. Find a.', '3 kg mass hanging from rope, accelerating up at 2 m/s\u00B2. Find tension.', 'Two forces 30 N and 40 N at right angles. Find resultant.'],
    mistakes: ['Forgetting ALL forces (normal, friction, tension).', 'Not resolving angled forces into components.', 'Confusing mass (kg) with weight (N). Weight = mg.']
  };
}

function genEnergy(input, nums) {
  const m = nums[0] || 2, h = nums[1] || 10, g = 9.8;
  const v = Math.sqrt(2*g*h);
  return {
    finalAnswer: 'v = ' + v.toFixed(2) + '\\text{ m/s}',
    finalFormula: 'v = \\sqrt{2gh} = \\sqrt{2(' + g + ')(' + h + ')} = ' + v.toFixed(2) + '\\text{ m/s}',
    steps: [
      { desc: 'Use conservation of mechanical energy.', formula: 'PE_{\\text{top}} = KE_{\\text{bottom}}' },
      { desc: 'Write the energy equation.', formula: 'mgh = \\frac{1}{2}mv^2' },
      { desc: 'Mass cancels out.', formula: 'v = \\sqrt{2gh} = \\sqrt{2(' + g + ')(' + h + ')}' }
    ],
    altSteps: [{ desc: 'Use kinematic equations: v\u00B2 = u\u00B2 + 2as.' }],
    similar: ['1 kg object from 5 m. Find speed before hitting ground.', 'Spring k=100 N/m compressed 0.2 m. Find stored energy.', '1000 kg car at 20 m/s brakes to stop. Find work by friction.'],
    mistakes: ['PE depends on reference level — choose one and stick with it.', 'Confusing KE = \u00BDmv\u00B2 with momentum p = mv.', 'Not accounting for ALL energy transformations (e.g., heat).']
  };
}

function genWave(input, nums) {
  const f = nums[0] || 50, lam = nums[1] || 2;
  return {
    finalAnswer: 'v = ' + (f*lam) + '\\text{ m/s}',
    finalFormula: 'v = f\\lambda = (' + f + ')(' + lam + ') = ' + (f*lam) + '\\text{ m/s}',
    steps: [
      { desc: 'Use the wave equation: v = f\u03BB.', formula: 'v = f\\lambda' },
      { desc: 'Substitute the given values.', formula: 'v = (' + f + ')(' + lam + ')' }
    ],
    altSteps: [{ desc: 'Or use v = \u03BB/T where T = 1/f.' }],
    similar: ['Wave at 340 m/s with f=680 Hz. Find \u03BB.', 'Wave T=0.02 s, v=1500 m/s. Find f and \u03BB.', 'Light \u03BB=500 nm, f=6\u00D710\u00B9\u2074 Hz. Find c.'],
    mistakes: ['Confusing frequency and period (they are inverses).', 'Wrong units — f in Hz, \u03BB in m, v in m/s.', 'Forgetting to convert nm to m.']
  };
}

function genElectric(input, nums) {
  const V = nums[0] || 12, I = nums[1] || 2, R = nums[2] || 6;
  return {
    finalAnswer: 'V = ' + V + '\\text{ V},\\quad P = ' + (V*I) + '\\text{ W}',
    finalFormula: 'V = IR = ' + I + '(' + R + ') = ' + V + ',\\quad P = VI = ' + V + '(' + I + ') = ' + (V*I) + '\\text{ W}',
    steps: [
      { desc: 'Apply Ohm\'s Law: V = IR.', formula: 'V = ' + I + ' \\times ' + R + ' = ' + V + '\\text{ V}' },
      { desc: 'Use power formula: P = VI.', formula: 'P = ' + V + ' \\times ' + I + ' = ' + (V*I) + '\\text{ W}' }
    ],
    altSteps: [{ desc: 'Also P = I\u00B2R or P = V\u00B2/R.' }],
    similar: ['9 V battery, 3 \u03A9 resistor. Find I and P.', 'Device draws 0.5 A at 120 V. Find R and P.', 'Three 6 \u03A9 resistors in parallel. Find total R.'],
    mistakes: ['Confusing series and parallel resistance formulas.', 'Forgetting to convert mA to A, k\u03A9 to \u03A9.', 'P = V\u00B2/R only works for voltage across the resistor.']
  };
}

function genOptics(input, nums) {
  const u = nums[0] || 30, f = nums[1] || 15;
  const sign = input.toLowerCase().includes('concave') ? -1 : 1;
  const v = 1 / ((1/(sign*f)) - (1/u));
  return {
    finalAnswer: 'v = ' + v.toFixed(2) + '\\text{ cm}',
    finalFormula: '\\frac{1}{v} = \\frac{1}{f} - \\frac{1}{u} = \\frac{1}{' + (sign*f) + '} - \\frac{1}{' + u + '}',
    steps: [
      { desc: 'Use the lens/mirror equation.', formula: '\\frac{1}{f} = \\frac{1}{u} + \\frac{1}{v}' },
      { desc: 'Rearrange and substitute.', formula: '\\frac{1}{v} = \\frac{1}{' + (sign*f) + '} - \\frac{1}{' + u + '}' }
    ],
    altSteps: [{ desc: 'Draw a ray diagram to verify.' }],
    similar: ['Object 20 cm from convex lens f=10 cm. Find v.', 'Concave mirror f=15 cm, object at 30 cm. Find v.', 'Lens produces image at 40 cm when object at 24 cm. Find f.'],
    mistakes: ['Sign convention errors — memorize your convention.', 'Confusing concave (converges, +f) with convex (diverges, -f).', 'Using formula without correct signs for u and v.']
  };
}

function genGenericPhysics(input, nums) {
  return {
    finalAnswer: nums.length ? 'Using values: ' + nums.join(', ') : 'See steps.',
    finalFormula: '',
    steps: [
      { desc: 'Identify physical quantities and principle.', formula: '\\text{Problem: } ' + input },
      { desc: 'Write the relevant formula.', formula: nums.length ? '\\text{Values: } ' + nums.join(', ') : '' },
      { desc: 'Substitute and solve.' },
      { desc: 'State answer with correct units.' }
    ],
    altSteps: [{ desc: 'Consider if another method could verify.' }],
    similar: ['Practice more problems on this topic.', 'Change given values to test understanding.'],
    mistakes: ['Always include units — they help catch errors.', 'Check if answer is physically reasonable.', 'Round only at the final step.']
  };
}

// ---- CHEMISTRY GENERATORS ----
function genMole(input, nums) {
  const mass = nums[0] || 80;
  const molarMass = nums[1] || 40;
  const moles = mass / molarMass;
  return {
    finalAnswer: 'n = ' + moles.toFixed(4) + '\\text{ mol}',
    finalFormula: 'n = \\frac{' + mass + '}{' + molarMass + '} = ' + moles.toFixed(4) + '\\text{ mol}',
    steps: [
      { desc: 'Formula: n = mass / molar mass.', formula: 'n = \\frac{m}{M}' },
      { desc: 'Identify the molar mass from atomic masses.', formula: 'M = ' + molarMass + '\\text{ g/mol}' },
      { desc: 'Calculate moles.', formula: 'n = \\frac{' + mass + '}{' + molarMass + '} = ' + moles.toFixed(4) + '\\text{ mol}' }
    ],
    altSteps: [{ desc: 'Convert moles to particles: number = n \u00D7 N\u2090.' }],
    similar: ['Moles in 36 g H\u2082O? (H=1, O=16)', 'Mass of 0.5 mol CO\u2082? (C=12, O=16)', 'Atoms in 2 mol He?'],
    mistakes: ['n = m/M, not n = m\u00D7M.', 'Forgetting to sum all atomic masses in the compound.', 'Confusing moles with number of particles.']
  };
}

function genReaction(input, nums) {
  const mass = nums[0] || 56;
  const molar = nums[1] || 56;
  const moles = mass / molar;
  return {
    finalAnswer: 'n(Fe\u2082O\u2083) = ' + (moles/2).toFixed(4) + '\\text{ mol}',
    finalFormula: '\\text{From } ' + mass + '\\text{ g Fe: } n = \\frac{' + mass + '}{' + molar + '} = ' + moles.toFixed(2) + '\\text{ mol Fe} \\rightarrow ' + (moles/2).toFixed(2) + '\\text{ mol Fe}_2\\text{O}_3',
    steps: [
      { desc: 'Write the balanced equation first.', formula: '4\\text{Fe} + 3\\text{O}_2 \\rightarrow 2\\text{Fe}_2\\text{O}_3' },
      { desc: 'Find moles of given substance.', formula: 'n(\\text{Fe}) = \\frac{' + mass + '}{' + molar + '} = ' + moles.toFixed(2) + '\\text{ mol}' },
      { desc: 'Use stoichiometric ratio from balanced equation.', formula: 'n(\\text{Fe}_2\\text{O}_3) = \\frac{2}{4} \\times n(\\text{Fe})' }
    ],
    altSteps: [{ desc: 'Check the balanced equation atom counts.' }],
    similar: ['Balance N\u2082 + H\u2082 \u2192 NH\u2083', 'Grams O\u2082 needed for 12 g C? (C + O\u2082 \u2192 CO\u2082)', 'Balance Fe + H\u2082O \u2192 Fe\u2083O\u2084 + H\u2082'],
    mistakes: ['Unbalanced equation gives wrong ratios.', 'Changing subscripts instead of coefficients.', 'Wrong mole ratio — always use the balanced eq coefficients.']
  };
}

function genGasLaw(input, nums) {
  const P1 = nums[0] || 1, V1 = nums[1] || 2.5, T1 = nums[2] || 300, P2 = nums[3] || 2, T2 = nums[4] || 600;
  const V2 = (P1*V1*T2)/(P2*T1);
  return {
    finalAnswer: 'V\u2082 = ' + V2.toFixed(2) + '\\text{ L}',
    finalFormula: 'V_2 = \\frac{P_1V_1T_2}{P_2T_1} = \\frac{' + P1 + '(' + V1 + ')(' + T2 + ')}{' + P2 + '(' + T1 + ')} = ' + V2.toFixed(2) + '\\text{ L}',
    steps: [
      { desc: 'Use the combined gas law: P\u2081V\u2081/T\u2081 = P\u2082V\u2082/T\u2082.', formula: '\\frac{P_1V_1}{T_1} = \\frac{P_2V_2}{T_2}' },
      { desc: 'Rearrange for V\u2082.', formula: 'V_2 = \\frac{P_1V_1T_2}{P_2T_1}' },
      { desc: 'Substitute values (ensure T in Kelvin).', formula: 'V_2 = \\frac{' + P1 + '(' + V1 + ')(' + T2 + ')}{' + P2 + '(' + T1 + ')}' }
    ],
    altSteps: [{ desc: 'Check with ideal gas law PV = nRT (if n is constant).' }],
    similar: ['Gas at 2 atm, 3 L expands to 6 L at constant T. Find new P.', 'Gas at 300 K, 2 L heated to 600 K at constant P. Find new V.', 'Volume of 1 mol gas at STP?'],
    mistakes: ['Forgetting to convert \u00B0C to K (add 273).', 'Inconsistent units — P in atm, V in L, T in K.', 'Wrong gas law — identify what stays constant.']
  };
}

function genPH(input, nums) {
  const conc = nums[0] || 0.001;
  const pH = -Math.log10(conc);
  return {
    finalAnswer: 'pH = ' + pH.toFixed(2),
    finalFormula: '\\text{pH} = -\\log[' + conc + '] = ' + pH.toFixed(2),
    steps: [
      { desc: 'Definition: pH = -log[H\u207A].', formula: '\\text{pH} = -\\log[H^+]' },
      { desc: 'For strong acid, [H\u207A] = acid concentration.', formula: '[H^+] = ' + conc + '\\text{ M}' },
      { desc: 'Calculate pH.', formula: '\\text{pH} = -\\log(' + conc + ') = ' + pH.toFixed(2) }
    ],
    altSteps: [{ desc: 'pOH = 14 - pH (at 25\u00B0C).' }, { desc: 'For weak acids, use Ka first.' }],
    similar: ['pH of 0.01 M H\u2082SO\u2084?', '[H\u207A] if pH = 4.5?', 'pH of 0.05 M NaOH?'],
    mistakes: ['pH is logarithmic — diff of 1 = 10\u00D7 change.', 'For strong bases, find [OH\u207B] first, then [H\u207A] = Kw/[OH\u207B].', 'Polyprotic acids release multiple H\u207A.']
  };
}

function genThermoChem(input, nums) {
  const m = nums[0] || 50, T1 = nums[1] || 20, T2 = nums[2] || 50;
  const c = 4.18;
  const q = m * c * (T2 - T1);
  return {
    finalAnswer: 'q = ' + q.toFixed(2) + '\\text{ J}',
    finalFormula: 'q = mc\\Delta T = ' + m + '(' + c + ')(' + (T2-T1) + ') = ' + q.toFixed(2) + '\\text{ J}',
    steps: [
      { desc: 'Calorimetry equation: q = mc\u0394T.', formula: 'q = mc\\Delta T' },
      { desc: 'Identify values.', formula: 'm = ' + m + '\\text{ g},\\quad c = ' + c + '\\text{ J/g}^\\circ\\text{C},\\quad \\Delta T = ' + (T2-T1) + '^\\circ\\text{C}' },
      { desc: 'Calculate heat.', formula: 'q = ' + m + '(' + c + ')(' + (T2-T1) + ') = ' + q.toFixed(2) + '\\text{ J}' }
    ],
    altSteps: [{ desc: 'For reactions, use \u0394H instead.' }],
    similar: ['100 g water at 25\u00B0C absorbs 4180 J. Find final T.', '200 g metal (c=0.9) at 100\u00B0C in water. Find heat.', 'Heat to raise 50 g water from 20 to 80\u00B0C?'],
    mistakes: ['\u0394T = T_final - T_initial (not reverse).', 'Units: c in J/g\u00B0C, m in g, T in \u00B0C.', 'Sign convention: absorbed = +, released = \u2212.']
  };
}

function genGenericChemistry(input, nums) {
  return {
    finalAnswer: nums.length ? 'Using values: ' + nums.join(', ') : 'See steps.',
    finalFormula: '',
    steps: [
      { desc: 'Analyze the chemical problem.', formula: '\\text{Problem: } ' + input },
      { desc: 'Apply the relevant chemical principle.' },
      { desc: 'Calculate with attention to units.' },
      { desc: 'Express answer with appropriate significant figures.' }
    ],
    altSteps: [{ desc: 'Verify using dimensional analysis.' }],
    similar: ['Practice more problems in this area.', 'Create a step-by-step method for this type.'],
    mistakes: ['Check equations are balanced.', 'Ensure consistent units.', 'Correct number of significant figures.']
  };
}

// ============================================================
// SOLVE FLOW
// ============================================================
const solveBtn = document.getElementById('solveBtn');
const problemInput = document.getElementById('problemInput');
const outputEmpty = document.getElementById('outputEmpty');
const outputLoading = document.getElementById('outputLoading');
const solutionContent = document.getElementById('solutionContent');
const outputActions = document.getElementById('outputActions');
const altToggle = document.getElementById('altToggle');
const altContent = document.getElementById('altContent');
const altToggleText = document.getElementById('altToggleText');
const subjectWarning = document.getElementById('subjectWarning');
const warningMessage = document.getElementById('warningMessage');
const finalAnswerBox = document.getElementById('finalAnswerBox');

solveBtn.addEventListener('click', solve);

function solve() {
  const input = problemInput.value.trim();
  if (!input && !uploadedFiles.length) { toast('Enter a problem or upload a file.', 'error'); return; }
  
  const detected = input ? detectSubject(input) : currentSubject;
  let autoSwitch = false;
  
  if (detected !== currentSubject && input) {
    warningMessage.textContent = 'This appears to be ' + meta[detected].label + '. Switching...';
    subjectWarning.style.display = 'block';
    autoSwitch = true;
    setTimeout(() => { subjectWarning.style.display = 'none'; }, 3000);
  }
  
  showLoading();
  const delay = 1000 + Math.random() * 500;
  
  const steps = document.querySelectorAll('.loading-step');
  let idx = 0;
  const int = setInterval(() => {
    steps.forEach(s => s.classList.remove('active'));
    if (idx < steps.length) { steps[idx].classList.add('active'); idx++; }
  }, delay / 4);
  
  setTimeout(() => {
    clearInterval(int);
    steps.forEach(s => s.classList.remove('active'));
    
    if (autoSwitch && detected !== currentSubject) switchSubject(detected);
    
    currentSolutionData = input ? generateSolution(input, detected) : {
      finalAnswer: 'Please type your problem in the text area.',
      finalFormula: '',
      steps: [{ desc: 'File uploaded. Type the problem to solve it.' }],
      altSteps: [],
      similar: ['Try typing a problem.'],
      mistakes: ['Upload clear images for best OCR results.']
    };
    
    altContent.style.display = 'none';
    altToggle.classList.remove('open');
    altToggleText.textContent = 'Show';
    
    renderSolution(currentSolutionData);
    showSolution();
  }, delay);
}

// Sample pill solve (click on pill sets input, click Solve button separately)
document.querySelectorAll('.pill').forEach(p => {
  if (p) {} // Handled in renderPills
});

// ============================================================
// RENDER
// ============================================================
function renderSolution(data) {
  const rf = (f) => {
    if (!f) return '';
    try { return katex.renderToString(f, { throwOnError: false, displayMode: true }); }
    catch(e) { return '<code>' + f + '</code>'; }
  };
  
  // Final answer
  finalAnswerBox.innerHTML = data.finalFormula ? rf(data.finalFormula) : (data.finalAnswer || '');
  
  // Steps
  const sc = document.getElementById('stepsContainer');
  sc.innerHTML = data.steps.map((s, i) =>
    '<div class="step-item"><div class="step-num">Step ' + (i+1) + '</div><div class="step-desc">' + s.desc + '</div>' +
    (s.formula ? '<div class="step-formula">' + rf(s.formula) + '</div>' : '') + '</div>'
  ).join('');
  
  // Alternate
  const ac = document.getElementById('altStepsContainer');
  ac.innerHTML = (data.altSteps || []).map((s, i) =>
    '<div class="step-item"><div class="step-num">' + (i+1) + '</div><div class="step-desc">' + s.desc + '</div>' +
    (s.formula ? '<div class="step-formula">' + rf(s.formula) + '</div>' : '') + '</div>'
  ).join('');
  
  // Similar
  const sim = document.getElementById('similarQuestions');
  sim.innerHTML = (data.similar || []).map((q, i) =>
    '<div class="similar-item"><span class="similar-num">' + (i+1) + '</span>' + q + '</div>'
  ).join('');
  
  // Mistakes
  const ml = document.getElementById('mistakesList');
  ml.innerHTML = (data.mistakes || []).map(m => '<li>' + m + '</li>').join('');
}

function renderMath() {
  if (typeof renderMathInElement === 'function') {
    try { renderMathInElement(solutionContent, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError: false }); } catch(e) {}
  }
}

// ============================================================
// UI HELPERS
// ============================================================
function showLoading() {
  outputEmpty.style.display = 'none'; solutionContent.style.display = 'none';
  outputActions.style.display = 'none'; outputLoading.style.display = 'flex';
  subjectWarning.style.display = 'none';
}

function showSolution() {
  outputLoading.style.display = 'none'; outputEmpty.style.display = 'none';
  solutionContent.style.display = 'block'; outputActions.style.display = 'flex';
  subjectWarning.style.display = 'none';
  setTimeout(renderMath, 50);
}

// ============================================================
// ALT TOGGLE
// ============================================================
altToggle.addEventListener('click', () => {
  const open = altContent.style.display === 'block';
  altContent.style.display = open ? 'none' : 'block';
  altToggle.classList.toggle('open');
  altToggleText.textContent = open ? 'Show' : 'Hide';
});

// ============================================================
// PDF EXPORT
// ============================================================
document.getElementById('exportBtn').addEventListener('click', async function() {
  const panel = document.querySelector('.panel-output');
  const btn = this;
  const origHtml = btn.innerHTML;
  btn.innerHTML = '...';
  btn.disabled = true;
  
  try {
    if (typeof html2canvas === 'function' && typeof jspdf === 'function') {
      const canvas = await html2canvas(panel, {
        scale: 2, useCORS: true,
        backgroundColor: getTheme() === 'dark' ? '#080818' : '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save('numsolve-solution.pdf');
      toast('PDF downloaded!', 'success');
    } else {
      window.print();
    }
  } catch(e) {
    window.print();
  }
  
  btn.innerHTML = origHtml;
  btn.disabled = false;
});

// ============================================================
// TOAST
// ============================================================
function toast(msg, type) {
  const c = document.querySelector('.toast-container') || (() => {
    const x = document.createElement('div'); x.className = 'toast-container';
    x.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(x); return x;
  })();
  const t = document.createElement('div');
  t.style.cssText = 'padding:12px 20px;border-radius:var(--radius-md);background:var(--bg-card);border:1px solid var(--border-color);box-shadow:0 8px 30px rgba(0,0,0,0.3);font-size:0.9rem;font-weight:500;color:var(--text-primary);animation:fadeUp 0.3s ease;max-width:380px;border-left:3px solid ' + (type === 'error' ? '#ef4444' : '#10b981');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = 'all 0.3s ease'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ============================================================
// KEYBOARD
// ============================================================
document.addEventListener('keydown', e => {
  if ((e.ctrlKey||e.metaKey) && e.key === 'Enter') { e.preventDefault(); solve(); }
  if ((e.ctrlKey||e.metaKey) && e.key === 'i') { e.preventDefault(); problemInput.focus(); }
});

// ============================================================
// BACKGROUND ANIMATIONS
// ============================================================
(function initBg() {
  const syms = '\u2211 \u222B \u03C0 \u221A \u221E \u0394 \u03B8 \u03BB \u03BC \u03C3 \u03C6 \u03C9 \u03B1 \u03B2 \u2202 \u2207 \u2208 \u220F \u2229 \u222A \u2282 \u2286 \u00B1 \u00D7 \u00F7 \u2248 \u2261 \u2260 \u2264 \u2265 \u2192 \u21D2'.split(' ');
  const c = document.getElementById('floatSymbols');
  if (!c) return;
  for (let i = 0; i < 25; i++) {
    const e = document.createElement('span');
    e.className = 'fs';
    e.textContent = syms[Math.floor(Math.random()*syms.length)];
    e.style.left = Math.random()*100+'%';
    e.style.fontSize = (12+Math.random()*20)+'px';
    e.style.setProperty('--dur', (15+Math.random()*25)+'s');
    e.style.setProperty('--del', Math.random()*20+'s');
    c.appendChild(e);
  }
  
  const eqs = ['E=mc\u00B2','F=ma','a\u00B2+b\u00B2=c\u00B2','PV=nRT','v=u+at','s=ut+\u00BDat\u00B2','KE=\u00BDmv\u00B2','PE=mgh','pH=-log[H\u207A]','\u03B5=IR+Ir','\u222Bf(x)dx','x=(-b\u00B1\u221A\u0394)/2a','sin\u00B2\u03B8+cos\u00B2\u03B8=1','n=m/M','C=2\u03C0r','A=\u03C0r\u00B2','\u0394G=\u0394H-T\u0394S','q=mc\u0394T','c=\u03BBf'];
  ['dataStreamL','dataStreamR'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const l = document.createElement('span');
      l.className = 'ds-line';
      l.textContent = eqs[Math.floor(Math.random()*eqs.length)];
      l.style.setProperty('--dur', (20+Math.random()*20)+'s');
      l.style.setProperty('--del', Math.random()*15+'s');
      el.appendChild(l);
    }
  });
})();

// ============================================================
// KEYWORD DETECTION HELPERS (used in generateSolution)
// ============================================================
function hasAny(words, text) { return words.some(w => text.includes(w)); }

// ============================================================
// INIT
// ============================================================
switchSubject('mathematics');
setTimeout(() => {
  const fp = document.querySelector('.pill');
  if (fp) fp.click();
}, 600);
