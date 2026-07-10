var kitsAtivos = ['UN'];
var coresSelecionadas = [];
var tamanhosSelecionados = [];
var skusSessao = [];
var biblioteca = JSON.parse(localStorage.getItem('sr-sku-biblioteca') || '[]');

var KITS = ['UN','Kit2','Kit3','Kit4'];
var CORES_RAPIDAS = ['Preto','Branco','Rosa','Azul marinho','Azul royal','Cinza','Verde','Vermelho','Nude','Off white','Amarelo','Lilas'];
var TAMS_ADULTO = ['PP','P','M','G','GG','XGG','UN'];
var TAMS_INFANTIL = ['2','4','6','8','10','12','14','16'];

function init() {
  var kg = document.getElementById('kit-grid');
  KITS.forEach(function(k) {
    var b = document.createElement('button');
    b.className = k === 'UN' ? 'kit-btn on' : 'kit-btn';
    b.id = 'kit-' + k;
    b.textContent = k;
    b.onclick = function() { toggleKit(k); };
    kg.appendChild(b);
  });
  var cr = document.getElementById('cores-rapidas');
  CORES_RAPIDAS.forEach(function(c) {
    var b = document.createElement('button');
    b.className = 'cor-rapida';
    b.id = 'cr-' + c.replace(/\s/g,'_');
    b.textContent = c;
    b.onclick = function() { adicionarCorRapida(c); };
    cr.appendChild(b);
  });
  var ta = document.getElementById('tam-adulto');
  TAMS_ADULTO.forEach(function(t) {
    var b = document.createElement('button');
    b.className = 'tam-btn';
    b.id = 'tam-' + t;
    b.textContent = t;
    b.onclick = function() { toggleTam(t); };
    ta.appendChild(b);
  });
  var ti = document.getElementById('tam-infantil');
  TAMS_INFANTIL.forEach(function(t) {
    var b = document.createElement('button');
    b.className = 'tam-btn';
    b.id = 'tam-' + t;
    b.textContent = t;
    b.onclick = function() { toggleTam(t); };
    ti.appendChild(b);
  });
  document.getElementById('cor-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') adicionarCor();
  });
  renderBiblioteca();
}

function slugSKU(str) {
  var r = str.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9\s]/g,'').trim().split(/\s+/);
  return r.map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join('');
}

function toggleKit(kit) {
  var idx = kitsAtivos.indexOf(kit);
  if (idx > -1) { if (kitsAtivos.length === 1) return; kitsAtivos.splice(idx,1); document.getElementById('kit-'+kit).classList.remove('on'); }
  else { kitsAtivos.push(kit); document.getElementById('kit-'+kit).classList.add('on'); }
  atualizarPreview();
}

function toggleTam(tam) {
  var idx = tamanhosSelecionados.indexOf(tam);
  if (idx > -1) { tamanhosSelecionados.splice(idx,1); document.getElementById('tam-'+tam).classList.remove('on'); }
  else { tamanhosSelecionados.push(tam); document.getElementById('tam-'+tam).classList.add('on'); }
  atualizarPreview();
}

function adicionarCor() {
  var input = document.getElementById('cor-input');
  var val = input.value.trim();
  if (!val || coresSelecionadas.indexOf(val) > -1) { input.value = ''; return; }
  coresSelecionadas.push(val);
  input.value = '';
  renderCores();
  atualizarPreview();
}

function adicionarCorRapida(cor) {
  var idx = coresSelecionadas.indexOf(cor);
  if (idx > -1) { coresSelecionadas.splice(idx,1); } else { coresSelecionadas.push(cor); }
  renderCores();
  atualizarPreview();
}

function removerCor(cor) {
  coresSelecionadas = coresSelecionadas.filter(function(c) { return c !== cor; });
  renderCores();
  atualizarPreview();
}

function renderCores() {
  var wrap = document.getElementById('cores-wrap');
  wrap.innerHTML = '';
  coresSelecionadas.forEach(function(c) {
    var tag = document.createElement('div');
    tag.className = 'cor-tag';
    var span = document.createElement('span');
    span.textContent = c;
    var del = document.createElement('span');
    del.className = 'cor-del';
    del.textContent = 'x';
    del.onclick = function() { removerCor(c); };
    tag.appendChild(span);
    tag.appendChild(del);
    wrap.appendChild(tag);
  });
  CORES_RAPIDAS.forEach(function(c) {
    var btn = document.getElementById('cr-' + c.replace(/\s/g,'_'));
    if (btn) btn.className = coresSelecionadas.indexOf(c) > -1 ? 'cor-rapida usada' : 'cor-rapida';
  });
}

function montarSKU(kit, cor, tam, nome) {
  var prefix = kit === 'UN' ? '' : kit + '-';
  var tamStr = tam ? '-' + tam : '';
  return prefix + slugSKU(nome) + '-' + slugSKU(cor) + tamStr;
}

