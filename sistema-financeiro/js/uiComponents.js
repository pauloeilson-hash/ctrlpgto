/**
 * Componentes de interface do usuário
 */

class UIComponents {
    constructor() {
        this.charts = {
            nomes: null,
            meses: null
        };
        this.filters = {
            nome: '',
            dataInicial: '',
            dataFinal: '',
            status: '',
            historico: ''
        };
        this.isRegistrosVisible = true;
        this.domCache = {};
        this.backupControlsSetup = false;
        
        // NOVAS PROPRIEDADES PARA SELEÇÃO MÚLTIPLA
        this.selectedPayments = new Set();
        this.isSelectAll = false;
        
        this.initializeComponents();
        this.setupEventListeners();
    }

/**
 * Inicializa componentes - VERSÃO CORRIGIDA
 */
initializeComponents() {
    console.log('🔄 Inicializando componentes da UI...');
    
    this.setCurrentDate();
    this.renderTable();
    this.updateSummary();
    this.initializeCharts();
    this.updateNomesDatalist();
    this.setupToastContainer();
    this.initializeCollapsible();
    
    // FORÇA a configuração dos controles de backup
    this.setupBackupControlsOnce();
    
    console.log('✅ Componentes da UI inicializados');
}
    /**
     * Inicializa o estado do collapsible
     */
    initializeCollapsible() {
        const collapsible = this.getElement('card-registros-collapsible');
        const button = this.getElement('btn-toggle-registros');
        
        if (collapsible && button) {
            // Estado inicial expandido
            this.isRegistrosVisible = true;
            collapsible.classList.remove('card-collapsed');
            button.setAttribute('aria-expanded', "true");
            collapsible.style.maxHeight = "none";
        }
    }

    /**
     * Configura listeners de eventos - VERSÃO SEGURA
     */
    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Remove event listeners existentes primeiro
        this.removeEventListeners();
        
        // Listeners básicos (elementos que sempre existem)
        this.setupBasicEventListeners();
        
        // Listeners de seleção (podem ser carregados depois)
        setTimeout(() => {
            this.setupSelectionEventListeners();
        }, 100);
        
        // Controles de backup
        this.setupBackupControlsOnce();

        // Event bus listeners
        eventBus.subscribe('dataChanged', () => this.handleDataChange());
        eventBus.subscribe('showToast', (data) => this.showToast(data.message, data.type));
        eventBus.subscribe('filtersChanged', () => this.applyFilters());
        
        console.log('✅ Event listeners configurados');
    }

    /**
     * Configura listeners básicos (elementos que sempre existem)
     */
    setupBasicEventListeners() {
        // Registro de pagamento
        this.safeAddEventListener('btn-registrar', 'click', () => this.handleRegisterPayment());
        this.safeAddEventListener('btn-limpar', 'click', () => this.clearForm());

        // Filtros
        this.safeAddEventListener('btn-aplicar-filtros', 'click', 
            Utils.debounce(() => this.applyFilters(), 300));
        this.safeAddEventListener('btn-limpar-filtros', 'click', () => this.clearFilters());

        // Exportação
        this.safeAddEventListener('btn-export-csv', 'click', () => this.exportCSV());
        this.safeAddEventListener('btn-export-xlsx', 'click', () => this.exportXLSX());
        this.safeAddEventListener('btn-import-csv', 'click', () => this.triggerFileImport());
        this.safeAddEventListener('file-import', 'change', (e) => this.handleFileImport(e));

        // Relatórios PDF
        this.safeAddEventListener('btn-relatorio-mes', 'click', () => this.generateMonthlyReport());
        this.safeAddEventListener('btn-relatorio-ano', 'click', () => this.generateAnnualReport());

        // Controles gerais
        this.safeAddEventListener('btn-reset', 'click', () => this.handleResetData());
        //this.safeAddEventListener('btn-save-close', 'click', () => exportManager.backupAndClose());
        this.safeAddEventListener('btn-toggle-registros', 'click', () => this.toggleRegistros());

        // Backup restore dialog
        this.safeAddEventListener('btn-restore-ok', 'click', () => this.handleRestoreBackup());
        this.safeAddEventListener('btn-restore-cancel', 'click', () => this.hideBackupDialog());
    }

    /**
 * Configura listeners de seleção (elementos que podem ser dinâmicos)
 */
