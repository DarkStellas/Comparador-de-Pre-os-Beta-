let cardcontainer = document.querySelector('.card-container');
let inputBusca = document.querySelector('#input-busca');
let priceUpdateInterval = null; // Variável para controlar o intervalo de atualização de preços
const detailsPanel = document.getElementById('details-panel');
const detailsContent = document.getElementById('details-content');
const closeDetailsBtn = document.getElementById('close-details-btn');
let dados = [];

// Carrega os dados do JSON uma vez quando a página é carregada
window.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    RenderisarCards(dados);
    popularFiltrosCPU();
    popularFiltrosGPU();

    // Adiciona o evento para fechar o painel
    closeDetailsBtn.addEventListener('click', fecharDetalhes);
});

async function carregarDados() {
    try {
        let resposta = await fetch('Dados.json');
        dados = await resposta.json();
    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
    }
}

async function iniciarBusca() {
    let termoBusca = inputBusca.value.toLowerCase();

    let dadosFiltrados = dados.filter(dado => {
        const fabricante = dado.Fabricante.toLowerCase();
        if (dado.Categoria === 'GPU') {
            return dado.GPU.toLowerCase().includes(termoBusca) ||
                   fabricante.includes(termoBusca) ||
                   (dado.Quantidade && dado.Quantidade.toLowerCase().includes(termoBusca)) ||
                   (dado.Tipo && dado.Tipo.toLowerCase().includes(termoBusca));
        } else if (dado.Categoria === 'CPU') {
            return dado.CPU.toLowerCase().includes(termoBusca) ||
                   fabricante.includes(termoBusca) ||
                   dado.Compatibilidade.toLowerCase().includes(termoBusca);
        }
        return false; // Para outras categorias, adicione a lógica aqui
    });

    RenderisarCards(dadosFiltrados);
}

function toggleGpuFilters() {
    const subFilters = document.getElementById('gpu-sub-filters');
    subFilters.classList.toggle('hidden');
    if (!document.getElementById('cpu-sub-filters').classList.contains('hidden')) {
        document.getElementById('cpu-sub-filters').classList.add('hidden'); // Garante que o outro painel feche
    }

    // Se o painel for aberto, mostra todas as GPUs. Se for fechado, mostra tudo.
    if (!subFilters.classList.contains('hidden')) {
        aplicarFiltrosGPU(); // Aplica o filtro (que inicialmente é "todos")
    } else {
        RenderisarCards(dados); // Mostra todos os dados
    }
}

function toggleCpuFilters() {
    const subFilters = document.getElementById('cpu-sub-filters');
    subFilters.classList.toggle('hidden');
    document.getElementById('gpu-sub-filters').classList.add('hidden'); // Garante que o outro painel feche

    // Se o painel for aberto, mostra todas as CPUs. Se for fechado, mostra tudo.
    if (!subFilters.classList.contains('hidden')) {
        aplicarFiltrosCPU(); // Aplica o filtro (que inicialmente é "todos")
    } else {
        RenderisarCards(dados); // Mostra todos os dados
    }
}


function aplicarFiltrosGPU() {
    const fabricante = document.getElementById('fabricante-filter').value;
    const tipoMemoria = document.getElementById('tipo-memoria-filter').value;
    const quantidadeMemoria = document.getElementById('quantidade-memoria-filter').value;

    let dadosFiltrados = dados.filter(dado => {
        // Filtra apenas dentro da categoria GPU
        if (dado.Categoria !== 'GPU') {
            return false;
        }

        const atendeFabricante = fabricante === 'todos' || dado.Fabricante === fabricante;
        const atendeTipo = tipoMemoria === 'todos' || dado.Tipo === tipoMemoria;
        const atendeQuantidade = quantidadeMemoria === 'todos' || dado.Quantidade === quantidadeMemoria;

        return atendeFabricante && atendeTipo && atendeQuantidade;
    });

    RenderisarCards(dadosFiltrados);
}