function atualizarPreview() {
  var nome = document.getElementById('nome').value.trim();
  var preview = document.getElementById('preview');
  if (!nome) { preview.textContent = '—'; return; }
  var kit = kitsAtivos[0];
  var cor = coresSelecionadas.length > 0 ? coresSelecionadas[0] : 'Cor';
  var tam = tamanhosSelecionados.length > 0 ? tamanhosSelecionados[0] : '';
  preview.textContent = montarSKU(kit, cor, tam, nome);
}

function gerarSKUs() {
  var nome = document.getElementById('nome').value.trim();
  if (!nome) { alert('Informe o nome do produto'); return; }
  if (coresSelecionadas.length === 0) { alert('Adicione pelo menos uma cor'); return; }

  var novos = [];
  kitsAtivos.forEach(function(kit) {
    coresSelecionadas.forEach(function(cor) {
      if (tamanhosSelecionados.length > 0) {
        tamanhosSelecionados.forEach(function(tam) {
          novos.push({sku: montarSKU(kit,cor,tam,nome), kit:kit, cor:cor, tam:tam, nome:nome, novo:true});
        });
      } else {
        novos.push({sku: montarSKU(kit,cor,'',nome), kit:kit, cor:cor, tam:'', nome:nome, novo:true});
      }
    });
  });

  // ACUMULA — não sobrescreve
  skusSessao = skusSessao.concat(novos);
  renderSessao();
}

function renderSessao() {
  var lista = document.getElementById('sku-lista-sessao');
  var count = document.getElementById('count-sessao');
  var exportRow = document.getElementById('export-row-sessao');

  count.textContent = skusSessao.length;
  exportRow.style.display = skusSessao.length > 0 ? 'flex' : 'none';

  if (skusSessao.length === 0) {
    lista.innerHTML = '<div class="empty"><div class="ico">🔖</div><p>Preencha e clique em Gerar</p></div>';
    return;
  }

  lista.innerHTML = '';
  skusSessao.forEach(function(item, i) {
    var div = document.createElement('div');
    div.className = item.novo ? 'sku-item novo' : 'sku-item';

    var info = document.createElement('div');
    info.style.flex = '1';
    var txt = document.createElement('div');
    txt.className = 'sku-text';
    txt.textContent = item.sku;
    var meta = document.createElement('div');
    meta.className = 'sku-meta';
    meta.textContent = item.nome + ' - ' + item.kit + (item.cor ? ' - ' + item.cor : '') + (item.tam ? ' - ' + item.tam : '');
    info.appendChild(txt);
    info.appendChild(meta);

    var btnCp = document.createElement('button');
    btnCp.className = 'sku-cp';
    btnCp.textContent = 'Copiar';
    (function(sku, b) {
      b.onclick = function() {
        navigator.clipboard.writeText(sku);
        b.textContent = 'OK!';
        setTimeout(function() { b.textContent = 'Copiar'; }, 1200);
      };
    })(item.sku, btnCp);

    var btnDel = document.createElement('button');
    btnDel.className = 'sku-del';
    btnDel.textContent = 'x';
    (function(idx) {
      btnDel.onclick = function() {
        skusSessao.splice(idx, 1);
        renderSessao();
      };
    })(i);

    div.appendChild(info);
    div.appendChild(btnCp);
    div.appendChild(btnDel);
    lista.appendChild(div);
  });

  // Remove marcacao novo apos render
  setTimeout(function() {
    skusSessao.forEach(function(s) { s.novo = false; });
  }, 500);
}

function limparSessao() {
  if (skusSessao.length > 0 && !confirm('Limpar SKUs desta sessao?')) return;
  skusSessao = [];
  renderSessao();
}

function limparFormulario() {
  document.getElementById('nome').value = '';
  coresSelecionadas = [];
  tamanhosSelecionados = [];
  kitsAtivos = ['UN'];
  KITS.forEach(function(k) {
    var btn = document.getElementById('kit-'+k);
    if (btn) btn.className = k === 'UN' ? 'kit-btn on' : 'kit-btn';
  });
  TAMS_ADULTO.concat(TAMS_INFANTIL).forEach(function(t) {
    var btn = document.getElementById('tam-'+t);
    if (btn) btn.className = 'tam-btn';
  });
  renderCores();
  document.getElementById('preview').textContent = '—';
}

function salvarNaBiblioteca() {
  if (skusSessao.length === 0) return;
  skusSessao.forEach(function(s) {
    var existe = biblioteca.some(function(b) { return b.sku === s.sku; });
    if (!existe) biblioteca.push({sku: s.sku, kit: s.kit, cor: s.cor, tam: s.tam, nome: s.nome, data: new Date().toLocaleDateString('pt-BR')});
  });
  localStorage.setItem('sr-sku-biblioteca', JSON.stringify(biblioteca));
  renderBiblioteca();
  alert('SKUs salvos na biblioteca!');
}

