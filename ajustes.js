/* Ajustes compartidos: modo claro/oscuro y moneda (MXN, USD, EUR) */
(function(){
  var h = document.documentElement;

  /* ---------- Tema ---------- */
  var tema;
  try { tema = localStorage.getItem('tema'); } catch (e) {}
  if (tema !== 'dark' && tema !== 'light')
    tema = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  h.dataset.theme = tema;

  function pintarTema(){
    var b = document.getElementById('tema');
    if (b) b.textContent = h.dataset.theme === 'dark' ? '☀ Modo claro' : '☾ Modo oscuro';
  }
  document.addEventListener('click', function(e){
    if (!e.target.closest || !e.target.closest('#tema')) return;
    h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('tema', h.dataset.theme); } catch (err) {}
    pintarTema();
  });

  /* ---------- Moneda ---------- */
  var SIM = {MXN:'$', USD:'US$', EUR:'€'}, cod = 'MXN';
  try { var g = localStorage.getItem('moneda'); if (SIM[g]) cod = g; } catch (e) {}

  var M = window.MONEDA = {
    codigo: cod,
    fmt: function(x){
      var s = Math.abs(x).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2});
      return (x < 0 && Math.round(Math.abs(x) * 100) > 0 ? '-' : '') + SIM[M.codigo] + s;
    },
    pintar: function(){
      document.querySelectorAll('.mon').forEach(function(e){ e.textContent = M.codigo; });
      var s = document.getElementById('moneda'); if (s) s.value = M.codigo;
    }
  };

  function iniciar(){
    pintarTema();
    M.pintar();
    var s = document.getElementById('moneda');
    if (!s) return;
    s.addEventListener('change', function(){
      M.codigo = s.value;
      try { localStorage.setItem('moneda', M.codigo); } catch (e) {}
      M.pintar();
      document.dispatchEvent(new Event('moneda'));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
