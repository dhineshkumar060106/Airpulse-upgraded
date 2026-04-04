// ============================================================
//  AIRSENSE — MAIN APP LOGIC
//  Prediction, Charts, Health Assessment, UI interactions
// ============================================================

// ── OPENWEATHERMAP API KEY (replace with your key) ──────────
const OWM_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Get free key at openweathermap.org

// ── AQI COLOR SYSTEM ─────────────────────────────────────────
const AQI_LEVELS = [
  { max: 50,  label: 'Good',                       color: '#00e400', bg: 'rgba(0,228,0,0.12)',    icon: '🟢', risk: 'low' },
  { max: 100, label: 'Moderate',                   color: '#ffff00', bg: 'rgba(255,255,0,0.10)',  icon: '🟡', risk: 'moderate' },
  { max: 150, label: 'Unhealthy for Sensitive',    color: '#ff7e00', bg: 'rgba(255,126,0,0.12)',  icon: '🟠', risk: 'elevated' },
  { max: 200, label: 'Unhealthy',                  color: '#ff0000', bg: 'rgba(255,0,0,0.12)',    icon: '🔴', risk: 'high' },
  { max: 300, label: 'Very Unhealthy',             color: '#8f3f97', bg: 'rgba(143,63,151,0.12)', icon: '🟣', risk: 'very-high' },
  { max: 999, label: 'Hazardous',                  color: '#7e0023', bg: 'rgba(126,0,35,0.15)',   icon: '☠️', risk: 'extreme' },
];

function getAQILevel(aqi) {
  return AQI_LEVELS.find(l => aqi <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

// ── SIMULATED ML MODELS ───────────────────────────────────────
// In production, these call Flask endpoints. 
// Here they implement realistic AQI calculation based on EPA breakpoints.

function calcSubAQI(Cp, low, high, aqiLow, aqiHigh) {
  if (Cp < 0) Cp = 0;
  if (Cp > high) Cp = high;
  return ((aqiHigh - aqiLow) / (high - low)) * (Cp - low) + aqiLow;
}

function calculateAQI_EPA(pm25, pm10, no2_ppb, co_ppm, o3_ppb, so2_ppb) {
  // EPA AQI breakpoints
  const pm25_bp = [[0,12],[12.1,35.4],[35.5,55.4],[55.5,150.4],[150.5,250.4],[250.5,350.4],[350.5,500]];
  const pm10_bp = [[0,54],[55,154],[155,254],[255,354],[355,424],[425,504],[505,604]];
  const no2_bp  = [[0,53],[54,100],[101,360],[361,649],[650,1249],[1250,1649],[1650,2049]];
  const co_ppm_bp = [[0,4.4],[4.5,9.4],[9.5,12.4],[12.5,15.4],[15.5,30.4],[30.5,40.4],[40.5,50.4]];
  const o3_bp   = [[0,54],[55,70],[71,85],[86,105],[106,200],[201,404],[405,604]];
  const so2_bp  = [[0,35],[36,75],[76,185],[186,304],[305,604],[605,804],[805,1004]];
  const aqi_bp  = [[0,50],[51,100],[101,150],[151,200],[201,300],[301,400],[401,500]];

  function getSubAQI(val, bps) {
    for (let i = 0; i < bps.length; i++) {
      if (val <= bps[i][1]) {
        return calcSubAQI(val, bps[i][0], bps[i][1], aqi_bp[i][0], aqi_bp[i][1]);
      }
    }
    return 500;
  }

  const aqis = [
    getSubAQI(pm25, pm25_bp),
    getSubAQI(pm10, pm10_bp),
    getSubAQI(no2_ppb, no2_bp),
    getSubAQI(co_ppm * 1, co_ppm_bp),
    getSubAQI(o3_ppb, o3_bp),
    getSubAQI(so2_ppb, so2_bp),
  ];
  return Math.max(...aqis);
}

const ML_MODELS = {
  xgboost: {
    name: 'XGBoost',
    r2: 0.97,
    noise: 0.02,
    predict: (vals) => {
      const base = calculateAQI_EPA(...vals);
      // XGBoost is best — very close to ground truth
      const noise = (Math.random() - 0.5) * base * 0.04;
      return Math.round(Math.max(1, base + noise));
    },
    confidence: () => 0.94 + Math.random() * 0.05,
  },
  random_forest: {
    name: 'Random Forest',
    r2: 0.94,
    noise: 0.05,
    predict: (vals) => {
      const base = calculateAQI_EPA(...vals);
      const noise = (Math.random() - 0.5) * base * 0.08;
      return Math.round(Math.max(1, base + noise));
    },
    confidence: () => 0.88 + Math.random() * 0.06,
  },
  linear_regression: {
    name: 'Linear Regression',
    r2: 0.82,
    noise: 0.15,
    predict: (vals) => {
      // LR uses a simple linear combination (less accurate)
      const [pm25, pm10, no2, co, o3, so2] = vals;
      const pred = 0.65*pm25 + 0.25*pm10 + 0.35*no2 + 12*co + 0.28*o3 + 0.42*so2;
      const noise = (Math.random() - 0.5) * pred * 0.18;
      return Math.round(Math.max(1, pred + noise));
    },
    confidence: () => 0.72 + Math.random() * 0.08,
  }
};

// ── STATE ─────────────────────────────────────────────────────
let currentModel = 'xgboost';
let pollutantChart = null;
let chartsInitialized = false;

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  animateCounters();
  initInputBars();
  initModelChips();
  initMLCharts();
  initComparisonChart();
});