function aplicarFiltrosCPU() {
    const fabricante = document.getElementById('cpu-fabricante-filter').value;

    let dadosFiltrados = dados.filter(dado => {
        // Filtra apenas dentro da categoria CPU
        if (dado.Categoria !== 'CPU') {
            return false;
        }

        const atendeFabricante = fabricante === 'todos' || dado.Fabricante === fabricante;

        return atendeFabricante;
    });

    RenderisarCards(dadosFiltrados);
}
 
// --- NOVA LÓGICA DE FILTROS INTELIGENTES E INTERDEPENDENTES ---

/**
 * Popula os filtros de GPU pela primeira vez quando a página carrega.
 */
function popularFiltrosGPU() {
    // Chama a função principal de atualização, que irá popular todos os filtros
    // com todas as opções disponíveis, já que inicialmente nada está selecionado.
    atualizarFiltrosGPU();
}

/**
 * Popula os filtros de CPU pela primeira vez quando a página carrega.
 */
function popularFiltrosCPU() {
    atualizarFiltrosCPU();
}

/**
 * Função que atualiza as opções dos filtros de CPU.
 * Por enquanto, apenas popula o fabricante. Pode ser expandida no futuro.
 */
function atualizarFiltrosCPU() {
    const cpus = dados.filter(d => d.Categoria === 'CPU');
    const fabricanteSel = document.getElementById('cpu-fabricante-filter').value || 'todos';

    const fabricantesPossiveis = [...new Set(cpus.map(cpu => cpu.Fabricante))];
    popularSelect('cpu-fabricante-filter', fabricantesPossiveis, fabricanteSel);

    aplicarFiltrosCPU();
}

/**
 * Função que atualiza as opções dos filtros de GPU de forma interdependente
 * e renderiza os cards filtrados. É chamada sempre que um dos filtros de GPU é alterado.
 */
function atualizarFiltrosGPU() {
    const gpus = dados.filter(d => d.Categoria === 'GPU');

    // 1. Pega os valores selecionados atualmente nos filtros
    const fabricanteSel = document.getElementById('fabricante-filter').value || 'todos';
    const tipoMemoriaSel = document.getElementById('tipo-memoria-filter').value || 'todos';
    const quantidadeMemoriaSel = document.getElementById('quantidade-memoria-filter').value || 'todos';

    // 2. Calcula as opções possíveis para cada filtro com base nas seleções dos outros
    // Opções de Fabricante: baseadas no tipo e quantidade selecionados
    const gpusParaFabricante = gpus.filter(gpu =>
        (tipoMemoriaSel === 'todos' || gpu.Tipo === tipoMemoriaSel) &&
        (quantidadeMemoriaSel === 'todos' || gpu.Quantidade === quantidadeMemoriaSel)
    );
    const fabricantesPossiveis = [...new Set(gpusParaFabricante.map(gpu => gpu.Fabricante))];
    popularSelect('fabricante-filter', fabricantesPossiveis, fabricanteSel);

    // Opções de Tipo de Memória: baseadas no fabricante e quantidade selecionados
    const gpusParaTipo = gpus.filter(gpu =>
        (fabricanteSel === 'todos' || gpu.Fabricante === fabricanteSel) &&
        (quantidadeMemoriaSel === 'todos' || gpu.Quantidade === quantidadeMemoriaSel)
    );
    const tiposPossiveis = [...new Set(gpusParaTipo.map(gpu => gpu.Tipo))];
    popularSelect('tipo-memoria-filter', tiposPossiveis, tipoMemoriaSel);

    // Opções de Quantidade: baseadas no fabricante e tipo selecionados
    const gpusParaQuantidade = gpus.filter(gpu =>
        (fabricanteSel === 'todos' || gpu.Fabricante === fabricanteSel) &&
        (tipoMemoriaSel === 'todos' || gpu.Tipo === tipoMemoriaSel)
    );
    const quantidadesPossiveis = [...new Set(gpusParaQuantidade.map(gpu => gpu.Quantidade))];
    popularSelect('quantidade-memoria-filter', quantidadesPossiveis, quantidadeMemoriaSel);

    // 3. Aplica o filtro final para renderizar os cards na tela
    aplicarFiltrosGPU();
}


/**
 * Limpa e preenche um elemento <select> com novas opções, mantendo a seleção anterior se possível.
 */
