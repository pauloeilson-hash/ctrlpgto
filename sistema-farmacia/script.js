// Sistema de estoque
let estoque = JSON.parse(localStorage.getItem('estoque')) || [];
let movimentacoes = JSON.parse(localStorage.getItem('movimentacoes')) || [];
let categorias = JSON.parse(localStorage.getItem('categorias')) || [
    { id: 1, nome: "Analgésico", descricao: "Medicamentos para alívio da dor" },
    { id: 2, nome: "Antibiótico", descricao: "Medicamentos para tratamento de infecções" },
    { id: 3, nome: "Antialérgico", descricao: "Medicamentos para tratamento de alergias" },
    { id: 4, nome: "Anti-inflamatório", descricao: "Medicamentos para redução de inflamações" },
    { id: 5, nome: "Outros", descricao: "Outros tipos de medicamentos" }
];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    inicializarTema();
    atualizarDashboard();
    atualizarTabelaProdutos();
    carregarSelects();
    configurarNavegacao();
    atualizarListaCategorias();
});

// Sistema de tema
function inicializarTema() {
    const temaSalvo = localStorage.getItem('tema');
    const botaoTema = document.getElementById('themeToggle');
    
    if (temaSalvo === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        botaoTema.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.removeAttribute('data-theme');
        botaoTema.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    botaoTema.addEventListener('click', alternarTema);
}

function alternarTema() {
    const botaoTema = document.getElementById('themeToggle');
    
    if (document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('tema', 'light');
        botaoTema.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('tema', 'dark');
        botaoTema.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Navegação entre seções
function configurarNavegacao() {
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.sidebar .nav-link').forEach(item => {
                item.classList.remove('active');
            });
            
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).style.display = 'block';
            
            if (targetId === 'dashboard') {
                atualizarDashboard();
            } else if (targetId === 'produtos') {
                atualizarTabelaProdutos();
            } else if (targetId === 'saida') {
                carregarSelects();
            } else if (targetId === 'categorias') {
                atualizarListaCategorias();
            }
        });
    });
}

// Modal Produto
function abrirModalProduto() {
    document.getElementById('form-produto').reset();
    carregarSelectCategorias();
    new bootstrap.Modal(document.getElementById('modalProduto')).show();
}

function salvarProduto() {
    const nome = document.getElementById('nomeProduto').value;
    const categoria = document.getElementById('categoriaProduto').value;
    const estoqueMinimo = parseInt(document.getElementById('estoqueMinimo').value);

    if (!nome || !categoria) {
        mostrarToast('Erro', 'Preencha todos os campos obrigatórios', 'danger');
        return;
    }

    const novoProduto = {
        id: Date.now(),
        nome: nome,
        categoria: categoria,
        estoqueMinimo: estoqueMinimo,
        lotes: []
    };

    estoque.push(novoProduto);
    salvarDados();
    bootstrap.Modal.getInstance(document.getElementById('modalProduto')).hide();
    mostrarToast('Sucesso', 'Produto cadastrado com sucesso', 'success');
    atualizarTabelaProdutos();
    carregarSelects();
}

// Modal Categoria
function abrirModalCategoria() {
    document.getElementById('form-categoria').reset();
    new bootstrap.Modal(document.getElementById('modalCategoria')).show();
}

function salvarCategoria() {
    const nome = document.getElementById('nomeCategoria').value;
    const descricao = document.getElementById('descricaoCategoria').value;

    if (!nome) {
        mostrarToast('Erro', 'Preencha o nome da categoria', 'danger');
        return;
    }

    // Verificar se a categoria já existe
    if (categorias.some(cat => cat.nome.toLowerCase() === nome.toLowerCase())) {
        mostrarToast('Erro', 'Esta categoria já existe', 'danger');
        return;
    }

    const novaCategoria = {
        id: Date.now(),
        nome: nome,
        descricao: descricao
    };

    categorias.push(novaCategoria);
    salvarDados();
    bootstrap.Modal.getInstance(document.getElementById('modalCategoria')).hide();
    mostrarToast('Sucesso', 'Categoria cadastrada com sucesso', 'success');
    atualizarListaCategorias();
    carregarSelectCategorias();
}

