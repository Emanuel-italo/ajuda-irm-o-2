'use strict';

// --------------------------------------------------------------------------------------------------
// LÓGICA DE VISUALIZAÇÃO DE TELA (PRELOADER)
// --------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
  const loadingScreen = document.getElementById('loading-screen');

  // Adiciona a classe 'hidden' quando a página estiver totalmente carregada
  window.addEventListener('load', function() {
    loadingScreen.classList.add('hidden');
  });

  // Remove o elemento do DOM completamente após a transição de opacidade
  loadingScreen.addEventListener('transitionend', function() {
    loadingScreen.style.display = 'none';
  });
});

// --------------------------------------------------------------------------------------------------
// CÓDIGO DA APLICAÇÃO DIABETES HELPER
// --------------------------------------------------------------------------------------------------

// chaves de armazenamento
const PROFILE_KEY = 'dh_profile_v1';
const HISTORY_KEY = 'dh_history_v1';

// constantes Humalog
const HUMALOG_ICR      = 10;   // g de carbo por U
const HUMALOG_CF       = 50;   // mg/dL reduzido por U
const HUMALOG_ROUNDING = 0.5;  // arredondamento em U

// base local de alimentos
const FOOD_DB = [
  { name: 'Pão branco (1 fatia)',             carbs: 15, ig: 70, subs: ['Pão integral'] },
  { name: 'Arroz cozido (100g)',              carbs: 28, ig: 70, subs: ['Arroz integral'] },
  { name: 'Batata-doce (100g)',               carbs: 20, ig: 50, subs: ['Legumes'] },
  { name: 'Maçã média',                       carbs: 20, ig: 40, subs: ['Pera'] },
  { name: 'Banana média',                     carbs: 27, ig: 60, subs: ['Maçã'] },
  { name: 'Leite (200ml)',                    carbs: 10, ig: 30, subs: ['Iogurte natural'] },
  { name: 'Açúcar (1 col. sopa)',             carbs: 12, ig:100, subs: ['Fruta'] },
  { name: 'Pão de manhã (1 fatia)',           carbs: 15, ig: 70, subs: ['Pão integral'] },
  { name: 'Café puro com açúcar (200ml)',     carbs: 12, ig: 65, subs: ['Café sem açúcar'] },
  { name: 'Feijão cozido (100g)',             carbs:  8, ig: 30, subs: ['Feijão integral'] },
  { name: 'Torrada (1 unidade)',              carbs: 12, ig: 70, subs: ['Pão integral torrado'] },
  { name: 'Frango grelhado (100g)',           carbs:  0, ig:  0, subs: ['Peixe grelhado'] },
  { name: 'Carne bovina (100g)',              carbs:  0, ig:  0, subs: ['Carne magra'] },
  { name: 'Batata cozida (100g)',             carbs: 20, ig: 50, subs: ['Batata-doce'] },
  { name: 'Bolacha Club Social (3 unid.)',    carbs: 15, ig: 70, subs: ['Bolacha integral'] },
  { name: 'Risole (1 unid.)',                 carbs: 20, ig: 75, subs: ['Salgado assado'] },
  { name: 'Coxinha (1 unid. média)',          carbs: 30, ig: 80, subs: ['Coxinha de forno'] },
  { name: 'Pizza frango e catupiry (1 fatia)',carbs: 30, ig: 70, subs: ['Pizza integral'] }
];

// alimentos que obrigam o campo “Unidade”
const UNIT_REQUIRED = [
  'Pão branco (1 fatia)',
  'Batata-doce (100g)',
  'Maçã média',
  'Banana média',
  'Pão de manhã (1 fatia)',
  'Torrada (1 unidade)',
  'Bolacha Club Social (3 unid.)',
  'Risole (1 unid.)',
  'Coxinha (1 unid. média)',
  'Pizza frango e catupiry (1 fatia)'
];

// helper para obter elemento pelo ID
function el(id){ return document.getElementById(id); }