function popularSelect(selectId, items, valorAtual) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="todos">Todos</option>'; // Adiciona a opção padrão

    items.sort().forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });

    // Restaura o valor selecionado se ele ainda for uma opção válida, senão, volta para "Todos".
    select.value = items.includes(valorAtual) ? valorAtual : "todos";
}

function RenderisarCards(dados) {
    cardcontainer.innerHTML = ''; // Limpa os cards existentes
    for (let dado of dados) {
        let article = document.createElement('article');
        article.classList.add('card');
        article.addEventListener('click', () => mostrarDetalhes(dado)); // Adiciona o evento de clique

        // Verifica a categoria para usar o template correto
        if (dado.Categoria === 'GPU') {
            article.innerHTML = `<h2>${dado.GPU}</h2>
                    <p><strong>Fabricante:</strong> ${dado.Fabricante}</p>
                    <p><strong>Memória:</strong> ${dado.Quantidade} ${dado.Tipo}</p>`;
        } else if (dado.Categoria === 'CPU') {
            article.innerHTML = `<h2>${dado.CPU}</h2>
                    <p><strong>Fabricante:</strong> ${dado.Fabricante}</p>
                    <p><strong>Compatibilidade:</strong> ${dado.Compatibilidade}</p>
                    <p><strong>Núcleos/Threads:</strong> ${dado['quantidade de nucleos']} / ${dado.threads}</p>
                    <p><strong>Clock:</strong> ${dado.clock}</p>`;
        }
        // Você pode adicionar mais 'else if' para outras categorias no futuro

        cardcontainer.appendChild(article);
    }
}

/**
 * Mostra o painel de detalhes com as informações do item clicado.
 * @param {object} item O objeto de dados do produto (CPU ou GPU).
 */
function mostrarDetalhes(item) {
    // Limpa qualquer intervalo de atualização de preço anterior
    if (priceUpdateInterval) clearInterval(priceUpdateInterval);

    detailsContent.classList.remove('details-content-placeholder');
    detailsContent.innerHTML = ''; // Limpa o conteúdo anterior

    // Adiciona o título principal
    const title = document.createElement('h2');
    title.textContent = item.Categoria === 'GPU' ? item.GPU : item.CPU;
    detailsContent.appendChild(title);

    // Adiciona a imagem se a URL existir
    if (item.ImagemURL) {
        const img = document.createElement('img');
        img.src = item.ImagemURL;
        img.alt = `Imagem de ${item.GPU || item.CPU}`;
        img.classList.add('details-image');
        detailsContent.appendChild(img);
    }

    // Container para informações que podem ser atualizadas (pela seleção de versão)
    const infoContainer = document.createElement('div');
    infoContainer.id = 'dynamic-info-container';
    detailsContent.appendChild(infoContainer);

    // Container para as marcas parceiras (que é estático para o item)
    const brandsContainer = document.createElement('div');
    brandsContainer.id = 'gpu-interactive-filters'; // Renomeado para clareza
    detailsContent.appendChild(brandsContainer);

    // Lógica específica para GPU com seletor de versão
    if (item.Categoria === 'GPU') {
        // Se a GPU tiver o campo "Versoes"
        if (item.Versoes && item.Versoes.length > 0) {
            renderizarSeletorVersao(item, infoContainer, brandsContainer);

            // Inicia a cadeia de renderização
            const seletorVersao = document.getElementById('version-select');
            atualizarDetalhesVersao(item, seletorVersao.value, infoContainer);
            renderizarSeletorMarca(item); // Chama a próxima função na cadeia
        } else {
            // Se não houver versões, exibe os dados principais do item
            atualizarDetalhesVersao(item, -1, infoContainer);
            // Inicia a cadeia de filtros de marca mesmo sem o seletor de versão
            renderizarSeletorMarca(item);
        }
    } else if (item.Categoria === 'CPU') {
        // Para CPUs, apenas exibe os detalhes padrão
        atualizarDetalhesVersao(item, -1, infoContainer);

        // Exibe as marcas parceiras (fabricantes de placa-mãe) para CPUs
        if (item.MarcasParceiras && Array.isArray(item.MarcasParceiras)) {
            const brandTitle = 'Fabricantes de Placa-Mãe:';
            const brandsHTML = `
                <h3>${brandTitle}</h3>
                <div class="partner-brands-container">
                    ${item.MarcasParceiras.map(brand => `<span class="partner-brand-tag">${brand}</span>`).join('')}
                </div>
            `;
            // Coloca o HTML no container dos filtros interativos
            document.getElementById('gpu-interactive-filters').innerHTML = brandsHTML;
        }
    }

    // Adiciona a seção de links de lojas, se existir
    if (item.Lojas && Object.keys(item.Lojas).length > 0) {
        const storesContainer = document.createElement('div');
        storesContainer.className = 'details-stores-container';

        let storesHTML = '<h3>Onde Comprar:</h3><ul class="stores-list">';
        for (const loja in item.Lojas) {
            storesHTML += `<li><a href="${item.Lojas[loja]}" target="_blank">${loja}</a></li>`;
        }
        storesHTML += '</ul>';

        storesContainer.innerHTML = storesHTML;
        detailsContent.appendChild(storesContainer);
    }


    detailsPanel.classList.add('visible'); // Torna o painel visível
    document.body.classList.add('panel-open'); // Adiciona classe ao body
}