function excluirCategoria(id) {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;

    // Verificar se existem produtos usando esta categoria
    const produtosComCategoria = estoque.filter(produto => produto.categoria === categoria.nome);
    
    if (produtosComCategoria.length > 0) {
        mostrarToast('Erro', `Não é possível excluir. Existem ${produtosComCategoria.length} produto(s) usando esta categoria.`, 'danger');
        return;
    }

    if (confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`)) {
        categorias = categorias.filter(c => c.id !== id);
        salvarDados();
        mostrarToast('Sucesso', 'Categoria excluída com sucesso', 'success');
        atualizarListaCategorias();
        carregarSelectCategorias();
    }
}

function atualizarListaCategorias() {
    const container = document.getElementById('lista-categorias');
    const estatisticasContainer = document.getElementById('estatisticas-categorias');
    
    if (categorias.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma categoria cadastrada</p>';
        estatisticasContainer.innerHTML = '<p class="text-muted">Nenhuma categoria para exibir estatísticas</p>';
        return;
    }

    // Lista de categorias
    container.innerHTML = '';
    categorias.forEach(categoria => {
        const produtosNaCategoria = estoque.filter(produto => produto.categoria === categoria.nome);
        const totalEstoque = produtosNaCategoria.reduce((total, produto) => 
            total + produto.lotes.reduce((sum, lote) => sum + lote.quantidade, 0), 0);
        
        container.innerHTML += `
            <div class="categoria-item border-bottom">
                <div class="d-flex justify-content-between align-items-center p-2 categoria-header" onclick="toggleProdutosCategoria(${categoria.id})" style="cursor: pointer;">
                    <div>
                        <strong>${categoria.nome}</strong>
                        ${categoria.descricao ? `<br><small class="categoria-descricao">${categoria.descricao}</small>` : ''}
                        <br><small class="text-primary">${produtosNaCategoria.length} produto(s) • ${totalEstoque} unidades</small>
                    </div>
                    <div>
                        <i class="fas fa-chevron-down" id="icon-categoria-${categoria.id}"></i>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="event.stopPropagation(); excluirCategoria(${categoria.id})" ${categoria.nome === 'Outros' ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="produtos-categoria" id="produtos-categoria-${categoria.id}" style="display: none; background-color: var(--table-hover);">
                    <div class="p-3">
                        ${produtosNaCategoria.length > 0 ? 
                            produtosNaCategoria.map(produto => {
                                const totalEstoqueProduto = produto.lotes.reduce((sum, lote) => sum + lote.quantidade, 0);
                                const status = totalEstoqueProduto === 0 ? 'danger' : 
                                             totalEstoqueProduto <= produto.estoqueMinimo ? 'warning' : 'success';
                                return `
                                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom produto-item">
                                        <div>
                                            <strong>${produto.nome}</strong>
                                            <br>
                                            <small class="text-muted">Estoque: ${totalEstoqueProduto} • Mínimo: ${produto.estoqueMinimo}</small>
                                            <br>
                                            <small>Lotes: ${produto.lotes.map(l => l.numero).join(', ') || 'Nenhum'}</small>
                                        </div>
                                        <span class="badge bg-${status}">
                                            ${totalEstoqueProduto === 0 ? 'Sem Estoque' : 
                                              totalEstoqueProduto <= produto.estoqueMinimo ? 'Estoque Baixo' : 'Normal'}
                                        </span>
                                    </div>
                                `;
                            }).join('') : 
                            '<p class="text-muted text-center p-2">Nenhum produto nesta categoria</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    });

    // Estatísticas
    estatisticasContainer.innerHTML = '';
    categorias.forEach(categoria => {
        const produtosNaCategoria = estoque.filter(produto => produto.categoria === categoria.nome);
        const totalEstoque = produtosNaCategoria.reduce((total, produto) => 
            total + produto.lotes.reduce((sum, lote) => sum + lote.quantidade, 0), 0);
        
        if (produtosNaCategoria.length > 0) {
            estatisticasContainer.innerHTML += `
                <div class="mb-2">
                    <strong>${categoria.nome}</strong>
                    <div class="progress mb-1">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${(produtosNaCategoria.length / estoque.length) * 100}%">
                            ${produtosNaCategoria.length}
                        </div>
                    </div>
                    <small class="text-muted">${produtosNaCategoria.length} produto(s) • ${totalEstoque} unidades</small>
                </div>
            `;
        }
    });

    if (estatisticasContainer.innerHTML === '') {
        estatisticasContainer.innerHTML = '<p class="text-muted">Nenhum produto cadastrado para exibir estatísticas</p>';
    }
}

function carregarSelectCategorias() {
    const selectCategoria = document.getElementById('categoriaProduto');
    selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';
    
    categorias.forEach(categoria => {
        selectCategoria.innerHTML += `<option value="${categoria.nome}">${categoria.nome}</option>`;
    });
}

// Função para expandir/recolher produtos da categoria
function toggleProdutosCategoria(categoriaId) {
    const produtosDiv = document.getElementById(`produtos-categoria-${categoriaId}`);
    const icon = document.getElementById(`icon-categoria-${categoriaId}`);
    
    if (produtosDiv.style.display === 'none') {
        produtosDiv.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
    } else {
        produtosDiv.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
    }
}

// Entrada de produtos
document.getElementById('form-entrada').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const produtoId = parseInt(document.getElementById('produtoEntrada').value);
    const quantidade = parseInt(document.getElementById('quantidadeEntrada').value);
    const lote = document.getElementById('loteEntrada').value;
    const validade = document.getElementById('validadeEntrada').value;
    const fornecedor = document.getElementById('fornecedorEntrada').value;

    const produto = estoque.find(p => p.id === produtoId);
    if (!produto) return;

    // Adicionar lote
    produto.lotes.push({
        numero: lote,
        validade: validade,
        quantidade: quantidade,
        fornecedor: fornecedor
    });

    // Registrar movimentação
    movimentacoes.unshift({
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        produtoId: produtoId,
        produtoNome: produto.nome,
        tipo: 'entrada',
        quantidade: quantidade,
        lote: lote
    });

    salvarDados();
    this.reset();
    mostrarToast('Sucesso', 'Entrada registrada com sucesso', 'success');
    atualizarDashboard();
    carregarSelects();
});

// Saída de produtos
document.getElementById('form-saida').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const produtoId = parseInt(document.getElementById('produtoSaida').value);
    const quantidade = parseInt(document.getElementById('quantidadeSaida').value);
    const loteNumero = document.getElementById('loteSaida').value;
    const motivo = document.getElementById('motivoSaida').value;
    const observacoes = document.getElementById('observacoesSaida').value;

    const produto = estoque.find(p => p.id === produtoId);
    if (!produto) return;

    // Encontrar o lote específico
    const lote = produto.lotes.find(l => l.numero === loteNumero);
    if (!lote) {
        mostrarToast('Erro', 'Lote não encontrado', 'danger');
        return;
    }

    // Verificar se há quantidade suficiente no lote selecionado
    if (quantidade > lote.quantidade) {
        mostrarToast('Erro', `Quantidade indisponível no lote ${loteNumero}. Disponível: ${lote.quantidade}`, 'danger');
        return;
    }

    // Remover do lote específico
    lote.quantidade -= quantidade;

    // Remover lote se estiver vazio
    if (lote.quantidade === 0) {
        produto.lotes = produto.lotes.filter(l => l.numero !== loteNumero);
    }

    // Registrar movimentação
    movimentacoes.unshift({
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        produtoId: produtoId,
        produtoNome: produto.nome,
        tipo: 'saída',
        quantidade: quantidade,
        lote: loteNumero,
        motivo: motivo,
        observacoes: observacoes
    });

    salvarDados();
    this.reset();
    mostrarToast('Sucesso', 'Saída registrada com sucesso', 'success');
    atualizarDashboard();
    carregarSelects();
});

// Funções auxiliares
function carregarSelects() {
    const selectEntrada = document.getElementById('produtoEntrada');
    const selectSaida = document.getElementById('produtoSaida');
    
    selectEntrada.innerHTML = '<option value="">Selecione um produto</option>';
    selectSaida.innerHTML = '<option value="">Selecione um produto</option>';
    
    estoque.forEach(produto => {
        const option = `<option value="${produto.id}">${produto.nome}</option>`;
        selectEntrada.innerHTML += option;
        selectSaida.innerHTML += option;
    });
}

function atualizarLotesDisponiveis() {
    const produtoId = parseInt(document.getElementById('produtoSaida').value);
    const selectLote = document.getElementById('loteSaida');
    const infoLote = document.getElementById('info-lote');
    
    selectLote.innerHTML = '<option value="">Selecione um lote</option>';
    infoLote.innerHTML = '<p class="text-muted">Selecione um produto e lote para ver detalhes</p>';
    
    if (!produtoId) return;
    
    const produto = estoque.find(p => p.id === produtoId);
    if (!produto) return;
    
    // Ordenar lotes por validade (mais próximo de vencer primeiro)
    const lotesOrdenados = [...produto.lotes].sort((a, b) => new Date(a.validade) - new Date(b.validade));
    
    if (lotesOrdenados.length === 0) {
        selectLote.innerHTML = '<option value="" disabled>Nenhum lote disponível</option>';
        infoLote.innerHTML = '<p class="text-danger">Nenhum lote disponível para este produto</p>';
        return;
    }
    
    lotesOrdenados.forEach(lote => {
        const diasParaVencer = Math.ceil((new Date(lote.validade) - new Date()) / (1000 * 60 * 60 * 24));
        const statusVencimento = diasParaVencer <= 30 ? 'text-danger' : diasParaVencer <= 90 ? 'text-warning' : 'text-success';
        
        selectLote.innerHTML += `
            <option value="${lote.numero}" data-quantidade="${lote.quantidade}" data-validade="${lote.validade}" data-fornecedor="${lote.fornecedor || 'Não informado'}">
                ${lote.numero} - ${lote.quantidade} unidades (Vence: ${new Date(lote.validade).toLocaleDateString('pt-BR')})
            </option>
        `;
    });
    
    // Adicionar evento para mostrar informações do lote selecionado
    selectLote.addEventListener('change', function() {
        const optionSelecionada = this.options[this.selectedIndex];
        if (optionSelecionada.value) {
            const quantidade = optionSelecionada.getAttribute('data-quantidade');
            const validade = optionSelecionada.getAttribute('data-validade');
            const fornecedor = optionSelecionada.getAttribute('data-fornecedor');
            const diasParaVencer = Math.ceil((new Date(validade) - new Date()) / (1000 * 60 * 60 * 24));
            
            infoLote.innerHTML = `
                <p><strong>Lote:</strong> ${optionSelecionada.value}</p>
                <p><strong>Quantidade disponível:</strong> <span class="estoque-disponivel">${quantidade} unidades</span></p>
                <p><strong>Validade:</strong> ${new Date(validade).toLocaleDateString('pt-BR')}</p>
                <p><strong>Fornecedor:</strong> ${fornecedor}</p>
                <p><strong>Dias para vencer:</strong> <span class="${diasParaVencer <= 30 ? 'text-danger' : diasParaVencer <= 90 ? 'text-warning' : 'text-success'}">${diasParaVencer} dias</span></p>
            `;
        } else {
            infoLote.innerHTML = '<p class="text-muted">Selecione um lote para ver detalhes</p>';
        }
    });
}

