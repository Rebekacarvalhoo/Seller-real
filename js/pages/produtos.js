let produtos = JSON.parse(localStorage.getItem('sr-produtos') || '[]');
let editandoIndex = -1;

function slugify(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9\s]/g,'').trim()
    .split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function gerarSKU() {
  const nome = document.getElementById('nome').value;
  const variacoes = document.querySelectorAll('#variacoes-wrap .variacao-row');
  const preview = document.getElementById('sku-previews');
  preview.innerHTML = '';

  if (!nome) return;

  variacoes.forEach((row, i) => {
    const cor = row.querySelectorAll('input')[0]?.value || '';
    const tam = row.querySelector('select')?.value || '';
    let sku = slugify(nome);
    if (cor) sku += '-' + slugify(cor);
    if (tam) sku += '-' + tam;

    const box = document.createElement('div');
    box.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
    box.innerHTML = `
      <div class="sku-preview-box" style="flex:1;">${sku}</div>
      <button class="btn btn-outline btn-sm" onclick="copiarSKU('${sku}', this)">Copiar</button>
    `;
    preview.appendChild(box);
  });

  if (variacoes.length === 0) {
    const sku = slugify(nome);
    preview.innerHTML = `<div class="sku-preview-box">${sku}</div>`;
  }
}

function copiarSKU(sku, btn) {
  navigator.clipboard.writeText(sku);
  btn.textContent = '✓ Copiado';
  setTimeout(() => btn.textContent = 'Copiar', 1500);
}

function calcularCustos() {
  const c1 = parseFloat(document.getElementById('kit1-custo').value) || 0;
  const c2 = parseFloat(document.getElementById('kit2-custo').value) || 0;
  const c3 = parseFloat(document.getElementById('kit3-custo').value) || 0;

  if (c1 > 0 && c2 === 0) {
    document.getElementById('kit2-hint').textContent = `Sugestão: R$ ${(c1*2).toFixed(2)}`;
  }
  if (c1 > 0 && c3 === 0) {
    document.getElementById('kit3-hint').textContent = `Sugestão: R$ ${(c1*3).toFixed(2)}`;
  }

  const box = document.getElementById('custo-box');
  const det = document.getElementById('custo-detalhes');

  if (c1 > 0 || c2 > 0 || c3 > 0) {
    box.style.display = 'block';
    let html = '';
    if (c1 > 0) html += `<div class="custo-row"><span class="custo-row-label">Kit 1 (unitário)</span><span class="custo-row-val">R$ ${c1.toFixed(2)}</span></div>`;
    if (c2 > 0) html += `<div class="custo-row"><span class="custo-row-label">Kit 2 — custo por peça</span><span class="custo-row-val">R$ ${(c2/2).toFixed(2)}</span></div>`;
    if (c3 > 0) html += `<div class="custo-row"><span class="custo-row-label">Kit 3 — custo por peça</span><span class="custo-row-val">R$ ${(c3/3).toFixed(2)}</span></div>`;
    det.innerHTML = html;
  } else {
    box.style.display = 'none';
  }
}

function selecionarTipo(tipo, btn) {
  document.querySelectorAll('.tipo-btn').forEach(b => b.className = 'tipo-btn');
  btn.className = `tipo-btn selected-${tipo === 'fabricado' ? 'fab' : tipo === 'revendido' ? 'rev' : 'mix'}`;
  document.getElementById('tipo-valor').value = tipo;
}

function adicionarVariacao() {
  const wrap = document.getElementById('variacoes-wrap');
  const idx = wrap.children.length;
  const div = document.createElement('div');
  div.className = 'variacao-row';
  div.dataset.index = idx;
  div.innerHTML = `
    <div class="form-group" style="gap:4px;">
      <span class="form-label" style="font-size:10px;">Cor</span>
      <input class="form-input" type="text" placeholder="Ex: Rosa" oninput="gerarSKU()" style="padding:7px 10px;font-size:13px;">
    </div>
    <div class="form-group" style="gap:4px;">
      <span class="form-label" style="font-size:10px;">Tamanho</span>
      <select class="form-select" oninput="gerarSKU()" style="padding:7px 10px;font-size:13px;">
        <option value="">Único</option>
        <option>PP</option><option>P</option><option>M</option>
        <option>G</option><option>GG</option><option>XGG</option>
        <option>2</option><option>4</option><option>6</option>
        <option>8</option><option>10</option><option>12</option>
        <option>14</option><option>16</option>
      </select>
    </div>
    <button class="btn-remove" onclick="removerVariacao(this)">✕</button>
  `;
  wrap.appendChild(div);
  gerarSKU();
}

function removerVariacao(btn) {
  const wrap = document.getElementById('variacoes-wrap');
  if (wrap.children.length > 1) {
    btn.closest('.variacao-row').remove();
    gerarSKU();
  }
}

