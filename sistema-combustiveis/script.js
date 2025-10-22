// Arrays para armazenar os dados
let veiculos = JSON.parse(localStorage.getItem('veiculos')) || [];
let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos')) || [];

// Elementos do DOM para tabs
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Elementos do DOM para veículos
const veiculoForm = document.getElementById('veiculo-form');
const tabelaVeiculosCorpo = document.getElementById('tabela-veiculos-corpo');
const emptyVeiculos = document.getElementById('empty-veiculos');
const btnLimparVeiculo = document.getElementById('btn-limpar-veiculo');

// Elementos do DOM para abastecimentos
const abastecimentoForm = document.getElementById('abastecimento-form');
const tabelaCorpo = document.getElementById('tabela-corpo');
const emptyMessage = document.getElementById('empty-message');
const btnLimpar = document.getElementById('btn-limpar');
const veiculoSelect = document.getElementById('veiculo');
const filtroVeiculoAbastecimentos = document.getElementById('filtro-veiculo-abastecimentos');

// Elementos do dashboard
const totalFrota = document.getElementById('total-frota');
const totalVeiculos = document.getElementById('total-veiculos');
const mediaLitroFrota = document.getElementById('media-litro-frota');
const totalLitrosFrota = document.getElementById('total-litros-frota');

// Elementos da tabela de resumo
const tabelaResumoCorpo = document.getElementById('tabela-resumo-corpo');
const emptyResumo = document.getElementById('empty-resumo');

// Elementos do formulário de abastecimento
const dataInput = document.getElementById('data');
const combustivelSelect = document.getElementById('combustivel');
const litrosInput = document.getElementById('litros');
const precoLitroInput = document.getElementById('preco-litro');
const valorTotalInput = document.getElementById('valor-total');
const odometroInput = document.getElementById('odometro');

// Elementos do tema
const themeToggle = document.getElementById('theme-toggle');

// Definir data atual como padrão
const hoje = new Date().toISOString().split('T')[0];
dataInput.value = hoje;

// Inicializar tema
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeButton(currentTheme);

// Event Listeners para tema
themeToggle.addEventListener('click', toggleTheme);

// Event Listeners para tabs
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        
        // Remover classe active de todas as tabs e conteúdos
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        // Adicionar classe active à tab e conteúdo selecionados
        tab.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        // Se for a aba de gráficos, atualizar os gráficos
        if (tabId === 'graficos') {
            setTimeout(atualizarGraficos, 100);
        }
    });
});

/// Event Listeners para formulários - VERIFICAR SE EXISTEM
veiculoForm.addEventListener('submit', adicionarVeiculo);
abastecimentoForm.addEventListener('submit', adicionarAbastecimento);
btnLimparVeiculo.addEventListener('click', limparCamposVeiculo);
btnLimpar.addEventListener('click', limparCamposAbastecimento);

// Variáveis para controlar os cálculos
let calculando = false;

// Event Listeners para cálculos automáticos - VERSÃO CORRIGIDA
litrosInput.addEventListener('input', function() {
    if (!calculando) {
        calculando = true;
        setTimeout(() => {
            if (litrosInput.value && precoLitroInput.value) {
                calcularValorTotal();
            } else if (litrosInput.value && valorTotalInput.value) {
                calcularPrecoLitro();
            }
            calculando = false;
        }, 300);
    }
});

precoLitroInput.addEventListener('input', function() {
    if (!calculando) {
        calculando = true;
        setTimeout(() => {
            if (precoLitroInput.value && litrosInput.value) {
                calcularValorTotal();
            } else if (precoLitroInput.value && valorTotalInput.value) {
                calcularLitros();
            }
            calculando = false;
        }, 300);
    }
});

valorTotalInput.addEventListener('input', function() {
    if (!calculando) {
        calculando = true;
        setTimeout(() => {
            if (valorTotalInput.value && precoLitroInput.value) {
                calcularLitros();
            } else if (valorTotalInput.value && litrosInput.value) {
                calcularPrecoLitro();
            }
            calculando = false;
        }, 300);
    }
});

// Event Listener para filtro de veículos na tabela de abastecimentos
filtroVeiculoAbastecimentos.addEventListener('change', atualizarTabelaAbastecimentos);

// Inicializar a aplicação
atualizarSelectVeiculos();
atualizarTabelaVeiculos();
atualizarTabelaAbastecimentos();
atualizarDashboard();
atualizarTabelaResumo();