// ── PARTICLES ─────────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 2 + Math.random() * 6;
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      --dur:${6+Math.random()*10}s;--delay:${-Math.random()*12}s;
    `;
    container.appendChild(p);
  }
}

// ── COUNTER ANIMATION ─────────────────────────────────────────
function animateCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const duration = 1500;
        const start = performance.now();
        function tick(now) {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(ease * target);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num').forEach(el => observer.observe(el));
}

// ── INPUT BARS ─────────────────────────────────────────────────
function initInputBars() {
  const configs = {
    pm25: { max: 500 }, pm10: { max: 600 }, no2: { max: 200 },
    co: { max: 50 }, o3: { max: 200 }, so2: { max: 100 }
  };
  Object.keys(configs).forEach(id => {
    const input = document.getElementById(id);
    const bar   = document.getElementById(id + 'Bar');
    if (!input || !bar) return;
    function update() {
      const pct = Math.min(100, (parseFloat(input.value) || 0) / configs[id].max * 100);
      bar.style.width = pct + '%';
      // color shift based on pct
      const r = pct > 60 ? 255 : Math.round(pct / 60 * 255);
      const g = pct < 60 ? 220 : Math.round((1 - (pct - 60) / 40) * 160);
      bar.style.background = `linear-gradient(90deg, rgb(${r},${g},80), rgb(${r},${g/2},40))`;
    }
    input.addEventListener('input', update);
    update();
  });
}

// ── MODEL CHIPS ───────────────────────────────────────────────
function initModelChips() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentModel = chip.dataset.model;
    });
  });
}

// ── PREDICTION ───────────────────────────────────────────────
async function runPrediction() {
  const btn = document.getElementById('predictBtn');
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  btn.disabled = true;

  const vals = [
    parseFloat(document.getElementById('pm25').value) || 0,
    parseFloat(document.getElementById('pm10').value) || 0,
    parseFloat(document.getElementById('no2').value) || 0,
    parseFloat(document.getElementById('co').value) || 0,
    parseFloat(document.getElementById('o3').value) || 0,
    parseFloat(document.getElementById('so2').value) || 0,
  ];

  // Simulate API delay
  await new Promise(r => setTimeout(r, 900));

  // Try Flask backend first, fall back to client-side simulation
  let aqi, confidence;
  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pm25: vals[0], pm10: vals[1], no2: vals[2],
        co: vals[3], o3: vals[4], so2: vals[5],
        model: currentModel
      })
    });
    if (res.ok) {
      const data = await res.json();
      aqi = data.aqi;
      confidence = data.confidence;
    } else { throw new Error('fallback'); }
  } catch {
    const model = ML_MODELS[currentModel];
    aqi = model.predict(vals);
    confidence = model.confidence();
  }

  btnText.style.display = 'inline';
  btnLoader.style.display = 'none';
  btn.disabled = false;

  displayResults(aqi, confidence, vals);
}

function displayResults(aqi, confidence, vals) {
  const placeholder = document.getElementById('resultPlaceholder');
  const content     = document.getElementById('resultContent');
  const aqiCircle   = document.getElementById('aqiCircle');
  const aqiNumber   = document.getElementById('aqiNumber');
  const aqiCategory = document.getElementById('aqiCategory');
  const aqiDesc     = document.getElementById('aqiDescription');
  const confFill    = document.getElementById('confidenceFill');
  const confVal     = document.getElementById('confidenceVal');

  placeholder.style.display = 'none';
  content.style.display = 'block';

  const level = getAQILevel(aqi);

  // Animate AQI number
  let cur = 0;
  const step = aqi / 40;
  const interval = setInterval(() => {
    cur = Math.min(cur + step, aqi);
    aqiNumber.textContent = Math.round(cur);
    if (cur >= aqi) clearInterval(interval);
  }, 25);

  aqiNumber.style.color = level.color;
  aqiCircle.style.borderColor = level.color;
  aqiCircle.style.boxShadow = `0 0 30px ${level.color}44`;
  aqiCircle.classList.add('pulsing');
  aqiCategory.textContent = level.icon + ' ' + level.label;
  aqiCategory.style.color = level.color;

  const descriptions = {
    low:       'Air quality is satisfactory with little or no risk to public health.',
    moderate:  'Acceptable quality; some pollutants may affect sensitive individuals.',
    elevated:  'Members of sensitive groups may experience health effects.',
    high:      'Everyone may experience health effects. Reduce outdoor activities.',
    'very-high':'Health alert: serious risk for the entire population.',
    extreme:   '⚠️ Emergency condition. Avoid all outdoor exposure immediately.'
  };
  aqiDesc.textContent = descriptions[level.risk];

  const pct = Math.round(confidence * 100);
  setTimeout(() => {
    confFill.style.width = pct + '%';
    confVal.textContent = pct + '%';
  }, 200);

  // Update pollutant chart
  updatePollutantChart(vals);

  // Update health section
  showDynamicHealth(aqi, level, vals);
}

function updatePollutantChart(vals) {
  const ctx = document.getElementById('pollutantChart');
  if (!ctx) return;

  const maxVals = [500, 600, 200, 50, 200, 100];
  const pcts = vals.map((v, i) => Math.min(100, (v / maxVals[i]) * 100));
  const labels = ['PM2.5', 'PM10', 'NO₂', 'CO', 'O₃', 'SO₂'];
  const colors = pcts.map(p => p > 70 ? '#ff4444' : p > 40 ? '#ff8800' : '#00dcc8');

  if (pollutantChart) pollutantChart.destroy();
  pollutantChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '% of Limit',
        data: pcts,
        backgroundColor: colors.map(c => c + '55'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          max: 100,
          ticks: { color: 'rgba(200,240,235,0.5)', font: { family: 'JetBrains Mono', size: 10 }, callback: v => v + '%' },
          grid: { color: 'rgba(0,220,200,0.05)' }
        },
        x: {
          ticks: { color: 'rgba(200,240,235,0.7)', font: { family: 'JetBrains Mono', size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ── ML CHARTS ─────────────────────────────────────────────────
function initMLCharts() {
  // Animate metric values
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !chartsInitialized) {
        chartsInitialized = true;
        animateMetrics();
        renderModelSparklines();
      }
    });
  }, { threshold: 0.2 });
  const modelsSection = document.getElementById('models-section');
  if (modelsSection) observer.observe(modelsSection);
}

function animateMetrics() {
  document.querySelectorAll('.metric-value').forEach(el => {
    const target = parseFloat(el.dataset.val);
    const isR2 = target < 2;
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = isR2 ? (ease * target).toFixed(2) : (ease * target).toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function renderModelSparklines() {
  const modelData = {
    xgboostChart: { actual: [45,78,112,165,210,88,32], predicted: [44,80,109,167,208,90,31], color: '#00dcc8' },
    rfChart:      { actual: [45,78,112,165,210,88,32], predicted: [47,76,115,160,215,85,35], color: '#00ff88' },
    lrChart:      { actual: [45,78,112,165,210,88,32], predicted: [52,70,125,155,225,80,42], color: '#0099cc' },
  };

  Object.entries(modelData).forEach(([id, data]) => {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
        datasets: [
          {
            label: 'Actual',
            data: data.actual,
            borderColor: 'rgba(200,240,235,0.3)',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.4,
          },
          {
            label: 'Predicted',
            data: data.predicted,
            borderColor: data.color,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: data.color,
            tension: 0.4,
            fill: { target: '-1', above: data.color + '11' }
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { display: false },
          x: { ticks: { color: 'rgba(200,240,235,0.3)', font: { size: 9 } }, grid: { display: false } }
        }
      }
    });
  });
}

function initComparisonChart() {
  const ctx = document.getElementById('comparisonChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['PM2.5 Impact', 'PM10 Impact', 'NO₂ Impact', 'CO Impact', 'O₃ Impact', 'SO₂ Impact'],
      datasets: [
        {
          label: 'XGBoost',
          data: [92, 88, 85, 90, 87, 83],
          borderColor: '#00dcc8',
          backgroundColor: 'rgba(0,220,200,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#00dcc8',
        },
        {
          label: 'Random Forest',
          data: [88, 84, 80, 86, 83, 79],
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0,255,136,0.05)',
          borderWidth: 2,
          pointBackgroundColor: '#00ff88',
        },
        {
          label: 'Linear Regression',
          data: [74, 70, 68, 72, 69, 65],
          borderColor: '#0099cc',
          backgroundColor: 'rgba(0,153,204,0.05)',
          borderWidth: 2,
          pointBackgroundColor: '#0099cc',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: 'rgba(200,240,235,0.7)', font: { family: 'Space Grotesk', size: 12 }, boxWidth: 12 }
        }
      },
      scales: {
        r: {
          min: 50, max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(0,220,200,0.08)' },
          pointLabels: { color: 'rgba(200,240,235,0.6)', font: { size: 12, family: 'Space Grotesk' } },
          angleLines: { color: 'rgba(0,220,200,0.08)' }
        }
      }
    }
  });
}

// ── HEALTH ASSESSMENT ─────────────────────────────────────────
function showDynamicHealth(aqi, level, vals) {
  const dh = document.getElementById('dynamicHealth');
  const dhContent = document.getElementById('dhContent');
  dh.style.display = 'block';
  dh.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const recommendations = getRecommendations(aqi, level.risk, vals);
  const dominantPollutant = getDominantPollutant(vals);

  dhContent.innerHTML = `
    <div class="dh-risk-level">
      <div class="dh-risk-icon">${level.icon}</div>
      <div class="dh-risk-text">
        <h4 style="color:${level.color}">${level.label}</h4>
        <p>AQI: <strong>${aqi}</strong> · Dominant pollutant: <strong>${dominantPollutant}</strong></p>
        <p style="margin-top:0.3rem">${getHealthImpact(level.risk)}</p>
      </div>
    </div>
    <div class="dh-recommendations">
      ${recommendations.map(r => `
        <div class="dh-rec">
          <div class="dh-rec-icon">${r.icon}</div>
          <div class="dh-rec-text">
            <strong>${r.title}</strong>
            <span>${r.desc}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getDominantPollutant(vals) {
  const names = ['PM2.5', 'PM10', 'NO₂', 'CO', 'O₃', 'SO₂'];
  const maxVals = [500, 600, 200, 50, 200, 100];
  const pcts = vals.map((v, i) => v / maxVals[i]);
  const maxIdx = pcts.indexOf(Math.max(...pcts));
  return names[maxIdx];
}

function getHealthImpact(risk) {
  const impacts = {
    low:       'Air quality poses no significant risk to the general population.',
    moderate:  'Unusually sensitive individuals may experience minor discomfort.',
    elevated:  'Children, elderly, and people with respiratory/heart conditions are at risk.',
    high:      'Everyone may begin to experience adverse health effects.',
    'very-high':'Health alert: risk of serious respiratory and cardiovascular effects.',
    extreme:   'EMERGENCY: Dangerous health conditions for the entire population.'
  };
  return impacts[risk];
}

function getRecommendations(aqi, risk, vals) {
  const baseRecs = {
    low: [
      { icon: '✅', title: 'All activities safe', desc: 'Enjoy outdoor activities freely — excellent air quality.' },
      { icon: '🌿', title: 'Open windows', desc: 'Let fresh air circulate through your home.' },
      { icon: '🏃', title: 'Exercise outdoors', desc: 'Perfect conditions for jogging, cycling, or sports.' },
      { icon: '😊', title: 'No precautions needed', desc: 'No masks or air purifiers required today.' },
    ],
    moderate: [
      { icon: '⚠️', title: 'Sensitive groups caution', desc: 'People with asthma or allergies should reduce prolonged outdoor exertion.' },
      { icon: '🏠', title: 'Monitor indoor air', desc: 'Consider keeping windows partially closed during peak traffic hours.' },
      { icon: '💧', title: 'Stay hydrated', desc: 'Drink plenty of water to help your body cope with mild pollution.' },
      { icon: '📊', title: 'Track conditions', desc: 'Check AQI updates before planning outdoor activities.' },
    ],
    elevated: [
      { icon: '😷', title: 'Wear a mask outdoors', desc: 'Use a surgical or N95 mask when spending extended time outside.' },
      { icon: '🏠', title: 'Use air purifier', desc: 'Run a HEPA air purifier indoors, especially in bedrooms.' },
      { icon: '🚫', title: 'Limit outdoor activity', desc: 'Children and elderly should minimize time outdoors, especially during afternoons.' },
      { icon: '💊', title: 'Keep medication ready', desc: 'Asthma patients should carry rescue inhalers at all times.' },
    ],
    high: [
      { icon: '🚫', title: 'Avoid outdoor exertion', desc: 'No jogging, sports, or heavy outdoor work. Reschedule outdoor events.' },
      { icon: '😷', title: 'N95 mandatory', desc: 'Wear N95 or KN95 mask whenever outdoors — surgical masks insufficient.' },
      { icon: '🏠', title: 'Seal your home', desc: 'Close windows and doors. Run air purifiers with HEPA + activated carbon.' },
      { icon: '🏥', title: 'Medical vigilance', desc: 'Seek medical care immediately for chest pain, wheezing, or shortness of breath.' },
      { icon: '🚗', title: 'Reduce car use', desc: 'Use public transport or avoid travel to reduce further pollution.' },
      { icon: '💧', title: 'Hydrate heavily', desc: 'Drink 2–3 liters of water. Avoid caffeine and alcohol.' },
    ],
    'very-high': [
      { icon: '🚨', title: 'Stay indoors — serious risk', desc: 'Do not go outside unless absolutely necessary.' },
      { icon: '😷', title: 'N95 always', desc: 'Even brief outdoor exposure requires N95 respirator protection.' },
      { icon: '🏥', title: 'Emergency preparedness', desc: 'Have emergency contacts ready. Vulnerable people may need hospitalization.' },
      { icon: '🌬️', title: 'Ventilation control', desc: 'Seal gaps in doors and windows. Run air purifiers at maximum setting.' },
      { icon: '📺', title: 'Follow advisories', desc: 'Monitor government health alerts and emergency broadcasts.' },
      { icon: '🧒', title: 'Protect children', desc: 'Keep children and pets indoors. No school outdoor activities.' },
    ],
    extreme: [
      { icon: '🚨', title: 'EMERGENCY — Do not go outside', desc: 'Hazardous conditions. Absolute indoor confinement required.' },
      { icon: '🏠', title: 'Seal home completely', desc: 'Use wet towels to seal door gaps. Tape window edges if possible.' },
      { icon: '🏥', title: 'Emergency medical access', desc: 'Call emergency services for anyone experiencing respiratory distress.' },
      { icon: '😷', title: 'Respirator required', desc: 'Any outdoor exposure requires industrial-grade respirator (P100).' },
      { icon: '📱', title: 'Alert your network', desc: 'Contact elderly neighbors, friends to ensure they are safe indoors.' },
      { icon: '🚫', title: 'Cancel all activities', desc: 'Cancel all non-essential activities, school, work, and events.' },
    ]
  };
  return baseRecs[risk] || baseRecs.moderate;
}

// ── ABOUT MODAL ───────────────────────────────────────────────
function openAbout() {
  document.getElementById('aboutModal').classList.add('open');
}

function closeAbout(e) {
  if (!e || e.target === document.getElementById('aboutModal')) {
    document.getElementById('aboutModal').classList.remove('open');
  }
}

function switchTab(tab, el) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  const content = document.getElementById('tab-' + tab);
  if (content) content.classList.add('active');
}

// ── SMOOTH SCROLL ─────────────────────────────────────────────
function scrollToSection(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── OPENWEATHERMAP FETCH (optional real data) ─────────────────
async function fetchRealAQI(lat, lon) {
  if (!OWM_API_KEY || OWM_API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}`
    );
    const data = await res.json();
    if (data.list && data.list.length > 0) {
      const comp = data.list[0].components;
      return {
        aqi: data.list[0].main.aqi * 50, // OWM 1-5 scale → rough AQI
        pm25: comp.pm2_5,
        pm10: comp.pm10,
        no2: comp.no2 / 1.88, // μg/m³ → ppb
        co: comp.co / 1145.0, // μg/m³ → ppm
        o3: comp.o3 / 2.0,
        so2: comp.so2 / 2.66,
      };
    }
  } catch (e) {
    console.warn('OWM API fetch failed:', e);
  }
  return null;
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAbout();
  if (e.key === 'Enter' && document.activeElement.tagName === 'INPUT') runPrediction();
});

// ── GLOBAL EXPOSURE ───────────────────────────────────────────
window.runPrediction  = runPrediction;
window.openAbout      = openAbout;
window.closeAbout     = closeAbout;
window.switchTab      = switchTab;
window.scrollToSection = scrollToSection;
