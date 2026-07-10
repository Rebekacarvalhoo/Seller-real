const platsAtivas = { ml: true, shopee: true, tiktok: true };
const precos = { ml: 0, shopee: 0, tiktok: 0 };
let historico = JSON.parse(localStorage.getItem('sr-precificacao') || '[]');

function togglePlat(plat) {
  platsAtivas[plat] = !platsAtivas[plat];
  const btn = document.getElementById('btn-' + plat);
  btn.classList.toggle('on', platsAtivas[plat]);
  document.getElementById('card-' + plat).classList.toggle('inativo', !platsAtivas[plat]);
  calcular();
}

function calcularPrecoML(custo, emb, margem, adsPct, impPct) {
  const comissao = parseFloat(document.getElementById('ml-tipo').value);
  // frete estimado como % do preço — varia por faixa, usamos iteração
  // p = (custo + emb) / (1 - comissao - adsPct - impPct - fretePct - margem)
  // frete: 0 se p<=79, 5% se p<=199, 7% se p>199 — iterar 3x converge
  let p = (custo + emb) / (1 - comissao - adsPct - impPct - margem);
  for (let i = 0; i < 5; i++) {
    const frete = p <= 79 ? 0 : p <= 199.99 ? 0.05 : 0.07;
    p = (custo + emb) / (1 - comissao - frete - adsPct - impPct - margem);
  }
  const frete = p <= 79 ? 0 : p <= 199.99 ? p * 0.05 : p * 0.07;
  return { preco: p, comissao: p * comissao, frete, ads: p * adsPct, imp: p * impPct };
}

function calcularPrecoShopee(custo, emb, margem, adsPct, impPct) {
  const campanha = parseFloat(document.getElementById('shopee-camp').value);
  // comissao por faixa + taxa fixa — iterar
  let p = (custo + emb) / (1 - 0.20 - campanha - adsPct - impPct - margem);
  for (let i = 0; i < 5; i++) {
    let com, fixo;
    if (p < 80) { com = 0.20; fixo = 4; }
    else if (p < 100) { com = 0.14; fixo = 16; }
    else if (p < 200) { com = 0.14; fixo = 20; }
    else { com = 0.14; fixo = 26; }
    p = (custo + emb + fixo) / (1 - com - campanha - adsPct - impPct - margem);
  }
  let com, fixo;
  if (p < 80) { com = 0.20; fixo = 4; }
  else if (p < 100) { com = 0.14; fixo = 16; }
  else if (p < 200) { com = 0.14; fixo = 20; }
  else { com = 0.14; fixo = 26; }
  return { preco: p, comissao: p * (com + campanha), fixo, ads: p * adsPct, imp: p * impPct };
}

function calcularPrecoTikTok(custo, emb, margem, adsPct, impPct) {
  const afil = parseFloat(document.getElementById('tiktok-afil').value || 0) / 100;
  let p = (custo + emb) / (1 - 0.06 - afil - adsPct - impPct - margem);
  for (let i = 0; i < 3; i++) {
    const fixo = p < 79 ? 2 : 0;
    p = (custo + emb + fixo) / (1 - 0.06 - afil - adsPct - impPct - margem);
  }
  const fixo = p < 79 ? 2 : 0;
  return { preco: p, comissao: p * 0.06, afil: p * afil, fixo, ads: p * adsPct, imp: p * impPct };
}

function fmtR(n) { return 'R$ ' + Math.abs(n).toFixed(2); }
function fmtP(p) { return 'R$ ' + p.toFixed(2); }

function renderDetalhes(id, dados, custo, emb, margem) {
  const el = document.getElementById('detalhes-' + id);
  const lucro = dados.preco * margem;
  const rows = [
    ['Custo produto', fmtR(custo), 'neg'],
    ['Embalagem', fmtR(emb), 'neg'],
    ['Comissão', fmtR(dados.comissao), 'neg'],
    dados.frete > 0 ? ['Frete', fmtR(dados.frete), 'neg'] : null,
    dados.fixo > 0 ? ['Taxa fixa', fmtR(dados.fixo), 'neg'] : null,
    dados.afil > 0 ? ['Afiliado', fmtR(dados.afil), 'neg'] : null,
    ['Ads', fmtR(dados.ads), 'neg'],
    ['Imposto', fmtR(dados.imp), 'neg'],
  ].filter(Boolean);

  el.innerHTML = rows.map(([l, v, c]) =>
    `<div class="res-row"><span class="res-row-label">${l}</span><span class="res-row-val ${c}">- ${v}</span></div>`
  ).join('') +
  `<div class="res-row lucro"><span class="res-row-label">Seu lucro</span><span class="res-row-val pos">${fmtR(lucro)}</span></div>`;
}

