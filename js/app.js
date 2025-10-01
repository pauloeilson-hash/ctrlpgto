/**
 * Arquivo principal da aplicação - Inicialização e configuração
 */

class PagamentosApp {
    constructor() {
        this.isInitialized = false;
        this.version = '1.0.0';
    }

    /**
     * Inicializa a aplicação
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('Aplicação já inicializada');
            return;
        }

        try {
            this.setupEnvironment();
            this.checkDependencies();
            this.setupPageUnload();
            this.initializeModules();
            this.setupGlobalErrorHandling();
            this.logStartup();

            this.isInitialized = true;
            console.log('✅ Aplicação inicializada com sucesso');

        } catch (error) {
            console.error('❌ Erro na inicialização da aplicação:', error);
            this.showCriticalError('Erro ao inicializar a aplicação');
        }
    }

    /**
     * Configura ambiente e variáveis globais
     */
  setupEnvironment() {
    // Define globais para módulos
    window.Utils = Utils;
    window.eventBus = eventBus;
    window.dataManager = dataManager;
    window.exportManager = exportManager;
    window.googleDriveManager = googleDriveManager;
    window.darkModeManager = darkModeManager; // ← ADICIONE ESTA LINHA
    window.uiComponents = uiComponents;

    // Configura data atual nos campos de data vazios
    this.setDefaultDates();
}

    /**
     * Verifica dependências externas
     */
    checkDependencies() {
        const requiredLibs = {
            'Chart.js': () => typeof Chart !== 'undefined',
            'XLSX': () => typeof XLSX !== 'undefined',
            'PapaParse': () => typeof Papa !== 'undefined',
            'jsPDF': () => typeof window.jspdf !== 'undefined'
        };

        const missingLibs = Object.entries(requiredLibs)
            .filter(([_, check]) => !check())
            .map(([name]) => name);

        if (missingLibs.length > 0) {
            throw new Error(`Bibliotecas necessárias não carregadas: ${missingLibs.join(', ')}`);
        }
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

    // Para Live Reload específico
    if (typeof window.LiveReload !== 'undefined') {
        window.addEventListener('livereload', () => {
            if (window.uiComponents) {
                uiComponents.destroy();
            }
        });
    }
}

       // REMOVA ou COMENTE estas linhas:
// Para hot reload do Vite ou outros
// if (import.meta && import.meta.hot) {
//     import.meta.hot.dispose(() => {
//         if (window.uiComponents) {
//             uiComponents.destroy();
//         }
//     });
// }

    /**
 * Inicializa módulos da aplicação - VERSÃO CORRIGIDA
 */
initializeModules() {
    // CORREÇÃO: Inicializa uiComponents primeiro
    window.uiComponents = new UIComponents();
    
    // Inicializa componentes de UI
    uiComponents.initializeComponents();
    
    // Solicita restauração de backup se necessário
    setTimeout(() => {
        uiComponents.solicitateBackupRestore();
    }, 500);

    // Configura shortcuts de teclado
    this.setupKeyboardShortcuts();

    // Configura service worker (se disponível)
    this.setupServiceWorker();
}

/**
 * Configura ambiente e variáveis globais - VERSÃO CORRIGIDA
 */
setupEnvironment() {
    // CORREÇÃO: Não define uiComponents aqui ainda
    // Ele será definido em initializeModules()
    window.Utils = Utils;
    window.eventBus = eventBus;
    window.dataManager = dataManager;
    window.exportManager = exportManager;
    window.googleDriveManager = googleDriveManager;
    window.darkModeManager = darkModeManager;

    // Configura data atual nos campos de data vazios
    this.setDefaultDates();
}

    /**
     * Configura tratamento global de erros
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Erro global:', event.error);
            this.showErrorToast('Ocorreu um erro inesperado');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejeitada:', event.reason);
            this.showErrorToast('Operação falhou');
        });
    }

    /**
     * Configura atalhos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Enter: Registrar pagamento
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                uiComponents.handleRegisterPayment();
            }

            // Ctrl+E: Exportar CSV
            if (event.ctrlKey && event.key === 'e') {
                event.preventDefault();
                uiComponents.exportCSV();
            }

            // Ctrl+L: Limpar formulário
            if (event.ctrlKey && event.key === 'l') {
                event.preventDefault();
                uiComponents.clearForm();
            }

            // Escape: Limpar filtros
            if (event.key === 'Escape') {
                if (document.activeElement.tagName === 'INPUT' || 
                    document.activeElement.tagName === 'SELECT') {
                    uiComponents.clearFilters();
                }
            }
        });
    }

    /**
     * Configura service worker para cache (opcional)
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado:', registration);
                })
                .catch(error => {
                    console.log('Service Worker não registrado:', error);
                });
        }
    }

    /**
     * Define datas padrão nos campos
     */
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        
        // Data atual no campo de registro se estiver vazio
        const dataInput = document.getElementById('input-data');
        if (dataInput && !dataInput.value) {
            dataInput.value = today;
        }

        // Data final no filtro como hoje se estiver vazia
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

    /**
     * Exibe notificação de erro
     */
    showErrorToast(message) {
        if (window.uiComponents && uiComponents.showToast) {
            uiComponents.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * Retorna informações da aplicação
     */
    getAppInfo() {
        const data = dataManager.loadData();
        const stats = dataManager.getStatistics(data);
        
        return {
            version: this.version,
            records: data.length,
            totalValue: stats.total,
            period: {
                start: stats.startDate,
                end: stats.endDate
            },
            initialized: this.isInitialized
        };
    }

    /**
     * Limpa cache e reinicializa
     */
    async clearCache() {
        if (confirm('Deseja limpar o cache e recarregar a aplicação?')) {
            localStorage.removeItem('pagamentos_data_v3');
            window.location.reload();
        }
    }
}

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const app = new PagamentosApp();
    app.initialize();
    
    // Torna app global para debugging
    window.app = app;
});

// Export para testes (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PagamentosApp };
}