setupSelectionEventListeners() {
    console.log('🔧 Configurando listeners de seleção...');
    
    // APENAS ESTES LISTENERS PERMANECEM
    this.safeAddEventListener('select-all', 'change', (e) => this.toggleSelectAll(e));
    // REMOVIDOS: btn-marcar-todos e btn-desmarcar-todos
    
    // BOTÕES ESPECÍFICOS PARA STATUS
    this.safeAddEventListener('btn-marcar-pendente', 'click', () => this.bulkChangeStatus('pendente'));
    this.safeAddEventListener('btn-marcar-efetuado', 'click', () => this.bulkChangeStatus('efetuado'));
    
    console.log('✅ Listeners de seleção configurados');
}

    /**
     * Adiciona event listener de forma segura (verifica se elemento existe)
     */
    safeAddEventListener(elementId, eventType, callback) {
        const element = this.getElement(elementId);
        if (element) {
            element.addEventListener(eventType, callback);
            console.log(`✅ Listener configurado para: ${elementId}`);
        } else {
            console.warn(`⚠️ Elemento não encontrado: ${elementId}`);
        }
    }

/**
 * Remove event listeners existentes para evitar duplicação
 */
removeEventListeners() {
    const elements = [
        'btn-registrar', 'btn-limpar', 'btn-aplicar-filtros', 'btn-limpar-filtros',
        'btn-export-csv', 'btn-export-xlsx', 'btn-import-csv', 'btn-relatorio-mes',
        'btn-relatorio-ano', 'btn-reset', 'btn-save-close', 'btn-toggle-registros',
        'btn-restore-ok', 'btn-restore-cancel', 'btn-backup-local', 'btn-restore-local',
//        'btn-google-login', 'btn-backup-drive', 'btn-restore-drive', 'btn-logout-drive',
        'select-all', 
        // REMOVIDOS: 'btn-marcar-todos', 'btn-desmarcar-todos'
        'btn-marcar-pendente', 'btn-marcar-efetuado'
    ];

    elements.forEach(id => {
        const element = this.getElement(id);
        if (element) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            this.domCache[id] = newElement;
        }
    });
    
    console.log('🧹 Event listeners antigos removidos');
}
    /**
 * Manipula mudanças nos dados (atualiza tudo, incluindo gráficos)
 */
