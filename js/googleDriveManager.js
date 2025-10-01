/**
 * Gerenciamento do Google Drive - VERSÃO REAL
 */

class GoogleDriveManager {
    constructor() {
        this.CLIENT_ID = '164615992004-s5tp4ire88o3f1ivinnk6uco1b2u1rj7.apps.googleusercontent.com'; // ← SUBSTITUA pelo seu Client ID
        this.API_KEY = ''; // Não necessário para OAuth
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        this.discoveryDocs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
        
        this.isInitialized = false;
        this.isAuthenticated = false;
        this.tokenClient = null;
        
        console.log('🚀 GoogleDriveManager (Modo Real) iniciado');
        
        // Bind das funções
        this.handleAuthCallback = this.handleAuthCallback.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.showToast = this.showToast.bind(this);
        
        this.initializeGoogleAPI();
    }

    /**
     * Inicialização das APIs do Google
     */
    initializeGoogleAPI() {
        // Verifica se as APIs já estão carregadas
        if (window.gapi && window.google) {
            this.initGAPI();
            this.initGIS();
            return;
        }

        this.loadGoogleScripts();
    }

    /**
     * Carrega scripts do Google
     */
    loadGoogleScripts() {
        console.log('📚 Carregando bibliotecas do Google...');

        // Carrega GAPI
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
            console.log('✅ GAPI carregado');
            gapi.load('client', this.initGAPI.bind(this));
        };
        gapiScript.onerror = () => {
            console.error('❌ Erro ao carregar GAPI');
            this.showToast('Erro ao carregar Google APIs', 'error');
            this.fallbackToSimulation();
        };
        document.head.appendChild(gapiScript);

