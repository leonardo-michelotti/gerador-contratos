// Array para armazenar os postos
let postos = [];

// Meses em português
const mesesPt = [
    "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    preencherDataAssinatura();
    aplicarMascaras();
    
    // Event listener para checkbox de data
    const usarDataHoje = document.getElementById('usar_data_hoje');
    if (usarDataHoje) {
        usarDataHoje.addEventListener('change', function() {
            const dataPersonalizada = document.getElementById('data_personalizada');
            if (this.checked) {
                dataPersonalizada.style.display = 'none';
                preencherDataAssinatura();
            } else {
                dataPersonalizada.style.display = 'grid';
            }
        });
    }

    // Event listeners para modais
    setupModalEvents();
});

function aplicarMascaras() {
    // Máscara para CPF
    const cpfInputs = ['cliente_cpf', 'testemunha_1_cpf', 'testemunha_2_cpf'];
    cpfInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function(e) {
                e.target.value = formatarCPF(e.target.value);
            });
        }
    });

    // Máscara para telefone
    const telefoneElement = document.getElementById('cliente_telefone');
    if (telefoneElement) {
        telefoneElement.addEventListener('input', function(e) {
            e.target.value = formatarTelefone(e.target.value);
        });
    }

    // Máscara para CEP
    const cepElement = document.getElementById('cliente_cep');
    if (cepElement) {
        cepElement.addEventListener('input', function(e) {
            e.target.value = formatarCEP(e.target.value);
        });
    }

    // Máscara para valor monetário
    const valorElement = document.getElementById('valor_total');
    if (valorElement) {
        valorElement.addEventListener('input', function(e) {
            e.target.value = formatarMoeda(e.target.value);
        });
    }
}

function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return cpf;
}

function formatarTelefone(telefone) {
    telefone = telefone.replace(/\D/g, '');
    telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
    telefone = telefone.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    return telefone;
}

function formatarCEP(cep) {
    cep = cep.replace(/\D/g, '');
    cep = cep.replace(/(\d{5})(\d)/, '$1-$2');
    return cep;
}

function formatarMoeda(valor) {
    valor = valor.replace(/\D/g, '');
    if (valor === '') return '';
    valor = (parseInt(valor) / 100).toFixed(2);
    valor = valor.replace('.', ',');
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return valor;
}

function preencherDataAssinatura() {
    const hoje = new Date();
    const diaElement = document.getElementById('dia_assinatura');
    const mesElement = document.getElementById('mes_assinatura');
    const anoElement = document.getElementById('ano_assinatura');
    
    if (diaElement) diaElement.value = hoje.getDate().toString().padStart(2, '0');
    if (mesElement) mesElement.value = mesesPt[hoje.getMonth() + 1];
    if (anoElement) anoElement.value = hoje.getFullYear();
}

function adicionarPosto() {
    const qtdElement = document.getElementById('posto_qtd');
    const localElement = document.getElementById('posto_local');
    const escalaElement = document.getElementById('posto_escala');
    const horarioElement = document.getElementById('posto_horario');

    const qtd = qtdElement ? qtdElement.value : '';
    const local = localElement ? localElement.value.trim() : '';
    const escala = escalaElement ? escalaElement.value.trim() : '';
    const horario = horarioElement ? horarioElement.value.trim() : '';

    if (!qtd || !local) {
        showAlert('Quantidade e Local são obrigatórios!', 'error');
        return;
    }

    const posto = {
        quantidade: parseInt(qtd),
        local: local,
        escala: escala || 'Não informado',
        horario: horario || 'Não informado'
    };

    postos.push(posto);
    atualizarListaPostos();
    limparFormularioPosto();
    updateStatus(`Posto adicionado. Total: ${postos.length} posto(s)`);
}

function removerPosto(index) {
    if (confirm('Deseja remover este posto?')) {
        postos.splice(index, 1);
        atualizarListaPostos();
        updateStatus(`Posto removido. Total: ${postos.length} posto(s)`);
    }
}

