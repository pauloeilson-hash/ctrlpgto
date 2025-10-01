/**
 * Gerenciamento de dados e operações no localStorage
 */

class DataManager {
    constructor() {
        this.STORAGE_KEY = 'pagamentos_data_v3'; // Versão atualizada para forçar migração
        this.migrateFromV2();
    }

    /**
     * Migra dados da versão anterior (v2) se necessário
     */
    migrateFromV2() {
        const v2Data = localStorage.getItem('pagamentos_data_v2');
        if (v2Data && !localStorage.getItem(this.STORAGE_KEY)) {
            try {
                const data = JSON.parse(v2Data);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
                console.log('Dados migrados da versão v2 para v3');
            } catch (error) {
                console.error('Erro na migração de dados:', error);
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
            console.error('Erro ao carregar dados:', error);
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
            console.error('Erro ao salvar dados:', error);
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
     * Adiciona novo pagamento
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
     * Valida dados do pagamento
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

       // Validação melhorada de data futura
    if (Utils.isValidDate(pagamento.data)) {
        const today = new Date();
        const inputDate = new Date(pagamento.data);
        today.setHours(0, 0, 0, 0);
        
        if (inputDate > today) {
            errors.push('Data não pode ser futura');
        }
    }
    
    return errors;

        if (!pagamento.valor || isNaN(pagamento.valor) || pagamento.valor <= 0) {
            errors.push('Valor deve ser um número positivo');
        }

        if (pagamento.historico && pagamento.historico.length > 500) {
            errors.push('Histórico não pode ter mais de 500 caracteres');
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
     * Filtra pagamentos com base nos critérios
     * @param {Object} filters - Objeto de filtros
     * @returns {Array} Pagamentos filtrados
     */
    filterPayments(filters = {}) {
        let data = this.loadData();

        if (filters.nome) {
            data = data.filter(item => item.nome === filters.nome);
        }

        if (filters.dataInicial) {
            data = data.filter(item => item.data >= filters.dataInicial);
        }

        if (filters.dataFinal) {
            data = data.filter(item => item.data <= filters.dataFinal);
        }

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
            console.error('Erro ao limpar dados:', error);
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

// Instância global do DataManager
window.dataManager = new DataManager();