function atualizarDashboard() {
    const totalProdutos = estoque.length;
    const totalEstoque = estoque.reduce((total, produto) => 
        total + produto.lotes.reduce((sum, lote) => sum + lote.quantidade, 0), 0);
    
    const produtosBaixoEstoque = estoque.filter(produto => {
        const total = produto.lotes.reduce((sum, lote) => sum + lote.quantidade, 0);
        return total <= produto.estoqueMinimo;
    }).length;

    const produtosVencendo = estoque.filter(produto => 
        produto.lotes.some(lote => {
            const diasParaVencer = Math.ceil((new Date(lote.validade) - new Date()) / (1000 * 60 * 60 * 24));
            return diasParaVencer <= 30 && diasParaVencer > 0;
        })
    ).length;

    document.getElementById('total-produtos').textContent = totalProdutos;
    document.getElementById('total-estoque').textContent = totalEstoque;
    document.getElementById('total-baixo').textContent = produtosBaixoEstoque;
    document.getElementById('total-vencendo').textContent = produtosVencendo;

    // Atualizar movimentações
    const tbody = document.querySelector('#tabela-movimentacoes tbody');
    tbody.innerHTML = '';
    movimentacoes.slice(0, 10).forEach(mov => {
        tbody.innerHTML += `
            <tr>
                <td>${mov.data}</td>
                <td>${mov.produtoNome}</td>
                <td><span class="badge ${mov.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}">${mov.tipo}</span></td>
                <td>${mov.quantidade}</td>
                <td>${mov.lote || '-'}</td>
            </tr>
        `;
    });

    // Atualizar alertas do dashboard
    atualizarAlertasDashboard();
}