// captura elementos do DOM
const els = {
  age: el('age'), weight: el('weight'), height: el('height'),
  hba1c: el('hba1c'), diabetesType: el('diabetesType'), diabetesOrigin: el('diabetesOrigin'),
  target: el('target'), saveProfile: el('save-profile'), resetProfile: el('reset-profile'),
  profileSummary: el('profile-summary'),
  glucose: el('glucose'), carbs: el('carbs'), food: el('food'),
  unitLabel: el('unit-label'), foodUnit: el('food-unit'),
  calcBtn: el('calc-btn'), correctionOnly: el('correctionOnly'),
  resultBox: el('result'), doseText: el('dose-text'), doseDetail: el('dose-detail'),
  alerts: el('alerts'), foodSuggestion: el('food-suggestion'),
  searchFood: el('search-food'), searchBtn: el('search-btn'), foodResults: el('food-results'),
  foodsDatalist: el('foods'), historyList: el('history-list'),
  trendCanvas: el('trend-canvas'), exportCsv: el('export-csv'),
  clearHistory: el('clear-history'), qaButtons: [...document.querySelectorAll('.qa')],
  qaResponse: el('qa-response'), editProfileBtn: el('edit-profile'),
  suggestFoodBtn: el('suggest-food')
};

// utilitários
const toNum = v => (v == null || v === '') ? NaN : Number(v);
const roundTo = (value, step) => {
  const s = Number(step) || HUMALOG_ROUNDING;
  const raw = Math.round((value / s) * 1e6) / 1e6;
  return Math.round(raw) * s;
};

// popula datalist de alimentos
function populateFoodList(){
  els.foodsDatalist.innerHTML =
    FOOD_DB.map(f => `<option value="${f.name}">`).join('');
}
populateFoodList();

// exibe/esconde campo “Unidade” só para opções exatas
els.food.addEventListener('change', ()=>{
  const val = els.food.value.trim();
  const needsUnit = UNIT_REQUIRED.includes(val);
  els.unitLabel.hidden = !needsUnit;
  if(!needsUnit) els.foodUnit.value = '';
});

