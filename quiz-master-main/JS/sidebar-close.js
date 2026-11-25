/* sidebar-close.js — زرار ✕ + الضغط برّه + Esc لقفل السايدبار على الموبايل */
(function () {
  var sb = document.querySelector('.sidebar');
  if (!sb) return;

  var bd = document.createElement('div');
  bd.className = 'sidebar-backdrop';
  document.body.appendChild(bd);

  var x = document.createElement('button');
  x.type = 'button';
  x.className = 'sidebar-close';
  x.setAttribute('aria-label', 'Close menu');
  x.textContent = '✕';
  sb.appendChild(x);

  function sync() { bd.classList.toggle('show', sb.classList.contains('open')); }
  function close() { sb.classList.remove('open'); }

  new MutationObserver(sync).observe(sb, { attributes: true, attributeFilter: ['class'] });
  x.addEventListener('click', close);
  bd.addEventListener('click', close);
  sb.addEventListener('click', function (e) { if (e.target.closest('.nav-link')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();