/**
 * Sistema de Event Bus para comunicação entre componentes
 */

class EventBus {
    constructor() {
        this.subscribers = {};
        this.history = [];
        this.maxHistorySize = 100;
    }

    /**
     * Inscreve um callback para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser executada
     * @returns {Function} Função para cancelar a inscrição
     */
    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }
        
        this.subscribers[event].push(callback);
        
        // Retorna função para unsubscribe
        return () => {
            this.unsubscribe(event, callback);
        };
    }

    /**
     * Remove inscrição de um callback
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser removida
     */
    unsubscribe(event, callback) {
        if (!this.subscribers[event]) return;
        
        this.subscribers[event] = this.subscribers[event].filter(
            cb => cb !== callback
        );
    }

    /**
     * Publica um evento para todos os subscribers
     * @param {string} event - Nome do evento
     * @param {*} data - Dados a serem passados
     */
    publish(event, data = null) {
        // Adiciona ao histórico
        this.history.unshift({
            event,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Mantém histórico limitado
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }
        
        // Executa callbacks
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Publica um evento apenas uma vez
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser executada
     */
    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.unsubscribe(event, onceCallback);
        };
        this.subscribe(event, onceCallback);
    }

    /**
     * Limpa todos os subscribers de um evento
     * @param {string} event - Nome do evento
     */
    clear(event = null) {
        if (event) {
            this.subscribers[event] = [];
        } else {
            this.subscribers = {};
        }
    }

    /**
     * Retorna o histórico de eventos
     * @returns {Array} Histórico de eventos
     */
    getHistory() {
        return this.history;
    }

    /**
     * Limpa o histórico de eventos
     */
    clearHistory() {
        this.history = [];
    }
}

// Instância global do EventBus
window.eventBus = new EventBus();