function renderizarSeletorVersao(item, infoContainer, brandsContainer) {
    const selectorHTML = `
        <div class="details-version-selector">
            <label for="version-select">Selecione a Versão:</label>
            <select id="version-select">
                ${item.Versoes.map((v, index) => `<option value="${index}">${v.Nome}</option>`).join('')}
            </select>
        </div>
    `;
    brandsContainer.innerHTML = selectorHTML;

    const versionSelect = document.getElementById('version-select');
    versionSelect.addEventListener('change', () => {
        atualizarDetalhesVersao(item, versionSelect.value, infoContainer);
        renderizarSeletorMarca(item); // Renderiza o próximo seletor
    });
}

function renderizarSeletorMarca(item) {
    // Limpa seletores antigos de marca e fan
    const oldBrandSelector = document.getElementById('brand-selector-container');
    if (oldBrandSelector) oldBrandSelector.remove();
    const oldFanSelector = document.getElementById('fan-selector-container');
    if (oldFanSelector) oldFanSelector.remove();
    const oldProductLines = document.getElementById('product-lines-container');
    if (oldProductLines) oldProductLines.remove();

    const marcas = Object.keys(item.MarcasParceiras || {});
    if (marcas.length === 0) return;

    const container = document.createElement('div');
    container.id = 'brand-selector-container';
    container.className = 'details-brand-selector';

    // Cria os botões "chip" para cada marca
    container.innerHTML = `
        <label>Selecione a Marca:</label>
        <div class="brand-chips-container">
            ${marcas.map(marca => `<button class="brand-chip" data-brand="${marca}">${marca}</button>`).join('')}
        </div>
    `;

    document.getElementById('gpu-interactive-filters').appendChild(container);

    const brandChips = container.querySelectorAll('.brand-chip');
    brandChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove a classe 'active' de todos os chips
            brandChips.forEach(c => c.classList.remove('active'));
            // Adiciona a classe 'active' ao chip clicado
            chip.classList.add('active');
            // Renderiza o próximo seletor com base na marca selecionada
            renderizarSeletorFan(item, chip.dataset.brand);
        });
    });

    // Ativa o primeiro chip e inicia a renderização do próximo nível
    if (brandChips.length > 0) {
        brandChips[0].classList.add('active');
    }
    renderizarSeletorFan(item, marcas[0]);
}

function renderizarSeletorFan(item, marcaSelecionada) {
    // Limpa seletores antigos de fan e linhas de produto
    const oldFanSelector = document.getElementById('fan-selector-container');
    if (oldFanSelector) oldFanSelector.remove();
    const oldProductLines = document.getElementById('product-lines-container');
    if (oldProductLines) oldProductLines.remove();

    const fanOptions = Object.keys(item.MarcasParceiras[marcaSelecionada] || {});
    if (fanOptions.length === 0) return;

    const container = document.createElement('div');
    container.id = 'fan-selector-container';
    container.className = 'details-fan-selector';

    container.innerHTML = `
        <label for="fan-select">Configuração de Fans:</label>
        <select id="fan-select">
            ${fanOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
    `;

    document.getElementById('gpu-interactive-filters').appendChild(container);

    const fanSelect = document.getElementById('fan-select');
    fanSelect.addEventListener('change', () => {
        renderizarSeletorLinhaProduto(item, marcaSelecionada, fanSelect.value);
    });

    // Renderiza as linhas de produto para a primeira opção de fan
    renderizarSeletorLinhaProduto(item, marcaSelecionada, fanOptions[0]);
}

