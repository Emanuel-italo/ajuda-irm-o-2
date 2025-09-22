// Seletor de seções
const profileSection = document.getElementById('profile-section');
const appSection     = document.getElementById('app-section');

// Campos de perfil
const ageIn          = document.getElementById('age');
const weightIn       = document.getElementById('weight');
const carbRatioIn    = document.getElementById('carbRatio');
const sensitivityIn  = document.getElementById('sensitivity');
const saveProfileBtn = document.getElementById('save-profile');

// Campos de refeição
const glucoseIn   = document.getElementById('glucose');
const carbsIn     = document.getElementById('carbs');
const calcBtn     = document.getElementById('calc-btn');
const resultP     = document.getElementById('result');
const historyList = document.getElementById('history');

// Verifica se há perfil salvo
let profile = JSON.parse(localStorage.getItem('diabetesProfile'));
if (profile) {
  showApp();
  renderHistory();
}

// Salva perfil no localStorage
saveProfileBtn.onclick = () => {
  profile = {
    age: +ageIn.value,
    weight: +weightIn.value,
    carbRatio: +carbRatioIn.value,
    sensitivity: +sensitivityIn.value,
    target: 100 // meta fixa, você pode tornar editável
  };
  localStorage.setItem('diabetesProfile', JSON.stringify(profile));
  showApp();
};

// Mostra seção principal
function showApp() {
  profileSection.hidden = true;
  appSection.hidden     = false;
}

// Cálculo e registro
calcBtn.onclick = () => {
  const glucose = +glucoseIn.value;
  const carbs   = +carbsIn.value;

  // Insulina de refeição e correção
  const doseMeal = carbs / profile.carbRatio;
  const doseCorr = glucose > profile.target
    ? (glucose - profile.target) / profile.sensitivity
    : 0;
  const insulin = +(doseMeal + doseCorr).toFixed(1);

  // Exibe resultado
  resultP.textContent = `Dose recomendada: ${insulin} U`;

  // Salva no histórico
  const record = {
    timestamp: new Date().toLocaleString(),
    glucose, carbs, insulin
  };
  const history = JSON.parse(localStorage.getItem('diabetesHistory') || '[]');
  history.unshift(record);
  localStorage.setItem('diabetesHistory', JSON.stringify(history));
  renderHistory();
};

// Renderiza histórico
function renderHistory() {
  const history = JSON.parse(localStorage.getItem('diabetesHistory') || '[]');
  historyList.innerHTML = history
    .map(r => `<li>[${r.timestamp}] GL ${r.glucose} | CHO ${r.carbs}g → ${r.insulin}U</li>`)
    .join('');
}