// Funções para tema
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Funções para veículos
function adicionarVeiculo(e) {
    e.preventDefault();
    
    const nomeVeiculo = document.getElementById('nome-veiculo').value;
    const placa = document.getElementById('placa').value;
    const tipoVeiculo = document.getElementById('tipo-veiculo').value;
    const combustivelPadrao = document.getElementById('combustivel-padrao').value;
    
    const novoVeiculo = {
        id: Date.now(),
        nome: nomeVeiculo,
        placa: placa.toUpperCase(),
        tipo: tipoVeiculo,
        combustivelPadrao: combustivelPadrao,
        totalGasto: 0,
        totalLitros: 0,
        ultimoAbastecimento: null
    };
    
    veiculos.push(novoVeiculo);
    salvarNoLocalStorage();
    atualizarSelectVeiculos();
    atualizarTabelaVeiculos();
    atualizarTabelaResumo();
    atualizarDashboard();
    limparCamposVeiculo();
}

function removerVeiculo(id) {
    if (confirm('Tem certeza que deseja remover este veículo? Todos os abastecimentos relacionados também serão removidos.')) {
        // Remover veículo
        veiculos = veiculos.filter(veiculo => veiculo.id !== id);
        
        // Remover abastecimentos relacionados
        abastecimentos = abastecimentos.filter(abastecimento => abastecimento.veiculoId !== id);
        
        salvarNoLocalStorage();
        atualizarSelectVeiculos();
        atualizarTabelaVeiculos();
        atualizarTabelaAbastecimentos();
        atualizarTabelaResumo();
        atualizarDashboard();
    }
}

function editarVeiculo(id) {
    const veiculo = veiculos.find(v => v.id === id);
    
    if (veiculo) {
        document.getElementById('nome-veiculo').value = veiculo.nome;
        document.getElementById('placa').value = veiculo.placa;
        document.getElementById('tipo-veiculo').value = veiculo.tipo;
        document.getElementById('combustivel-padrao').value = veiculo.combustivelPadrao;
        
        // Remover o veículo para edição
        veiculos = veiculos.filter(v => v.id !== id);
        salvarNoLocalStorage();
        atualizarSelectVeiculos();
        atualizarTabelaVeiculos();
        atualizarTabelaResumo();
        atualizarDashboard();
    }
}

// Função para adicionar abastecimento - CORRIGIDA
function adicionarAbastecimento(e) {
    e.preventDefault();
    
    const veiculoId = parseInt(veiculoSelect.value);
    const veiculo = veiculos.find(v => v.id === veiculoId);
    
    if (!veiculo) {
        alert('Selecione um veículo válido.');
        return;
    }
    
    // Validar campos numéricos
    const litros = parseFloat(litrosInput.value);
    const precoLitro = parseFloat(precoLitroInput.value);
    const valorTotal = parseFloat(valorTotalInput.value);
    
    if (!litros || litros <= 0) {
        alert('Por favor, informe uma quantidade de litros válida.');
        litrosInput.focus();
        return;
    }
    
    if (!precoLitro || precoLitro <= 0) {
        alert('Por favor, informe um preço por litro válido.');
        precoLitroInput.focus();
        return;
    }
    
    if (!valorTotal || valorTotal <= 0) {
        alert('Por favor, informe um valor total válido.');
        valorTotalInput.focus();
        return;
    }
    
    const novoAbastecimento = {
        id: Date.now(),
        veiculoId: veiculoId,
        veiculoNome: veiculo.nome,
        data: dataInput.value,
        combustivel: combustivelSelect.value,
        litros: litros,
        precoLitro: precoLitro,
        valorTotal: valorTotal,
        odometro: odometroInput.value ? parseInt(odometroInput.value) : null
    };
    
    abastecimentos.push(novoAbastecimento);
    
    // Atualizar estatísticas do veículo
    atualizarEstatisticasVeiculo(veiculoId);
    
    salvarNoLocalStorage();
    atualizarTabelaAbastecimentos();
    atualizarDashboard();
    atualizarTabelaResumo();
    limparCamposAbastecimento();
    
    alert('Abastecimento registrado com sucesso!');
}


function removerAbastecimento(id) {
    if (confirm('Tem certeza que deseja remover este abastecimento?')) {
        const abastecimento = abastecimentos.find(a => a.id === id);
        
        abastecimentos = abastecimentos.filter(abastecimento => abastecimento.id !== id);
        
        // Atualizar estatísticas do veículo
        if (abastecimento) {
            atualizarEstatisticasVeiculo(abastecimento.veiculoId);
        }
        
        salvarNoLocalStorage();
        atualizarTabelaAbastecimentos();
        atualizarDashboard();
        atualizarTabelaResumo();
    }
}

