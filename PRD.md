# Product Requirement Document (PRD): Aplicação de Gestão Financeira Pessoal

## 1. Visão Geral do Produto
O objetivo deste produto é oferecer uma aplicação intuitiva, completa e automatizada de gestão financeira pessoal. A solução permite o controle de saldos, orçamento, planejamento de metas, automação de lançamentos por áudio e imagem (OCR), além de integração via Open Finance e importação de extratos.

---

## 2. Requisitos Funcionais (Macros)

### RF01. Gestão de Contas e Saldo
- **Descrição:** Permite o cadastro e gerenciamento de múltiplas contas (Conta Corrente, Poupança, Carteira Física, Investimentos).
- **Funcionalidades:**
  - Cadastro, edição e inativação de contas.
  - Definição de saldo inicial e moeda.
  - Atualização automática do saldo acumulado com base nas movimentações.
  - Edição do saldo inicial a qualquer momento, com o saldo atual ajustado pela diferença (os lançamentos já registrados não são afetados).

### RF02. Gestão de Modos de Pagamento
- **Descrição:** Permite cadastrar os meios utilizados para transacionar valores.
- **Funcionalidades:**
  - Cadastro de formas de pagamento (Pix, Cartão de Débito, Cartão de Crédito, Boleto, Dinheiro em Espécie).
  - Associação de modos de pagamento a contas bancárias específicas.

### RF03. Categoria de Receitas e Despesas
- **Descrição:** Classificação hierárquica das transações para análise analítica.
- **Funcionalidades:**
  - Cadastro de categorias e subcategorias personalizadas.
  - Atribuição de ícones e cores para identificação visual.
  - Categorias padrão pré-carregadas (ex: Moradia, Alimentação, Transporte, Lazer).

### RF04. Dashboard e Tela Inicial
- **Descrição:** Painel resumido com indicadores de saúde financeira.
- **Funcionalidades:**
  - Visão geral do saldo consolidado de todas as contas.
  - Resumo de receitas, despesas e saldo do mês vigente.
  - Gráficos de distribuição de gastos por categoria.
  - Atalhos para ações rápidas (novo lançamento, envio de áudio, leitura de comprovante).
  - Detalhamento por clique: saldo consolidado abre o valor por conta; receitas e despesas do mês abrem o valor por categoria.
  - Provisionamento do mês: projeção do saldo assumindo que todas as contas fixas serão pagas e que os orçamentos flexíveis atingirão 100% do limite definido.

### RF05. Lançamento por Comando de Áudio
- **Descrição:** Registro inteligente de transações por voz.
- **Funcionalidades:**
  - Processamento de linguagem natural (NLP) para extrair valor, categoria, modo de pagamento e data a partir do áudio do usuário.
  - Tela de confirmação/revisão antes de efetivar o lançamento no sistema.

### RF06. Operações Recorrentes e Parcelamento
- **Descrição:** Suporte a transações periódicas e parceladas.
- **Funcionalidades:**
  - Configuração de recorrência (diária, semanal, mensal, anual).
  - Opção de delimitação por data fim ou número fixo de ocorrências/sem término.
  - Lançamento automático de compras parceladas com vencimento e valor projetados nas faturas/meses subsequentes.

### RF07. Gestão de Planejamento e Metas
- **Descrição:** Controle orçamentário e acompanhamento de objetivos financeiros.
- **Funcionalidades:**
  - **Orçamentos flexíveis:** Definição de teto de gastos por categoria com alertas ao atingir percentuais personalizáveis (ex: 80%, 100%).
  - **Contas fixas:** Orçamento do tipo "fixa" com descrição, categoria e dia de vencimento (ex: Aluguel, Internet) — várias contas fixas podem compartilhar a mesma categoria. Botão para marcar manualmente como paga. Alerta de vencimento (aviso alguns dias antes e aviso de atraso se o dia passar sem lançamento correspondente), independente do alerta por percentual.
  - **Replicação manual de orçamento:** botão para copiar as contas fixas e orçamentos flexíveis de um mês para o outro sob demanda (sem geração automática); itens já existentes no mês de destino são ignorados, não duplicados.
  - **Metas:** Criação de metas de acúmulo de capital (ex: Reserva de Emergência) com indicador visual de progresso.

### RF08. Automação e Importação de Dados
- **Descrição:** Redução do esforço manual de lançamento através de leitura de documentos e dados bancários.
- **Funcionalidades:**
  - **Importação:** Leitura de arquivos nos formatos OFX e CSV para conciliação bancária.
  - **OCR:** Captura de fotos ou uploads de PDFs de recibos e notas fiscais para preenchimento automático.
  - **Open Finance:** Sincronização automatizada e segura com instituições financeiras parceiras.

### RF09. Gestão de Cartões de Crédito
- **Descrição:** Controle dedicado para a dinâmica de cartões de crédito.
- **Funcionalidades:**
  - Cadastro de múltiplos cartões de crédito.
  - Definição de limites, dia de fechamento e dia de vencimento da fatura.
  - Projeção de faturas futuras com base em compras parceladas e gastos recorrentes.

### RF10. Relatórios e Análises Financeiras
- **Descrição:** Ferramentas de análise profunda do comportamento financeiro.
- **Funcionalidades:**
  - Evolução patrimonial ao longo do tempo.
  - Comparativo mês a mês de fluxo de caixa (Entradas vs. Saídas).
  - Exportação de dados e relatórios nos formatos PDF e CSV.

### RF11. Segurança e Notificações
- **Descrição:** Proteção do acesso aos dados e alertas ao usuário.
- **Funcionalidades:**
  - Autenticação biométrica (Touch ID / Face ID / Fingerprint) e PIN.
  - Criptografia dos dados sensíveis do usuário.
  - Notificações push e e-mails de lembrete sobre contas a vencer e limites de orçamento.
  - **Implementado nesta fase apenas o canal in-app**: sino de notificações no cabeçalho com contador de não lidas, histórico e marcação de leitura, alimentado pelos alertas de orçamento (80%/100%) e de vencimento de conta fixa. Push e e-mail permanecem para a Fase 5 (ver `SSD.md` §5).

---

## 3. Requisitos Não-Funcionais (RNF)

1. **Desempenho:** O processamento e resposta do assistente de áudio (NLP) deve ocorrer em menos de 3 segundos.
2. **Segurança:** Dados armazenados e em trânsito devem ser criptografados utilizando padrões AES-256 e TLS 1.3.
3. **Disponibilidade:** A plataforma deve manter uma disponibilidade de pelo menos 99.9%.
4. **Usabilidade:** Design responsivo adaptado para dispositivos móveis (iOS e Android) e web.