handleDataChange() {
    this.renderTable();
    this.updateSummary();
    this.updateCharts();
    this.updateNomesDatalist();
    this.updateBackupUI(); // ← ADICIONE ESTA LINHA
}

    /**
     * Gerencia registro de novo pagamento - VERSÃO CORRIGIDA
     */
    handleRegisterPayment() {
        const nome = this.getElement('input-nome').value.trim();
        const data = this.getElement('input-data').value;
        const valor = parseFloat(this.getElement('input-valor').value);
        const historico = this.getElement('input-historico').value.trim();
        const status = this.getElement('input-status').value;

        // Validações básicas
        if (!nome) {
            this.showToast('Nome é obrigatório', 'error');
            this.getElement('input-nome').focus();
            return;
        }

        if (!data) {
            this.showToast('Data é obrigatória', 'error');
            this.getElement('input-data').focus();
            return;
        }

        if (!valor || valor <= 0) {
            this.showToast('Valor deve ser um número positivo', 'error');
            this.getElement('input-valor').focus();
            return;
        }

        const success = dataManager.addPayment({ 
            nome, 
            data, 
            valor, 
            historico, 
            status 
        });
        
        if (success) {
            this.clearForm();
        }
    }

    /**
     * Limpa formulário de registro - VERSÃO CORRIGIDA
     */
    clearForm() {
        this.getElement('input-nome').value = '';
        this.getElement('input-data').value = '';
        this.getElement('input-valor').value = '';
        this.getElement('input-historico').value = '';
        this.getElement('input-status').value = 'pendente';
        this.setCurrentDate();
        this.getElement('input-nome').focus();
    }

    /**
     * Aplica filtros aos dados (já atualiza gráficos automaticamente)
     */
    applyFilters() {
        this.filters = {
            nome: this.getElement('filtro-nome').value,
            dataInicial: this.getElement('filtro-di').value,
            dataFinal: this.getElement('filtro-df').value,
            status: this.getElement('filtro-status').value,
            historico: this.getElement('filtro-historico').value.toLowerCase().trim()
        };

        // Limpa seleção ao aplicar filtros
        this.deselectAll();
        
        this.renderTable();
        this.updateSummary();
        this.updateCharts();
    }

    /**
     * Limpa filtros
     */
    clearFilters() {
        this.getElement('filtro-nome').value = '';
        this.getElement('filtro-di').value = '';
        this.getElement('filtro-df').value = '';
        this.getElement('filtro-status').value = '';
        this.getElement('filtro-historico').value = '';
        this.filters = { nome: '', dataInicial: '', dataFinal: '', status: '', historico: '' };
        
        this.applyFilters();
    }

    /**
     * Renderiza tabela de registros - VERSÃO COM SELEÇÃO MÚLTIPLA
     */
    renderTable() {
        const tbody = this.getElement('tbl-registros').querySelector('tbody');
        const data = dataManager.filterPayments(this.filters);

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center">Nenhum registro encontrado</td></tr>`;
            this.hideSelectionControls();
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr data-payment-id="${item.id}">
                <td style="text-align:center;">
                    <input type="checkbox" class="payment-checkbox" value="${item.id}" 
                           ${this.selectedPayments.has(item.id) ? 'checked' : ''}>
                </td>
                <td>${item.id}</td>
                <td>${Utils.escapeHtml(item.nome)}</td>
                <td>${item.data}</td>
                <td class="text-right">${Utils.formatCurrency(item.valor)}</td>
                <td>${Utils.escapeHtml(item.historico || '')}</td>
                <td>
                    <button onclick="uiComponents.togglePaymentStatus(${item.id})" 
                            class="status-btn status-${item.status}" 
                            title="Clique para alternar status">
                        ${item.status === 'efetuado' ? '✅ Efetuado' : '⏳ Pendente'}
                    </button>
                </td>
                <td>
                    <button onclick="uiComponents.editPayment(${item.id})">Editar</button>
                    <button onclick="uiComponents.deletePayment(${item.id})" class="secondary">Apagar</button>
                </td>
            </tr>
        `).join('');

        // Adiciona listeners para os checkboxes
        this.setupCheckboxListeners();
        
        // Atualiza controles de seleção
        this.updateSelectionControls();
    }

    /**
     * Configura listeners para os checkboxes
     */
    setupCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.payment-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const paymentId = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedPayments.add(paymentId);
                } else {
                    this.selectedPayments.delete(paymentId);
                    this.getElement('select-all').checked = false;
                    this.isSelectAll = false;
                }
                this.updateSelectionControls();
            });
        });
    }

    /**
     * Alterna seleção de todos os registros
     */
    toggleSelectAll(event) {
        this.isSelectAll = event.target.checked;
        const checkboxes = document.querySelectorAll('.payment-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.isSelectAll;
            const paymentId = parseInt(checkbox.value);
            
            if (this.isSelectAll) {
                this.selectedPayments.add(paymentId);
            } else {
                this.selectedPayments.delete(paymentId);
            }
        });
        
        this.updateSelectionControls();
    }

// REMOVER ESTES MÉTODOS (ou comentar):

/**
 * Seleciona todos os registros - MÉTODO REMOVIDO
 */
// selectAll() {
//     this.isSelectAll = true;
//     this.getElement('select-all').checked = true;
//     
//     const data = dataManager.filterPayments(this.filters);
//     this.selectedPayments = new Set(data.map(item => item.id));
//     
//     const checkboxes = document.querySelectorAll('.payment-checkbox');
//     checkboxes.forEach(checkbox => {
//         checkbox.checked = true;
//     });
//     
//     this.updateSelectionControls();
// }

/**
 * Deseleciona todos os registros - VERSÃO SIMPLIFICADA
 */
deselectAll() {
    this.isSelectAll = false;
    const selectAll = this.getElement('select-all');
    if (selectAll) selectAll.checked = false;
    this.selectedPayments.clear();
    
    const checkboxes = document.querySelectorAll('.payment-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    this.updateSelectionControls();
}
    /**
     * Atualiza controles de seleção
     */
    updateSelectionControls() {
        const selectedCount = this.selectedPayments.size;
        const selectionControls = this.getElement('selection-controls');
        const selectedCountElement = this.getElement('selected-count');
        
        if (selectedCount > 0) {
            if (selectionControls) selectionControls.style.display = 'flex';
            if (selectedCountElement) selectedCountElement.textContent = `${selectedCount} selecionado(s)`;
        } else {
            if (selectionControls) selectionControls.style.display = 'none';
        }
    }

    /**
     * Esconde controles de seleção
     */
    hideSelectionControls() {
        const selectionControls = this.getElement('selection-controls');
        if (selectionControls) selectionControls.style.display = 'none';
        this.selectedPayments.clear();
        this.isSelectAll = false;
        const selectAll = this.getElement('select-all');
        if (selectAll) selectAll.checked = false;
    }

    /**
     * Alterna status de um pagamento individual
     */
    togglePaymentStatus(id) {
        const data = dataManager.loadData();
        const payment = data.find(item => item.id === id);
        
        if (!payment) {
            this.showToast('Pagamento não encontrado', 'error');
            return;
        }

        const newStatus = payment.status === 'efetuado' ? 'pendente' : 'efetuado';
        
        if (dataManager.updatePayment(id, { status: newStatus })) {
            this.showToast(`Status alterado para ${newStatus === 'efetuado' ? 'Efetuado' : 'Pendente'}`, 'success');
            this.handleDataChange();
        }
    }

    /**
     * Altera status em lote - VERSÃO COM BOTÕES ESPECÍFICOS
     */
    bulkChangeStatus(newStatus) {
        const selectedCount = this.selectedPayments.size;
        
        if (selectedCount === 0) {
            this.showToast('Selecione pelo menos um registro', 'warning');
            return;
        }

        const statusText = newStatus === 'efetuado' ? 'Efetuado' : 'Pendente';
        
        if (!confirm(`Deseja marcar ${selectedCount} registro(s) como "${statusText}"?`)) {
            return;
        }

        let successCount = 0;
        const selectedIds = Array.from(this.selectedPayments);
        
        selectedIds.forEach(id => {
            if (dataManager.updatePayment(id, { status: newStatus })) {
                successCount++;
            }
        });

        // Limpa seleção
        this.deselectAll();
        
        this.showToast(`${successCount} registro(s) marcado(s) como ${statusText.toLowerCase()}!`, 'success');
        this.handleDataChange();
    }

    /**
     * Atualiza resumo total
     */
    updateSummary() {
        const data = dataManager.filterPayments(this.filters);
        const total = data.reduce((sum, item) => sum + item.valor, 0);
        this.getElement('resumo-total').textContent = `Total: ${Utils.formatCurrency(total)}`;
    }

    /**
     * Edita pagamento existente - VERSÃO CORRIGIDA
     */
    editPayment(id) {
        const data = dataManager.loadData();
        const payment = data.find(item => item.id === id);
        
        if (!payment) {
            this.showToast('Pagamento não encontrado', 'error');
            return;
        }

        // Preenche o formulário com os dados existentes
        this.getElement('input-nome').value = payment.nome;
        this.getElement('input-data').value = payment.data;
        this.getElement('input-valor').value = payment.valor;
        this.getElement('input-historico').value = payment.historico || '';
        this.getElement('input-status').value = payment.status || 'pendente';

        // Remove o pagamento para edição
        dataManager.deletePayment(id);
        this.getElement('input-nome').focus();
        
        this.showToast('Pagamento carregado para edição. Faça as alterações e clique em Registrar.', 'info');
    }

    /**
     * Exclui pagamento com confirmação
     */
    deletePayment(id) {
        if (!confirm('Tem certeza que deseja apagar este registro?')) return;
        dataManager.deletePayment(id);
    }

    /**
     * Atualiza datalist e select de nomes
     */
    updateNomesDatalist() {
        const data = dataManager.loadData();
        const nomesSet = new Set(data.map(item => item.nome.toLowerCase()));
        const datalist = this.getElement('datalist-nomes');
        const select = this.getElement('filtro-nome');

        // Atualiza datalist
        if (datalist) {
            datalist.innerHTML = Array.from(nomesSet)
                .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                .map(nomeLC => {
                    const nomeOriginal = data.find(item => 
                        item.nome.toLowerCase() === nomeLC
                    )?.nome || nomeLC;
                    return `<option value="${Utils.escapeHtml(nomeOriginal)}">`;
                })
                .join('');
        }

        // Atualiza select de filtro
        if (select) {
            const nomesArray = Utils.sortAlphabetically(Array.from(new Set(data.map(item => item.nome))));
            select.innerHTML = '<option value="">-- Todos --</option>' +
                nomesArray.map(nome => 
                    `<option value="${Utils.escapeHtml(nome)}">${Utils.escapeHtml(nome)}</option>`
                ).join('');
        }
    }

/**
 * Configura controles de backup - VERSÃO DIRETA
 */
setupBackupControlsOnce() {
    if (this.backupControlsSetup) return;
    
    console.log('🔧 Configurando controles de backup...');
    
    // Configuração DIRETA sem verificação complexa
    document.getElementById('backup-json-btn').addEventListener('click', () => {
        console.log('✅ Botão Backup clicado!');
        this.handleLocalBackup();
    });
    
    document.getElementById('restore-json-btn').addEventListener('click', () => {
        console.log('✅ Botão Restaurar clicado!');
        this.handleLocalRestore();
    });
    
    this.backupControlsSetup = true;
    console.log('✅ Controles de backup configurados DIRETAMENTE');
}

/**
 * Backup local - VERSÃO SUPER SIMPLES
 */
handleLocalBackup() {
    console.log('🔄 Executando backup...');
    
    const data = dataManager.loadData();
    
    if (data.length === 0) {
        alert('Nenhum dado para fazer backup');
        return;
    }

    try {
        const backupData = {
            app: 'Controle de Pagamentos',
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalRecords: data.length,
            totalValue: data.reduce((sum, item) => sum + item.valor, 0),
            records: data
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_pagamentos_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showToast(`✅ Backup com ${data.length} registros salvo!`, 'success');
        
    } catch (error) {
        console.error('Erro no backup:', error);
        this.showToast('Erro ao fazer backup', 'error');
    }
}

/**
 * Restauração local - VERSÃO SUPER SIMPLES
 */
handleLocalRestore() {
    console.log('🔄 Executando restauração...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                let records = [];
                
                // Detecta o formato do arquivo
                if (backupData.records) records = backupData.records;
                else if (backupData.data) records = backupData.data;
                else if (Array.isArray(backupData)) records = backupData;
                else throw new Error('Formato inválido');
                
                if (!records.length) throw new Error('Nenhum registro encontrado');
                
                if (confirm(`Restaurar ${records.length} registros? Os dados atuais serão substituídos.`)) {
                    // Valida e adapta os registros
                    const validatedRecords = records.map((record, index) => ({
                        id: record.id || Date.now() + index,
                        nome: record.nome || '',
                        data: record.data || '',
                        valor: record.valor || 0,
                        historico: record.historico || '',
                        status: record.status || 'efetuado',
                        createdAt: record.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }));
                    
                    dataManager.saveData(validatedRecords);
                    this.showToast(`✅ ${validatedRecords.length} registros restaurados!`, 'success');
                    this.handleDataChange();
                }
                
            } catch (error) {
                console.error('Erro na restauração:', error);
                this.showToast('Erro: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

    /**
     * Parse de dados CSV para restauração
     */
    parseCSVData(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const record = {};
            
            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            
            // Converte para o formato interno
            if (record.nome && record.data) {
                data.push({
                    id: record.id ? parseInt(record.id) : Date.now() + i,
                    nome: record.nome,
                    data: record.data,
                    valor: record.valor ? parseFloat(record.valor) : 0,
                    historico: record.historico || record.descricao || '',
                    status: record.status || 'efetuado',
                    createdAt: record.createdat || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        }
        
        return data;
    }

/**
 * Atualiza UI de backup
 */
updateBackupUI() {
    const data = dataManager.loadData();
    const statusText = this.getElement('drive-status');
    
    if (statusText) {
        if (data.length === 0) {
            statusText.textContent = '⚠️ Nenhum dado salvo';
            statusText.style.color = '#ffc107';
        } else {
            statusText.textContent = `✅ ${data.length} registros locais (JSON)`;
            statusText.style.color = '#28a745';
        }
    }
}


    /**
     * Inicializa gráficos
     */
    initializeCharts() {
        // Destrói gráficos existentes antes de criar novos
        this.destroyCharts();

        // Verifica se os elementos canvas existem
        const canvasNomes = this.getElement('chart-nomes');
        const canvasMeses = this.getElement('chart-meses');
        
        if (!canvasNomes || !canvasMeses) {
            console.warn('Canvas elements not found for charts');
            return;
        }

        const ctxNomes = canvasNomes.getContext('2d');
        const ctxMeses = canvasMeses.getContext('2d');

        this.charts.nomes = new Chart(ctxNomes, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total por Nome',
                    data: [],
                    backgroundColor: '#1f6feb',
                    borderColor: '#1a5fc9',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Total: ${Utils.formatCurrency(context.raw)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => Utils.formatCurrency(value)
                        }
                    }
                }
            }
        });

        this.charts.meses = new Chart(ctxMeses, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total por Mês',
                    data: [],
                    backgroundColor: '#6c757d',
                    borderColor: '#5a6268',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Total: ${Utils.formatCurrency(context.raw)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => Utils.formatCurrency(value)
                        }
                    }
                }
            }
        });

        this.updateCharts();
    }

    /**
     * Destrói gráficos existentes para evitar conflitos
     */
    destroyCharts() {
        if (this.charts.nomes) {
            this.charts.nomes.destroy();
            this.charts.nomes = null;
        }
        if (this.charts.meses) {
            this.charts.meses.destroy();
            this.charts.meses = null;
        }
    }

    /**
     * Atualiza gráficos com dados filtrados
     */
    updateCharts() {
        // Verifica se os canvases existem
        if (!this.getElement('chart-nomes') || !this.getElement('chart-meses')) {
            console.warn('Canvas elements not found for charts');
            return;
        }

        const data = dataManager.filterPayments(this.filters);
        
        if (data.length === 0) {
            this.clearCharts();
            return;
        }

        const totalPorNome = {};
        const totalPorMes = {};

        data.forEach(item => {
            totalPorNome[item.nome] = (totalPorNome[item.nome] || 0) + item.valor;
            const mes = item.data.slice(0, 7);
            totalPorMes[mes] = (totalPorMes[mes] || 0) + item.valor;
        });

        // Ordena por valor decrescente
        const nomesOrdenados = Object.keys(totalPorNome)
            .sort((a, b) => totalPorNome[b] - totalPorNome[a]);
        const mesesOrdenados = Object.keys(totalPorMes).sort();

        // Atualiza gráfico de nomes se existir
        if (this.charts.nomes) {
            this.charts.nomes.data.labels = nomesOrdenados;
            this.charts.nomes.data.datasets[0].data = nomesOrdenados.map(nome => totalPorNome[nome]);
            this.charts.nomes.update('none');
        }

        // Atualiza gráfico de meses se existir
        if (this.charts.meses) {
            this.charts.meses.data.labels = mesesOrdenados.map(mes => 
                `${mes.slice(5, 7)}/${mes.slice(0, 4)}`
            );
            this.charts.meses.data.datasets[0].data = mesesOrdenados.map(mes => totalPorMes[mes]);
            this.charts.meses.update('none');
        }
    }

    /**
     * Limpa dados dos gráficos
     */
    clearCharts() {
        if (this.charts.nomes) {
            this.charts.nomes.data.labels = [];
            this.charts.nomes.data.datasets[0].data = [];
            this.charts.nomes.update();
        }
        if (this.charts.meses) {
            this.charts.meses.data.labels = [];
            this.charts.meses.data.datasets[0].data = [];
            this.charts.meses.update();
        }
    }

    /**
     * Exporta para CSV
     */
    exportCSV() {
        const data = dataManager.filterPayments(this.filters);
        exportManager.exportToCSV(data);
    }

    /**
     * Exporta para XLSX
     */
    exportXLSX() {
        const data = dataManager.filterPayments(this.filters);
        exportManager.exportToXLSX(data);
    }

    /**
     * Gera relatório PDF com filtros ativos
     */
    generateMonthlyReport() {
        const data = dataManager.filterPayments(this.filters);
        
        if (!data.length) {
            this.showToast('Nenhum registro encontrado para os filtros atuais', 'warning');
            return;
        }

        // Cria título descritivo com os filtros ativos
        let titulo = 'Relatório de Pagamentos';
        
        // Adiciona informações dos filtros ao título
        const filtrosAtivos = [];
        if (this.filters.nome) filtrosAtivos.push(`Nome: ${this.filters.nome}`);
        if (this.filters.dataInicial) filtrosAtivos.push(`De: ${this.filters.dataInicial}`);
        if (this.filters.dataFinal) filtrosAtivos.push(`Até: ${this.filters.dataFinal}`);
        if (this.filters.status) filtrosAtivos.push(`Status: ${this.filters.status}`);
        
        if (filtrosAtivos.length > 0) {
            titulo += ` (${filtrosAtivos.join(' | ')})`;
        }

        exportManager.generateMonthlyPDF(titulo, data);
    }

    /**
     * Gera relatório anual PDF (desconsidera filtros ativos)
     */
    generateAnnualReport() {
        const ano = prompt('Digite o ano para o relatório (ex.: 2025):');
        if (!ano || !/^\d{4}$/.test(ano)) {
            this.showToast('Ano inválido. Digite um ano com 4 dígitos.', 'warning');
            return;
        }

        // Desconsidera filtros ativos - busca todos os dados do ano especificado
        const todosOsDados = dataManager.loadData();
        const dadosAno = todosOsDados.filter(item => item.data && item.data.startsWith(ano));

        if (!dadosAno.length) {
            this.showToast(`Nenhum registro encontrado para o ano ${ano}`, 'warning');
            return;
        }

        const titulo = `Relatório Anual ${ano}`;
        exportManager.generateAnnualPDF(ano, dadosAno);
    }

    /**
     * Gerencia importação de arquivo
     */
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.showToast('Processando importação...', 'info');
            const result = await exportManager.importFromCSV(file);
            
            let message = `Importação concluída. ${result.added} registros adicionados.`;
            if (result.skipped > 0) {
                message += ` ${result.skipped} registros ignorados.`;
            }
            if (result.errors.length > 0) {
                message += ` ${result.errors.length} erros encontrados.`;
                console.error('Erros na importação:', result.errors);
            }

            this.showToast(message, result.errors.length > 0 ? 'warning' : 'success');
            event.target.value = '';

        } catch (error) {
            this.showToast(`Erro na importação: ${error.message}`, 'error');
            event.target.value = '';
        }
    }

    /**
     * Gerencia restauração de backup
     */
    handleRestoreBackup() {
        const fileInput = this.getElement('restore-file-input');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('Selecione um arquivo de backup!', 'warning');
            return;
        }

        this.restoreBackupFile(file);
    }

    /**
     * Restaura backup de arquivo
     */
    async restoreBackupFile(file) {
        try {
            this.showToast('Restaurando backup...', 'info');
            
            if (file.name.endsWith('.csv')) {
                const result = await exportManager.importFromCSV(file);
                this.showToast(`Backup restaurado! ${result.added} registros adicionados.`, 'success');
            } else if (file.name.endsWith('.xlsx')) {
                // Implementar restauração de XLSX se necessário
                this.showToast('Restauração de XLSX não implementada', 'warning');
                return;
            } else {
                this.showToast('Formato de arquivo não suportado', 'error');
                return;
            }

            this.hideBackupDialog();
            this.handleDataChange();

        } catch (error) {
            this.showToast(`Erro ao restaurar backup: ${error.message}`, 'error');
        }
    }

    /**
     * Gerencia reset de dados
     */
    handleResetData() {
        if (!confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) {
            return;
        }

        if (confirm('Esta ação irá remover permanentemente todos os registros. Continuar?')) {
            dataManager.clearAllData();
        }
    }

    /**
     * Alterna visibilidade dos registros
     */
    toggleRegistros() {
        const collapsible = this.getElement('card-registros-collapsible');
        const button = this.getElement('btn-toggle-registros');
        
        if (!collapsible || !button) {
            console.error('Elementos do collapse não encontrados');
            return;
        }

        this.isRegistrosVisible = !this.isRegistrosVisible;

        if (this.isRegistrosVisible) {
            // Expandir
            collapsible.style.maxHeight = "1000px";
            collapsible.classList.remove('card-collapsed');
            button.setAttribute('aria-expanded', "true");
            
            // Força redesenho para garantir a transição
            setTimeout(() => {
                collapsible.style.maxHeight = "none";
            }, 300);
        } else {
            // Recolher
            collapsible.style.maxHeight = `${collapsible.scrollHeight}px`;
            
            // Força recálculo do layout
            collapsible.offsetHeight;
            
            collapsible.style.maxHeight = "0";
            collapsible.classList.add('card-collapsed');
            button.setAttribute('aria-expanded', "false");
        }
        
        // Atualiza o estado no console para debug
        console.log('Registros visíveis:', this.isRegistrosVisible);
    }

    // Métodos auxiliares
    getElement(id) {
        if (!this.domCache[id]) {
            this.domCache[id] = document.getElementById(id);
        }
        return this.domCache[id];
    }

    setCurrentDate() {
        if (!this.getElement('input-data').value) {
            this.getElement('input-data').value = new Date().toISOString().split('T')[0];
        }
    }

    triggerFileImport() {
        this.getElement('file-import').click();
    }

    hideBackupDialog() {
        this.getElement('backup-restore-dialog').style.display = 'none';
    }

    setupToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    showToast(message, type = 'info') {
        const container = this.getElement('toast-container') || document.querySelector('#toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');

        container.appendChild(toast);

        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Solicita restauração de backup ao iniciar (se não houver dados)
     */
    solicitateBackupRestore() {
        const data = dataManager.loadData();
        if (data.length > 0) return;

        this.getElement('backup-restore-dialog').style.display = 'flex';
        this.getElement('restore-file-input').value = '';
    }

    /**
     * Limpa recursos antes de destruir a instância
     */
    destroy() {
        this.destroyCharts();
        eventBus.clear();
        this.domCache = {};
    }
}

// DEBUG TEMPORÁRIO - Verificar se os botões existem
setTimeout(() => {
    console.log('🔍 DEBUG - Verificando elementos de backup:');
    console.log('- btn-backup-local:', document.getElementById('btn-backup-local'));
    console.log('- btn-restore-local:', document.getElementById('btn-restore-local'));
    console.log('- backupControlsSetup:', this.backupControlsSetup);
}, 1000);