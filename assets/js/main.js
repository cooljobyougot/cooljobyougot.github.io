(function(){
  // Theme
  var KEY = 'lc_theme';
  var toggle = document.getElementById('themeToggle');
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch(e){}
  }
  function getTheme(){
    try { return localStorage.getItem(KEY); } catch(e){ return null; }
  }
  if (!getTheme()){
    try{
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }catch(e){}
  }
  if (toggle){
    toggle.addEventListener('click', function(){
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Smooth scroll for data-scroll links (keeps URL hash)
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[data-scroll]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    var el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({behavior:'smooth', block:'start'});
    history.pushState(null, '', href);
  });

  // Cookie consent
  var CONSENT_KEY = 'lc_cookie_consent'; // accepted | rejected
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieAccept');
  var rejectBtn = document.getElementById('cookieReject');
  var settingsBtn = document.getElementById('cookieSettings');
  function getConsent(){ try { return localStorage.getItem(CONSENT_KEY); } catch(e){ return null; } }
  function setConsent(v){ try { localStorage.setItem(CONSENT_KEY, v); } catch(e){} }
  function showBanner(){ if (banner) banner.style.display = 'block'; }
  function hideBanner(){ if (banner) banner.style.display = 'none'; }
  if (!getConsent()) showBanner();
  if (acceptBtn) acceptBtn.addEventListener('click', function(){ setConsent('accepted'); hideBanner(); });
  if (rejectBtn) rejectBtn.addEventListener('click', function(){ setConsent('rejected'); hideBanner(); });
  if (settingsBtn) settingsBtn.addEventListener('click', function(e){ e.preventDefault(); showBanner(); });

  // Set year
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();