function renderizarSeletorLinhaProduto(item, marca, fans) {
    const oldContainer = document.getElementById('product-lines-container');
    if (oldContainer) oldContainer.remove();

    const linhas = item.MarcasParceiras[marca]?.[fans] || [];
    if (linhas.length === 0) return;

    const container = document.createElement('div');
    container.id = 'product-lines-container';
    container.className = 'details-line-selector';
    container.innerHTML = `
        <label for="line-select">Linha do Produto:</label>
        <select id="line-select">
            ${linhas.map(linha => `<option value="${typeof linha === 'object' ? linha.Nome : linha}">${typeof linha === 'object' ? linha.Nome : linha}</option>`).join('')}
        </select>
    `;
    document.getElementById('gpu-interactive-filters').appendChild(container);

    // Adiciona o listener para atualizar o preço quando a linha mudar
    document.getElementById('line-select').addEventListener('change', () => atualizarPrecoGPU(item));
    atualizarPrecoGPU(item); // Chama para exibir o preço inicial
}

/**
 * Esconde o painel de detalhes.
 */
function fecharDetalhes() {
    // Limpa o intervalo de atualização de preço ao fechar o painel
    if (priceUpdateInterval) clearInterval(priceUpdateInterval);

    detailsPanel.classList.remove('visible');
    document.body.classList.remove('panel-open'); // Remove classe do body
}

/**
 * Atualiza o conteúdo do painel de detalhes com base na versão selecionada.
 * @param {object} item O objeto de dados completo do produto.
 * @param {number} versaoIndex O índice da versão selecionada. Se for -1, usa o item principal.
 * @param {HTMLElement} container O elemento HTML onde as informações serão renderizadas.
 */
function atualizarDetalhesVersao(item, versaoIndex, container) {
    let infoHTML = '';
    // Se versaoIndex for válido e existir, pega os dados da versão, senão, usa os dados do item principal
    const dadosParaExibir = (versaoIndex >= 0 && item.Versoes) ? item.Versoes[versaoIndex] : item;

    if (item.Categoria === 'GPU') {
        infoHTML = `
            <p><strong>Categoria:</strong> ${item.Categoria}</p>
            <p><strong>Fabricante:</strong> ${item.Fabricante}</p>
            <p><strong>Memória:</strong> ${dadosParaExibir.Quantidade}</p>
            <p><strong>Tipo de Memória:</strong> ${dadosParaExibir.Tipo}</p>
        `;
    } else if (item.Categoria === 'CPU') {
        infoHTML = `
            <p><strong>Categoria:</strong> ${item.Categoria}</p>
            <p><strong>Fabricante:</strong> ${item.Fabricante}</p>
            <p><strong>Soquete:</strong> ${item.Compatibilidade}</p>
            <p><strong>Núcleos / Threads:</strong> ${item['quantidade de nucleos']} / ${item.threads}</p>
            <p><strong>Clock:</strong> ${item.clock}</p>
        `;
    }

    container.innerHTML = infoHTML;
}

/**
 * Busca os valores selecionados nos filtros de GPU e exibe o preço correspondente.
 * Esta função é chamada sempre que uma seleção que afeta o preço é alterada.
 * @param {object} item O objeto de dados completo do produto.
 */
