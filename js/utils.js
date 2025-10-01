/**
 * Utilitários gerais para a aplicação
 */

class Utils {
    /**
     * Formata valor para moeda brasileira
     * @param {number} value - Valor a ser formatado
     * @returns {string} Valor formatado
     */
    static formatCurrency(value) {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} str - String a ser escapada
     * @returns {string} String escapada
     */
    static escapeHtml(str) {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Valida se uma string é uma data válida
     * @param {string} dateString - Data no formato YYYY-MM-DD
     * @returns {boolean} True se for uma data válida
     */
    static isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString.length === 10;
    }

    /**
     * Debounce para otimizar performance
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função debounced
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Gera ID único
     * @returns {string} ID único
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Converte string para número, tratando vírgula como decimal
     * @param {string} value - Valor a ser convertido
     * @returns {number} Número convertido
     */
    static parseNumber(value) {
        if (typeof value === 'number') return value;
        const str = String(value).replace(/\./g, '').replace(',', '.');
        return parseFloat(str) || 0;
    }

    /**
     * Ordena array de strings em ordem alfabética considerando acentos
     * @param {string[]} array - Array a ser ordenado
     * @returns {string[]} Array ordenado
     */
    static sortAlphabetically(array) {
        return array.sort((a, b) => 
            a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
        );
    }

    /**
     * Verifica se o objeto está vazio
     * @param {Object} obj - Objeto a ser verificado
     * @returns {boolean} True se estiver vazio
     */
    static isEmpty(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        return Object.keys(obj).length === 0;
    }

    /**
     * Clona um objeto profundamente
     * @param {*} obj - Objeto a ser clonado
     * @returns {*} Clone do objeto
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Formata data para formato brasileiro
     * @param {string} dateString - Data no formato YYYY-MM-DD
     * @returns {string} Data formatada (DD/MM/YYYY)
     */
    static formatDateBR(dateString) {
        if (!this.isValidDate(dateString)) return dateString;
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    /**
     * Retorna o mês e ano de uma data
     * @param {string} dateString - Data no formato YYYY-MM-DD
     * @returns {string} Mês/ano (MM/YYYY)
     */
    static getMonthYear(dateString) {
        if (!this.isValidDate(dateString)) return '';
        const [year, month] = dateString.split('-');
        return `${month}/${year}`;
    }

    /**
     * Retorna o ano de uma data
     * @param {string} dateString - Data no formato YYYY-MM-DD
     * @returns {string} Ano (YYYY)
     */
    static getYear(dateString) {
        if (!this.isValidDate(dateString)) return '';
        return dateString.split('-')[0];
    }
}

// Export para uso global
window.Utils = Utils;