function atualizarTabelaProdutos() {
    const tbody = document.querySelector('#tabela-produtos tbody');
    const busca = document.getElementById('busca-produto').value.toLowerCase();
    
    tbody.innerHTML = '';
    
    estoque.filter(produto => 
        produto.nome.toLowerCase().includes(busca) ||
        produto.categoria.toLowerCase().includes(busca)
    ).forEach(produto => {
        const totalEstoque = produto.lotes.reduce((sum, lote) => sum + lote.quantidade, 0);
        const status = totalEstoque === 0 ? 'bg-danger' : 
                     totalEstoque <= produto.estoqueMinimo ? 'bg-warning' : 'bg-success';
        const statusText = totalEstoque === 0 ? 'Sem Estoque' : 
                         totalEstoque <= produto.estoqueMinimo ? 'Estoque Baixo' : 'Normal';

        tbody.innerHTML += `
            <tr>
                <td>${produto.nome}</td>
                <td>${produto.categoria}</td>
                <td>${produto.lotes.map(l => l.numero).join(', ') || '-'}</td>
                <td>${produto.lotes.map(l => l.validade).join(', ') || '-'}</td>
                <td>${totalEstoque}</td>
                <td><span class="badge ${status}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="excluirProduto(${produto.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    // Configurar busca em tempo real
    document.getElementById('busca-produto').addEventListener('input', atualizarTabelaProdutos);
}

function atualizarAlertasDashboard() {
    const container = document.getElementById('alertas-dashboard');
    container.innerHTML = '';

    // Alertas de estoque baixo
    estoque.filter(produto => {
        const total = produto.lotes.reduce((sum, lote) => sum + lote.quantidade, 0);
        return total <= produto.estoqueMinimo;
    }).forEach(produto => {
        const total = produto.lotes.reduce((sum, lote) => sum + lote.quantidade, 0);
        container.innerHTML += `
            <div class="alert-item alert-warning">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong>Estoque Baixo:</strong> ${produto.nome} (${total} unidades)
            </div>
        `;
    });

    // Alertas de vencimento
    estoque.forEach(produto => {
        produto.lotes.forEach(lote => {
            const diasParaVencer = Math.ceil((new Date(lote.validade) - new Date()) / (1000 * 60 * 60 * 24));
            if (diasParaVencer <= 30 && diasParaVencer > 0) {
                container.innerHTML += `
                    <div class="alert-item alert-danger">
                        <i class="fas fa-calendar-times me-2"></i>
                        <strong>Vencimento Próximo:</strong> ${produto.nome} - Lote ${lote.numero} (${diasParaVencer} dias)
                    </div>
                `;
            }
        });
    });

    if (container.innerHTML === '') {
        container.innerHTML = '<div class="text-center text-muted">Nenhum alerta no momento</div>';
    }
}

function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        estoque = estoque.filter(produto => produto.id !== id);
        salvarDados();
        mostrarToast('Sucesso', 'Produto excluído com sucesso', 'success');
        atualizarTabelaProdutos();
        carregarSelects();
        atualizarDashboard();
    }
}

function salvarDados() {
    localStorage.setItem('estoque', JSON.stringify(estoque));
    localStorage.setItem('movimentacoes', JSON.stringify(movimentacoes));
    localStorage.setItem('categorias', JSON.stringify(categorias));
}

function mostrarToast(titulo, mensagem, tipo) {
    document.getElementById('toast-title').textContent = titulo;
    document.getElementById('toast-message').textContent = mensagem;
    document.getElementById('toast').className = `toast align-items-center text-bg-${tipo} border-0 show`;
    
    setTimeout(() => {
        document.getElementById('toast').className = 'toast';
    }, 3000);
}

// Função para voltar ao menu
function voltarAoMenu() {
    // Navegação inteligente que funciona em qualquer ambiente
    if (window.location.pathname.includes('/sistema-farmacia/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = './index.html';
    }
}

// No evento DOMContentLoaded, adicione:
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...
    carregarFiltrosRelatorios();
});

// Função para carregar os filtros
function carregarFiltrosRelatorios() {
    const selectCategoria = document.getElementById('filtro-categoria');
    const selectProduto = document.getElementById('filtro-produto');
    
    // Carregar categorias
    selectCategoria.innerHTML = '<option value="">Todas</option>';
    categorias.forEach(categoria => {
        selectCategoria.innerHTML += `<option value="${categoria.nome}">${categoria.nome}</option>`;
    });
    
    // Carregar produtos
    selectProduto.innerHTML = '<option value="">Todos</option>';
    estoque.forEach(produto => {
        selectProduto.innerHTML += `<option value="${produto.id}">${produto.nome}</option>`;
    });
}

// Função para aplicar filtros
function aplicarFiltros() {
    const tipo = document.getElementById('filtro-tipo').value;
    const categoria = document.getElementById('filtro-categoria').value;
    const produtoId = document.getElementById('filtro-produto').value;
    const motivo = document.getElementById('filtro-motivo').value;
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFim = document.getElementById('filtro-data-fim').value;
    
    let movimentacoesFiltradas = movimentacoes.filter(mov => {
        // Filtro por tipo
        if (tipo && mov.tipo !== tipo) return false;
        
        // Filtro por categoria
        if (categoria) {
            const produto = estoque.find(p => p.id === mov.produtoId);
            if (!produto || produto.categoria !== categoria) return false;
        }
        
        // Filtro por produto
        if (produtoId && mov.produtoId !== parseInt(produtoId)) return false;
        
        // Filtro por motivo (apenas para saídas)
        if (motivo && mov.tipo === 'saída' && mov.motivo !== motivo) return false;
        
        // Filtro por data
        if (dataInicio || dataFim) {
            const dataMov = converterDataParaComparacao(mov.data);
            const inicio = dataInicio ? new Date(dataInicio) : null;
            const fim = dataFim ? new Date(dataFim) : null;
            
            if (inicio && dataMov < inicio) return false;
            if (fim && dataMov > fim) return false;
        }
        
        return true;
    });
    
    exibirRelatorio(movimentacoesFiltradas);
    atualizarResumos(movimentacoesFiltradas);
}

// Função para exibir o relatório na tabela
function exibirRelatorio(movimentacoesFiltradas) {
    const tbody = document.querySelector('#tabela-relatorios tbody');
    const totalRegistros = document.getElementById('total-registros');
    
    tbody.innerHTML = '';
    totalRegistros.textContent = `${movimentacoesFiltradas.length} registros`;
    
    if (movimentacoesFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    Nenhuma movimentação encontrada com os filtros aplicados
                </td>
            </tr>
        `;
        return;
    }
    
    movimentacoesFiltradas.forEach(mov => {
        const produto = estoque.find(p => p.id === mov.produtoId);
        const categoria = produto ? produto.categoria : 'N/A';
        
        // Combinar observações com fornecedor se existir
        let observacoesCompletas = mov.observacoes || '';
        if (mov.fornecedor && !observacoesCompletas.includes(mov.fornecedor)) {
            if (observacoesCompletas) {
                observacoesCompletas += ` | Fornecedor: ${mov.fornecedor}`;
            } else {
                observacoesCompletas = `Fornecedor: ${mov.fornecedor}`;
            }
        }
        
        tbody.innerHTML += `
            <tr>
                <td>${mov.data}</td>
                <td>${mov.produtoNome}</td>
                <td>${categoria}</td>
                <td>
                    <span class="badge ${mov.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}">
                        ${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                </td>
                <td>${mov.quantidade}</td>
                <td>${mov.lote || '-'}</td>
                <td>${mov.motivo ? formatarMotivo(mov.motivo) : '-'}</td>
                <td>${observacoesCompletas || '-'}</td>
            </tr>
        `;
    });
}

// Função para atualizar os resumos
function atualizarResumos(movimentacoesFiltradas) {
    atualizarResumoCategorias(movimentacoesFiltradas);
    atualizarResumoPeriodo(movimentacoesFiltradas);
}

// Resumo por categoria
function atualizarResumoCategorias(movimentacoesFiltradas) {
    const container = document.getElementById('resumo-categorias');
    
    if (movimentacoesFiltradas.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum dado para exibir</p>';
        return;
    }
    
    // Agrupar por categoria
    const resumo = {};
    movimentacoesFiltradas.forEach(mov => {
        const produto = estoque.find(p => p.id === mov.produtoId);
        const categoria = produto ? produto.categoria : 'Outros';
        
        if (!resumo[categoria]) {
            resumo[categoria] = { entradas: 0, saidas: 0 };
        }
        
        if (mov.tipo === 'entrada') {
            resumo[categoria].entradas += mov.quantidade;
        } else {
            resumo[categoria].saidas += mov.quantidade;
        }
    });
    
    let html = '';
    Object.keys(resumo).forEach(categoria => {
        const dados = resumo[categoria];
        const saldo = dados.entradas - dados.saidas;
        
        html += `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong>${categoria}</strong>
                    <span class="badge ${saldo >= 0 ? 'bg-success' : 'bg-danger'}">
                        Saldo: ${saldo}
                    </span>
                </div>
                <div class="d-flex justify-content-between small text-muted">
                    <span>Entradas: ${dados.entradas}</span>
                    <span>Saídas: ${dados.saidas}</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-success" style="width: ${dados.entradas > 0 ? (dados.entradas / (dados.entradas + dados.saidas)) * 100 : 0}%"></div>
                    <div class="progress-bar bg-danger" style="width: ${dados.saidas > 0 ? (dados.saidas / (dados.entradas + dados.saidas)) * 100 : 0}%"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Resumo por período
function atualizarResumoPeriodo(movimentacoesFiltradas) {
    const container = document.getElementById('resumo-periodo');
    
    if (movimentacoesFiltradas.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum dado para exibir</p>';
        return;
    }
    
    // Agrupar por mês
    const resumo = {};
    movimentacoesFiltradas.forEach(mov => {
        const data = new Date(converterDataParaComparacao(mov.data));
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (!resumo[mesAno]) {
            resumo[mesAno] = { entradas: 0, saidas: 0 };
        }
        
        if (mov.tipo === 'entrada') {
            resumo[mesAno].entradas += mov.quantidade;
        } else {
            resumo[mesAno].saidas += mov.quantidade;
        }
    });
    
    let html = '';
    Object.keys(resumo).sort((a, b) => {
        const [mesA, anoA] = a.split('/');
        const [mesB, anoB] = b.split('/');
        return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
    }).forEach(mesAno => {
        const dados = resumo[mesAno];
        
        html += `
            <div class="mb-3 p-2 border rounded">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong class="text-primary">${mesAno}</strong>
                    <small class="text-muted">Total: ${dados.entradas + dados.saidas}</small>
                </div>
                <div class="d-flex text-center">
                    <div class="flex-fill p-2 bg-success bg-opacity-25 me-1 rounded">
                        <small class="text-success fw-bold">Entradas</small>
                        <div class="fw-bold text-success">${dados.entradas}</div>
                    </div>
                    <div class="flex-fill p-2 bg-danger bg-opacity-25 rounded">
                        <small class="text-danger fw-bold">Saídas</small>
                        <div class="fw-bold text-danger">${dados.saidas}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Função para limpar filtros
function limparFiltros() {
    document.getElementById('form-filtros-relatorios').reset();
    aplicarFiltros();
}

// Função para exportar relatório
function exportarRelatorio() {
    const tabela = document.getElementById('tabela-relatorios');
    let csv = [];
    const linhas = tabela.querySelectorAll('tr');
    
    for (let i = 0; i < linhas.length; i++) {
        const linha = [];
        const colunas = linhas[i].querySelectorAll('td, th');
        
        for (let j = 0; j < colunas.length; j++) {
            let texto = colunas[j].innerText.replace(/,/g, ';');
            linha.push(texto);
        }
        
        csv.push(linha.join(','));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csv.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_movimentacoes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarToast('Sucesso', 'Relatório exportado com sucesso', 'success');
}

// Funções auxiliares
function converterDataParaComparacao(dataString) {
    const [dia, mes, ano] = dataString.split('/');
    return new Date(ano, mes - 1, dia);
}

function formatarMotivo(motivo) {
    const motivos = {
        'venda': 'Venda',
        'uso_interno': 'Uso Interno',
        'descarte': 'Descarte',
        'outro': 'Outro'
    };
    return motivos[motivo] || motivo;
}

// Atualize a função configurarNavegacao para incluir a aba de relatórios
function configurarNavegacao() {
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.sidebar .nav-link').forEach(item => {
                item.classList.remove('active');
            });
            
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).style.display = 'block';
            
            if (targetId === 'dashboard') {
                atualizarDashboard();
            } else if (targetId === 'produtos') {
                atualizarTabelaProdutos();
            } else if (targetId === 'saida') {
                carregarSelects();
            } else if (targetId === 'categorias') {
                atualizarListaCategorias();
            } else if (targetId === 'relatorios') {
                carregarFiltrosRelatorios();
                aplicarFiltros(); // Carrega todos os dados inicialmente
            }
        });
    });
}