function atualizarListaPostos() {
    const lista = document.getElementById('postosList');
    if (!lista) return;
    
    if (postos.length === 0) {
        lista.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Nenhum posto adicionado ainda</div>';
        return;
    }

    lista.innerHTML = postos.map((posto, index) => `
        <div class="posto-item">
            <div class="posto-info">
                <strong>${posto.quantidade} vigilante(s)</strong><br>
                <strong>Local:</strong> ${posto.local}<br>
                <strong>Escala:</strong> ${posto.escala}<br>
                <strong>Horário:</strong> ${posto.horario}
            </div>
            <div class="posto-actions">
                <button class="btn btn-danger" onclick="removerPosto(${index})">
                    REMOVER
                </button>
            </div>
        </div>
    `).join('');
}

function limparFormularioPosto() {
    const campos = ['posto_qtd', 'posto_local', 'posto_escala', 'posto_horario'];
    campos.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
}

function limparFormulario() {
    if (!confirm('Deseja realmente limpar todos os campos?')) {
        return;
    }

    // Limpar todos os campos do formulário
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="date"]');
    inputs.forEach(input => input.value = '');

    const selects = document.querySelectorAll('select');
    selects.forEach(select => select.selectedIndex = 0);

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.id === 'usar_data_hoje') {
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        }
    });

    // Limpar lista de postos
    postos = [];
    atualizarListaPostos();

    // Restaurar valores padrão
    const foroUf = document.getElementById('foro_uf');
    const cidadeAssinatura = document.getElementById('cidade_assinatura');
    const ufAssinatura = document.getElementById('uf_assinatura');
    
    if (foroUf) foroUf.value = 'RS';
    if (cidadeAssinatura) cidadeAssinatura.value = 'Santa Maria';
    if (ufAssinatura) ufAssinatura.value = 'RS';
    
    preencherDataAssinatura();
    updateStatus('Formulário limpo com sucesso');
    showAlert('Formulário limpo com sucesso!', 'success');
}

function validarFormulario() {
    const erros = [];

    // Campos obrigatórios
    const nomeCompleto = document.getElementById('cliente_nome_completo')?.value?.trim();
    const cpf = document.getElementById('cliente_cpf')?.value?.trim();
    const dataInicio = document.getElementById('data_inicio')?.value;
    const valorTotal = document.getElementById('valor_total')?.value?.trim();

    if (!nomeCompleto) erros.push('Nome completo é obrigatório');
    if (!cpf) erros.push('CPF é obrigatório');
    if (!dataInicio) erros.push('Data de início é obrigatória');
    if (!valorTotal) erros.push('Valor total é obrigatório');

    if (erros.length > 0) {
        showAlert('Erro de validação:\n\n' + erros.join('\n'), 'error');
        return false;
    }

    return true;
}

