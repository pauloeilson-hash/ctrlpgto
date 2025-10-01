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
            dataFinal: ''
        };
        this.isRegistrosVisible = true;
        this.domCache = {};
        
        this.initializeComponents();
        this.setupEventListeners();
    }

  initializeComponents() {
    this.setCurrentDate();
    this.renderTable();
    this.updateSummary();
    this.initializeCharts();
    this.updateNomesDatalist();
    this.setupToastContainer();
    this.setupBackupControls(); // ← ALTERADO (era setupGoogleDriveControls)
    this.initializeCollapsible();
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
     * Configura listeners de eventos
     */
    setupEventListeners() {
    // Registro de pagamento
    this.getElement('btn-registrar').addEventListener('click', () => this.handleRegisterPayment());
    this.getElement('btn-limpar').addEventListener('click', () => this.clearForm());

    // Filtros
    this.getElement('btn-aplicar-filtros').addEventListener('click', 
        Utils.debounce(() => this.applyFilters(), 300));
    this.getElement('btn-limpar-filtros').addEventListener('click', () => this.clearFilters());

    // Exportação
    this.getElement('btn-export-csv').addEventListener('click', () => this.exportCSV());
    this.getElement('btn-export-xlsx').addEventListener('click', () => this.exportXLSX());
    this.getElement('btn-import-csv').addEventListener('click', () => this.triggerFileImport());
    this.getElement('file-import').addEventListener('change', (e) => this.handleFileImport(e));

    // Relatórios PDF
    this.getElement('btn-relatorio-mes').addEventListener('click', () => this.generateMonthlyReport());
    this.getElement('btn-relatorio-ano').addEventListener('click', () => this.generateAnnualReport());

    // Controles gerais
    this.getElement('btn-reset').addEventListener('click', () => this.handleResetData());
    this.getElement('btn-save-close').addEventListener('click', () => exportManager.backupAndClose());
    this.getElement('btn-toggle-registros').addEventListener('click', () => this.toggleRegistros());

    // Backup restore dialog
    this.getElement('btn-restore-ok').addEventListener('click', () => this.handleRestoreBackup());
    this.getElement('btn-restore-cancel').addEventListener('click', () => this.hideBackupDialog());

    // CORREÇÃO: Esta linha deve chamar setupBackupControls, não setupGoogleDriveControls
    this.setupBackupControls(); // ← LINHA CORRIGIDA

    // Event bus listeners
    eventBus.subscribe('dataChanged', () => this.handleDataChange());
    eventBus.subscribe('showToast', (data) => this.showToast(data.message, data.type));
    eventBus.subscribe('filtersChanged', () => this.applyFilters());
}

    /**
     * Manipula mudanças nos dados
     */
    handleDataChange() {
        this.renderTable();
        this.updateSummary();
        this.updateCharts();
        this.updateNomesDatalist();
    }

    /**
     * Gerencia registro de novo pagamento
     */
    handleRegisterPayment() {
        const nome = this.getElement('input-nome').value.trim();
        const data = this.getElement('input-data').value;
        const valor = parseFloat(this.getElement('input-valor').value);
        const historico = this.getElement('input-historico').value.trim();

        const success = dataManager.addPayment({ nome, data, valor, historico });
        
        if (success) {
            this.clearForm();
            this.getElement('input-nome').focus();
        }
    }

    /**
     * Limpa formulário de registro
     */
    clearForm() {
        this.getElement('input-nome').value = '';
        this.getElement('input-data').value = '';
        this.getElement('input-valor').value = '';
        this.getElement('input-historico').value = '';
        this.setCurrentDate();
    }

    /**
 * Aplica filtros aos dados (já atualiza gráficos automaticamente)
 */
applyFilters() {
    this.filters = {
        nome: this.getElement('filtro-nome').value,
        dataInicial: this.getElement('filtro-di').value,
        dataFinal: this.getElement('filtro-df').value
    };

    this.renderTable();
    this.updateSummary();
    this.updateCharts(); // Gráficos atualizam automaticamente
}

/**
 * Manipula mudanças nos dados (atualiza tudo, incluindo gráficos)
 */
handleDataChange() {
    this.renderTable();
    this.updateSummary();
    this.updateCharts(); // Gráficos atualizam automaticamente
    this.updateNomesDatalist();
}

    /**
     * Limpa filtros
     */
    clearFilters() {
        this.getElement('filtro-nome').value = '';
        this.getElement('filtro-di').value = '';
        this.getElement('filtro-df').value = '';
        this.filters = { nome: '', dataInicial: '', dataFinal: '' };
        
        this.applyFilters();
    }

    /**
     * Renderiza tabela de registros
     */
    renderTable() {
        const tbody = this.getElement('tbl-registros').querySelector('tbody');
        const data = dataManager.filterPayments(this.filters);

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum registro encontrado</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${Utils.escapeHtml(item.nome)}</td>
                <td>${item.data}</td>
                <td class="text-right">${Utils.formatCurrency(item.valor)}</td>
                <td>${Utils.escapeHtml(item.historico || '')}</td>
                <td>
                    <button onclick="uiComponents.editPayment(${item.id})">Editar</button>
                    <button onclick="uiComponents.deletePayment(${item.id})" class="secondary">Apagar</button>
                </td>
            </tr>
        `).join('');
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
     * Edita pagamento existente
     */
    editPayment(id) {
        const data = dataManager.loadData();
        const payment = data.find(item => item.id === id);
        
        if (!payment) {
            this.showToast('Pagamento não encontrado', 'error');
            return;
        }

        this.getElement('input-nome').value = payment.nome;
        this.getElement('input-data').value = payment.data;
        this.getElement('input-valor').value = payment.valor;
        this.getElement('input-historico').value = payment.historico || '';

        // Remove o pagamento para edição
        dataManager.deletePayment(id);
        this.getElement('input-nome').focus();
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
        datalist.innerHTML = Array.from(nomesSet)
            .sort((a, b) => a.localeCompare(b, 'pt-BR'))
            .map(nomeLC => {
                const nomeOriginal = data.find(item => 
                    item.nome.toLowerCase() === nomeLC
                )?.nome || nomeLC;
                return `<option value="${Utils.escapeHtml(nomeOriginal)}">`;
            })
            .join('');

        // Atualiza select de filtro
        const nomesArray = Utils.sortAlphabetically(Array.from(new Set(data.map(item => item.nome))));
        select.innerHTML = '<option value="">-- Todos --</option>' +
            nomesArray.map(nome => 
                `<option value="${Utils.escapeHtml(nome)}">${Utils.escapeHtml(nome)}</option>`
            ).join('');
    }

/**
 * Configura controles do Google Drive - Versão Corrigida e Simplificada
 */
setupGoogleDriveControls() {
    console.log('🔧 Configurando controles do Google Drive...');
    
    // Debug temporário
    this.debugGoogleDriveButtons();
    
    // Aguarda a DOM estar completamente carregada
    setTimeout(() => {
        this.initializeGoogleDriveSafe();
    }, 2000);
}

/**
 * Inicialização segura do Google Drive
 */
initializeGoogleDriveSafe() {
    try {
        // Verifica se o Google Drive Manager está disponível
        if (typeof googleDriveManager === 'undefined') {
            console.warn('⚠️ GoogleDriveManager não carregado, tentando novamente...');
            setTimeout(() => this.initializeGoogleDriveSafe(), 1000);
            return;
        }

        // Configura os event listeners
        this.setupGoogleDriveListeners();
        
        // Atualiza a UI inicial
        this.updateGoogleDriveUI();
        
        console.log('✅ Google Drive configurado com sucesso');

    } catch (error) {
        console.error('❌ Erro na inicialização do Google Drive:', error);
    }
}

/**
 * Configura controles de backup e sincronização - VERSÃO CORRIGIDA
 */
setupBackupControls() {
    console.log('🔧 Configurando controles de backup...');
    
    // Backup Local
    this.getElement('btn-backup-local').addEventListener('click', () => this.handleLocalBackup());
    this.getElement('btn-restore-local').addEventListener('click', () => this.handleLocalRestore());
    
    // Google Drive (opcional)
    this.setupGoogleDriveEventListeners();
    
    // Atualização inicial
    this.updateBackupUI();
}

/**
 * Configura event listeners do Google Drive - VERSÃO CORRIGIDA
 */
setupGoogleDriveEventListeners() {
    console.log('🔧 Configurando listeners do Google Drive...');
    
    // Aguarda a DOM estar completamente carregada
    setTimeout(() => {
        this.initializeGoogleDriveSafe();
    }, 2000);
}

/**
 * Inicialização segura do Google Drive - VERSÃO CORRIGIDA
 */
initializeGoogleDriveSafe() {
    try {
        // Verifica se o Google Drive Manager está disponível
        if (typeof googleDriveManager === 'undefined') {
            console.warn('⚠️ GoogleDriveManager não carregado, tentando novamente...');
            setTimeout(() => this.initializeGoogleDriveSafe(), 1000);
            return;
        }

        // Configura os event listeners
        this.setupDirectGoogleDriveListeners();
        
        // Configura listener de status
        this.setupGoogleDriveStatusListener();
        
        // Atualiza a UI inicial
        this.updateGoogleDriveUI();
        
        console.log('✅ Google Drive configurado com sucesso');

    } catch (error) {
        console.error('❌ Erro na inicialização do Google Drive:', error);
    }
}

/**
 * Configura listeners diretos do Google Drive
 */
setupDirectGoogleDriveListeners() {
    const elements = {
        login: 'btn-google-login',
        backup: 'btn-backup-drive', 
        restore: 'btn-restore-drive',
        logout: 'btn-logout-drive'
    };

    Object.entries(elements).forEach(([action, id]) => {
        const element = document.getElementById(id);
        if (element) {
            // Remove listeners existentes
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Adiciona novo listener
            document.getElementById(id).addEventListener('click', () => {
                this.handleGoogleDriveAction(action);
            });
            
            console.log(`✅ Listener configurado para: ${id}`);
        }
    });
}

/**
 * Configura listener de status do Google Drive
 */
setupGoogleDriveStatusListener() {
    if (window.eventBus) {
        eventBus.subscribe('googleDriveStatus', (data) => {
            console.log('📞 Status do Google Drive recebido:', data);
            this.updateGoogleDriveUI(data);
        });
    }
}

/**
 * Manipula ações do Google Drive
 */
handleGoogleDriveAction(action) {
    switch (action) {
        case 'login':
            console.log('🔐 Conectar Google Drive');
            this.handleGoogleLogin();
            break;
        case 'backup':
            console.log('💾 Backup no Drive');
            this.handleBackupToDrive();
            break;
        case 'restore':
            console.log('📥 Restaurar do Drive');
            this.handleRestoreFromDrive();
            break;
        case 'logout':
            console.log('🚪 Sair do Drive');
            this.handleGoogleLogout();
            break;
    }
}

/**
 * Manipula login no Google Drive
 */
async handleGoogleLogin() {
    try {
        console.log('🔄 Iniciando autenticação...');
        this.showToast('Conectando ao Google Drive...', 'info');
        
        if (typeof googleDriveManager === 'undefined') {
            throw new Error('Google Drive Manager não carregado');
        }
        
        await googleDriveManager.authenticate();
        console.log('✅ Autenticação concluída');
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        this.showToast('Erro ao conectar com Google Drive: ' + error.message, 'error');
    }
}

/**
 * Faz backup no Google Drive
 */
async handleBackupToDrive() {
    try {
        const data = dataManager.loadData();
        
        if (data.length === 0) {
            this.showToast('Nenhum dado para fazer backup', 'warning');
            return;
        }

        console.log('💾 Iniciando backup no Google Drive...');
        this.showToast('Salvando backup no Google Drive...', 'info');
        
        await googleDriveManager.saveToDrive(data);
        console.log('✅ Backup no Drive concluído');
        
    } catch (error) {
        console.error('❌ Erro no backup:', error);
        this.showToast('Erro ao salvar backup no Drive: ' + error.message, 'error');
    }
}

/**
 * Restaura do Google Drive
 */
async handleRestoreFromDrive() {
    if (!confirm('Deseja restaurar dados do Google Drive? Os dados atuais serão substituídos.')) {
        return;
    }

    try {
        console.log('📥 Iniciando restauração do Google Drive...');
        this.showToast('Carregando backup do Google Drive...', 'info');
        
        const data = await googleDriveManager.loadFromDrive();
        
        if (data && Array.isArray(data)) {
            dataManager.saveData(data);
            this.showToast(`✅ Dados restaurados! ${data.length} registros carregados.`, 'success');
            this.handleDataChange();
            console.log('✅ Restauração do Drive concluída');
        }
    } catch (error) {
        console.error('❌ Erro na restauração:', error);
        this.showToast('Erro ao restaurar do Drive: ' + error.message, 'error');
    }
}

/**
 * Manipula logout do Google Drive
 */
async handleGoogleLogout() {
    try {
        console.log('🚪 Iniciando logout...');
        googleDriveManager.logout();
        this.showToast('Desconectado do Google Drive', 'info');
        console.log('✅ Logout concluído');
    } catch (error) {
        console.error('❌ Erro no logout:', error);
        this.showToast('Erro ao desconectar: ' + error.message, 'error');
    }
}

/**
 * Atualiza interface do Google Drive - VERSÃO CORRIGIDA
 */
updateGoogleDriveUI(status = null) {
    try {
        const driveStatus = status || (window.googleDriveManager ? googleDriveManager.getStatus() : { 
            isInitialized: false, 
            isAuthenticated: false,
            isReal: false,
            clientIdConfigured: false
        });
        
        const loginBtn = this.getElement('btn-google-login');
        const backupBtn = this.getElement('btn-backup-drive');
        const restoreBtn = this.getElement('btn-restore-drive');
        const logoutBtn = this.getElement('btn-logout-drive');
        const statusText = this.getElement('drive-status');
        const googleStatus = this.getElement('google-status');

        if (!loginBtn || !statusText) {
            console.log('⏳ Aguardando elementos da UI do Google Drive...');
            return;
        }

        console.log('🎨 Atualizando UI do Google Drive:', driveStatus);

        // Status do serviço
        if (!driveStatus.clientIdConfigured) {
            statusText.textContent = '⚙️ Configure o Client ID';
            statusText.style.color = '#ffc107';
        } else if (driveStatus.isAuthenticated) {
            statusText.textContent = '✅ Google Drive Conectado';
            statusText.style.color = '#28a745';
        } else if (driveStatus.isInitialized) {
            statusText.textContent = '🔒 Google Drive Disponível';
            statusText.style.color = '#6c757d';
        } else {
            statusText.textContent = '⏳ Inicializando...';
            statusText.style.color = '#6c757d';
        }

        // Estados dos botões
        if (driveStatus.isAuthenticated) {
            loginBtn.disabled = true;
            backupBtn.disabled = false;
            restoreBtn.disabled = false;
            logoutBtn.disabled = false;
            
            if (googleStatus) googleStatus.textContent = '✅ Conectado';
            loginBtn.style.background = '#28a745';
        } else if (driveStatus.isInitialized && driveStatus.clientIdConfigured) {
            loginBtn.disabled = false;
            backupBtn.disabled = true;
            restoreBtn.disabled = true;
            logoutBtn.disabled = true;
            
            if (googleStatus) googleStatus.textContent = '🔓 Conectar Google Drive';
            loginBtn.style.background = '';
        } else {
            loginBtn.disabled = true;
            backupBtn.disabled = true;
            restoreBtn.disabled = true;
            logoutBtn.disabled = true;
            
            if (googleStatus) googleStatus.textContent = '⚙️ Configurar';
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar UI do Google Drive:', error);
    }
}

/**
 * Atualiza UI de backup geral
 */
updateBackupUI() {
    const data = dataManager.loadData();
    const statusText = this.getElement('drive-status');
    
    if (statusText) {
        const driveStatus = googleDriveManager ? googleDriveManager.getStatus() : null;
        
        if (driveStatus && driveStatus.clientIdConfigured) {
            // Mostra status do Google Drive se configurado
            if (driveStatus.isAuthenticated) {
                statusText.textContent = '✅ Google Drive Conectado';
                statusText.style.color = '#28a745';
            } else if (driveStatus.isInitialized) {
                statusText.textContent = '🔒 Google Drive Disponível';
                statusText.style.color = '#6c757d';
            } else {
                statusText.textContent = '⏳ Inicializando Google Drive...';
                statusText.style.color = '#6c757d';
            }
        } else {
            // Status do backup local
            if (data.length === 0) {
                statusText.textContent = '⚠️ Nenhum dado salvo';
                statusText.style.color = '#ffc107';
            } else {
                statusText.textContent = `✅ ${data.length} registros locais`;
                statusText.style.color = '#28a745';
            }
        }
    }
}

/**
 * Restauração local
 */
handleLocalRestore() {
    // Cria input de arquivo temporário
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.csv';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        this.processLocalRestore(file);
    };
    
    fileInput.click();
}

/**
 * Processa restauração de arquivo local
 */
async processLocalRestore(file) {
    try {
        this.showToast('Processando arquivo de backup...', 'info');
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                let data;
                
                if (file.name.endsWith('.json')) {
                    // Backup JSON
                    data = JSON.parse(e.target.result);
                } else if (file.name.endsWith('.csv')) {
                    // Backup CSV - usa o importador existente
                    data = this.parseCSVData(e.target.result);
                } else {
                    throw new Error('Formato de arquivo não suportado');
                }
                
                if (!Array.isArray(data)) {
                    throw new Error('Arquivo de backup inválido');
                }
                
                if (!confirm(`Deseja restaurar ${data.length} registros do backup?\nOs dados atuais serão substituídos.`)) {
                    return;
                }
                
                dataManager.saveData(data);
                this.showToast(`Backup restaurado! ${data.length} registros carregados.`, 'success');
                this.handleDataChange();
                
            } catch (error) {
                console.error('❌ Erro ao processar arquivo:', error);
                this.showToast('Erro ao processar arquivo de backup', 'error');
            }
        };
        
        reader.readAsText(file);
        
    } catch (error) {
        console.error('❌ Erro na restauração local:', error);
        this.showToast('Erro ao restaurar backup', 'error');
    }
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
            statusText.textContent = `✅ ${data.length} registros locais`;
            statusText.style.color = '#28a745';
        }
    }
}

/**
 * Configura listeners diretos como fallback
 */
setupDirectListeners() {
    const elements = [
        'btn-google-login',
        'btn-backup-drive', 
        'btn-restore-drive',
        'btn-logout-drive'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // Remove listeners existentes
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Adiciona novo listener
            document.getElementById(id).addEventListener('click', (event) => {
                event.preventDefault();
                this.handleGoogleDriveClick(id);
            });
        }
    });
}

/**
 * Manipula cliques nos botões do Google Drive
 */
handleGoogleDriveClick(buttonId) {
    switch (buttonId) {
        case 'btn-google-login':
            console.log('🔐 Conectar Google Drive');
            this.handleGoogleLogin();
            break;
        case 'btn-backup-drive':
            console.log('💾 Backup no Drive');
            this.handleBackupToDrive();
            break;
        case 'btn-restore-drive':
            console.log('📥 Restaurar do Drive');
            this.handleRestoreFromDrive();
            break;
        case 'btn-logout-drive':
            console.log('🚪 Sair do Drive');
            this.handleGoogleLogout();
            break;
    }
}

/**
 * Manipula login no Google Drive - Versão Corrigida
 */
async handleGoogleLogin() {
    try {
        console.log('🔄 Iniciando autenticação...');
        this.showToast('Conectando ao Google Drive...', 'info');
        
        // Verifica se o googleDriveManager existe
        if (typeof googleDriveManager === 'undefined') {
            throw new Error('Google Drive Manager não carregado');
        }
        
        await googleDriveManager.authenticate();
        console.log('✅ Autenticação concluída');
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        this.showToast('Erro ao conectar com Google Drive: ' + error.message, 'error');
    }
}

/**
 * Faz backup no Google Drive - Versão Corrigida
 */
async handleBackupToDrive() {
    try {
        const data = dataManager.loadData();
        
        if (data.length === 0) {
            this.showToast('Nenhum dado para fazer backup', 'warning');
            return;
        }

        console.log('💾 Iniciando backup...');
        this.showToast('Salvando backup no Google Drive...', 'info');
        
        await googleDriveManager.saveToDrive(data);
        console.log('✅ Backup concluído');
        
    } catch (error) {
        console.error('❌ Erro no backup:', error);
        this.showToast('Erro ao salvar backup no Drive: ' + error.message, 'error');
    }
}

/**
 * Restaura do Google Drive - Versão Corrigida
 */
async handleRestoreFromDrive() {
    if (!confirm('Deseja restaurar dados do Google Drive? Os dados atuais serão substituídos.')) {
        return;
    }

    try {
        console.log('📥 Iniciando restauração...');
        this.showToast('Carregando backup do Google Drive...', 'info');
        
        const data = await googleDriveManager.loadFromDrive();
        
        if (data && Array.isArray(data)) {
            dataManager.saveData(data);
            this.showToast('Dados restaurados do Google Drive!', 'success');
            this.handleDataChange();
            console.log('✅ Restauração concluída');
        }
    } catch (error) {
        console.error('❌ Erro na restauração:', error);
        this.showToast('Erro ao restaurar do Drive: ' + error.message, 'error');
    }
}

/**
 * Manipula logout do Google Drive - Versão Corrigida
 */
async handleGoogleLogout() {
    try {
        console.log('🚪 Iniciando logout...');
        googleDriveManager.logout();
        this.showToast('Desconectado do Google Drive', 'info');
        console.log('✅ Logout concluído');
    } catch (error) {
        console.error('❌ Erro no logout:', error);
        this.showToast('Erro ao desconectar: ' + error.message, 'error');
    }
}

/**
 * Configuração mínima e segura - Versão Corrigida
 */
setupGoogleDriveMinimal() {
    try {
        // Verifica se os elementos existem
        const elements = {
            login: document.getElementById('btn-google-login'),
            backup: document.getElementById('btn-backup-drive'),
            restore: document.getElementById('btn-restore-drive'),
            logout: document.getElementById('btn-logout-drive'),
            status: document.getElementById('drive-status')
        };

        // Verifica se todos os elementos existem
        if (!elements.login || !elements.backup || !elements.restore || !elements.logout) {
            console.error('❌ Elementos do Google Drive não encontrados:', elements);
            return;
        }

        console.log('✅ Elementos encontrados, configurando listeners...');

        // Salva a referência correta do 'this'
        const self = this;

        // Configura listeners com arrow functions para manter o contexto
        elements.login.onclick = () => {
            console.log('🔐 Login clicado');
            self.handleGoogleLogin();
        };

        elements.backup.onclick = () => {
            console.log('💾 Backup clicado');
            self.handleBackupToDrive();
        };

        elements.restore.onclick = () => {
            console.log('📥 Restore clicado');
            self.handleRestoreFromDrive();
        };

        elements.logout.onclick = () => {
            console.log('🚪 Logout clicado');
            self.handleGoogleLogout();
        };

        // Atualiza UI inicial
        this.updateGoogleDriveUI();

        console.log('🎯 Google Drive configurado com sucesso!');

    } catch (error) {
        console.error('❌ Erro na configuração minimalista:', error);
    }
}

/**
 * Atualiza interface do Google Drive - VERSÃO COM STATUS REAL
 */
updateGoogleDriveUI(status = null) {
    try {
        const driveStatus = status || (window.googleDriveManager ? googleDriveManager.getStatus() : { 
            isInitialized: false, 
            isAuthenticated: false,
            isReal: false
        });
        
        const loginBtn = this.getElement('btn-google-login');
        const backupBtn = this.getElement('btn-backup-drive');
        const restoreBtn = this.getElement('btn-restore-drive');
        const logoutBtn = this.getElement('btn-logout-drive');
        const statusText = this.getElement('drive-status');
        const googleStatus = this.getElement('google-status');

        if (!loginBtn || !statusText) return;

        // Status do serviço
        if (!driveStatus.clientIdConfigured) {
            statusText.textContent = '⚙️ Configure o Client ID';
            statusText.style.color = '#ffc107';
        } else if (driveStatus.isAuthenticated) {
            statusText.textContent = '✅ Google Drive Conectado';
            statusText.style.color = '#28a745';
        } else if (driveStatus.isInitialized) {
            statusText.textContent = '🔒 Google Drive Disponível';
            statusText.style.color = '#6c757d';
        } else {
            statusText.textContent = '⏳ Inicializando...';
            statusText.style.color = '#6c757d';
        }

        // Estados dos botões
        if (driveStatus.isAuthenticated) {
            loginBtn.disabled = true;
            backupBtn.disabled = false;
            restoreBtn.disabled = false;
            logoutBtn.disabled = false;
            
            if (googleStatus) googleStatus.textContent = '✅ Conectado';
            loginBtn.style.background = '#28a745';
        } else if (driveStatus.isInitialized && driveStatus.clientIdConfigured) {
            loginBtn.disabled = false;
            backupBtn.disabled = true;
            restoreBtn.disabled = true;
            logoutBtn.disabled = true;
            
            if (googleStatus) googleStatus.textContent = '🔓 Conectar Google Drive';
            loginBtn.style.background = '';
        } else {
            loginBtn.disabled = true;
            backupBtn.disabled = true;
            restoreBtn.disabled = true;
            logoutBtn.disabled = true;
            
            if (googleStatus) googleStatus.textContent = '⚙️ Configurar';
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar UI do Google Drive:', error);
    }
}

/**
 * Força a atualização visual da UI
 */
forceUIRefresh() {
    // Truque para forçar o navegador a redesenharr
    const elements = document.querySelectorAll('#btn-google-login, #btn-backup-drive, #btn-restore-drive, #btn-logout-drive');
    
    elements.forEach(element => {
        if (element) {
            element.style.display = 'none';
            element.offsetHeight; // Força reflow
            element.style.display = 'block';
        }
    });
    
    console.log('🔄 UI refresh forçado');
}

/**
 * Força o redesenho dos botões para garantir que as mudanças sejam aplicadas
 */
forceButtonRedraw(elements) {
    // Truque para forçar o redesenho dos elementos
    Object.values(elements).forEach(element => {
        if (element) {
            element.style.display = 'none';
            element.offsetHeight; // Força reflow
            element.style.display = '';
        }
    });
}

/**
 * Debug temporário - Verifica o estado dos botões
 */
debugGoogleDriveButtons() {
    setTimeout(() => {
        console.log('🐛 DEBUG - Estado dos botões do Google Drive:');
        console.log('🔘 Login:', {
            elemento: document.getElementById('btn-google-login'),
            disabled: document.getElementById('btn-google-login')?.disabled,
            text: document.getElementById('btn-google-login')?.textContent
        });
        console.log('🔘 Backup:', {
            elemento: document.getElementById('btn-backup-drive'),
            disabled: document.getElementById('btn-backup-drive')?.disabled
        });
        console.log('🔘 Restore:', {
            elemento: document.getElementById('btn-restore-drive'),
            disabled: document.getElementById('btn-restore-drive')?.disabled
        });
        console.log('🔘 Logout:', {
            elemento: document.getElementById('btn-logout-drive'),
            disabled: document.getElementById('btn-logout-drive')?.disabled
        });
        console.log('📊 Status do GoogleDriveManager:', googleDriveManager?.getStatus());
    }, 2000);
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
            this.charts.nomes.update('none'); // 'none' para animação mais suave
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

// Debug temporário - remove depois
setTimeout(() => {
    console.log('🔍 DEBUG: Verificando elementos do Google Drive...');
    console.log('Login button:', document.getElementById('btn-google-login'));
    console.log('Backup button:', document.getElementById('btn-backup-drive'));
    console.log('Restore button:', document.getElementById('btn-restore-drive'));
    console.log('Logout button:', document.getElementById('btn-logout-drive'));
    console.log('Status text:', document.getElementById('drive-status'));
}, 2000);

// Instância global dos componentes de UI
window.uiComponents = new UIComponents();