// Função para exportar relatório em PDF
function exportarRelatorioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Dados do relatório
    const tipoFiltro = document.getElementById('filtro-tipo').value || 'Todos';
    const categoriaFiltro = document.getElementById('filtro-categoria').value || 'Todas';
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFim = document.getElementById('filtro-data-fim').value;
    
    // Título do relatório
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('RELATÓRIO DE MOVIMENTAÇÕES - FARMÁCIA', 105, 15, { align: 'center' });
    
    // Informações dos filtros aplicados
    doc.setFontSize(10);
    doc.setTextColor(100);
    let filtrosText = `Filtros aplicados: Tipo: ${tipoFiltro} | Categoria: ${categoriaFiltro}`;
    if (dataInicio || dataFim) {
        filtrosText += ` | Período: ${dataInicio || 'Início'} à ${dataFim || 'Fim'}`;
    }
    doc.text(filtrosText, 105, 22, { align: 'center' });
    
    // Data de geração
    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${dataGeracao}`, 105, 28, { align: 'center' });
    
    // Preparar dados da tabela
    const headers = [['Data', 'Produto', 'Categoria', 'Tipo', 'Quantidade', 'Lote', 'Motivo']];
    
    const movimentacoesFiltradas = obterMovimentacoesFiltradas();
    const tableData = movimentacoesFiltradas.map(mov => {
        const produto = estoque.find(p => p.id === mov.produtoId);
        const categoria = produto ? produto.categoria : 'N/A';
        
        return [
            mov.data,
            mov.produtoNome,
            categoria,
            mov.tipo === 'entrada' ? 'Entrada' : 'Saída',
            mov.quantidade.toString(),
            mov.lote || '-',
            mov.motivo ? formatarMotivo(mov.motivo) : '-'
        ];
    });
    
    // Adicionar tabela
    doc.autoTable({
        head: headers,
        body: tableData,
        startY: 35,
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: [52, 152, 219],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        },
        margin: { top: 35 },
        didDrawPage: function (data) {
            // Rodapé com número de página
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(
                `Página ${doc.internal.getNumberOfPages()}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }
    });
    
    // Adicionar resumo estatístico
    const finalY = doc.lastAutoTable.finalY + 10;
    
    if (finalY > 250) {
        doc.addPage();
    }
    
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('RESUMO ESTATÍSTICO', 105, finalY, { align: 'center' });
    
    // Calcular totais
    const totais = calcularTotaisRelatorio(movimentacoesFiltradas);
    
    doc.setFontSize(9);
    let currentY = finalY + 8;
    
    doc.text(`Total de Movimentações: ${movimentacoesFiltradas.length}`, 20, currentY);
    currentY += 5;
    doc.text(`Entradas: ${totais.entradas} unidades`, 20, currentY);
    currentY += 5;
    doc.text(`Saídas: ${totais.saidas} unidades`, 20, currentY);
    currentY += 5;
    doc.text(`Saldo Líquido: ${totais.entradas - totais.saidas} unidades`, 20, currentY);
    
    // Resumo por categoria no PDF
    currentY += 10;
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text('RESUMO POR CATEGORIA:', 20, currentY);
    
    const resumoCategorias = calcularResumoCategoriasPDF(movimentacoesFiltradas);
    resumoCategorias.forEach((categoria, index) => {
        currentY += 5;
        if (currentY > 270) {
            doc.addPage();
            currentY = 20;
        }
        doc.setFontSize(8);
        doc.text(`${categoria.nome}:`, 25, currentY);
        doc.text(`Entradas: ${categoria.entradas} | Saídas: ${categoria.saidas} | Saldo: ${categoria.saldo}`, 80, currentY);
    });
    
    // Salvar o PDF
    const fileName = `relatorio_movimentacoes_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    mostrarToast('Sucesso', 'Relatório PDF gerado com sucesso', 'success');
}

// Função auxiliar para obter movimentações filtradas
function obterMovimentacoesFiltradas() {
    const tipo = document.getElementById('filtro-tipo').value;
    const categoria = document.getElementById('filtro-categoria').value;
    const produtoId = document.getElementById('filtro-produto').value;
    const motivo = document.getElementById('filtro-motivo').value;
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFim = document.getElementById('filtro-data-fim').value;
    
    return movimentacoes.filter(mov => {
        if (tipo && mov.tipo !== tipo) return false;
        if (categoria) {
            const produto = estoque.find(p => p.id === mov.produtoId);
            if (!produto || produto.categoria !== categoria) return false;
        }
        if (produtoId && mov.produtoId !== parseInt(produtoId)) return false;
        if (motivo && mov.tipo === 'saída' && mov.motivo !== motivo) return false;
        if (dataInicio || dataFim) {
            const dataMov = converterDataParaComparacao(mov.data);
            const inicio = dataInicio ? new Date(dataInicio) : null;
            const fim = dataFim ? new Date(dataFim) : null;
            if (inicio && dataMov < inicio) return false;
            if (fim && dataMov > fim) return false;
        }
        return true;
    });
}

// Função para calcular totais do relatório
function calcularTotaisRelatorio(movimentacoesFiltradas) {
    return movimentacoesFiltradas.reduce((totais, mov) => {
        if (mov.tipo === 'entrada') {
            totais.entradas += mov.quantidade;
        } else {
            totais.saidas += mov.quantidade;
        }
        return totais;
    }, { entradas: 0, saidas: 0 });
}

// Função para calcular resumo por categoria para PDF
function calcularResumoCategoriasPDF(movimentacoesFiltradas) {
    const resumo = {};
    
    movimentacoesFiltradas.forEach(mov => {
        const produto = estoque.find(p => p.id === mov.produtoId);
        const categoria = produto ? produto.categoria : 'Outros';
        
        if (!resumo[categoria]) {
            resumo[categoria] = { entradas: 0, saidas: 0 };
        }
        
        if (mov.tipo === 'entrada') {
            resumo[categoria].entradas += mov.quantidade;
        } else {
            resumo[categoria].saidas += mov.quantidade;
        }
    });
    
    return Object.keys(resumo).map(nome => ({
        nome,
        entradas: resumo[nome].entradas,
        saidas: resumo[nome].saidas,
        saldo: resumo[nome].entradas - resumo[nome].saidas
    })).sort((a, b) => b.entradas - a.entradas);
}

// Atualize a função exportarRelatorio para exportarRelatorioCSV
function exportarRelatorioCSV() {
    const tabela = document.getElementById('tabela-relatorios');
    let csv = [];
    const linhas = tabela.querySelectorAll('tr');
    
    for (let i = 0; i < linhas.length; i++) {
        const linha = [];
        const colunas = linhas[i].querySelectorAll('td, th');
        
        for (let j = 0; j < colunas.length; j++) {
            let texto = colunas[j].innerText.replace(/,/g, ';');
            linha.push(texto);
        }
        
        csv.push(linha.join(','));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csv.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_movimentacoes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarToast('Sucesso', 'Relatório CSV exportado com sucesso', 'success');
}

// Função para exportar relatório detalhado em PDF (opcional)
function exportarRelatorioDetalhadoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações da página
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Cabeçalho
    doc.setFillColor(52, 152, 219);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('RELATÓRIO DETALHADO', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Sistema de Controle de Estoque - Farmácia', pageWidth / 2, 22, { align: 'center' });
    
    // Informações do relatório
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    let currentY = 40;
    
    const filtros = obterFiltrosAplicados();
    doc.text(`Período: ${filtros.periodo}`, 20, currentY);
    currentY += 5;
    doc.text(`Filtros: ${filtros.texto}`, 20, currentY);
    currentY += 5;
    doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 20, currentY);
    
    // Dados das movimentações
    const movimentacoesFiltradas = obterMovimentacoesFiltradas();
    currentY += 15;
    
    if (movimentacoesFiltradas.length === 0) {
        doc.setFontSize(12);
        doc.text('Nenhuma movimentação encontrada com os filtros aplicados', pageWidth / 2, currentY, { align: 'center' });
    } else {
        // Tabela principal
        const headers = [['Data', 'Produto', 'Categoria', 'Tipo', 'Qtd', 'Lote', 'Motivo', 'Observações']];
        const tableData = movimentacoesFiltradas.map(mov => {
            const produto = estoque.find(p => p.id === mov.produtoId);
            const categoria = produto ? produto.categoria : 'N/A';
            const observacoes = mov.observacoes ? mov.observacoes.substring(0, 30) + (mov.observacoes.length > 30 ? '...' : '') : '-';
            
            return [
                mov.data,
                mov.produtoNome,
                categoria,
                mov.tipo === 'entrada' ? 'E' : 'S',
                mov.quantidade.toString(),
                mov.lote || '-',
                mov.motivo ? formatarMotivo(mov.motivo) : '-',
                observacoes
            ];
        });
        
        doc.autoTable({
            head: headers,
            body: tableData,
            startY: currentY,
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
            },
            headStyles: {
                fillColor: [44, 62, 80],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 30 },
                2: { cellWidth: 25 },
                3: { cellWidth: 10 },
                4: { cellWidth: 15 },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 },
                7: { cellWidth: 40 }
            },
            margin: { top: currentY },
            didDrawPage: function (data) {
                // Número da página
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(
                    `Página ${doc.internal.getNumberOfPages()}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
        });
        
        // Estatísticas no final
        const finalY = doc.lastAutoTable.finalY + 10;
        if (finalY > pageHeight - 50) {
            doc.addPage();
        }
        
        adicionarEstatisticasPDF(doc, movimentacoesFiltradas, finalY);
    }
    
    // Salvar PDF
    const fileName = `relatorio_detalhado_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    mostrarToast('Sucesso', 'Relatório detalhado PDF gerado com sucesso', 'success');
}

// Função auxiliar para obter filtros aplicados
function obterFiltrosAplicados() {
    const tipo = document.getElementById('filtro-tipo').value || 'Todos';
    const categoria = document.getElementById('filtro-categoria').value || 'Todas';
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFim = document.getElementById('filtro-data-fim').value;
    
    let periodo = 'Todo o período';
    if (dataInicio && dataFim) {
        periodo = `${dataInicio} à ${dataFim}`;
    } else if (dataInicio) {
        periodo = `A partir de ${dataInicio}`;
    } else if (dataFim) {
        periodo = `Até ${dataFim}`;
    }
    
    return {
        periodo,
        texto: `Tipo: ${tipo}, Categoria: ${categoria}`
    };
}

// Função para adicionar estatísticas ao PDF
function adicionarEstatisticasPDF(doc, movimentacoesFiltradas, startY) {
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('ESTATÍSTICAS DO RELATÓRIO', 105, startY, { align: 'center' });
    
    const totais = calcularTotaisRelatorio(movimentacoesFiltradas);
    const resumoCategorias = calcularResumoCategoriasPDF(movimentacoesFiltradas);
    
    let currentY = startY + 10;
    doc.setFontSize(9);
    
    // Estatísticas gerais
    doc.text(`Total de registros: ${movimentacoesFiltradas.length}`, 20, currentY);
    currentY += 5;
    doc.text(`Total de entradas: ${totais.entradas} unidades`, 20, currentY);
    currentY += 5;
    doc.text(`Total de saídas: ${totais.saidas} unidades`, 20, currentY);
    currentY += 5;
    doc.text(`Saldo líquido: ${totais.entradas - totais.saidas} unidades`, 20, currentY);
    
    // Top categorias
    currentY += 10;
    doc.setFontSize(10);
    doc.text('TOP CATEGORIAS:', 20, currentY);
    
    const topCategorias = resumoCategorias.slice(0, 5);
    topCategorias.forEach((categoria, index) => {
        currentY += 5;
        doc.setFontSize(8);
        doc.text(`${index + 1}. ${categoria.nome}:`, 25, currentY);
        doc.text(`Entradas: ${categoria.entradas} | Saídas: ${categoria.saidas}`, 80, currentY);
    });
}

// Sistema de Backup
let backupConfig = JSON.parse(localStorage.getItem('backupConfig')) || {
    automatico: false,
    frequencia: 'diario',
    ultimoBackup: null
};

// Inicialização do sistema de backup
function inicializarBackup() {
    atualizarListaBackups();
    carregarConfigBackup();
    
    if (backupConfig.automatico) {
        verificarBackupAutomatico();
    }
}

function carregarConfigBackup() {
    document.getElementById('backupAutomatico').checked = backupConfig.automatico;
    document.getElementById('frequenciaBackup').value = backupConfig.frequencia;
    
    if (backupConfig.automatico) {
        document.getElementById('configFrequencia').style.display = 'block';
    }
}

function toggleBackupAutomatico() {
    const ativo = document.getElementById('backupAutomatico').checked;
    backupConfig.automatico = ativo;
    
    if (ativo) {
        document.getElementById('configFrequencia').style.display = 'block';
        backupConfig.frequencia = document.getElementById('frequenciaBackup').value;
        realizarBackupAutomatico();
    } else {
        document.getElementById('configFrequencia').style.display = 'none';
    }
    
    localStorage.setItem('backupConfig', JSON.stringify(backupConfig));
    mostrarToast('Configuração', `Backup automático ${ativo ? 'ativado' : 'desativado'}`, 'success');
}

function verificarBackupAutomatico() {
    const agora = new Date();
    const ultimoBackup = backupConfig.ultimoBackup ? new Date(backupConfig.ultimoBackup) : null;
    
    if (!ultimoBackup || deveFazerBackup(ultimoBackup, agora)) {
        realizarBackupAutomatico();
    }
}

function deveFazerBackup(ultimoBackup, agora) {
    const diffMs = agora - ultimoBackup;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    
    switch (backupConfig.frequencia) {
        case 'diario':
            return diffDias >= 1;
        case 'semanal':
            return diffDias >= 7;
        case 'mensal':
            return diffDias >= 30;
        default:
            return false;
    }
}

function realizarBackupAutomatico() {
    const backup = gerarBackupCompleto();
    backup.nome = `Backup_Automático_${new Date().toISOString().split('T')[0]}`;
    salvarBackupLocal(backup);
    
    backupConfig.ultimoBackup = new Date().toISOString();
    localStorage.setItem('backupConfig', JSON.stringify(backupConfig));
    
    console.log('Backup automático realizado com sucesso');
}

// Funções de exportação
function exportarBackup() {
    const nome = document.getElementById('nomeBackup').value || `Backup_${new Date().toISOString().split('T')[0]}`;
    const incluirProdutos = document.getElementById('incluirProdutos').checked;
    const incluirMovimentacoes = document.getElementById('incluirMovimentacoes').checked;
    const incluirCategorias = document.getElementById('incluirCategorias').checked;
    
    const backup = {
        nome: nome,
        data: new Date().toISOString(),
        versao: '1.0',
        dados: {}
    };
    
    if (incluirProdutos) backup.dados.estoque = estoque;
    if (incluirMovimentacoes) backup.dados.movimentacoes = movimentacoes;
    if (incluirCategorias) backup.dados.categorias = categorias;
    
    // Salvar localmente
    salvarBackupLocal(backup);
    
    // Download do arquivo
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${nome}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    mostrarToast('Backup', 'Backup exportado com sucesso', 'success');
    atualizarListaBackups();
}

function exportarBackupCSV() {
    // Exportar produtos como CSV
    let csvContent = "Nome,Categoria,Estoque Mínimo,Lotes\n";
    
    estoque.forEach(produto => {
        const lotesStr = produto.lotes.map(lote => 
            `${lote.numero}(${lote.quantidade})`
        ).join(';');
        
        csvContent += `"${produto.nome}","${produto.categoria}",${produto.estoqueMinimo},"${lotesStr}"\n`;
    });
    
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
    const exportFileDefaultName = `Backup_Produtos_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    mostrarToast('Backup', 'CSV exportado com sucesso', 'success');
}