        // Carrega GIS
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.onload = this.initGIS.bind(this);
        gisScript.onerror = () => {
            console.error('❌ Erro ao carregar GIS');
            this.showToast('Erro ao carregar Google Identity', 'error');
            this.fallbackToSimulation();
        };
        document.head.appendChild(gisScript);
    }

    /**
     * Fallback para modo simulação se houver erro
     */
    fallbackToSimulation() {
        console.log('🔄 Ativando modo simulação como fallback');
        this.isInitialized = true;
        this.updateUI();
        this.showToast('Usando modo simulação do Google Drive', 'warning');
    }

    /**
     * Inicializa GAPI
     */
    async initGAPI() {
        try {
            await gapi.client.init({
                apiKey: this.API_KEY,
                discoveryDocs: this.discoveryDocs,
            });
            this.isInitialized = true;
            console.log('✅ GAPI inicializado');
            this.updateUI();
        } catch (error) {
            console.warn('⚠️ GAPI não inicializado:', error);
            this.fallbackToSimulation();
        }
    }

    /**
     * Inicializa GIS
     */
    initGIS() {
        try {
            if (!this.CLIENT_ID || this.CLIENT_ID === 'SEU_CLIENT_ID_AQUI') {
                console.warn('⚠️ Client ID não configurado');
                this.fallbackToSimulation();
                return;
            }

            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: this.handleAuthCallback,
                error_callback: (error) => {
                    console.error('❌ Erro de autenticação:', error);
                    this.showToast('Erro na autenticação do Google Drive', 'error');
                }
            });
            console.log('✅ GIS inicializado');
            this.updateUI();
        } catch (error) {
            console.error('❌ Erro ao inicializar GIS:', error);
            this.fallbackToSimulation();
        }
    }

    /**
     * Callback de autenticação
     */
    handleAuthCallback(response) {
        if (response.error) {
            console.error('❌ Erro de autenticação:', response.error);
            
            if (response.error === 'popup_closed_by_user') {
                this.showToast('Autenticação cancelada', 'warning');
            } else {
                this.showToast('Erro na autenticação: ' + response.error, 'error');
            }
            return;
        }
        
        this.isAuthenticated = true;
        this.showToast('✅ Conectado ao Google Drive!', 'success');
        this.updateUI();
    }

    /**
     * Autenticação real com Google Drive
     */
    async authenticate() {
        return new Promise((resolve, reject) => {
            if (this.isAuthenticated) {
                resolve(true);
                return;
            }

            if (!this.tokenClient) {
                this.showToast('Google Drive não disponível', 'error');
                reject(new Error('Google Drive não inicializado'));
                return;
            }

            try {
                // Verifica se já tem token
                const token = gapi.client.getToken();
                if (token !== null) {
                    this.isAuthenticated = true;
                    this.updateUI();
                    resolve(true);
                    return;
                }

                // Solicita novo token
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
                resolve(true); // A resolução real vem pelo callback
                
            } catch (error) {
                console.error('❌ Erro na autenticação:', error);
                this.showToast('Erro ao conectar com Google Drive', 'error');
                reject(error);
            }
        });
    }

    /**
     * Backup real no Google Drive
     */
    async saveToDrive(data, filename = 'backup_pagamentos.json') {
        // Verifica autenticação
        if (!this.isAuthenticated) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Não autenticado no Google Drive');
            }
        }

        try {
            console.log('💾 Salvando no Google Drive...');
            this.showToast('Salvando backup no Google Drive...', 'info');

            const fileContent = JSON.stringify({
                data: data,
                metadata: {
                    app: 'Controle de Pagamentos',
                    version: '1.0',
                    exportedAt: new Date().toISOString(),
                    recordCount: data.length,
                    totalValue: data.reduce((sum, item) => sum + item.valor, 0)
                }
            }, null, 2);

            // Procura arquivo existente
            const existingFile = await this.findFile(filename);
            
            let fileId;
            if (existingFile) {
                // Atualiza arquivo existente
                console.log('📝 Atualizando arquivo existente:', existingFile.id);
                fileId = await this.updateFile(existingFile.id, fileContent);
                this.showToast('✅ Backup atualizado no Google Drive!', 'success');
            } else {
                // Cria novo arquivo
                console.log('🆕 Criando novo arquivo');
                fileId = await this.createFile(filename, fileContent);
                this.showToast('✅ Backup salvo no Google Drive!', 'success');
            }

            return fileId;

        } catch (error) {
            console.error('❌ Erro ao salvar no Google Drive:', error);
            
            if (error.status === 403) {
                this.showToast('Permissão negada. Faça login novamente.', 'error');
                this.logout();
            } else if (error.status === 401) {
                this.showToast('Sessão expirada. Faça login novamente.', 'error');
                this.logout();
            } else {
                this.showToast('Erro ao salvar no Google Drive: ' + error.message, 'error');
            }
            
            throw error;
        }
    }

    /**
     * Busca arquivo no Google Drive
     */
    async findFile(filename) {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${filename}' and trashed=false`,
                fields: 'files(id, name, modifiedTime)',
                spaces: 'drive',
            });
            
            return response.result.files[0] || null;
        } catch (error) {
            console.error('❌ Erro ao buscar arquivo:', error);
            throw error;
        }
    }

    /**
     * Cria novo arquivo no Google Drive
     */
    async createFile(filename, content) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        
        const metadata = {
            'name': filename,
            'mimeType': 'application/json',
            'description': 'Backup do Controle de Pagamentos'
        };
        
        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            content +
            close_delim;
        
        const request = gapi.client.request({
            'path': '/upload/drive/v3/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });
        
        const response = await request;
        return response.result.id;
    }

    /**
     * Atualiza arquivo existente no Google Drive
     */
    async updateFile(fileId, content) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        
        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify({}) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            content +
            close_delim;
        
        const request = gapi.client.request({
            'path': `/upload/drive/v3/files/${fileId}`,
            'method': 'PATCH',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });
        
        const response = await request;
        return response.result.id;
    }

    /**
     * Carrega backup do Google Drive
     */
    async loadFromDrive(filename = 'backup_pagamentos.json') {
        // Verifica autenticação
        if (!this.isAuthenticated) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Não autenticado no Google Drive');
            }
        }

        try {
            console.log('📥 Carregando do Google Drive...');
            this.showToast('Carregando backup do Google Drive...', 'info');

            const file = await this.findFile(filename);
            if (!file) {
                this.showToast('Arquivo de backup não encontrado no Google Drive', 'warning');
                return null;
            }

            const response = await gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });

            const backupData = response.result;
            
            if (!backupData.data || !Array.isArray(backupData.data)) {
                throw new Error('Formato de arquivo de backup inválido');
            }

            this.showToast(`✅ Backup carregado! ${backupData.data.length} registros.`, 'success');
            return backupData.data;

        } catch (error) {
            console.error('❌ Erro ao carregar do Google Drive:', error);
            
            if (error.status === 404) {
                this.showToast('Arquivo de backup não encontrado', 'error');
            } else if (error.status === 403 || error.status === 401) {
                this.showToast('Permissão negada. Faça login novamente.', 'error');
                this.logout();
            } else {
                this.showToast('Erro ao carregar do Google Drive: ' + error.message, 'error');
            }
            
            throw error;
        }
    }

    /**
     * Logout do Google Drive
     */
    logout() {
        console.log('🚪 Executando logout...');
        
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken(null);
        }
        
        this.isAuthenticated = false;
        this.showToast('Desconectado do Google Drive', 'info');
        this.updateUI();
    }

    /**
     * Atualiza interface
     */
    updateUI() {
        if (window.eventBus) {
            eventBus.publish('googleDriveStatus', {
                initialized: this.isInitialized,
                authenticated: this.isAuthenticated,
                isReal: this.CLIENT_ID && this.CLIENT_ID !== 'SEU_CLIENT_ID_AQUI'
            });
        }
    }

    /**
     * Mostra notificação
     */
    showToast(message, type = 'info') {
        if (window.eventBus) {
            eventBus.publish('showToast', { message, type });
        }
    }

    /**
     * Status do serviço
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isAuthenticated: this.isAuthenticated,
            isReal: this.CLIENT_ID && this.CLIENT_ID !== 'SEU_CLIENT_ID_AQUI',
            clientIdConfigured: !!this.CLIENT_ID && this.CLIENT_ID !== 'SEU_CLIENT_ID_AQUI'
        };
    }
}

// Instância global
window.googleDriveManager = new GoogleDriveManager();