(function () {
  const routes = {
    dashboard: { view: 'views/dashboard.html', script: 'js/pages/dashboard.js', init: 'initDashboard' },
    produtos: { view: 'views/produtos.html', script: 'js/pages/produtos.js', init: 'initProdutos' },
    precificacao: { view: 'views/precificacao.html', script: 'js/pages/precificacao.js', init: 'initPrecificacao' },
    sku: { view: 'views/sku.html', script: 'js/pages/sku.js', init: 'initSku' }
  };

  const DEFAULT_ROUTE = 'dashboard';
  let currentRoute = null;
  const loadedScripts = new Set();

  const contentEl = document.getElementById('app-content');
  const navItems = document.querySelectorAll('.nav-item[data-route]');

  function getRouteFromHash() {
    const hash = location.hash.replace(/^#\/?/, '');
    return routes[hash] ? hash : DEFAULT_ROUTE;
  }

  function updateSidebar(route) {
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.route === route);
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (loadedScripts.has(src)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = function () {
        loadedScripts.add(src);
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async function navigate(route) {
    if (!routes[route]) route = DEFAULT_ROUTE;
    if (route === currentRoute) return;

    contentEl.innerHTML = '<div class="app-loading">Carregando...</div>';

    try {
      const response = await fetch(routes[route].view);
      if (!response.ok) throw new Error('View não encontrada');
      const html = await response.text();

      contentEl.innerHTML = html;
      updateSidebar(route);

      await loadScript(routes[route].script);

      const initFn = window[routes[route].init];
      if (typeof initFn === 'function') initFn();

      currentRoute = route;
    } catch (err) {
      contentEl.innerHTML = '<div class="app-loading">Erro ao carregar a página. <a href="#/dashboard" style="color:var(--gold)">Voltar ao Dashboard</a></div>';
      console.error(err);
    }
  }

  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      if (location.hash !== '#/' + item.dataset.route) {
        location.hash = '#/' + item.dataset.route;
      } else {
        navigate(item.dataset.route);
      }
    });
  });

  window.addEventListener('hashchange', function () {
    navigate(getRouteFromHash());
  });

  const initialRoute = getRouteFromHash();
  if (!location.hash) {
    location.hash = '#/' + initialRoute;
  } else {
    navigate(initialRoute);
  }
})();
