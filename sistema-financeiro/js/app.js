/**
 * Arquivo principal da aplicação - Inicialização e configuração
 */

console.log('📄 app.js carregando...');

class PagamentosApp {
    constructor() {
        console.log('🔄 PagamentosApp constructor chamado');
        this.isInitialized = false;
        this.version = '1.0.0';
    }

    /**
 * Inicializa a aplicação - VERSÃO COM VERIFICAÇÃO DE BACKUP
 */
initialize() {
    if (this.isInitialized) {
        console.warn('Aplicação já inicializada');
        return;
    }

    try {
        console.log('🚀 Inicializando aplicação...');
        
        // Verifica dependências críticas
        this.checkCriticalDependencies();
        
        // Configura ambiente
        this.setupEnvironment();
        this.setupPageUnload();
        this.initializeModules();
        this.setupGlobalErrorHandling();
        this.logStartup();

        // VERIFICAÇÃO ESPECÍFICA DOS BOTÕES DE BACKUP
        setTimeout(() => {
            console.log('🔍 Verificando botões de backup:');
            console.log('- backup-json-btn:', document.getElementById('backup-json-btn'));
            console.log('- restore-json-btn:', document.getElementById('restore-json-btn'));
            
            // Força a configuração se não estiver feita
            if (window.uiComponents && !window.uiComponents.backupControlsSetup) {
                console.log('🔄 Forçando configuração dos botões de backup...');
                window.uiComponents.setupBackupControlsOnce();
            }
        }, 500);

        this.isInitialized = true;
        console.log('✅ Aplicação inicializada com sucesso');

    } catch (error) {
        console.error('❌ Erro na inicialização da aplicação:', error);
        this.showCriticalError('Erro ao inicializar a aplicação: ' + error.message);
    }
}
    /**
     * Verifica apenas dependências críticas
     */
    checkCriticalDependencies() {
        console.log('🔍 Verificando dependências críticas...');
        const critical = {
            'Utils': () => typeof Utils !== 'undefined',
            'eventBus': () => typeof eventBus !== 'undefined', 
            'dataManager': () => typeof dataManager !== 'undefined'
        };

        const missing = Object.entries(critical)
            .filter(([_, check]) => !check())
            .map(([name]) => name);

        if (missing.length > 0) {
            throw new Error(`Dependências críticas faltantes: ${missing.join(', ')}`);
        }
        
        console.log('✅ Todas as dependências críticas carregadas');
    }

    /**
     * Configura ambiente
     */
    setupEnvironment() {
        console.log('🔧 Configurando ambiente...');
        
        // uiComponents será definido depois em initializeModules()
        console.log('✅ Ambiente configurado');
    }

    /**
     * Configura cleanup antes de descarregar a página
     */
    setupPageUnload() {
        window.addEventListener('beforeunload', () => {
            if (window.uiComponents) {
                uiComponents.destroy();
            }
        });
    }

    /**
     * Inicializa módulos da aplicação
     */
    initializeModules() {
        // Inicializa componentes de UI
        window.uiComponents = new UIComponents();
        uiComponents.initializeComponents();
        
        // Solicita restauração de backup se necessário
        setTimeout(() => {
            uiComponents.solicitateBackupRestore();
        }, 500);

        // Configura shortcuts de teclado
        this.setupKeyboardShortcuts();
    }

    /**
     * Configura atalhos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Enter: Registrar pagamento
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                if (window.uiComponents) {
                    uiComponents.handleRegisterPayment();
                }
            }
        });
    }

    /**
     * Configura tratamento global de erros
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Erro global:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejeitada:', event.reason);
        });
    }

    /**
     * Define datas padrão nos campos
     */
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        
        const dataInput = document.getElementById('input-data');
        if (dataInput && !dataInput.value) {
            dataInput.value = today;
        }

        const dataFimInput = document.getElementById('filtro-df');
        if (dataFimInput && !dataFimInput.value) {
            dataFimInput.value = today;
        }
    }

    /**
     * Log de inicialização
     */
    logStartup() {
        const data = dataManager.loadData();
        const stats = dataManager.getStatistics(data);
        
        console.log(`
╔══════════════════════════════════════╗
║      Controle de Pagamentos v${this.version}     ║
║                                      ║
║  📊 Registros: ${data.length.toString().padEnd(8)}           ║
║  💰 Valor total: ${stats.total.toFixed(2).padEnd(10)}       ║
║  📅 Período: ${stats.startDate || 'N/A'} - ${stats.endDate || 'N/A'} ║
║                                      ║
║  ✅ Aplicação inicializada           ║
╚══════════════════════════════════════╝
        `);
    }

    /**
     * Exibe erro crítico
     */
    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: #d32f2f;
            color: white;
            padding: 20px;
            text-align: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <h3>🚨 Erro Crítico</h3>
            <p>${message}</p>
            <button onclick="this.parentNode.remove()" 
                    style="background: white; color: #d32f2f; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                Fechar
            </button>
        `;
        document.body.appendChild(errorDiv);
    }
}

console.log('✅ PagamentosApp class definida');

// GARANTIR que a classe seja global
window.PagamentosApp = PagamentosApp;
console.log('🌐 PagamentosApp definido globalmente:', typeof window.PagamentosApp);

// Debug final
console.log('✅ app.js carregado completamente');

// DEBUG TEMPORÁRIO - REMOVER DEPOIS
console.log('🔍 DEBUG - Estado final do app.js:');
console.log('- PagamentosApp definido:', typeof PagamentosApp);
console.log('- window.PagamentosApp:', typeof window.PagamentosApp);
console.log('- Utils:', typeof Utils);
console.log('- eventBus:', typeof eventBus);
console.log('- dataManager:', typeof dataManager);

// Teste imediato
if (typeof PagamentosApp !== 'undefined') {
    console.log('✅ PagamentosApp está definido localmente');
} else {
    console.error('❌ PagamentosApp NÃO está definido localmente');
}

if (typeof window.PagamentosApp !== 'undefined') {
    console.log('✅ window.PagamentosApp está definido globalmente');
} else {
    console.error('❌ window.PagamentosApp NÃO está definido globalmente');
}