function editarAbastecimento(id) {
    const abastecimento = abastecimentos.find(a => a.id === id);
    
    if (abastecimento) {
        veiculoSelect.value = abastecimento.veiculoId;
        dataInput.value = abastecimento.data;
        combustivelSelect.value = abastecimento.combustivel;
        litrosInput.value = abastecimento.litros;
        precoLitroInput.value = abastecimento.precoLitro;
        valorTotalInput.value = abastecimento.valorTotal;
        odometroInput.value = abastecimento.odometro || '';
        
        // Remover o abastecimento para edição
        abastecimentos = abastecimentos.filter(a => a.id !== id);
        
        // Atualizar estatísticas do veículo
        atualizarEstatisticasVeiculo(abastecimento.veiculoId);
        
        salvarNoLocalStorage();
        atualizarTabelaAbastecimentos();
        atualizarDashboard();
        atualizarTabelaResumo();
    }
}

// Funções auxiliares
function atualizarEstatisticasVeiculo(veiculoId) {
    const abastecimentosVeiculo = abastecimentos.filter(a => a.veiculoId === veiculoId);
    
    if (abastecimentosVeiculo.length === 0) {
        // Resetar estatísticas se não houver abastecimentos
        const veiculoIndex = veiculos.findIndex(v => v.id === veiculoId);
        if (veiculoIndex !== -1) {
            veiculos[veiculoIndex].totalGasto = 0;
            veiculos[veiculoIndex].totalLitros = 0;
            veiculos[veiculoIndex].ultimoAbastecimento = null;
        }
        return;
    }
    
    const totalGasto = abastecimentosVeiculo.reduce((acc, curr) => acc + curr.valorTotal, 0);
    const totalLitros = abastecimentosVeiculo.reduce((acc, curr) => acc + curr.litros, 0);
    
    // Encontrar o último abastecimento
    const ultimoAbastecimento = [...abastecimentosVeiculo].sort((a, b) => 
        new Date(b.data) - new Date(a.data)
    )[0];
    
    // Atualizar veículo
    const veiculoIndex = veiculos.findIndex(v => v.id === veiculoId);
    if (veiculoIndex !== -1) {
        veiculos[veiculoIndex].totalGasto = totalGasto;
        veiculos[veiculoIndex].totalLitros = totalLitros;
        veiculos[veiculoIndex].ultimoAbastecimento = ultimoAbastecimento.data;
    }
}

function atualizarSelectVeiculos() {
    veiculoSelect.innerHTML = '<option value="">Selecione um veículo</option>';
    filtroVeiculoAbastecimentos.innerHTML = '<option value="todos">Todos os veículos</option>';
    
    veiculos.forEach(veiculo => {
        const option = document.createElement('option');
        option.value = veiculo.id;
        option.textContent = `${veiculo.nome} (${veiculo.placa})`;
        veiculoSelect.appendChild(option);
        
        const optionFiltro = document.createElement('option');
        optionFiltro.value = veiculo.id;
        optionFiltro.textContent = `${veiculo.nome} (${veiculo.placa})`;
        filtroVeiculoAbastecimentos.appendChild(optionFiltro);
    });
}

function atualizarTabelaVeiculos() {
    tabelaVeiculosCorpo.innerHTML = '';
    
    if (veiculos.length === 0) {
        emptyVeiculos.style.display = 'block';
        return;
    }
    
    emptyVeiculos.style.display = 'none';
    
    veiculos.forEach(veiculo => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${veiculo.nome}</td>
            <td>${veiculo.placa}</td>
            <td>${formatarTipoVeiculo(veiculo.tipo)}</td>
            <td>${formatarCombustivel(veiculo.combustivelPadrao)}</td>
            <td>R$ ${veiculo.totalGasto.toFixed(2)}</td>
            <td class="actions">
                <button class="btn-small" onclick="editarVeiculo(${veiculo.id})">Editar</button>
                <button class="btn-small btn-danger" onclick="removerVeiculo(${veiculo.id})">Remover</button>
            </td>
        `;
        
        tabelaVeiculosCorpo.appendChild(tr);
    });
}

function atualizarTabelaAbastecimentos() {
    tabelaCorpo.innerHTML = '';
    
    const veiculoFiltro = filtroVeiculoAbastecimentos.value;
    let abastecimentosFiltrados = [...abastecimentos];
    
    if (veiculoFiltro !== 'todos') {
        abastecimentosFiltrados = abastecimentosFiltrados.filter(a => a.veiculoId === parseInt(veiculoFiltro));
    }
    
    if (abastecimentosFiltrados.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }
    
    emptyMessage.style.display = 'none';
    
    // Ordenar por data (mais recente primeiro)
    abastecimentosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    abastecimentosFiltrados.forEach(abastecimento => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${formatarData(abastecimento.data)}</td>
            <td>${abastecimento.veiculoNome}</td>
            <td>${formatarCombustivel(abastecimento.combustivel)}</td>
            <td>${abastecimento.litros.toFixed(2)} L</td>
            <td>R$ ${abastecimento.precoLitro.toFixed(3)}</td>
            <td>R$ ${abastecimento.valorTotal.toFixed(2)}</td>
            <td>${abastecimento.odometro || '-'}</td>
            <td class="actions">
                <button class="btn-small" onclick="editarAbastecimento(${abastecimento.id})">Editar</button>
                <button class="btn-small btn-danger" onclick="removerAbastecimento(${abastecimento.id})">Remover</button>
            </td>
        `;
        
        tabelaCorpo.appendChild(tr);
    });
}