function atualizarPrecoGPU(item) {
    // Remove o container de preço antigo, se existir
    const oldPriceContainer = document.getElementById('price-container');
    if (oldPriceContainer) oldPriceContainer.remove();

    // Busca os elementos dos seletores
    const marcaChipAtivo = document.querySelector('.brand-chip.active');
    const fanSelect = document.getElementById('fan-select');
    const lineSelect = document.getElementById('line-select');

    // Se algum dos seletores não existir, não faz nada
    if (!marcaChipAtivo || !fanSelect || !lineSelect) return;

    const marca = marcaChipAtivo.dataset.brand;
    const fans = fanSelect.value;
    const linhaNome = lineSelect.value;

    const linhas = item.MarcasParceiras[marca]?.[fans] || [];
    const linhaProduto = linhas.find(l => (typeof l === 'object' ? l.Nome : l) === linhaNome);

    // Verifica se a linha de produto é um objeto e se tem a propriedade 'Preco'
    if (typeof linhaProduto === 'object' && (linhaProduto.Lojas || linhaProduto.PrecoRecomendado)) {
        const priceContainer = document.createElement('div');
        priceContainer.id = 'price-container';
        priceContainer.className = 'details-price-container';

        let pricesHTML = '';

        // Adiciona o Preço Recomendado, se existir
        if (linhaProduto.PrecoRecomendado) {
            pricesHTML += `
                <div class="recommended-price">
                    <span>Preço Recomendado:</span>
                    <strong>${linhaProduto.PrecoRecomendado}</strong>
                </div>
            `;
        }

        // Adiciona os Preços Atuais das lojas, se existirem
        if (linhaProduto.Lojas) {
            pricesHTML += '<h4>Preços Atuais:</h4><ul class="price-list">';
            for (const loja in linhaProduto.Lojas) {
                const infoLoja = linhaProduto.Lojas[loja];
                pricesHTML += `
                    <li>
                        <a href="${infoLoja.UrlProduto}" target="_blank">
                            ${loja}: <strong data-loja="${loja}">${infoLoja.PrecoAtual}</strong>
                        </a>
                    </li>`;
            }
            pricesHTML += '</ul>';
        }

        priceContainer.innerHTML = pricesHTML;
        document.getElementById('gpu-interactive-filters').appendChild(priceContainer);

        // Inicia a simulação de atualização de preços
        iniciarSimuladorDePrecos(linhaProduto);
    }
}

/**
 * SIMULAÇÃO: Atualiza os preços na tela a cada X minutos.
 * No futuro, aqui entraria a chamada para a sua API de scraping.
 */
function iniciarSimuladorDePrecos(linhaProduto) {
    // Limpa o intervalo anterior para não ter múltiplos rodando
    if (priceUpdateInterval) clearInterval(priceUpdateInterval);

    const DEZ_MINUTOS = 10 * 60 * 1000; // 600000

    const fetchAndUpdatePrices = async () => {
        console.log("Requisitando preços atualizados do nosso backend...");
        try {
            // --- ESTA É A PARTE QUE MUDARIA ---
            // No futuro, você faria uma chamada real para a sua API de backend.
            // O backend, por sua vez, chamaria a API do Google.
            const response = await fetch(`/api/get-prices?product=${encodeURIComponent(linhaProduto.Nome)}`);
            if (!response.ok) throw new Error('Falha ao buscar preços do backend.');

            const precosAtuais = await response.json(); // Ex: { "Pichau": "R$ 15.450,00", "Kabum": "R$ 15.550,00" }

            // Atualiza os preços na tela com os dados recebidos do backend
            for (const loja in precosAtuais) {
                const elPreco = document.querySelector(`.price-list strong[data-loja="${loja}"]`);
                if (elPreco && elPreco.textContent !== precosAtuais[loja]) {
                    elPreco.textContent = precosAtuais[loja];
                    elPreco.classList.add('price-updated');
                    setTimeout(() => elPreco.classList.remove('price-updated'), 1000);
                }
            }

        } catch (error) {
            console.error("Erro ao buscar preços:", error);
            // Aqui você poderia, por exemplo, parar de tentar atualizar ou mostrar uma mensagem de erro.
        }
    };

    // Executa uma vez imediatamente e depois a cada 10 minutos
    // fetchAndUpdatePrices(); // Comentado por enquanto, pois a API não existe.
    priceUpdateInterval = setInterval(fetchAndUpdatePrices, DEZ_MINUTOS);
}