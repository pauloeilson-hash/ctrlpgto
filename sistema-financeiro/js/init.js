// js/init.js - Carregamento com verificações
console.log('🚀 Iniciando carregamento da aplicação...');

const scripts = [
    { src: 'js/utils.js', name: 'Utils' },
    { src: 'js/eventBus.js', name: 'eventBus' },
    { src: 'js/dataManager.js', name: 'dataManager' },
    { src: 'js/exportManager.js', name: 'exportManager' },
    { src: 'js/googleDriveManager.js', name: 'googleDriveManager' },
    { src: 'js/darkModeManager.js', name: 'darkModeManager' },
    { src: 'js/uiComponents.js', name: 'UIComponents' },
    { src: 'js/app.js', name: 'PagamentosApp' }
];

let currentScript = 0;

function loadNextScript() {
    if (currentScript >= scripts.length) {
        console.log('✅ Todos os scripts carregados, verificando...');
        verifyDependencies();
        return;
    }

    const scriptInfo = scripts[currentScript];
    console.log(`📦 Carregando ${scriptInfo.src}...`);

    const script = document.createElement('script');
    script.src = scriptInfo.src;
    
    script.onload = () => {
        console.log(`✅ ${scriptInfo.src} carregado`);
        
        // Verifica se o módulo foi definido
        if (scriptInfo.name && typeof window[scriptInfo.name] === 'undefined') {
            console.warn(`⚠️ ${scriptInfo.name} não foi definido globalmente em ${scriptInfo.src}`);
        }
        
        currentScript++;
        setTimeout(loadNextScript, 100);
    };
    
    script.onerror = () => {
        console.error(`❌ FALHA ao carregar ${scriptInfo.src}`);
        currentScript++;
        setTimeout(loadNextScript, 100);
    };
    
    document.head.appendChild(script);
}

function verifyDependencies() {
    console.log('🔍 Verificando dependências...');
    
    const dependencies = {
        'Utils': () => typeof Utils !== 'undefined',
        'eventBus': () => typeof eventBus !== 'undefined',
        'dataManager': () => typeof dataManager !== 'undefined',
        'exportManager': () => typeof exportManager !== 'undefined',
        'darkModeManager': () => typeof darkModeManager !== 'undefined',
        'PagamentosApp': () => typeof PagamentosApp !== 'undefined'
    };

    const missing = [];
    const available = [];

    Object.entries(dependencies).forEach(([name, check]) => {
        if (check()) {
            available.push(name);
        } else {
            missing.push(name);
        }
    });

    console.log('✅ Disponíveis:', available);
    console.log('❌ Faltantes:', missing);

    if (missing.length > 0) {
        console.error('❌ Dependências faltantes:', missing);
        showError(`Módulos não carregados: ${missing.join(', ')}`);
        return;
    }

    initializeApp();
}

function initializeApp() {
    console.log('🎯 Inicializando aplicação...');
    
    try {
        const app = new PagamentosApp();
        app.initialize();
        window.app = app;
        console.log('🎉 Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showError(`Erro na inicialização: ${error.message}`);
    }
}

function showError(message) {
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
        font-size: 14px;
    `;
    errorDiv.innerHTML = `
        <h3>🚨 Erro ao Carregar</h3>
        <p>${message}</p>
        <p style="font-size: 12px; opacity: 0.8;">Verifique o console para detalhes</p>
        <button onclick="location.reload()" 
                style="background: white; color: #d32f2f; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px;">
            🔄 Recarregar
        </button>
    `;
    document.body.appendChild(errorDiv);
}

// Inicia o carregamento
loadNextScript();