/**
 * Gerenciamento de exportação de dados (CSV, XLSX, PDF)
 */

class ExportManager {
    constructor() {
        this.exportHistory = [];
    }

    /**
     * Exporta dados para CSV
     * @param {Array} data - Dados a serem exportados
     * @param {string} filename - Nome do arquivo (opcional)
     * @param {boolean} showAlert - Se deve mostrar alerta se vazio
     * @returns {boolean} Sucesso da operação
     */
    exportToCSV(data, filename = null, showAlert = true) {
        if (!this.validateData(data, showAlert)) return false;

        try {
            const header = ['ID', 'Nome', 'Data', 'Valor', 'Histórico', 'Criado em', 'Atualizado em'];
            const rows = [header.join(',')];
            
            data.forEach(item => {
                const row = [
                    item.id,
                    this.escapeCSV(item.nome),
                    item.data,
                    item.valor.toString().replace('.', ','),
                    this.escapeCSV(item.historico || ''),
                    item.createdAt || '',
                    item.updatedAt || ''
                ];
                rows.push(row.join(','));
            });

            const csvContent = rows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            this.downloadFile(
                url, 
                filename || `pagamentos_${this.getFormattedDate()}.csv`
            );
            
            this.logExport('CSV', data.length);
            eventBus.publish('exportCompleted', { format: 'CSV', count: data.length });
            return true;

        } catch (error) {
            console.error('Erro ao exportar CSV:', error);
            this.showError('Erro ao exportar CSV');
            return false;
        }
    }