function salvarBackupLocal(backup) {
    let backups = JSON.parse(localStorage.getItem('backups')) || [];
    
    // Manter apenas os 10 backups mais recentes
    backups.unshift(backup);
    if (backups.length > 10) {
        backups = backups.slice(0, 10);
    }
    
    localStorage.setItem('backups', JSON.stringify(backups));
}

function atualizarListaBackups() {
    const container = document.getElementById('lista-backups');
    const backups = JSON.parse(localStorage.getItem('backups')) || [];
    
    if (backups.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum backup encontrado</p>';
        return;
    }
    
    container.innerHTML = '';
    backups.forEach((backup, index) => {
        const data = new Date(backup.data).toLocaleDateString('pt-BR');
        const hora = new Date(backup.data).toLocaleTimeString('pt-BR');
        
        container.innerHTML += `
            <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                <div>
                    <strong>${backup.nome}</strong>
                    <br>
                    <small class="text-muted">${data} às ${hora}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="restaurarBackup(${index})" title="Restaurar">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success me-1" onclick="downloadBackup(${index})" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="excluirBackup(${index})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

// Funções de importação
function importarBackup() {
    const fileInput = document.getElementById('arquivoBackup');
    const sobrescrever = document.getElementById('sobrescreverDados').checked;
    
    if (!fileInput.files.length) {
        mostrarToast('Erro', 'Selecione um arquivo para importar', 'danger');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            if (file.name.endsWith('.json')) {
                const backup = JSON.parse(e.target.result);
                restaurarDadosBackup(backup, sobrescrever);
            } else if (file.name.endsWith('.csv')) {
                // Implementar importação de CSV se necessário
                mostrarToast('Info', 'Importação de CSV em desenvolvimento', 'info');
            } else {
                throw new Error('Formato de arquivo não suportado');
            }
        } catch (error) {
            mostrarToast('Erro', 'Erro ao processar arquivo: ' + error.message, 'danger');
        }
    };
    
    reader.readAsText(file);
}

function restaurarDadosBackup(backup, sobrescrever) {
    if (!confirm('Tem certeza que deseja restaurar este backup? Esta ação pode substituir dados existentes.')) {
        return;
    }
    
    try {
        if (backup.dados.estoque) {
            if (sobrescrever) {
                estoque = backup.dados.estoque;
            } else {
                // Mesclar dados
                backup.dados.estoque.forEach(novoProduto => {
                    const existe = estoque.find(p => p.id === novoProduto.id);
                    if (!existe) {
                        estoque.push(novoProduto);
                    }
                });
            }
        }
        
        if (backup.dados.movimentacoes) {
            if (sobrescrever) {
                movimentacoes = backup.dados.movimentacoes;
            } else {
                movimentacoes = [...backup.dados.movimentacoes, ...movimentacoes];
            }
        }
        
        if (backup.dados.categorias) {
            if (sobrescrever) {
                categorias = backup.dados.categorias;
            } else {
                backup.dados.categorias.forEach(novaCategoria => {
                    const existe = categorias.find(c => c.id === novaCategoria.id);
                    if (!existe) {
                        categorias.push(novaCategoria);
                    }
                });
            }
        }
        
        salvarDados();
        mostrarToast('Backup', 'Dados restaurados com sucesso', 'success');
        
        // Atualizar todas as visualizações
        atualizarDashboard();
        atualizarTabelaProdutos();
        carregarSelects();
        atualizarListaCategorias();
        
    } catch (error) {
        mostrarToast('Erro', 'Erro ao restaurar backup: ' + error.message, 'danger');
    }
}

function restaurarBackup(index) {
    const backups = JSON.parse(localStorage.getItem('backups')) || [];
    const backup = backups[index];
    
    if (backup) {
        restaurarDadosBackup(backup, true);
    }
}

function downloadBackup(index) {
    const backups = JSON.parse(localStorage.getItem('backups')) || [];
    const backup = backups[index];
    
    if (backup) {
        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${backup.nome}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

function excluirBackup(index) {
    if (confirm('Tem certeza que deseja excluir este backup?')) {
        let backups = JSON.parse(localStorage.getItem('backups')) || [];
        backups.splice(index, 1);
        localStorage.setItem('backups', JSON.stringify(backups));
        atualizarListaBackups();
        mostrarToast('Backup', 'Backup excluído com sucesso', 'success');
    }
}

function gerarBackupCompleto() {
    return {
        nome: `Backup_Completo_${new Date().toISOString().split('T')[0]}`,
        data: new Date().toISOString(),
        versao: '1.0',
        dados: {
            estoque: estoque,
            movimentacoes: movimentacoes,
            categorias: categorias
        }
    };
}

function confirmarLimpezaDados() {
    if (confirm('ATENÇÃO: Esta ação irá remover TODOS os dados do sistema. Esta ação não pode ser desfeita. Tem certeza?')) {
        if (confirm('CONFIRMAÇÃO FINAL: Você realmente deseja apagar todos os dados?')) {
            limparTodosDados();
        }
    }
}

function limparTodosDados() {
    // Criar backup final antes de limpar
    const backupFinal = gerarBackupCompleto();
    backupFinal.nome = 'Backup_Pre_Limpeza_' + new Date().toISOString().split('T')[0];
    salvarBackupLocal(backupFinal);
    
    // Limpar dados
    estoque = [];
    movimentacoes = [];
    categorias = [
        { id: 1, nome: "Analgésico", descricao: "Medicamentos para alívio da dor" },
        { id: 2, nome: "Antibiótico", descricao: "Medicamentos para tratamento de infecções" },
        { id: 3, nome: "Antialérgico", descricao: "Medicamentos para tratamento de alergias" },
        { id: 4, nome: "Anti-inflamatório", descricao: "Medicamentos para redução de inflamações" },
        { id: 5, nome: "Outros", descricao: "Outros tipos de medicamentos" }
    ];
    
    salvarDados();
    mostrarToast('Sistema', 'Todos os dados foram removidos', 'warning');
    
    // Atualizar todas as visualizações
    atualizarDashboard();
    atualizarTabelaProdutos();
    carregarSelects();
    atualizarListaCategorias();
    atualizarListaBackups();
}

// Atualize a função configurarNavegacao para incluir a aba de backup
function configurarNavegacao() {
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.sidebar .nav-link').forEach(item => {
                item.classList.remove('active');
            });
            
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).style.display = 'block';
            
            if (targetId === 'dashboard') {
                atualizarDashboard();
            } else if (targetId === 'produtos') {
                atualizarTabelaProdutos();
            } else if (targetId === 'saida') {
                carregarSelects();
            } else if (targetId === 'categorias') {
                atualizarListaCategorias();
            } else if (targetId === 'relatorios') {
                carregarFiltrosRelatorios();
                aplicarFiltros();
            } else if (targetId === 'backup') {
                inicializarBackup();
            }
        });
    });
}

// Adicione esta linha ao DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    inicializarTema();
    atualizarDashboard();
    atualizarTabelaProdutos();
    carregarSelects();
    configurarNavegacao();
    atualizarListaCategorias();
    carregarFiltrosRelatorios();
    inicializarBackup(); // ← Adicione esta linha
});

// Função para atualizar estatísticas de entrada
function atualizarEstatisticasEntrada() {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    
    // Filtrar movimentações deste mês
    const entradasMes = movimentacoes.filter(mov => {
        if (mov.tipo !== 'entrada') return false;
        
        const dataMov = converterDataParaComparacao(mov.data);
        return dataMov.getMonth() === mesAtual && dataMov.getFullYear() === anoAtual;
    });
    
    const totalItensAdicionados = entradasMes.reduce((total, mov) => total + mov.quantidade, 0);
    
    document.getElementById('entradas-mes').textContent = entradasMes.length;
    document.getElementById('itens-adicionados').textContent = totalItensAdicionados;
}

// Função para atualizar estatísticas de saída
function atualizarEstatisticasSaida() {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    
    // Filtrar movimentações deste mês
    const saidasMes = movimentacoes.filter(mov => {
        if (mov.tipo !== 'saída') return false;
        
        const dataMov = converterDataParaComparacao(mov.data);
        return dataMov.getMonth() === mesAtual && dataMov.getFullYear() === anoAtual;
    });
    
    const totalItensRetirados = saidasMes.reduce((total, mov) => total + mov.quantidade, 0);
    
    document.getElementById('saidas-mes').textContent = saidasMes.length;
    document.getElementById('itens-retirados').textContent = totalItensRetirados;
}

// Atualize a função de entrada para chamar as estatísticas
document.getElementById('form-entrada').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const produtoId = parseInt(document.getElementById('produtoEntrada').value);
    const quantidade = parseInt(document.getElementById('quantidadeEntrada').value);
    const lote = document.getElementById('loteEntrada').value;
    const validade = document.getElementById('validadeEntrada').value;
    const fornecedor = document.getElementById('fornecedorEntrada').value;

    const produto = estoque.find(p => p.id === produtoId);
    if (!produto) return;

    // Adicionar lote
    produto.lotes.push({
        numero: lote,
        validade: validade,
        quantidade: quantidade,
        fornecedor: fornecedor
    });

    // Registrar movimentação
    movimentacoes.unshift({
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        produtoId: produtoId,
        produtoNome: produto.nome,
        tipo: 'entrada',
        quantidade: quantidade,
        lote: lote,
        fornecedor: fornecedor, // ← Adicionar fornecedor aqui
        observacoes: `Fornecedor: ${fornecedor}` // ← Adicionar observações com fornecedor
    });

    salvarDados();
    this.reset();
    mostrarToast('Sucesso', 'Entrada registrada com sucesso', 'success');
    atualizarDashboard();
    carregarSelects();
    atualizarEstatisticasEntrada(); // ← Adicionar esta linha
});

// Atualize a função de saída para chamar as estatísticas
document.getElementById('form-saida').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const produtoId = parseInt(document.getElementById('produtoSaida').value);
    const quantidade = parseInt(document.getElementById('quantidadeSaida').value);
    const loteNumero = document.getElementById('loteSaida').value;
    const motivo = document.getElementById('motivoSaida').value;
    const observacoes = document.getElementById('observacoesSaida').value;

    const produto = estoque.find(p => p.id === produtoId);
    if (!produto) return;

    // Encontrar o lote específico
    const lote = produto.lotes.find(l => l.numero === loteNumero);
    if (!lote) {
        mostrarToast('Erro', 'Lote não encontrado', 'danger');
        return;
    }

    // Verificar se há quantidade suficiente no lote selecionado
    if (quantidade > lote.quantidade) {
        mostrarToast('Erro', `Quantidade indisponível no lote ${loteNumero}. Disponível: ${lote.quantidade}`, 'danger');
        return;
    }

    // Remover do lote específico
    lote.quantidade -= quantidade;

    // Remover lote se estiver vazio
    if (lote.quantidade === 0) {
        produto.lotes = produto.lotes.filter(l => l.numero !== loteNumero);
    }

    // Registrar movimentação
    movimentacoes.unshift({
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        produtoId: produtoId,
        produtoNome: produto.nome,
        tipo: 'saída',
        quantidade: quantidade,
        lote: loteNumero,
        motivo: motivo,
        observacoes: observacoes
    });

    salvarDados();
    this.reset();
    mostrarToast('Sucesso', 'Saída registrada com sucesso', 'success');
    atualizarDashboard();
    carregarSelects();
    atualizarEstatisticasSaida(); // ← Adicionar esta linha
});

// Atualize a função configurarNavegacao para chamar as estatísticas
function configurarNavegacao() {
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.sidebar .nav-link').forEach(item => {
                item.classList.remove('active');
            });
            
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).style.display = 'block';
            
            if (targetId === 'dashboard') {
                atualizarDashboard();
            } else if (targetId === 'produtos') {
                atualizarTabelaProdutos();
            } else if (targetId === 'entrada') {
                carregarSelects();
                atualizarEstatisticasEntrada(); // ← Adicionar esta linha
            } else if (targetId === 'saida') {
                carregarSelects();
                atualizarEstatisticasSaida(); // ← Adicionar esta linha
            } else if (targetId === 'categorias') {
                atualizarListaCategorias();
            } else if (targetId === 'relatorios') {
                carregarFiltrosRelatorios();
                aplicarFiltros();
            } else if (targetId === 'backup') {
                inicializarBackup();
            }
        });
    });
}