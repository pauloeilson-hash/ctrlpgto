/**
 * Gerenciamento de dados e operações no localStorage
 */

console.log('📦 dataManager.js carregando...');

class DataManager {
    constructor() {
        console.log('🔄 DataManager constructor chamado');
        this.STORAGE_KEY = 'pagamentos_data_v4';
        this.migrateFromV3();
        console.log('✅ DataManager inicializado');
    }

    /**
     * Migra dados da versão anterior (v3) adicionando campo status
     */
    migrateFromV3() {
        const v3Data = localStorage.getItem('pagamentos_data_v3');
        if (v3Data && !localStorage.getItem(this.STORAGE_KEY)) {
            try {
                const data = JSON.parse(v3Data);
                // Adiciona campo status aos registros existentes
                const migratedData = data.map(item => ({
                    ...item,
                    status: 'efetuado' // Assume que registros antigos já foram efetuados
                }));
                
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedData));
                console.log('✅ Dados migrados da versão v3 para v4 com campo status');
            } catch (error) {
                console.error('❌ Erro na migração de dados:', error);
            }
        }
    }

    /**
     * Carrega dados do localStorage
     * @returns {Array} Array de pagamentos
     */
    loadData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados salvos');
            return [];
        }
    }

    /**
     * Salva dados no localStorage
     * @param {Array} data - Array de pagamentos
     */
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            eventBus.publish('dataChanged', { data, action: 'save' });
        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            this.showError('Erro ao salvar dados');
        }
    }

    /**
     * Gera próximo ID sequencial
     * @param {Array} data - Array de pagamentos
     * @returns {number} Próximo ID
     */
    generateNextId(data) {
        return data.length > 0 ? Math.max(...data.map(x => x.id)) + 1 : 1;
    }

    /**
     * Adiciona novo pagamento - VERSÃO COM STATUS
     * @param {Object} pagamento - Dados do pagamento
     * @returns {boolean} Sucesso da operação
     */
    addPayment(pagamento) {
        const errors = this.validatePayment(pagamento);
        if (errors.length > 0) {
            this.showError(errors.join('\n'));
            return false;
        }

        const data = this.loadData();
        
        // Normaliza nome (mantém caixa do existente se houver)
        const nomeNormalizado = this.normalizeNome(pagamento.nome, data);
        
        const novoPagamento = {
            id: this.generateNextId(data),
            nome: nomeNormalizado,
            data: pagamento.data,
            valor: Number(pagamento.valor.toFixed(2)),
            historico: pagamento.historico || '',
            status: pagamento.status || 'pendente', // ← NOVO CAMPO
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.push(novoPagamento);
        this.saveData(data);
        
        this.showSuccess('Pagamento registrado com sucesso!');
        return true;
    }

    /**
     * Atualiza pagamento existente
     * @param {number} id - ID do pagamento
     * @param {Object} updates - Campos a serem atualizados
     * @returns {boolean} Sucesso da operação
     */
    updatePayment(id, updates) {
        const data = this.loadData();
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) {
            this.showError('Pagamento não encontrado');
            return false;
        }

        // Valida dados atualizados
        const paymentToValidate = { ...data[index], ...updates };
        const errors = this.validatePayment(paymentToValidate);
        if (errors.length > 0) {
            this.showError(errors.join('\n'));
            return false;
        }

        // Normaliza nome se necessário
        if (updates.nome) {
            updates.nome = this.normalizeNome(updates.nome, data.filter(item => item.id !== id));
        }

        data[index] = {
            ...data[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveData(data);
        this.showSuccess('Pagamento atualizado com sucesso!');
        return true;
    }

    /**
     * Remove pagamento
     * @param {number} id - ID do pagamento
     * @returns {boolean} Sucesso da operação
     */
    deletePayment(id) {
        const data = this.loadData().filter(item => item.id !== id);
        this.saveData(data);
        this.showSuccess('Pagamento removido com sucesso!');
        return true;
    }

    /**
     * Valida dados do pagamento - VERSÃO COM STATUS
     * @param {Object} pagamento - Dados do pagamento
     * @returns {Array} Array de erros
     */
    validatePayment(pagamento) {
        const errors = [];

        if (!pagamento.nome || pagamento.nome.trim().length === 0) {
            errors.push('Nome é obrigatório');
        } else if (pagamento.nome.trim().length < 2) {
            errors.push('Nome deve ter pelo menos 2 caracteres');
        }

        if (!Utils.isValidDate(pagamento.data)) {
            errors.push('Data é obrigatória e deve ser válida');
        } else {
            // Verifica se data não é futura
            const today = new Date().toISOString().split('T')[0];
            if (pagamento.data > today) {
                errors.push('Data não pode ser futura');
            }
        }

        if (!pagamento.valor || isNaN(pagamento.valor) || pagamento.valor <= 0) {
            errors.push('Valor deve ser um número positivo');
        }

        if (pagamento.historico && pagamento.historico.length > 500) {
            errors.push('Histórico não pode ter mais de 500 caracteres');
        }

        // Valida status
        if (pagamento.status && !['pendente', 'efetuado'].includes(pagamento.status)) {
            errors.push('Status deve ser "pendente" ou "efetuado"');
        }

        return errors;
    }

    /**
     * Normaliza nome mantendo caixa do existente
     * @param {string} nome - Nome a ser normalizado
     * @param {Array} data - Array de pagamentos
     * @returns {string} Nome normalizado
     */
    normalizeNome(nome, data) {
        const nomeTrimmed = nome.trim();
        const existing = data.find(item => 
            item.nome.toLowerCase() === nomeTrimmed.toLowerCase()
        );
        return existing ? existing.nome : nomeTrimmed;
    }

    /**
     * Filtra pagamentos com base nos critérios - VERSÃO COM FILTROS AVANÇADOS
     * @param {Object} filters - Objeto de filtros
     * @returns {Array} Pagamentos filtrados
     */
    filterPayments(filters = {}) {
        let data = this.loadData();

        // Filtro por nome
        if (filters.nome) {
            data = data.filter(item => item.nome === filters.nome);
        }

        // Filtro por data inicial
        if (filters.dataInicial) {
            data = data.filter(item => item.data >= filters.dataInicial);
        }

        // Filtro por data final
        if (filters.dataFinal) {
            data = data.filter(item => item.data <= filters.dataFinal);
        }

        // Filtro por status ← NOVO
        if (filters.status) {
            data = data.filter(item => item.status === filters.status);
        }

        // Filtro avançado por histórico ← NOVO
        if (filters.historico) {
            const searchTerm = filters.historico.toLowerCase();
            data = data.filter(item => {
                const historico = (item.historico || '').toLowerCase();
                return historico.includes(searchTerm);
            });
        }

        // Filtro por ano
        if (filters.ano) {
            data = data.filter(item => item.data.startsWith(filters.ano));
        }

        // Ordena por data (mais recente primeiro) e ID
        return data.sort((a, b) => {
            if (a.data === b.data) return b.id - a.id;
            return a.data < b.data ? 1 : -1;
        });
    }

    /**
     * Retorna estatísticas dos dados
     * @param {Array} data - Dados a serem analisados (opcional)
     * @returns {Object} Estatísticas
     */
    getStatistics(data = null) {
        const payments = data || this.loadData();
        
        if (payments.length === 0) {
            return {
                total: 0,
                count: 0,
                average: 0,
                startDate: null,
                endDate: null
            };
        }

        const valores = payments.map(p => p.valor);
        const total = valores.reduce((sum, val) => sum + val, 0);
        const datas = payments.map(p => p.data).sort();

        return {
            total,
            count: payments.length,
            average: total / payments.length,
            startDate: datas[0],
            endDate: datas[datas.length - 1],
            minValue: Math.min(...valores),
            maxValue: Math.max(...valores)
        };
    }

    /**
     * Limpa todos os dados
     * @returns {boolean} Sucesso da operação
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            eventBus.publish('dataChanged', { action: 'clear' });
            this.showSuccess('Todos os dados foram removidos');
            return true;
        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
            this.showError('Erro ao limpar dados');
            return false;
        }
    }

    /**
     * Exibe notificação de sucesso
     * @param {string} message - Mensagem a ser exibida
     */
    showSuccess(message) {
        eventBus.publish('showToast', { message, type: 'success' });
    }

    /**
     * Exibe notificação de erro
     * @param {string} message - Mensagem a ser exibida
     */
    showError(message) {
        eventBus.publish('showToast', { message, type: 'error' });
    }
}

console.log('🏗️ Criando instância global do dataManager...');

// INSTÂNCIA GLOBAL DO DataManager - LINHA MAIS IMPORTANTE
window.dataManager = new DataManager();

console.log('✅ dataManager definido globalmente:', typeof window.dataManager);

// Debug para verificar se está funcionando
console.log('🔍 dataManager carregado com sucesso!');
console.log('- STORAGE_KEY:', window.dataManager.STORAGE_KEY);
console.log('- Métodos disponíveis:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.dataManager)).filter(m => m !== 'constructor'));