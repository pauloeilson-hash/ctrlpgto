/**
 * Gerenciador do Modo Escuro
 */

class DarkModeManager {
    constructor() {
        this.STORAGE_KEY = 'pagamentos_darkmode';
        this.isDarkMode = this.loadPreference();
        
        this.initialize();
    }

    /**
     * Inicializa o modo escuro
     */
    initialize() {
        this.applyTheme();
        this.setupToggle();
        this.setupSystemPreference();
        
        console.log(`🌙 Modo Escuro: ${this.isDarkMode ? 'ATIVADO' : 'DESATIVADO'}`);
    }

    /**
     * Carrega a preferência salva
     */
    loadPreference() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved !== null) {
                return JSON.parse(saved);
            }
            // Se não há preferência salva, usa a preferência do sistema
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch (error) {
            console.error('Erro ao carregar preferência do modo escuro:', error);
            return false;
        }
    }

    /**
     * Salva a preferência
     */
    savePreference() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.isDarkMode));
        } catch (error) {
            console.error('Erro ao salvar preferência do modo escuro:', error);
        }
    }

    /**
     * Aplica o tema atual
     */
    applyTheme() {
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        // Atualiza o botão toggle
        this.updateToggleButton();
        
        // Força atualização dos gráficos se existirem
        this.updateCharts();
    }

    /**
     * Configura o botão toggle
     */
    setupToggle() {
        const toggleBtn = document.getElementById('btn-toggle-darkmode');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        } else {
            console.error('Botão do modo escuro não encontrado');
        }
    }

    /**
     * Configura o listener para preferência do sistema
     */
    setupSystemPreference() {
        // Escuta mudanças na preferência do sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Só segue a preferência do sistema se não houver preferência salva
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.isDarkMode = e.matches;
                this.applyTheme();
            }
        });
    }

    /**
     * Alterna entre modo claro e escuro
     */
    toggle() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.savePreference();
        this.showToast();
        
        console.log(`🌙 Modo Escuro ${this.isDarkMode ? 'ativado' : 'desativado'}`);
    }

    /**
     * Ativa o modo escuro
     */
    enable() {
        this.isDarkMode = true;
        this.applyTheme();
        this.savePreference();
    }

    /**
     * Desativa o modo escuro
     */
    disable() {
        this.isDarkMode = false;
        this.applyTheme();
        this.savePreference();
    }

  /**
 * Atualiza o texto do botão toggle
 */
updateToggleButton() {
    const toggleBtn = document.getElementById('btn-toggle-darkmode');
    if (toggleBtn) {
        if (this.isDarkMode) {
            toggleBtn.innerHTML = '☀️';
            toggleBtn.title = 'Alternar para modo claro';
        } else {
            toggleBtn.innerHTML = '🌙';
            toggleBtn.title = 'Alternar para modo escuro';
        }
    }
}

    /**
     * Mostra toast de confirmação
     */
    showToast() {
        if (window.eventBus) {
            const message = this.isDarkMode ? 'Modo escuro ativado' : 'Modo claro ativado';
            const type = 'info';
            eventBus.publish('showToast', { message, type });
        }
    }

    /**
     * Atualiza os gráficos para o tema atual
     */
    updateCharts() {
        if (window.uiComponents && uiComponents.charts) {
            // Força a atualização dos gráficos após mudança de tema
            setTimeout(() => {
                if (uiComponents.updateCharts) {
                    uiComponents.updateCharts();
                }
            }, 100);
        }
    }

    /**
     * Retorna o estado atual
     */
    getStatus() {
        return {
            isDarkMode: this.isDarkMode,
            preference: this.loadPreference()
        };
    }
}

// Instância global do DarkMode Manager
window.darkModeManager = new DarkModeManager();