    /**
     * Exporta dados para XLSX
     * @param {Array} data - Dados a serem exportados
     * @param {string} filename - Nome do arquivo (opcional)
     * @param {boolean} showAlert - Se deve mostrar alerta se vazio
     * @returns {boolean} Sucesso da operação
     */
    exportToXLSX(data, filename = null, showAlert = true) {
        if (!this.validateData(data, showAlert)) return false;

        try {
            // Prepara dados para Excel
            const excelData = data.map(item => ({
                'ID': item.id,
                'Nome': item.nome,
                'Data': item.data,
                'Valor (R$)': item.valor,
                'Histórico': item.historico || '',
                'Criado em': item.createdAt || '',
                'Atualizado em': item.updatedAt || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagamentos');
            
            XLSX.writeFile(workbook, filename || `pagamentos_${this.getFormattedDate()}.xlsx`);
            
            this.logExport('XLSX', data.length);
            eventBus.publish('exportCompleted', { format: 'XLSX', count: data.length });
            return true;

        } catch (error) {
            console.error('Erro ao exportar XLSX:', error);
            this.showError('Erro ao exportar XLSX');
            return false;
        }
    }

    /**
 * Gera relatório mensal em PDF - VERSÃO SIMPLES COM SOMATÓRIO
 */
generateMonthlyPDF(titulo, data) {
    if (!this.validateData(data)) return false;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Cabeçalho
        this.addPDFHeader(doc, titulo);

        // Informações resumidas
        doc.setFontSize(10);
        const totalValor = data.reduce((sum, item) => sum + item.valor, 0);
        
        doc.text(`Período: ${this.getDateRange(data)}`, 10, 28);
        doc.text(`Registros: ${data.length}`, 10, 33);
        doc.text(`Somatório: ${Utils.formatCurrency(totalValor)}`, 10, 38); // NOVO SOMATÓRIO

        // Tabela
        const columns = ["ID", "Nome", "Data", "Valor (R$)", "Histórico"];
        const rows = data.map(item => [
            item.id,
            item.nome,
            Utils.formatDateBR(item.data),
            Utils.formatCurrency(item.valor),
            item.historico || ''
        ]);

        if (typeof doc.autoTable === "function") {
            doc.autoTable({
                head: [columns],
                body: rows,
                startY: 45,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [31, 111, 235] },
                columnStyles: {
                    3: { halign: 'right' }
                }
            });
        }

        // Resumo final com somatório
        this.addPDFSummaryWithTotal(doc, data, totalValor);

        const filename = titulo.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
        doc.save(filename);
        
        this.logExport('PDF Relatório', data.length);
        return true;

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        this.showError('Erro ao gerar relatório PDF');
        return false;
    }
}

/**
 * Adiciona resumo com somatório destacado
 */
addPDFSummaryWithTotal(doc, data, totalValor) {
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 55;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    // Somatório em destaque
    doc.setTextColor(31, 111, 235); // Azul
    doc.text(`SOMATÓRIO TOTAL: ${Utils.formatCurrency(totalValor)}`, 10, finalY);
    
    doc.setTextColor(0, 0, 0); // Volta ao preto
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Baseado em ${data.length} lançamentos filtrados`, 10, finalY + 8);
}

/**
 * Retorna o range de datas dos dados
 */
getDateRange(data) {
    if (!data.length) return 'Nenhum dado';
    
    const datas = data.map(item => item.data).sort();
    const primeiraData = datas[0];
    const ultimaData = datas[datas.length - 1];
    
    if (primeiraData === ultimaData) {
        return Utils.formatDateBR(primeiraData);
    }
    
    return `${Utils.formatDateBR(primeiraData)} a ${Utils.formatDateBR(ultimaData)}`;
}

    /**
     * Gera relatório anual em PDF
     * @param {string} year - Ano do relatório
     * @param {Array} data - Dados a serem incluídos
     * @returns {boolean} Sucesso da operação
     */
    generateAnnualPDF(year, data) {
        if (!this.validateData(data)) return false;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: "landscape" });

            // Cabeçalho
            this.addPDFHeader(doc, `Relatório Anual ${year}`);

            // Agrupa dados por nome e mês
            const summary = this.generateAnnualSummary(data, year);

            // Prepara dados para tabela
            const columns = ["Nome", ...summary.months, "Total"];
            const rows = summary.rows;

            // Adiciona tabela
            if (typeof doc.autoTable === "function") {
                doc.autoTable({
                    head: [columns],
                    body: rows,
                    startY: 30,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [31, 111, 235] },
                    columnStyles: this.createColumnStyles(columns.length)
                });
            }

            // Adiciona resumo anual
            doc.setFontSize(12);
            doc.text(`Total geral do ano: ${Utils.formatCurrency(summary.total)}`, 
                    10, doc.lastAutoTable.finalY + 10);

            // Salva arquivo
            doc.save(`Relatorio_Anual_${year}.pdf`);
            
            this.logExport('PDF Anual', data.length);
            eventBus.publish('exportCompleted', { format: 'PDF', type: 'annual', count: data.length });
            return true;

        } catch (error) {
            console.error('Erro ao gerar PDF anual:', error);
            this.showError('Erro ao gerar relatório anual PDF');
            return false;
        }
    }

    /**
     * Gera resumo anual para relatório
     * @param {Array} data - Dados completos
     * @param {string} year - Ano do relatório
     * @returns {Object} Resumo organizado
     */
    generateAnnualSummary(data, year) {
        const yearData = data.filter(item => item.data.startsWith(year));
        const monthsSet = new Set();
        const namesSet = new Set();

        // Coleta meses e nomes únicos
        yearData.forEach(item => {
            if (item.data.startsWith(year)) {
                monthsSet.add(item.data.slice(5, 7));
                namesSet.add(item.nome);
            }
        });

        const months = Array.from(monthsSet).sort();
        const names = Utils.sortAlphabetically(Array.from(namesSet));

        // Calcula totais
        const totals = {};
        names.forEach(name => {
            totals[name] = { total: 0 };
            months.forEach(month => {
                totals[name][month] = 0;
            });
        });

        yearData.forEach(item => {
            const month = item.data.slice(5, 7);
            totals[item.nome][month] += item.valor;
            totals[item.nome].total += item.valor;
        });

        // Prepara linhas para tabela
        const rows = names.map(name => {
            const row = [name];
            months.forEach(month => {
                row.push(Utils.formatCurrency(totals[name][month]));
            });
            row.push(Utils.formatCurrency(totals[name].total));
            return row;
        });

        const totalYear = yearData.reduce((sum, item) => sum + item.valor, 0);

        return {
            months: months.map(m => `${m}/${year}`),
            rows,
            total: totalYear
        };
    }

    /**
     * Importa dados de arquivo CSV
     * @param {File} file - Arquivo CSV
     * @returns {Promise} Promise com resultado da importação
     */
    importFromCSV(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Nenhum arquivo selecionado'));
                return;
            }

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        const importedData = this.processImportedData(results.data);
                        resolve(importedData);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error(`Erro ao ler CSV: ${error.message}`));
                }
            });
        });
    }

    /**
     * Processa dados importados
     * @param {Array} rawData - Dados brutos do CSV
     * @returns {Object} Resultado do processamento
     */
    processImportedData(rawData) {
        const currentData = dataManager.loadData();
        const newData = [...currentData];
        let added = 0;
        let skipped = 0;
        const errors = [];

        rawData.forEach((row, index) => {
            try {
                const nome = (row.nome || row.Nome || row.NOME || '').trim();
                const dataStr = (row.data || row.Data || row.DATA || '').trim();
                const valorRaw = row.valor || row.Valor || row.VALOR || row.value || row.Value || 0;
                const historico = (row.historico || row.Histórico || row.HISTORICO || '').trim();

                if (!nome || !dataStr) {
                    skipped++;
                    return;
                }

                const valor = Utils.parseNumber(valorRaw);
                if (isNaN(valor) || valor <= 0) {
                    errors.push(`Linha ${index + 1}: Valor inválido`);
                    return;
                }

                if (!Utils.isValidDate(dataStr)) {
                    errors.push(`Linha ${index + 1}: Data inválida`);
                    return;
                }

                // Normaliza nome mantendo caixa existente
                const nomeNormalizado = dataManager.normalizeNome(nome, newData);

                newData.push({
                    id: dataManager.generateNextId(newData),
                    nome: nomeNormalizado,
                    data: dataStr,
                    valor: Number(valor.toFixed(2)),
                    historico,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                added++;

            } catch (error) {
                errors.push(`Linha ${index + 1}: ${error.message}`);
            }
        });

        if (added > 0) {
            dataManager.saveData(newData);
        }

        return {
            added,
            skipped,
            errors,
            total: newData.length
        };
    }

/**
 * Faz backup completo - VERSÃO SUPER SIMPLES
 */
backupAndClose() {
    const data = dataManager.loadData();
    
    if (data.length === 0) {
        if (!confirm("Nenhum dado registrado. Deseja mesmo fechar?")) return;
    } else {
        if (!confirm(`Gerar backup completo (CSV + XLSX) e fechar?\n\nRegistros: ${data.length}\nTotal: ${Utils.formatCurrency(data.reduce((s, x) => s + x.valor, 0))}`)) return;
        
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        // CSV IMEDIATO
        this.simpleCSV(data, `backup_${timestamp}.csv`);
        
        // XLSX com delay
        setTimeout(() => {
            this.simpleXLSX(data, `backup_${timestamp}.xlsx`);
        }, 500);
        
        alert(`Backup iniciado! Arquivos:\nbackup_${timestamp}.csv\nbackup_${timestamp}.xlsx\n\nFechando em 3 segundos...`);
    }
    
    setTimeout(() => window.close(), 3000);
}

/**
 * CSV simples e direto
 */
simpleCSV(data, filename) {
    const rows = [['ID', 'Nome', 'Data', 'Valor', 'Histórico'].join(',')];
    data.forEach(item => {
        rows.push([item.id, `"${item.nome}"`, item.data, item.valor, `"${item.historico || ''}"`].join(','));
    });
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

/**
 * XLSX simples e direto
 */
simpleXLSX(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pagamentos');
    XLSX.writeFile(wb, filename);
}

    // Métodos auxiliares
    validateData(data, showAlert = true) {
        if (!data || data.length === 0) {
            if (showAlert) {
                this.showWarning('Sem dados para exportar com os filtros atuais.');
            }
            return false;
        }
        return true;
    }

    escapeCSV(value) {
        if (value == null) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }

    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    getFormattedDate() {
        return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    }

    addPDFHeader(doc, title) {
        doc.setFontSize(16);
        doc.text(title, 10, 15);
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, 23);
    }

    addPDFSummary(doc, data) {
        const total = data.reduce((sum, item) => sum + item.valor, 0);
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40;
        
        doc.setFontSize(12);
        doc.text(`Total: ${Utils.formatCurrency(total)}`, 10, finalY);
        doc.text(`Quantidade: ${data.length} registros`, 10, finalY + 7);
    }

    createColumnStyles(columnCount) {
        const styles = {};
        // Coluna do nome mais larga
        styles[0] = { cellWidth: 'auto' };
        // Colunas de valores alinhadas à direita
        for (let i = 1; i < columnCount; i++) {
            styles[i] = { halign: 'right' };
        }
        return styles;
    }

    logExport(format, count) {
        this.exportHistory.unshift({
            format,
            count,
            timestamp: new Date().toISOString()
        });
        
        // Mantém histórico limitado
        if (this.exportHistory.length > 50) {
            this.exportHistory = this.exportHistory.slice(0, 50);
        }
    }

    showSuccess(message) {
        eventBus.publish('showToast', { message, type: 'success' });
    }

    showError(message) {
        eventBus.publish('showToast', { message, type: 'error' });
    }

    showWarning(message) {
        eventBus.publish('showToast', { message, type: 'warning' });
    }

    showInfo(message) {
        eventBus.publish('showToast', { message, type: 'info' });
    }
}

// Instância global do ExportManager
window.exportManager = new ExportManager();