function renderBiblioteca() {
  var el = document.getElementById('biblioteca-lista');
  var count = document.getElementById('count-biblioteca');
  var busca = document.getElementById('busca').value.toLowerCase();

  var filtrado = biblioteca.filter(function(s) {
    return !busca || s.sku.toLowerCase().indexOf(busca) > -1 || s.nome.toLowerCase().indexOf(busca) > -1;
  });

  count.textContent = biblioteca.length;

  if (filtrado.length === 0) {
    el.innerHTML = '<div class="empty"><div class="ico">📚</div><p>Nenhum SKU salvo ainda.<br>Gere SKUs e clique em Salvar na biblioteca.</p></div>';
    return;
  }

  // Agrupa por produto
  var grupos = {};
  filtrado.forEach(function(s) {
    if (!grupos[s.nome]) grupos[s.nome] = [];
    grupos[s.nome].push(s);
  });

  el.innerHTML = '';
  Object.keys(grupos).forEach(function(nome) {
    var grupo = grupos[nome];

    var header = document.createElement('div');
    header.className = 'grupo-header';
    var nomeEl = document.createElement('span');
    nomeEl.className = 'grupo-nome';
    nomeEl.textContent = nome + ' (' + grupo.length + ' SKUs)';
    var delGrupo = document.createElement('button');
    delGrupo.className = 'grupo-del';
    delGrupo.textContent = 'Remover produto';
    (function(n) {
      delGrupo.onclick = function() {
        biblioteca = biblioteca.filter(function(s) { return s.nome !== n; });
        localStorage.setItem('sr-sku-biblioteca', JSON.stringify(biblioteca));
        renderBiblioteca();
      };
    })(nome);
    header.appendChild(nomeEl);
    header.appendChild(delGrupo);
    el.appendChild(header);

    grupo.forEach(function(item, i) {
      var div = document.createElement('div');
      div.className = 'sku-item';
      div.style.marginBottom = '4px';

      var info = document.createElement('div');
      info.style.flex = '1';
      var txt = document.createElement('div');
      txt.className = 'sku-text';
      txt.textContent = item.sku;
      var meta = document.createElement('div');
      meta.className = 'sku-meta';
      meta.textContent = item.kit + (item.cor ? ' - ' + item.cor : '') + (item.tam ? ' - Tam ' + item.tam : '') + ' - ' + item.data;
      info.appendChild(txt);
      info.appendChild(meta);

      var btnCp = document.createElement('button');
      btnCp.className = 'sku-cp';
      btnCp.textContent = 'Copiar';
      (function(sku, b) {
        b.onclick = function() {
          navigator.clipboard.writeText(sku);
          b.textContent = 'OK!';
          setTimeout(function() { b.textContent = 'Copiar'; }, 1200);
        };
      })(item.sku, btnCp);

      var btnDel = document.createElement('button');
      btnDel.className = 'sku-del';
      btnDel.textContent = 'x';
      (function(sku) {
        btnDel.onclick = function() {
          biblioteca = biblioteca.filter(function(s) { return s.sku !== sku; });
          localStorage.setItem('sr-sku-biblioteca', JSON.stringify(biblioteca));
          renderBiblioteca();
        };
      })(item.sku);

      div.appendChild(info);
      div.appendChild(btnCp);
      div.appendChild(btnDel);
      el.appendChild(div);
    });
  });
}

function copiarSessao() {
  if (skusSessao.length === 0) return;
  var txt = skusSessao.map(function(s) { return s.sku; }).join('\n');
  navigator.clipboard.writeText(txt).then(function() {
    var btn = document.querySelector('[onclick="copiarSessao()"]');
    btn.textContent = 'Copiado!';
    setTimeout(function() { btn.textContent = 'Copiar sessao'; }, 1500);
  });
}

function copiarBiblioteca() {
  if (biblioteca.length === 0) return;
  var txt = biblioteca.map(function(s) { return s.sku; }).join('\n');
  navigator.clipboard.writeText(txt).then(function() {
    var btn = document.querySelector('[onclick="copiarBiblioteca()"]');
    btn.textContent = 'Copiado!';
    setTimeout(function() { btn.textContent = 'Copiar tudo'; }, 1500);
  });
}

function exportarCSV(origem) {
  var dados = origem === 'sessao' ? skusSessao : biblioteca;
  var linhas = ['SKU,Kit,Cor,Tamanho,Produto'];
  dados.forEach(function(s) { linhas.push(s.sku+','+s.kit+','+s.cor+','+s.tam+','+s.nome); });
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(linhas.join('\n'));
  a.download = 'skus-sellerreal.csv';
  a.click();
}

function limparBiblioteca() {
  if (!confirm('Limpar toda a biblioteca de SKUs?')) return;
  biblioteca = [];
  localStorage.setItem('sr-sku-biblioteca', JSON.stringify(biblioteca));
  renderBiblioteca();
}

function initSku() {
  init();
}
