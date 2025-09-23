// Keys
const resetProfileBtn = document.getElementById('reset-profile');
const profileSummary = document.getElementById('profile-summary');


const glucoseIn = document.getElementById('glucose');
const carbsIn = document.getElementById('carbs');
const calcBtn = document.getElementById('calc-btn');
const corrOnlyBtn = document.getElementById('correction-only');
const resultBox = document.getElementById('result');
const resultText = document.getElementById('result-text');
const resultBreak = document.getElementById('result-breakdown');


const historyContainer = document.getElementById('history');
const exportCsvBtn = document.getElementById('export-csv');
const clearHistoryBtn = document.getElementById('clear-history');
const lastUpdate = document.getElementById('last-update');
const miniChart = document.getElementById('mini-chart');


// Theme handling
function setTheme(theme){
if(theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
else document.documentElement.removeAttribute('data-theme');
toggleThemeBtn.setAttribute('aria-pressed', theme==='dark');
localStorage.setItem('theme', theme);
}
toggleThemeBtn.addEventListener('click', ()=>{
const current = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
setTheme(current === 'dark' ? 'light' : 'dark');
});
// restore theme
setTheme(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');


// small util: safe number parse
const toNum = v => (v==null || v === '') ? NaN : Number(v);


// rounding helper
function roundTo(value, step){
const s = Number(step) || 0.5;
return Math.round(value / s) * s;
}


// Load profile
let profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
function showProfileSummary(){
if(!profile){ profileSummary.textContent = 'Perfil não configurado'; return; }
profileSummary.textContent = `${profile.carbRatio}g/U · sens=${profile.sensitivity} · meta ${profile.target}mg/dL`;
}
function populateProfileForm(){
if(!profile) return;
ageIn.value = profile.age || '';
weightIn.value = profile.weight || '';
carbRatioIn.value = profile.carbRatio || '';
sensitivityIn.value = profile.sensitivity || '';
targetIn.value = profile.target || '';
roundingIn.value = profile.rounding || '0.5';
showProfileSummary();
}
populateProfileForm();


// Save profile
saveProfileBtn.addEventListener('click', ()=>{
const age = toNum(ageIn.value), weight = toNum(weightIn.value);
const carbRatio = toNum(carbRatioIn.value), sensitivity = toNum(sensitivityIn.value);
const target = toNum(targetIn.value), rounding = roundingIn.value;


if(!carbRatio || !sensitivity || !target){
alert('Preencha razão insulina/carb, fator de sensibilidade e meta antes de salvar.');
return;
}
profile = {age, weight, carbRatio, sensitivity, target, rounding};
localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
showProfileSummary();
flash('Perfil salvo');
});


resetProfileBtn.addEventListene