// perfil e armazenamento
let profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
function saveProfileToStorage(){ localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
function showProfileSummary(){
  els.profileSummary.textContent = profile
    ? `Humalog • Meta ${profile.target} mg/dL`
    : 'Perfil não configurado.';
}
function populateProfileForm(){
  if(!profile) return;
  els.age.value         = profile.age || '';
  els.weight.value      = profile.weight || '';
  els.height.value      = profile.height || '';
  els.hba1c.value       = profile.hba1c || '';
  els.diabetesType.value   = profile.diabetesType || '2';
  els.diabetesOrigin.value = profile.diabetesOrigin || 'desenvolvida';
  els.target.value      = profile.target || 100;
  showProfileSummary();
}
populateProfileForm();

els.saveProfile.addEventListener('click', ()=>{
  const t = toNum(els.target.value);
  if(!t){ alert('Preencha a meta glicêmica.'); return; }
  profile = {
    age: toNum(els.age.value),
    weight: toNum(els.weight.value),
    height: toNum(els.height.value),
    hba1c: toNum(els.hba1c.value),
    diabetesType: els.diabetesType.value,
    diabetesOrigin: els.diabetesOrigin.value,
    target: t
  };
  saveProfileToStorage();
  showProfileSummary();
  flash('Perfil salvo');
});

els.resetProfile.addEventListener('click', ()=>{
  if(!confirm('Resetar perfil?')) return;
  localStorage.removeItem(PROFILE_KEY);
  profile = null;
  populateProfileForm();
  showProfileSummary();
  flash('Perfil removido');
});

// histórico
function loadHistory(){ return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
function saveHistory(h){ localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

// cálculo de insulina
function calculateInsulin({ glucose, carbs, correctionOnly = false }){
  if(!profile) throw new Error('Perfil não configurado');
  const doseMeal = correctionOnly ? 0 : (carbs / HUMALOG_ICR);
  const doseCorr = glucose > profile.target
    ? (glucose - profile.target) / HUMALOG_CF
    : 0;
  const raw = doseMeal + doseCorr;
  const rounded = Number(roundTo(raw, HUMALOG_ROUNDING).toFixed(2));
  return {
    insulin: rounded,
    doseMeal: +doseMeal.toFixed(2),
    doseCorr: +doseCorr.toFixed(2),
    raw: +raw.toFixed(2)
  };
}

// alertas e sugestões
function generateAlerts(g){
  const alerts = [];
  if(g < 70) alerts.push({
    type: 'danger',
    text: 'Alerta: risco de hipoglicemia (BG < 70). Ingerir 15–20g de açúcares simples e reavaliar em 15 min.'
  });
  if(g > 250) alerts.push({
    type: 'danger',
    text: 'Alerta: hiperglicemia (BG > 250). Consulte seu médico.'
  });
  return alerts;
}
function suggestFoodForBG(g){
  if(g < 70) return '15–20g de carbo rápida (ex: açúcar, suco).';
  if(g <= 140) return 'Refeição OK. Prefira baixo IG + fibra.';
  if(g <= 250) return 'Reduza simples; prefira proteínas + fibras.';
  return 'BG alto — verifique cetonas e médico.';
}

// ação de calcular
function onCalculate({ correctionOnly = false } = {}){
  const glucose = toNum(els.glucose.value);
  const carbs   = toNum(els.carbs.value);
  if(isNaN(glucose) || isNaN(carbs)){
    alert('Preencha glicemia e carboidratos.');
    return;
  }
  if(!profile){
    alert('Configure o perfil.');
    return;
  }
  if(!els.unitLabel.hidden && !els.foodUnit.value.trim()){
    alert('Digite a unidade do alimento.');
    return;
  }

  const res = calculateInsulin({ glucose, carbs, correctionOnly });
  els.doseText.textContent   = `${res.insulin} U`;
  els.doseDetail.textContent = `Refeição ${res.doseMeal} U • Correção ${res.doseCorr} U • bruto ${res.raw} U`;
  els.resultBox.hidden = false;

  els.alerts.innerHTML = '';
  generateAlerts(glucose).forEach(a => {
    const d = document.createElement('div');
    d.className = `alert ${a.type}`;
    d.textContent = a.text;
    els.alerts.appendChild(d);
  });

  els.foodSuggestion.textContent = suggestFoodForBG(glucose);

  const history = loadHistory();
  history.unshift({
    ts: new Date().toISOString(),
    glucose,
    carbs,
    unit: els.unitLabel.hidden ? '' : els.foodUnit.value.trim(),
    insulin: res.insulin,
    meal: els.food.value || '—'
  });
  if(history.length > 1000) history.splice(1000);
  saveHistory(history);
  renderHistory();
}

els.calcBtn.addEventListener('click', () =>
  onCalculate({ correctionOnly: els.correctionOnly.checked })
);
els.suggestFoodBtn.addEventListener('click', () => {
  const g = toNum(els.glucose.value);
  els.foodSuggestion.textContent = isNaN(g)
    ? 'Informe glicemia para sugestões'
    : suggestFoodForBG(g);
});

// busca alimentos
function calcCG(ig, carbs){ return +((ig * carbs) / 100).toFixed(1); }
els.searchBtn.addEventListener('click', () => {
  const q = (els.searchFood.value || '').toLowerCase();
  const res = FOOD_DB.filter(f =>
    f.name.toLowerCase().includes(q) || q === ''
  );
  if(!res.length){
    els.foodResults.textContent = 'Nenhum alimento.';
    return;
  }
  els.foodResults.innerHTML = res.map(f => {
    const cg = calcCG(f.ig, f.carbs);
    return `<div><strong>${f.name}</strong> — ${f.carbs}g CHO • IG ${f.ig} • CG ${cg}<br>
      <em>Substituições:</em> ${f.subs.join(', ')}</div>`;
  }).join('<hr>');
});

// perguntas modeladas
els.qaButtons.forEach(btn => btn.addEventListener('click', e => {
  const txt = e.currentTarget.dataset.q.toLowerCase();
  if(/hipo|65|<70/.test(txt)){
    els.qaResponse.textContent =
      'BG baixo (<70): 15–20g de açúcares simples. Reavalie em 15 min.';
    return;
  }
  const nums = (txt.match(/\d{1,3}/g) || []).map(Number);
  if(!profile){
    els.qaResponse.textContent = 'Configure o perfil.';
    return;
  }
  const [g, c] = [nums[0]||0, nums[1]||0];
  const calc = calculateInsulin({ glucose: g, carbs: c });
  els.qaResponse.textContent =
    `Estimativa: ${calc.insulin} U (refeição ${calc.doseMeal} + correção ${calc.doseCorr}).`;
}));

// histórico e gráfico
function renderHistory(){
  const h = loadHistory();
  els.historyList.innerHTML = h.length === 0
    ? '<div class="muted">Nenhum registro ainda.</div>'
    : `<table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th>Quando</th>
            <th>Glicemia</th>
            <th>Carboidratos (g)</th>
            <th>Unidade</th>
            <th>Insulina</th>
            <th>Refeição</th>
          </tr>
        </thead>
        <tbody>
          ${h.map(r => `
            <tr>
              <td>${new Date(r.ts).toLocaleString()}</td>
              <td>${r.glucose}</td>
              <td>${r.carbs}</td>
              <td>${r.unit || '—'}</td>
              <td>${r.insulin}</td>
              <td>${r.meal}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  renderTrend();
}

function renderTrend(){
  const ctx = els.trendCanvas.getContext('2d');
  const w = els.trendCanvas.clientWidth, h = els.trendCanvas.height;
  els.trendCanvas.width = w;
  ctx.clearRect(0, 0, w, h);
  const data = loadHistory().slice(0, 20).reverse();
  if(!data.length) return;
  const vals = data.map(d => d.glucose);
  const max = Math.max(...vals, 300), min = Math.min(...vals, 40);
  const pad  = 10, stepX = (w - pad*2) / (vals.length - 1 || 1);
  ctx.lineWidth = 2; ctx.strokeStyle = '#06b6d4'; ctx.beginPath();
  vals.forEach((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / (max - min || 1)) * (h - pad*2);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    ctx.fillStyle = '#06b6d4'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 2*Math.PI); ctx.fill();
  });
  ctx.stroke();
}

// export CSV
els.exportCsv.addEventListener('click', ()=>{
  const h = loadHistory();
  if(!h.length){ alert('Nada para exportar'); return; }
  const rows = [
    ['data','glicemia','carboidratos (g)','unidade','insulina','refeicao'],
    ...h.map(r => [r.ts, r.glucose, r.carbs, r.unit, r.insulin, r.meal])
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'historico.csv';
  a.click();
  URL.revokeObjectURL(url);
  flash('CSV gerado');
});

// limpar histórico
els.clearHistory.addEventListener('click', ()=>{
  if(!confirm('Limpar todo o histórico?')) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  flash('Histórico limpo');
});

// toast helper
let toastTimer;
function flash(msg){
  clearTimeout(toastTimer);
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  document.body.appendChild(d);
  toastTimer = setTimeout(() => d.remove(), 1800);
}

// init
renderHistory();
populateProfileForm();

// preenchimento automático e scroll
els.foodResults.addEventListener('click', e => {
  const div = e.target.closest('div');
  if(!div) return;
  const name = div.querySelector('strong')?.textContent;
  if(!name) return;
  const entry = FOOD_DB.find(f => f.name === name);
  if(entry){
    els.food.value = name;
    els.carbs.value = entry.carbs;
    flash('Alimento preenchido');
  }
});
els.food.addEventListener('change', ()=>{
  const entry = FOOD_DB.find(f => f.name === els.food.value);
  if(entry) els.carbs.value = entry.carbs;
});
els.editProfileBtn.addEventListener('click', ()=>{
  window.scrollTo({ top: 0, behavior: 'smooth' });
  flash('Rolei para o perfil');
});
[els.glucose, els.carbs].forEach(i => {
  if(!i) return;
  i.addEventListener('keydown', e => {
    if(e.key === 'Enter') onCalculate();
  });
});