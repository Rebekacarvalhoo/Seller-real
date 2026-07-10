function selectEmpresa(el, empresa) {
  document.querySelectorAll('.empresa-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');

  const dados = {
    todas:   { bruto: 'R$ 84.320', liquido: 'R$ 31.640', pedidos: '1.248', ticket: 'R$ 67,56' },
    fashion: { bruto: 'R$ 41.200', liquido: 'R$ 15.850', pedidos: '612',   ticket: 'R$ 67,32' },
    beyou:   { bruto: 'R$ 28.540', liquido: 'R$ 10.440', pedidos: '389',   ticket: 'R$ 73,37' },
    rgkids:  { bruto: 'R$ 14.580', liquido: 'R$ 5.350',  pedidos: '247',   ticket: 'R$ 59,03' },
  };

  const d = dados[empresa];
  document.getElementById('kpi-bruto').textContent = d.bruto;
  document.getElementById('kpi-liquido').textContent = d.liquido;
  document.getElementById('kpi-pedidos').textContent = d.pedidos;
  document.getElementById('kpi-ticket').textContent = d.ticket;
}

function filterMkt(val) {
  const cards = { ml: 'card-ml', shopee: 'card-shopee', tiktok: 'card-tiktok' };
  if (val === 'todos') {
    Object.values(cards).forEach(id => document.getElementById(id).style.display = '');
  } else {
    Object.entries(cards).forEach(([k, id]) => {
      document.getElementById(id).style.display = (k === val) ? '' : 'none';
    });
  }
}

function initDashboard() {
  // funções já globais
}