function atualizarTabelaResumo() {
    tabelaResumoCorpo.innerHTML = '';
    
    if (veiculos.length === 0) {
        emptyResumo.style.display = 'block';
        return;
    }
    
    emptyResumo.style.display = 'none';
    
    veiculos.forEach(veiculo => {
        const mediaLitro = veiculo.totalLitros > 0 ? veiculo.totalGasto / veiculo.totalLitros : 0;
        
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${veiculo.nome}</td>
            <td>${veiculo.placa}</td>
            <td>R$ ${veiculo.totalGasto.toFixed(2)}</td>
            <td>${veiculo.totalLitros.toFixed(2)} L</td>
            <td>R$ ${mediaLitro.toFixed(3)}</td>
            <td>${veiculo.ultimoAbastecimento ? formatarData(veiculo.ultimoAbastecimento) : '-'}</td>
        `;
        
        tabelaResumoCorpo.appendChild(tr);
    });
}

function atualizarDashboard() {
    // Total de veículos
    totalVeiculos.textContent = veiculos.length;
    
    if (veiculos.length === 0 || abastecimentos.length === 0) {
        totalFrota.textContent = 'R$ 0,00';
        mediaLitroFrota.textContent = 'R$ 0,00';
        totalLitrosFrota.textContent = '0 L';
        return;
    }
    
    // Total gasto na frota
    const totalGastoFrota = veiculos.reduce((acc, veiculo) => acc + veiculo.totalGasto, 0);
    totalFrota.textContent = `R$ ${totalGastoFrota.toFixed(2)}`;
    
    // Total de litros
    const totalLitros = veiculos.reduce((acc, veiculo) => acc + veiculo.totalLitros, 0);
    totalLitrosFrota.textContent = `${totalLitros.toFixed(2)} L`;
    
    // Média por litro na frota
    const mediaLitro = totalLitros > 0 ? totalGastoFrota / totalLitros : 0;
    mediaLitroFrota.textContent = `R$ ${mediaLitro.toFixed(3)}`;
}

// Funções de cálculo individuais
function calcularValorTotal() {
    const litros = parseFloat(litrosInput.value);
    const precoLitro = parseFloat(precoLitroInput.value);
    
    if (litros > 0 && precoLitro > 0) {
        // Temporariamente remove o listener para evitar loop
        valorTotalInput.removeEventListener('input', arguments.callee);
        valorTotalInput.value = (litros * precoLitro).toFixed(2);
        // Re-adiciona o listener após um delay
        setTimeout(() => {
            valorTotalInput.addEventListener('input', arguments.callee);
        }, 500);
    }
}

function calcularLitros() {
    const valorTotal = parseFloat(valorTotalInput.value);
    const precoLitro = parseFloat(precoLitroInput.value);
    
    if (valorTotal > 0 && precoLitro > 0) {
        litrosInput.removeEventListener('input', arguments.callee);
        litrosInput.value = (valorTotal / precoLitro).toFixed(2);
        setTimeout(() => {
            litrosInput.addEventListener('input', arguments.callee);
        }, 500);
    }
}

function calcularPrecoLitro() {
    const valorTotal = parseFloat(valorTotalInput.value);
    const litros = parseFloat(litrosInput.value);
    
    if (valorTotal > 0 && litros > 0) {
        precoLitroInput.removeEventListener('input', arguments.callee);
        precoLitroInput.value = (valorTotal / litros).toFixed(3);
        setTimeout(() => {
            precoLitroInput.addEventListener('input', arguments.callee);
        }, 500);
    }
}

function limparCamposVeiculo() {
    veiculoForm.reset();
}


// Função para limpar campos - CORRIGIDA
function limparCamposAbastecimento() {
    // Limpa apenas os campos específicos, mantendo a data atual
    veiculoSelect.value = '';
    combustivelSelect.value = '';
    litrosInput.value = '';
    precoLitroInput.value = '';
    valorTotalInput.value = '';
    odometroInput.value = '';
    
    // Mantém a data atual
    dataInput.value = hoje;
    
    // Foca no primeiro campo
    veiculoSelect.focus();
}

function salvarNoLocalStorage() {
    localStorage.setItem('veiculos', JSON.stringify(veiculos));
    localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
}

// Funções de formatação
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarCombustivel(combustivel) {
    const tipos = {
        'gasolina': 'Gasolina',
        'etanol': 'Etanol',
        'diesel': 'Diesel',
        'gnv': 'GNV'
    };
    
    return tipos[combustivel] || combustivel;
}

function formatarTipoVeiculo(tipo) {
    const tipos = {
        'ambulancia': 'Ambulância',
        'carro': 'Carro',
        'moto': 'Moto',
        'caminhao': 'Caminhão',
        'van': 'Van',
        'onibus': 'Ônibus'
    };
    
    return tipos[tipo] || tipo;
}

// Funções para gráficos
function atualizarGraficos() {
    criarGraficoGastosVeiculos();
    criarGraficoCombustivel();
    criarGraficoEvolucaoGastos();
    criarGraficoMediasVeiculos();
}

function criarGraficoGastosVeiculos() {
    const ctx = document.getElementById('grafico-gastos-veiculos').getContext('2d');
    
    const labels = veiculos.map(v => v.nome);
    const dados = veiculos.map(v => v.totalGasto);
    const cores = gerarCores(veiculos.length);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Gasto (R$)',
                data: dados,
                backgroundColor: cores,
                borderColor: cores.map(cor => cor.replace('0.2', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function criarGraficoCombustivel() {
    const ctx = document.getElementById('grafico-combustivel').getContext('2d');
    
    const tiposCombustivel = {};
    abastecimentos.forEach(abastecimento => {
        const tipo = abastecimento.combustivel;
        tiposCombustivel[tipo] = (tiposCombustivel[tipo] || 0) + abastecimento.valorTotal;
    });
    
    const labels = Object.keys(tiposCombustivel).map(formatarCombustivel);
    const dados = Object.values(tiposCombustivel);
    const cores = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                backgroundColor: cores.slice(0, labels.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function criarGraficoEvolucaoGastos() {
    const ctx = document.getElementById('grafico-evolucao-gastos').getContext('2d');
    
    // Agrupar gastos por mês
    const gastosPorMes = {};
    abastecimentos.forEach(abastecimento => {
        const data = new Date(abastecimento.data);
        const mesAno = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        gastosPorMes[mesAno] = (gastosPorMes[mesAno] || 0) + abastecimento.valorTotal;
    });
    
    // Ordenar por data
    const mesesOrdenados = Object.keys(gastosPorMes).sort();
    const labels = mesesOrdenados.map(mes => {
        const [ano, mesNum] = mes.split('-');
        return `${mesNum}/${ano}`;
    });
    const dados = mesesOrdenados.map(mes => gastosPorMes[mes]);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos Mensais (R$)',
                data: dados,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function criarGraficoMediasVeiculos() {
    const ctx = document.getElementById('grafico-medias-veiculos').getContext('2d');
    
    const labels = veiculos.map(v => v.nome);
    const dados = veiculos.map(v => v.totalLitros > 0 ? v.totalGasto / v.totalLitros : 0);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Média R$/L',
                data: dados,
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(3);
                        }
                    }
                }
            }
        }
    });
}

function gerarCores(quantidade) {
    const cores = [];
    for (let i = 0; i < quantidade; i++) {
        const hue = (i * 360 / quantidade) % 360;
        cores.push(`hsla(${hue}, 70%, 50%, 0.7)`);
    }
    return cores;
}

// Elementos do DOM para backup
const btnExportar = document.getElementById('btn-exportar');
const btnImportar = document.getElementById('btn-importar');
const arquivoBackup = document.getElementById('arquivo-backup');
const btnLimparTudo = document.getElementById('btn-limpar-tudo');

// Elementos de informações
const infoVeiculos = document.getElementById('info-veiculos');
const infoAbastecimentos = document.getElementById('info-abastecimentos');
const infoTotalGasto = document.getElementById('info-total-gasto');
const infoUltimoBackup = document.getElementById('info-ultimo-backup');

// Event Listeners para backup
btnExportar.addEventListener('click', exportarBackup);
btnImportar.addEventListener('click', importarBackup);
btnLimparTudo.addEventListener('click', limparTodosDados);

// Função para exportar backup
function exportarBackup() {
    const dados = {
        veiculos: veiculos,
        abastecimentos: abastecimentos,
        metadata: {
            dataExportacao: new Date().toISOString(),
            totalVeiculos: veiculos.length,
            totalAbastecimentos: abastecimentos.length,
            versaoSistema: '1.0'
        }
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { 
        type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-combustivel-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Salvar data do último backup
    localStorage.setItem('ultimoBackup', new Date().toISOString());
    atualizarInformacoesBackup();
    
    alert('Backup exportado com sucesso!');
}

// Função para importar backup
function importarBackup() {
    const file = arquivoBackup.files[0];
    
    if (!file) {
        alert('Por favor, selecione um arquivo de backup.');
        return;
    }

    if (!confirm('ATENÇÃO: Isso substituirá todos os dados atuais. Tem certeza?')) {
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            
            // Validar estrutura do backup
            if (!dados.veiculos || !dados.abastecimentos) {
                throw new Error('Arquivo de backup inválido.');
            }

            // Substituir dados atuais
            veiculos = dados.veiculos;
            abastecimentos = dados.abastecimentos;
            
            salvarNoLocalStorage();
            atualizarSelectVeiculos();
            atualizarTabelaVeiculos();
            atualizarTabelaAbastecimentos();
            atualizarDashboard();
            atualizarTabelaResumo();
            atualizarInformacoesBackup();
            
            // Limpar seleção de arquivo
            arquivoBackup.value = '';
            
            alert('Backup importado com sucesso!');
            
        } catch (error) {
            alert('Erro ao importar backup: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Função para limpar todos os dados
function limparTodosDados() {
    if (!confirm('⚠️ ATENÇÃO: Isso removerá TODOS os veículos e abastecimentos. Esta ação é irreversível!')) {
        return;
    }

    if (!confirm('TEM CERTEZA ABSOLUTA? Todos os dados serão perdidos permanentemente.')) {
        return;
    }

    veiculos = [];
    abastecimentos = [];
    
    salvarNoLocalStorage();
    atualizarSelectVeiculos();
    atualizarTabelaVeiculos();
    atualizarTabelaAbastecimentos();
    atualizarDashboard();
    atualizarTabelaResumo();
    atualizarInformacoesBackup();
    
    alert('Todos os dados foram removidos com sucesso.');
}

// Função para atualizar informações do backup
function atualizarInformacoesBackup() {
    infoVeiculos.textContent = veiculos.length;
    infoAbastecimentos.textContent = abastecimentos.length;
    
    const totalGasto = veiculos.reduce((acc, veiculo) => acc + veiculo.totalGasto, 0);
    infoTotalGasto.textContent = `R$ ${totalGasto.toFixed(2)}`;
    
    const ultimoBackup = localStorage.getItem('ultimoBackup');
    if (ultimoBackup) {
        infoUltimoBackup.textContent = new Date(ultimoBackup).toLocaleDateString('pt-BR');
    } else {
        infoUltimoBackup.textContent = 'Nunca';
    }
}

// Atualizar informações quando a aba backup for aberta
document.querySelector('.tab[data-tab="backup"]').addEventListener('click', function() {
    setTimeout(atualizarInformacoesBackup, 100);
});

// Função para formatar números (adicione junto com as outras funções de formatação)
function formatarNumero(numero, casasDecimais = 2) {
    return parseFloat(numero).toFixed(casasDecimais);
}

// Elementos do DOM para filtros avançados
const filtroVeiculoGraficos = document.getElementById('filtro-veiculo-graficos');
const filtroDataInicio = document.getElementById('filtro-data-inicio');
const filtroDataFim = document.getElementById('filtro-data-fim');
const filtroCombustivel = document.getElementById('filtro-combustivel');
const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
const btnLimparFiltros = document.getElementById('btn-limpar-filtros');

// Variáveis para armazenar os filtros atuais
let filtrosAtivos = {
    veiculos: [],
    dataInicio: null,
    dataFim: null,
    combustiveis: []
};

// Event Listeners para filtros avançados
btnAplicarFiltros.addEventListener('click', aplicarFiltrosGraficos);
btnLimparFiltros.addEventListener('click', limparFiltrosGraficos);

// Inicializar filtros quando a aba de gráficos for aberta
document.querySelector('.tab[data-tab="graficos"]').addEventListener('click', function() {
    setTimeout(() => {
        inicializarFiltrosGraficos();
        atualizarGraficos();
    }, 100);
});

// Função para inicializar os filtros
function inicializarFiltrosGraficos() {
    // Limpar e popular select de veículos
    filtroVeiculoGraficos.innerHTML = '<option value="todos" selected>Todos os Veículos</option>';
    veiculos.forEach(veiculo => {
        const option = document.createElement('option');
        option.value = veiculo.id;
        option.textContent = `${veiculo.nome} (${veiculo.placa})`;
        filtroVeiculoGraficos.appendChild(option);
    });

    // Definir datas padrão (últimos 6 meses)
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(dataInicio.getMonth() - 6);

    filtroDataInicio.value = dataInicio.toISOString().split('T')[0];
    filtroDataFim.value = dataFim.toISOString().split('T')[0];
}

// Função para aplicar filtros
function aplicarFiltrosGraficos() {
    // Obter veículos selecionados
    const veiculosSelecionados = Array.from(filtroVeiculoGraficos.selectedOptions)
        .map(option => option.value)
        .filter(value => value !== 'todos');
    
    filtrosAtivos.veiculos = veiculosSelecionados;

    // Obter datas
    filtrosAtivos.dataInicio = filtroDataInicio.value ? new Date(filtroDataInicio.value) : null;
    filtrosAtivos.dataFim = filtroDataFim.value ? new Date(filtroDataFim.value) : null;

    // Obter combustíveis selecionados
    const combustiveisSelecionados = Array.from(filtroCombustivel.selectedOptions)
        .map(option => option.value)
        .filter(value => value !== 'todos');
    
    filtrosAtivos.combustiveis = combustiveisSelecionados;

    // Atualizar gráficos com filtros
    atualizarGraficos();
    
    // Mostrar status dos filtros
    mostrarStatusFiltros();
}

// Função para limpar filtros
function limparFiltrosGraficos() {
    // Resetar selects
    filtroVeiculoGraficos.querySelector('option[value="todos"]').selected = true;
    filtroCombustivel.querySelector('option[value="todos"]').selected = true;
    
    // Resetar datas para padrão
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(dataInicio.getMonth() - 6);
    
    filtroDataInicio.value = dataInicio.toISOString().split('T')[0];
    filtroDataFim.value = dataFim.toISOString().split('T')[0];
    
    // Limpar filtros ativos
    filtrosAtivos = {
        veiculos: [],
        dataInicio: null,
        dataFim: null,
        combustiveis: []
    };
    
    // Atualizar gráficos sem filtros
    atualizarGraficos();
    
    // Limpar status
    const statusElement = document.querySelector('.filtro-status');
    if (statusElement) {
        statusElement.remove();
    }
}

// Função para mostrar status dos filtros ativos
function mostrarStatusFiltros() {
    // Remover status anterior se existir
    const statusAnterior = document.querySelector('.filtro-status');
    if (statusAnterior) {
        statusAnterior.remove();
    }

    const statusElement = document.createElement('div');
    statusElement.className = 'filtro-status';
    
    let statusText = 'Filtros ativos: ';
    const filtros = [];
    
    if (filtrosAtivos.veiculos.length > 0) {
        const nomesVeiculos = filtrosAtivos.veiculos.map(id => {
            const veiculo = veiculos.find(v => v.id == id);
            return veiculo ? veiculo.nome : id;
        });
        filtros.push(`Veículos: ${nomesVeiculos.join(', ')}`);
    }
    
    if (filtrosAtivos.dataInicio || filtrosAtivos.dataFim) {
        const dataInicioStr = filtrosAtivos.dataInicio ? formatarData(filtrosAtivos.dataInicio.toISOString().split('T')[0]) : 'Início';
        const dataFimStr = filtrosAtivos.dataFim ? formatarData(filtrosAtivos.dataFim.toISOString().split('T')[0]) : 'Fim';
        filtros.push(`Período: ${dataInicioStr} a ${dataFimStr}`);
    }
    
    if (filtrosAtivos.combustiveis.length > 0) {
        const combustiveisFormatados = filtrosAtivos.combustiveis.map(formatarCombustivel);
        filtros.push(`Combustíveis: ${combustiveisFormatados.join(', ')}`);
    }
    
    if (filtros.length === 0) {
        statusText = 'Sem filtros ativos';
    } else {
        statusText += filtros.join(' | ');
    }
    
    statusElement.textContent = statusText;
    
    // Inserir após o botão de aplicar filtros
    const filtroContainer = document.querySelector('#graficos .form-container');
    filtroContainer.appendChild(statusElement);
}

// Função para obter dados filtrados
function obterDadosFiltrados() {
    let veiculosFiltrados = [...veiculos];
    let abastecimentosFiltrados = [...abastecimentos];

    // Aplicar filtro de veículos
    if (filtrosAtivos.veiculos.length > 0) {
        veiculosFiltrados = veiculosFiltrados.filter(veiculo => 
            filtrosAtivos.veiculos.includes(veiculo.id.toString())
        );
        
        abastecimentosFiltrados = abastecimentosFiltrados.filter(abastecimento =>
            filtrosAtivos.veiculos.includes(abastecimento.veiculoId.toString())
        );
    }

    // Aplicar filtro de data
    if (filtrosAtivos.dataInicio) {
        abastecimentosFiltrados = abastecimentosFiltrados.filter(abastecimento =>
            new Date(abastecimento.data) >= filtrosAtivos.dataInicio
        );
    }

    if (filtrosAtivos.dataFim) {
        // Adicionar um dia para incluir a data final completa
        const dataFimAjustada = new Date(filtrosAtivos.dataFim);
        dataFimAjustada.setDate(dataFimAjustada.getDate() + 1);
        
        abastecimentosFiltrados = abastecimentosFiltrados.filter(abastecimento =>
            new Date(abastecimento.data) < dataFimAjustada
        );
    }

    // Aplicar filtro de combustível
    if (filtrosAtivos.combustiveis.length > 0) {
        abastecimentosFiltrados = abastecimentosFiltrados.filter(abastecimento =>
            filtrosAtivos.combustiveis.includes(abastecimento.combustivel)
        );
    }

    return {
        veiculos: veiculosFiltrados,
        abastecimentos: abastecimentosFiltrados
    };
}

// Atualizar as funções de gráficos para usar dados filtrados
function criarGraficoGastosVeiculos() {
    const ctx = document.getElementById('grafico-gastos-veiculos');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const dadosFiltrados = obterDadosFiltrados();
    const labels = dadosFiltrados.veiculos.map(v => v.nome);
    const dados = dadosFiltrados.veiculos.map(v => v.totalGasto);
    const cores = gerarCores(dadosFiltrados.veiculos.length);
    
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Gasto (R$)',
                data: dados,
                backgroundColor: cores,
                borderColor: cores.map(cor => cor.replace('0.2', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: dadosFiltrados.veiculos.length === veiculos.length ? 
                          'Gastos por Veículo' : 'Gastos por Veículo (Filtrado)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Atualizar as outras funções de gráficos de forma similar...
// Modificar criarGraficoCombustivel, criarGraficoEvolucaoGastos e criarGraficoMediasVeiculos

function criarGraficoCombustivel() {
    const ctx = document.getElementById('grafico-combustivel');
    if (!ctx) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const dadosFiltrados = obterDadosFiltrados();
    
    const tiposCombustivel = {};
    dadosFiltrados.abastecimentos.forEach(abastecimento => {
        const tipo = abastecimento.combustivel;
        tiposCombustivel[tipo] = (tiposCombustivel[tipo] || 0) + abastecimento.valorTotal;
    });
    
    const labels = Object.keys(tiposCombustivel).map(formatarCombustivel);
    const dados = Object.values(tiposCombustivel);
    const cores = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    ctx.chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                backgroundColor: cores.slice(0, labels.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: dadosFiltrados.abastecimentos.length === abastecimentos.length ? 
                          'Distribuição por Combustível' : 'Distribuição por Combustível (Filtrado)'
                }
            }
        }
    });
}

function criarGraficoEvolucaoGastos() {
    const ctx = document.getElementById('grafico-evolucao-gastos');
    if (!ctx) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const dadosFiltrados = obterDadosFiltrados();
    
    // Agrupar gastos por mês
    const gastosPorMes = {};
    dadosFiltrados.abastecimentos.forEach(abastecimento => {
        const data = new Date(abastecimento.data);
        const mesAno = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        gastosPorMes[mesAno] = (gastosPorMes[mesAno] || 0) + abastecimento.valorTotal;
    });
    
    // Ordenar por data
    const mesesOrdenados = Object.keys(gastosPorMes).sort();
    const labels = mesesOrdenados.map(mes => {
        const [ano, mesNum] = mes.split('-');
        return `${mesNum}/${ano}`;
    });
    const dados = mesesOrdenados.map(mes => gastosPorMes[mes]);
    
    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos Mensais (R$)',
                data: dados,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: dadosFiltrados.abastecimentos.length === abastecimentos.length ? 
                          'Evolução de Gastos Mensais' : 'Evolução de Gastos Mensais (Filtrado)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function criarGraficoMediasVeiculos() {
    const ctx = document.getElementById('grafico-medias-veiculos');
    if (!ctx) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const dadosFiltrados = obterDadosFiltrados();
    
    const labels = dadosFiltrados.veiculos.map(v => v.nome);
    const dados = dadosFiltrados.veiculos.map(v => v.totalLitros > 0 ? v.totalGasto / v.totalLitros : 0);
    
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Média R$/L',
                data: dados,
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: dadosFiltrados.veiculos.length === veiculos.length ? 
                          'Comparação de Médias por Veículo' : 'Comparação de Médias por Veículo (Filtrado)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(3);
                        }
                    }
                }
            }
        }
    });
}