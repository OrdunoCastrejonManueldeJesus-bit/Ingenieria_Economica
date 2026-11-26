const $ = id => document.getElementById(id);
const mode = document.body.dataset.mode;
const money = x => MONEDA.fmt(x);
const pct = x => (x*100).toFixed(2) + ' %';

function generar(){
  let n = Math.min(30, Math.max(1, parseInt($('n').value) || 1));
  $('n').value = n;
  const old = [...document.querySelectorAll('.flujo')].map(i => i.value);
  $('flujos').innerHTML = '<div class="scroll"><table class="grid"><thead><tr><th>Año</th><th>Flujo de efectivo (<span class="mon">' + MONEDA.codigo + '</span>)</th></tr></thead><tbody>' +
    Array.from({length:n}, (_,t) => `<tr><th>${t+1}</th><td><input class="flujo" type="number" step="any" required placeholder="Ej. 3000" aria-label="Flujo año ${t+1}" value="${old[t] ?? ''}"></td></tr>`).join('') +
    '</tbody></table></div>';
}

function leer(){
  const inv = parseFloat($('inv').value);
  const F = [...document.querySelectorAll('.flujo')].map(i => parseFloat(i.value));
  const i = $('tasa') ? parseFloat($('tasa').value) / 100 : 0;
  if (isNaN(inv) || inv <= 0) return {error:'Escribe una inversión inicial mayor que 0.'};
  const falta = F.findIndex(isNaN);
  if (!F.length || falta >= 0) { const el = document.querySelectorAll('.flujo')[Math.max(falta,0)]; if (el) el.focus(); return {error:'Escribe el flujo de efectivo del año ' + (falta + 1) + ' (y los demás años vacíos).'}; }
  if ($('tasa') && mode !== 'tir' && (isNaN(i) || i < 0)) return {error:'Escribe una tasa válida (0 o mayor).'};
  return {inv, F, i};
}

const vpn = (i, inv, F) => F.reduce((s, f, t) => s + f / Math.pow(1 + i, t + 1), -inv);

function pri(inv, F, i){
  const filas = []; let acum = 0, res = null;
  F.forEach((f, t) => {
    const prev = acum; acum += f;
    filas.push([t+1, f, acum]);
    if (res === null && acum >= inv) res = t + (inv - prev) / f;
  });
  let html = res === null
    ? '<p class="big bad">No se recupera</p><p>Con los flujos dados, la inversión no se recupera en el horizonte.</p>'
    : `<p class="big ok">${res.toFixed(2)} años</p><p>Equivale a ${Math.floor(res)} años y ${Math.round((res % 1) * 12)} meses aprox.</p>`;
  html += '<div class="scroll"><table><tr><th>Año</th><th>Flujo</th><th>Acumulado</th><th>Pendiente</th></tr>' +
    filas.map(r => `<tr><td>${r[0]}</td><td>${money(r[1])}</td><td>${money(r[2])}</td><td>${money(Math.max(0, inv - r[2]))}</td></tr>`).join('') + '</table></div>';
  return html;
}

function vpnHtml(inv, F, i){
  const v = vpn(i, inv, F);
  return `<p class="big ${v >= 0 ? 'ok' : 'bad'}">${money(v)}</p>
    <p>${v > 0 ? 'VPN positivo: el proyecto es aceptable.' : v < 0 ? 'VPN negativo: se rechaza el proyecto.' : 'VPN = 0: es indiferente.'}</p>
    <div class="scroll"><table><tr><th>Año</th><th>Flujo</th><th>Valor presente</th></tr>` +
    F.map((f, t) => `<tr><td>${t+1}</td><td>${money(f)}</td><td>${money(f / Math.pow(1 + i, t + 1))}</td></tr>`).join('') + '</table></div>';
}

function vae(inv, F, i){
  const n = F.length, v = vpn(i, inv, F);
  const fac = i === 0 ? 1 / n : i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
  const a = v * fac;
  return `<p class="big ${a >= 0 ? 'ok' : 'bad'}">${money(a)} / año</p>
    <p>VPN = ${money(v)} × factor A/P (${fac.toFixed(6)})</p>
    <p>${a > 0 ? 'VAE positivo: el proyecto es aceptable.' : a < 0 ? 'VAE negativo: se rechaza el proyecto.' : 'VAE = 0: es indiferente.'}</p>`;
}

function tir(inv, F){
  let lo = -0.99, hi = 10;
  if (vpn(lo, inv, F) * vpn(hi, inv, F) > 0)
    return '<p class="err">No existe una TIR calculable: los flujos no cambian de signo (la suma de flujos no cubre la inversión, o no hay raíz entre -99 % y 1000 %).</p>';
  for (let k = 0; k < 300; k++){
    const mid = (lo + hi) / 2;
    if (vpn(lo, inv, F) * vpn(mid, inv, F) <= 0) hi = mid; else lo = mid;
  }
  const r = (lo + hi) / 2;
  let html = `<p class="big ok">${pct(r)}</p><p>Es la tasa que hace el VPN igual a 0.</p>`;
  const tmar = $('tmar') && $('tmar').value !== '' ? parseFloat($('tmar').value) / 100 : null;
  if (tmar !== null && !isNaN(tmar))
    html += `<p class="${r >= tmar ? 'ok' : 'bad'}">${r >= tmar ? 'TIR ≥ TMAR: el proyecto es aceptable.' : 'TIR < TMAR: se rechaza el proyecto.'}</p>`;
  return html;
}

function calcular(e){
  e.preventDefault();
  const d = leer(), out = $('res');
  out.hidden = false;
  if (d.error){ out.innerHTML = `<p class="err">${d.error}</p>`; return; }
  out.innerHTML = {pri, vpn: vpnHtml, vae, tir}[mode](d.inv, d.F, d.i);
}

$('gen').addEventListener('click', generar);
$('n').addEventListener('change', generar);
$('limpiar').addEventListener('click', () => {
  $('f').reset();
  generar();
  $('res').hidden = true;
  $('res').innerHTML = '';
  $('inv').focus();
});
$('f').addEventListener('submit', calcular);
document.addEventListener('moneda', () => {
  if (!$('res').hidden) $('f').dispatchEvent(new Event('submit', {cancelable:true}));
});
generar();
