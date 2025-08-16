#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WOLVE Contratos - Backend Flask
Sistema de geração de contratos de segurança
"""

from flask import Flask, render_template, request, jsonify, send_file
from docxtpl import DocxTemplate
import os
import json
from datetime import datetime
import tempfile
import subprocess
import shutil

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Configurações
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
TEMPLATE_FILENAME = 'contrato_base.docx'
TEMPLATE_PATH = os.path.join(UPLOAD_FOLDER, TEMPLATE_FILENAME)

# Garantir que as pastas existem
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Dados fixos da WOLVE
DADOS_WOLVE = {
    'contratado_cnpj': '52.183.690/0001-65',
    'representante_contratado_nome': 'LUCIANO MERCI MENDES',
    'representante_contratado_cpf': '024.866.980-00'
}

MESES_PT = [
    "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
]

def copy_template_from_downloads():
    """Copia o template do diretório Downloads do usuário"""
    import os.path
    from pathlib import Path
    
    # Possíveis localizações do template
    possible_paths = [
        # Linux/WSL
        os.path.expanduser("~/Downloads/contrato_base.docx"),
        os.path.expanduser("~/downloads/contrato_base.docx"),
        # Windows
        os.path.expanduser("~/Downloads/contrato_base.docx"),
        # Caminho relativo (caso esteja na pasta do projeto)
        "./contrato_base.docx",
        "../contrato_base.docx"
    ]
    
    for template_source in possible_paths:
        if os.path.exists(template_source):
            try:
                shutil.copy2(template_source, TEMPLATE_PATH)
                print(f"Template copiado de: {template_source}")
                return True
            except Exception as e:
                print(f"Erro ao copiar template de {template_source}: {e}")
                continue
    
    return False

def ensure_template_exists():
    """Verifica se o template existe, senão tenta copiar dos Downloads"""
    if os.path.exists(TEMPLATE_PATH):
        print(f"Template encontrado: {TEMPLATE_PATH}")
        return True
    
    print("Template não encontrado, tentando copiar dos Downloads...")
    
    if copy_template_from_downloads():
        return True
    
    print("❌ ERRO: Template não encontrado!")
    print("Por favor, coloque o arquivo 'contrato_base.docx' em uma dessas localizações:")
    print(f"  - {os.path.expanduser('~/Downloads/contrato_base.docx')}")
    print(f"  - {os.path.abspath('./contrato_base.docx')}")
    print(f"  - {TEMPLATE_PATH}")
    
    return False

def format_currency(value_str):
    """Formatar valor para padrão brasileiro"""
    if not value_str:
        return ""
    
    # Remove caracteres não numéricos exceto vírgula e ponto
    clean_value = ''.join(c for c in value_str if c.isdigit() or c in '.,')
    
    # Se já está no formato brasileiro (vírgula como decimal)
    if ',' in clean_value:
        return clean_value
    
    # Converte formato americano para brasileiro
    if '.' in clean_value:
        parts = clean_value.split('.')
        if len(parts) == 2 and len(parts[1]) <= 2:
            inteiro = int(parts[0])
            decimal = parts[1].ljust(2, '0')
            formatted = f"{inteiro:,}".replace(',', '.')
            return f"{formatted},{decimal}"
    
    # Se é só número inteiro
    if clean_value.isdigit():
        inteiro = int(clean_value)
        formatted = f"{inteiro:,}".replace(',', '.')
        return f"{formatted},00"
    
    return value_str

def generate_filename(cliente_nome):
    """Gerar nome de arquivo único"""
    slug = "".join(c for c in cliente_nome if c.isalnum() or c in (' ', '-', '_')).replace(' ', '_')
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    return f"Contrato_{slug}_{timestamp}"

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/gerar-contrato', methods=['POST'])
def gerar_contrato():
    """API para gerar contrato"""
    try:
        # Verificar se template existe
        if not os.path.exists(TEMPLATE_PATH):
            return jsonify({
                'error': 'Template não encontrado. Coloque o arquivo contrato_base.docx na pasta Downloads.'
            }), 400
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['cliente_nome_completo', 'cliente_cpf', 'data_inicio', 'valor_total']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo obrigatório: {field}'}), 400
        
        # Preparar contexto para o template
        context = {
            # Dados do contratante
            'cliente_nome_completo': data.get('cliente_nome_completo', '').strip(),
            'cliente_estado_civil': data.get('cliente_estado_civil', '').strip(),
            'cliente_cpf': data.get('cliente_cpf', '').strip(),
            'cliente_rg': data.get('cliente_rg', '').strip(),
            'cliente_email': data.get('cliente_email', '').strip(),
            'cliente_telefone': data.get('cliente_telefone', '').strip(),
            'cliente_logradouro': data.get('cliente_logradouro', '').strip(),
            'cliente_numero': data.get('cliente_numero', '').strip(),
            'cliente_complemento': data.get('cliente_complemento', '').strip(),
            'cliente_bairro': data.get('cliente_bairro', '').strip(),
            'cliente_cidade': data.get('cliente_cidade', '').strip(),
            'cliente_uf': data.get('cliente_uf', '').strip(),
            'cliente_cep': data.get('cliente_cep', '').strip(),
            
            # Dados do serviço
            'data_inicio': data.get('data_inicio', '').strip(),
            'data_fim': data.get('data_fim', '').strip(),
            'horario_inicio': data.get('horario_inicio', '').strip(),
            'horario_fim': data.get('horario_fim', '').strip(),
            'postos': data.get('postos', []),
            
            # Dados financeiros
            'valor_total': format_currency(data.get('valor_total', '')),
            'dia_vencimento': data.get('dia_vencimento', '').strip(),
            'chave_pix': data.get('chave_pix', '').strip(),
            
            # Dados contratuais
            'foro_cidade': data.get('foro_cidade', 'Santa Maria').strip(),
            'foro_uf': data.get('foro_uf', 'RS').strip(),
            'cidade_assinatura': data.get('cidade_assinatura', 'Santa Maria').strip(),
            'uf_assinatura': data.get('uf_assinatura', 'RS').strip(),
            'dia_assinatura': data.get('dia_assinatura', '').strip(),
            'mes_extenso_assinatura': data.get('mes_extenso_assinatura', '').strip(),
            'ano_assinatura': data.get('ano_assinatura', '').strip(),
            
            # Testemunhas
            'testemunha_1_cpf': data.get('testemunha_1_cpf', '').strip(),
            'testemunha_2_cpf': data.get('testemunha_2_cpf', '').strip(),
            
            # Dados fixos da WOLVE
            **DADOS_WOLVE
        }
        
        # Formatar complemento
        if context['cliente_complemento']:
            context['cliente_complemento'] = f", {context['cliente_complemento']}"
        
        # Preencher data de assinatura se necessário
        if data.get('usar_data_hoje', True):
            hoje = datetime.now()
            context['dia_assinatura'] = f"{hoje.day:02d}"
            context['mes_extenso_assinatura'] = MESES_PT[hoje.month]
            context['ano_assinatura'] = str(hoje.year)
        
        # Gerar arquivo
        filename = generate_filename(context['cliente_nome_completo'])
        output_path = os.path.join(OUTPUT_FOLDER, f"{filename}.docx")
        
        # Renderizar template
        doc = DocxTemplate(TEMPLATE_PATH)
        doc.render(context)
        doc.save(output_path)
        
        # Gerar PDF se solicitado
        pdf_path = None
        if data.get('gerar_pdf', False):
            try:
                pdf_path = os.path.join(OUTPUT_FOLDER, f"{filename}.pdf")
                result = subprocess.run([
                    'libreoffice', '--headless', '--convert-to', 'pdf',
                    '--outdir', OUTPUT_FOLDER, output_path
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode != 0:
                    pdf_path = None
            except Exception:
                pdf_path = None
        
        response_data = {
            'success': True,
            'message': 'Contrato gerado com sucesso!',
            'docx_file': f"{filename}.docx",
            'pdf_file': f"{filename}.pdf" if pdf_path and os.path.exists(pdf_path) else None
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar contrato: {str(e)}'}), 500

@app.route('/download/<filename>')
def download_file(filename):
    """Download de arquivo gerado"""
    file_path = os.path.join(OUTPUT_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({'error': 'Arquivo não encontrado'}), 404

@app.route('/api/status-template')
def status_template():
    """Verifica status do template"""
    return jsonify({
        'template_exists': os.path.exists(TEMPLATE_PATH),
        'template_path': TEMPLATE_PATH,
        'template_size': os.path.getsize(TEMPLATE_PATH) if os.path.exists(TEMPLATE_PATH) else 0
    })

@app.route('/health')
def health_check():
    """Health check para deploy"""
    return jsonify({
        'status': 'ok', 
        'timestamp': datetime.now().isoformat(),
        'template_ok': os.path.exists(TEMPLATE_PATH)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    # Verifica template mas SEMPRE inicia a aplicação
    if ensure_template_exists():
        print("✅ Template configurado corretamente!")
    else:
        print("⚠️ Template não encontrado - algumas funcionalidades podem não funcionar")
    
    # SEMPRE inicia a aplicação
    app.run(debug=debug_mode, host="0.0.0.0", port=port)