function abrirModal(index = -1) {
  editandoIndex = index;
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-titulo').textContent = index === -1 ? 'Novo produto' : 'Editar produto';

  if (index === -1) {
    limparForm();
  } else {
    preencherForm(produtos[index]);
  }
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function fecharModalFora(e) {
  if (e.target === document.getElementById('modal-overlay')) fecharModal();
}

function limparForm() {
  document.getElementById('nome').value = '';
  document.getElementById('kit1-custo').value = '';
  document.getElementById('kit2-custo').value = '';
  document.getElementById('kit3-custo').value = '';
  document.getElementById('obs').value = '';
  document.getElementById('tipo-valor').value = 'fabricado';
  document.getElementById('status-prod').value = 'ativo';
  document.querySelectorAll('.tipo-btn').forEach((b,i) => b.className = i===0 ? 'tipo-btn selected-fab' : 'tipo-btn');
  const wrap = document.getElementById('variacoes-wrap');
  wrap.innerHTML = `
    <div class="variacao-row" data-index="0">
      <div class="form-group" style="gap:4px;">
        <span class="form-label" style="font-size:10px;">Cor</span>
        <input class="form-input" type="text" placeholder="Ex: Preto" oninput="gerarSKU()" style="padding:7px 10px;font-size:13px;">
      </div>
      <div class="form-group" style="gap:4px;">
        <span class="form-label" style="font-size:10px;">Tamanho</span>
        <select class="form-select" oninput="gerarSKU()" style="padding:7px 10px;font-size:13px;">
          <option value="">Único</option>
          <option>PP</option><option>P</option><option>M</option>
          <option>G</option><option>GG</option><option>XGG</option>
          <option>2</option><option>4</option><option>6</option>
          <option>8</option><option>10</option><option>12</option>
          <option>14</option><option>16</option>
        </select>
      </div>
      <button class="btn-remove" onclick="removerVariacao(this)">✕</button>
    </div>`;
  document.getElementById('sku-previews').innerHTML = '';
  document.getElementById('custo-box').style.display = 'none';
  document.getElementById('kit2-hint').textContent = '';
  document.getElementById('kit3-hint').textContent = '';
}

function preencherForm(p) {
  document.getElementById('nome').value = p.nome;
  document.getElementById('kit1-custo').value = p.kit1 || '';
  document.getElementById('kit2-custo').value = p.kit2 || '';
  document.getElementById('kit3-custo').value = p.kit3 || '';
  document.getElementById('obs').value = p.obs || '';
  document.getElementById('tipo-valor').value = p.tipo;
  document.getElementById('status-prod').value = p.status;
  gerarSKU();
  calcularCustos();
}

function salvarProduto() {
  const nome = document.getElementById('nome').value.trim();
  if (!nome) { alert('Informe o nome do produto'); return; }

  const variacoes = [];
  document.querySelectorAll('#variacoes-wrap .variacao-row').forEach(row => {
    const cor = row.querySelectorAll('input')[0]?.value || '';
    const tam = row.querySelector('select')?.value || '';
    let sku = slugify(nome);
    if (cor) sku += '-' + slugify(cor);
    if (tam) sku += '-' + tam;
    variacoes.push({ cor, tam, sku });
  });

  const prod = {
    nome,
    categoria: document.getElementById('categoria').value,
    empresa: document.getElementById('empresa').value,
    tipo: document.getElementById('tipo-valor').value,
    kit1: parseFloat(document.getElementById('kit1-custo').value) || 0,
    kit2: parseFloat(document.getElementById('kit2-custo').value) || 0,
    kit3: parseFloat(document.getElementById('kit3-custo').value) || 0,
    obs: document.getElementById('obs').value,
    status: document.getElementById('status-prod').value,
    variacoes,
    criadoEm: new Date().toLocaleDateString('pt-BR'),
  };

  if (editandoIndex === -1) {
    empresas.forEach((emp, i) => {
      const p = { ...prodBase, empresa: emp };
      if (i > 0) { p.variacoes = prodBase.variacoes?.map(v => ({...v, sku: v.sku})); }
      produtos.push(p);
    });
  } else {
    produtos[editandoIndex] = prodBase;
  }

  localStorage.setItem('sr-produtos', JSON.stringify(produtos));
  fecharModal();
  renderTabela();
  atualizarStats();
}

function excluirProduto(index) {
  if (confirm('Excluir este produto?')) {
    produtos.splice(index, 1);
    localStorage.setItem('sr-produtos', JSON.stringify(produtos));
    renderTabela();
    atualizarStats();
  }
}

function toggleStatus(index) {
  produtos[index].status = produtos[index].status === 'ativo' ? 'inativo' : 'ativo';
  localStorage.setItem('sr-produtos', JSON.stringify(produtos));
  renderTabela();
  atualizarStats();
}

function renderTabela(lista = null) {
  const body = document.getElementById('tabela-body');
  const data = lista || produtos;

  if (data.length === 0) {
    body.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="icon">🏷️</div><p>Nenhum produto encontrado.</p></div></td></tr>`;
    return;
  }

  body.innerHTML = data.map((p, i) => {
    const realIdx = lista ? produtos.indexOf(p) : i;
    const tipoBadge = p.tipo === 'fabricado' ? '<span class="badge badge-fab">🧵 Fabricado</span>' :
                      p.tipo === 'revendido' ? '<span class="badge badge-rev">🛒 Revendido</span>' :
                      '<span class="badge badge-mix">⚡ Misto</span>';
    const statusBadge = p.status === 'ativo' ? '<span class="badge badge-ativo">● Ativo</span>' : '<span class="badge badge-inativo">● Inativo</span>';

    const kits = [];
    if (p.kit1 > 0) kits.push('<span class="badge badge-kit">Kit 1</span>');
    if (p.kit2 > 0) kits.push('<span class="badge badge-kit">Kit 2</span>');
    if (p.kit3 > 0) kits.push('<span class="badge badge-kit">Kit 3</span>');

    const variacoes = p.variacoes?.map(v => `${v.cor}${v.tam ? ' '+v.tam : ''}`).filter(Boolean).slice(0,3).join(', ') || '—';
    const skuPrincipal = p.variacoes?.[0]?.sku || slugify(p.nome);
    const maisVar = p.variacoes?.length > 3 ? ` +${p.variacoes.length-3}` : '';

    const custoDisplay = p.kit1 > 0 ? `R$ ${p.kit1.toFixed(2)}` : '—';
    const custoKitDisplay = p.kit2 > 0 || p.kit3 > 0 ?
      [p.kit2>0?`K2: R$${p.kit2.toFixed(2)}`:'', p.kit3>0?`K3: R$${p.kit3.toFixed(2)}`:''].filter(Boolean).join(' · ') : '—';

    return `<tr>
      <td>
        <div class="produto-nome">${p.nome}</div>
        <div class="produto-variacao">${p.empresa} · ${p.categoria}</div>
        ${p.obs ? `<div style="font-size:11px;color:var(--text3);margin-top:2px;">📝 ${p.obs}</div>` : ''}
      </td>
      <td style="font-size:12px;color:var(--text2);">${variacoes}${maisVar ? `<span style="color:var(--text3)"> ${maisVar}</span>` : ''}</td>
      <td><div style="font-family:monospace;font-size:11px;color:var(--text3);">${skuPrincipal}</div></td>
      <td>${tipoBadge}</td>
      <td style="font-size:12px;">${kits.join(' ') || '—'}</td>
      <td class="custo">${custoDisplay}</td>
      <td style="font-size:12px;color:var(--text2);">${custoKitDisplay}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="acoes">
          <button class="btn btn-outline btn-sm" onclick="abrirModal(${realIdx})">✏️</button>
          <button class="btn btn-sm btn-${p.status==='ativo'?'red':'green'}" onclick="toggleStatus(${realIdx})">${p.status==='ativo'?'Pausar':'Ativar'}</button>
          <button class="btn btn-red btn-sm" onclick="excluirProduto(${realIdx})">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function atualizarStats() {
  document.getElementById('stat-total').textContent = produtos.length;
  document.getElementById('stat-fab').textContent = produtos.filter(p=>p.tipo==='fabricado').length;
  document.getElementById('stat-rev').textContent = produtos.filter(p=>p.tipo==='revendido').length;
  document.getElementById('stat-mix').textContent = produtos.filter(p=>p.tipo==='misto').length;
}

function filtrar() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const tipo = document.getElementById('filtro-tipo').value;
  const status = document.getElementById('filtro-status').value;
  const kit = document.getElementById('filtro-kit').value;

  const filtrado = produtos.filter(p => {
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca) ||
      p.variacoes?.some(v => v.sku.toLowerCase().includes(busca));
    const matchTipo = !tipo || p.tipo === tipo;
    const matchStatus = !status || p.status === status;
    const matchKit = !kit || (kit==='1'&&p.kit1>0) || (kit==='2'&&p.kit2>0) || (kit==='3'&&p.kit3>0);
    return matchBusca && matchTipo && matchStatus && matchKit;
  });

  renderTabela(filtrado);
}

function exportarProdutos() {
  const csv = [
    ['Nome','Empresa','Categoria','Tipo','SKU','Cor','Tamanho','Kit1','Kit2','Kit3','Status','Obs'].join(','),
    ...produtos.flatMap(p =>
      (p.variacoes?.length ? p.variacoes : [{sku:slugify(p.nome),cor:'',tam:''}]).map(v =>
        [p.nome,p.empresa,p.categoria,p.tipo,v.sku,v.cor,v.tam,p.kit1,p.kit2,p.kit3,p.status,p.obs||''].join(',')
      )
    )
  ].join('\n');

  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'sellerreal-produtos.csv';
  a.click();
}

function toggleEmpresaHint(sel) {
  const hint = document.getElementById('empresa-hint');
  if (sel.value === 'todas') {
    hint.style.display = 'block';
    hint.textContent = '⚡ Será replicado em Fashion Hot, BeYou Fashion e RG Kids';
  } else {
    hint.style.display = 'none';
  }
}

function initProdutos() {
  renderTabela();
  atualizarStats();
}