function calcular() {
  const custo = parseFloat(document.getElementById('custo').value) || 0;
  const emb = parseFloat(document.getElementById('embalagem').value) || 0;
  const margem = parseFloat(document.getElementById('margem').value) / 100;
  const adsPct = parseFloat(document.getElementById('ads').value) / 100;
  const impPct = parseFloat(document.getElementById('imposto').value) / 100;

  const aviso = document.getElementById('aviso');

  if (margem + adsPct + impPct >= 0.85) {
    aviso.style.display = 'block';
    document.getElementById('aviso-msg').textContent = 'A soma de margem + ads + imposto está muito alta. Ajuste os valores.';
    return;
  }
  aviso.style.display = 'none';

  const ml = calcularPrecoML(custo, emb, margem, adsPct, impPct);
  const sh = calcularPrecoShopee(custo, emb, margem, adsPct, impPct);
  const tt = calcularPrecoTikTok(custo, emb, margem, adsPct, impPct);

  precos.ml = ml.preco;
  precos.shopee = sh.preco;
  precos.tiktok = tt.preco;

  // menor preço = melhor pra competitividade
  const menorPreco = Math.min(
    platsAtivas.ml ? ml.preco : Infinity,
    platsAtivas.shopee ? sh.preco : Infinity,
    platsAtivas.tiktok ? tt.preco : Infinity
  );

  document.getElementById('preco-ml').textContent = fmtP(ml.preco);
  document.getElementById('preco-shopee').textContent = fmtP(sh.preco);
  document.getElementById('preco-tiktok').textContent = fmtP(tt.preco);

  renderDetalhes('ml', ml, custo, emb, margem);
  renderDetalhes('shopee', sh, custo, emb, margem);
  renderDetalhes('tiktok', tt, custo, emb, margem);

  ['ml','shopee','tiktok'].forEach(p => {
    const isMelhor = platsAtivas[p] && precos[p] === menorPreco;
    document.getElementById('badge-' + p).style.display = isMelhor ? 'block' : 'none';
    document.getElementById('card-' + p).classList.toggle('melhor', isMelhor);
  });

  // Aviso margem baixa
  if (margem < 0.08) {
    aviso.style.display = 'block';
    document.getElementById('aviso-msg').textContent = `Margem de ${(margem*100).toFixed(0)}% está muito baixa. Recomendamos no mínimo 25% para cobrir imprevistos.`;
  }
}

function copiarPreco(plat) {
  const preco = precos[plat].toFixed(2).replace('.', ',');
  navigator.clipboard.writeText('R$ ' + preco).then(() => {
    const btn = document.querySelector(`#card-${plat} .copiar-btn`);
    btn.textContent = '✓ Copiado!';
    setTimeout(() => btn.textContent = '📋 Copiar preço', 1500);
  });
}

function salvarHistorico() {
  const nome = document.getElementById('nome-prod').value || 'Produto sem nome';
  const margem = document.getElementById('margem').value;
  const item = {
    nome,
    margem,
    precos: { ...precos },
    plats: { ...platsAtivas },
    data: new Date().toLocaleDateString('pt-BR'),
  };
  historico.unshift(item);
  if (historico.length > 20) historico.pop();
  localStorage.setItem('sr-precificacao', JSON.stringify(historico));
  renderHistorico();
}

function limparHistorico() {
  if (confirm('Limpar todo o histórico?')) {
    historico = [];
    localStorage.setItem('sr-precificacao', JSON.stringify(historico));
    renderHistorico();
  }
}

function removerHistorico(i) {
  historico.splice(i, 1);
  localStorage.setItem('sr-precificacao', JSON.stringify(historico));
  renderHistorico();
}

function renderHistorico() {
  const el = document.getElementById('historico-lista');
  if (historico.length === 0) {
    el.innerHTML = '<div class="empty-hist">Nenhuma precificação salva ainda.</div>';
    return;
  }
  el.innerHTML = historico.map((h, i) => {
    const platsStr = Object.entries(h.plats).filter(([,v])=>v).map(([k])=>k.toUpperCase()).join(' · ');
    const precoMin = Math.min(...Object.values(h.precos).filter(v=>v>0));
    return `<div class="hist-item">
      <div style="flex:1;">
        <div class="hist-nome">${h.nome}</div>
        <div class="hist-plat">${platsStr} · ${h.data} · margem ${h.margem}%</div>
      </div>
      <div class="hist-preco">a partir de R$ ${precoMin.toFixed(2)}</div>
      <button class="hist-del" onclick="removerHistorico(${i})">✕</button>
    </div>`;
  }).join('');
}

function initPrecificacao() {
  calcular();
  renderHistorico();
}