function coletarDadosFormulario() {
    return {
        // Dados do contratante
        cliente_nome_completo: getValue('cliente_nome_completo'),
        cliente_estado_civil: getValue('cliente_estado_civil'),
        cliente_cpf: getValue('cliente_cpf'),
        cliente_rg: getValue('cliente_rg'),
        cliente_email: getValue('cliente_email'),
        cliente_telefone: getValue('cliente_telefone'),
        cliente_logradouro: getValue('cliente_logradouro'),
        cliente_numero: getValue('cliente_numero'),
        cliente_complemento: getValue('cliente_complemento'),
        cliente_bairro: getValue('cliente_bairro'),
        cliente_cidade: getValue('cliente_cidade'),
        cliente_uf: getValue('cliente_uf'),
        cliente_cep: getValue('cliente_cep'),

        // Dados do serviço
        data_inicio: formatarDataBrasileira(getValue('data_inicio')),
        data_fim: formatarDataBrasileira(getValue('data_fim')),
        horario_inicio: getValue('horario_inicio'),
        horario_fim: getValue('horario_fim'),
        postos: postos,

        // Dados financeiros
        valor_total: getValue('valor_total'),
        dia_vencimento: getValue('dia_vencimento'),
        chave_pix: getValue('chave_pix'),

        // Dados contratuais
        foro_cidade: getValue('foro_cidade'),
        foro_uf: getValue('foro_uf'),
        cidade_assinatura: getValue('cidade_assinatura'),
        uf_assinatura: getValue('uf_assinatura'),

        // Data de assinatura
        usar_data_hoje: document.getElementById('usar_data_hoje')?.checked || false,
        dia_assinatura: getValue('dia_assinatura'),
        mes_extenso_assinatura: getValue('mes_assinatura'),
        ano_assinatura: getValue('ano_assinatura'),

        // Testemunhas
        testemunha_1_cpf: getValue('testemunha_1_cpf'),
        testemunha_2_cpf: getValue('testemunha_2_cpf'),

        // Opções
        gerar_pdf: document.getElementById('gerarPDF')?.checked || false
    };
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

function formatarDataBrasileira(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

async function gerarContrato() {
    if (!validarFormulario()) {
        return;
    }

    const dados = coletarDadosFormulario();
    
    // Mostrar loading
    showLoadingModal();
    updateStatus('Gerando contrato...');
    
    try {
        const response = await fetch('/api/gerar-contrato', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();
        
        hideLoadingModal();

        if (response.ok && result.success) {
            updateStatus('Contrato gerado com sucesso!');
            
            // Criar links de download
            let downloadHTML = `
                <div class="alert alert-success">
                    ${result.message}
                </div>
                <div class="download-links">
                    <a href="/download/${result.docx_file}" target="_blank">
                        📄 Baixar DOCX
                    </a>
            `;
            
            if (result.pdf_file) {
                downloadHTML += `
                    <a href="/download/${result.pdf_file}" target="_blank">
                        📑 Baixar PDF
                    </a>
                `;
            }
            
            downloadHTML += '</div>';
            
            showModal('Contrato Gerado!', downloadHTML);
            
        } else {
            throw new Error(result.error || 'Erro desconhecido');
        }
        
    } catch (error) {
        hideLoadingModal();
        updateStatus('Erro na geração do contrato.');
        showAlert(`Erro ao gerar contrato: ${error.message}`, 'error');
    }
}

function previewContrato() {
    if (!validarFormulario()) {
        return;
    }

    const dados = coletarDadosFormulario();
    const content = gerarHTMLContrato(dados);
    
    showModal('Preview do Contrato', content);
}

function gerarHTMLContrato(dados) {
    const postosHTML = dados.postos.map(posto => 
        `<li>${posto.quantidade} vigilante(s) - Local: ${posto.local} - Escala: ${posto.escala} - Horário: ${posto.horario}</li>`
    ).join('');

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #ffffff; max-width: 800px; background-color: #2d2d2d; padding: 20px; border-radius: 8px;">
            <h1 style="text-align: center; color: #D4AF37; margin-bottom: 20px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
            
            <p style="margin-bottom: 15px;"><strong>CONTRATANTE:</strong> ${dados.cliente_nome_completo}, brasileiro(a), ${dados.cliente_estado_civil}, 
            portador(a) do CPF nº ${dados.cliente_cpf} e RG nº ${dados.cliente_rg}, 
            residente e domiciliado(a) na ${dados.cliente_logradouro}, nº ${dados.cliente_numero}${dados.cliente_complemento ? ', ' + dados.cliente_complemento : ''}, 
            bairro ${dados.cliente_bairro}, na cidade de ${dados.cliente_cidade} - ${dados.cliente_uf}, 
            CEP ${dados.cliente_cep}, e-mail ${dados.cliente_email} e telefone ${dados.cliente_telefone}.</p>

            <p style="margin-bottom: 15px;"><strong>CONTRATADO:</strong> WOLVE SEGURANÇA PRIVADA LTDA, nome fantasia WOLVE SEGURANÇA, 
            inscrita no CNPJ sob o nº 52.183.690/0001-65, com sede na Rua Vicente do Prado Lima, 
            nº 585, apto 201, bairro Camobi, na cidade de Santa Maria - RS, CEP 97035-720, 
            e-mail lucianommendess@gmail.com e telefone (55) 98418-2641, neste ato representada por 
            LUCIANO MERCI MENDES, CPF 024.866.980-00.</p>

            <h3 style="color: #D4AF37; margin-top: 25px; margin-bottom: 10px;">CLÁUSULA QUARTA - DOS SERVIÇOS</h3>
            <p style="margin-bottom: 15px;">4.1 - Os serviços terão início em ${dados.data_inicio}, no horário ${dados.horario_inicio} até ${dados.horario_fim}.</p>
            
            ${dados.postos.length > 0 ? `
                <ul style="margin: 15px 0; padding-left: 20px;">
                    ${postosHTML}
                </ul>
            ` : ''}

            <h3 style="color: #D4AF37; margin-top: 25px; margin-bottom: 10px;">CLÁUSULA QUINTA - DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO</h3>
            <p style="margin-bottom: 15px;">5.1 - Os serviços OBJETO deste contrato serão remunerados pela quantia total de R$ ${dados.valor_total}, 
            com o pagamento da seguinte forma: mensal até o dia ${dados.dia_vencimento}, via PIX ${dados.chave_pix}.</p>

            <h3 style="color: #D4AF37; margin-top: 25px; margin-bottom: 10px;">CLÁUSULA SÉTIMA - DO PRAZO E VALIDADE</h3>
            <p style="margin-bottom: 15px;">7.1 - Vigência: de ${dados.data_inicio} a ${dados.data_fim}.</p>

            <h3 style="color: #D4AF37; margin-top: 25px; margin-bottom: 10px;">CLÁUSULA DÉCIMA PRIMEIRA - DO FORO</h3>
            <p style="margin-bottom: 25px;">11.1 - As partes elegem o foro da cidade de ${dados.foro_cidade} - ${dados.foro_uf}.</p>

            <br>
            <p style="text-align: center; margin: 30px 0; font-weight: bold;">
                ${dados.cidade_assinatura} - ${dados.uf_assinatura}, ${dados.dia_assinatura} de ${dados.mes_extenso_assinatura} de ${dados.ano_assinatura}.
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
                <div style="text-align: center;">
                    <div style="border-bottom: 2px solid #D4AF37; margin-bottom: 10px; height: 40px;"></div>
                    <strong style="color: #D4AF37;">CONTRATANTE</strong><br>
                    <span style="font-size: 0.9rem;">CPF: ${dados.cliente_cpf}</span>
                </div>
                <div style="text-align: center;">
                    <div style="border-bottom: 2px solid #D4AF37; margin-bottom: 10px; height: 40px;"></div>
                    <strong style="color: #D4AF37;">CONTRATADO</strong><br>
                    <span style="font-size: 0.9rem;">CNPJ: 52.183.690/0001-65<br>
                    Representante: LUCIANO MERCI MENDES<br>
                    CPF: 024.866.980-00</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
                <div style="text-align: center;">
                    <div style="border-bottom: 2px solid #D4AF37; margin-bottom: 10px; height: 40px;"></div>
                    <strong style="color: #D4AF37;">TESTEMUNHA 01</strong><br>
                    <span style="font-size: 0.9rem;">CPF: ${dados.testemunha_1_cpf}</span>
                </div>
                <div style="text-align: center;">
                    <div style="border-bottom: 2px solid #D4AF37; margin-bottom: 10px; height: 40px;"></div>
                    <strong style="color: #D4AF37;">TESTEMUNHA 02</strong><br>
                    <span style="font-size: 0.9rem;">CPF: ${dados.testemunha_2_cpf}</span>
                </div>
            </div>
        </div>
    `;
}

function showModal(title, content) {
    const modal = document.getElementById('previewModal');
    const modalTitle = modal.querySelector('.modal-title');
    const modalContent = document.getElementById('previewContent');
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalContent) modalContent.innerHTML = content;
    if (modal) modal.style.display = 'block';
}

function fecharModal() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.style.display = 'none';
}

function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) modal.style.display = 'block';
}

function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) modal.style.display = 'none';
}

function showAlert(message, type = 'info') {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Criar novo alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = message.replace(/\n/g, '<br>');
    
    // Inserir no topo da página
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
        
        // Scroll para o topo para ver o alerta
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Fallback para alert nativo
        alert(message);
    }
}

function updateStatus(message) {
    const statusBar = document.getElementById('statusBar');
    if (statusBar) {
        statusBar.textContent = message;
    }
}

function setupModalEvents() {
    // Fechar modal clicando fora dele
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });

    // Tecla ESC para fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="block"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}
