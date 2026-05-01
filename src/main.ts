import './style.css'
import { supabase } from './supabase'
import Chart from 'chart.js/auto'

const app = document.querySelector<HTMLDivElement>('#app')!

// --- State ---
let view: 'login' | 'signup' | 'dashboard' | 'patients' | 'patient-form' | 'forgot-password' | 'profile' | 'patient-profile' = 'login'
let loading = false
let errorMessage = ''
let successMessage = ''
let currentUser: any = null
let isGeneratingPlan = false
let generatedPlan: any = null
let isPlanModalOpen = false

const eyeOpenIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
const eyeClosedIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10c2 4 14 4 16 0"/><path d="M4 12l-1 2.5"/><path d="M8 14v3"/><path d="M12 14.5v3"/><path d="M16 14v3"/><path d="M20 12l1 2.5"/></svg>`

let dashboardData = {
  totalPatients: 0,
  weeklyConsultations: 0,
  patientsWithoutReturn: [] as any[]
}
let patients: any[] = []
let searchTerm = ''
let currentTab: 'pessoal' | 'clinico' | 'habitos' = 'pessoal'
let patientFormData: any = {
  nome: '',
  data_nascimento: '',
  sexo: '',
  email: '',
  telefone: '',
  whatsapp: '',
  peso_inicial: '',
  altura: '',
  nivel_atividade: '',
  objetivos: [],
  objetivo_texto: '',
  patologias: ['Nenhuma'],
  medicamentos: '',
  suplementos: '',
  refeicoes_por_dia: '',
  horario_acorda: '',
  horario_dorme: '',
  litros_agua: '',
  atividade_fisica: 'false',
  atividade_fisica_descricao: '',
  observacoes: ''
}
let selectedPatient: any = null
let patientConsultations: any[] = []
let patientPlans: any[] = []
let isConsultationModalOpen = false

// --- Templates ---

const logoTemplate = `
  <div class="logo-container">
    <div class="apple-glass"></div>
    <div class="logo-text">Saudável Nutri</div>
  </div>
`

const loginTemplate = () => `
  <div class="auth-page">
    <div class="card auth-card">
      ${logoTemplate}
      <h2>Bem-vinda de volta</h2>
      <p class="subtitle">Insira suas credenciais para acessar</p>
      
      <div id="error-box" class="error-message" style="${errorMessage ? 'display: block' : ''}">${errorMessage}</div>
      <div id="success-box" class="success-message" style="${successMessage ? 'display: block; background: #f0fff4; color: #27ae60; padding: 12px; border-radius: 10px; margin-bottom: 20px;' : 'display: none'}">${successMessage}</div>
      
      <form id="login-form">
        <div class="form-group">
          <label for="email">E-mail</label>
          <input type="email" id="email" placeholder="seu@email.com" required>
        </div>
        <div class="form-group">
          <label for="password">Senha</label>
          <div class="password-wrapper">
            <input type="password" id="password" placeholder="••••••••" required>
            <button type="button" class="toggle-password" id="toggle-login-password">${eyeClosedIcon}</button>
          </div>
        </div>
        <a href="#" class="forgot-password-link" id="go-forgot-password">Esqueci a senha</a>
        <button type="submit" ${loading ? 'disabled' : ''}>
          ${loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      
      <div class="footer-link">
        Não tem conta? <a href="#" id="go-signup">Cadastre-se</a>
      </div>
    </div>
  </div>
`

const signupTemplate = () => `
  <div class="auth-page">
    <div class="card auth-card">
      ${logoTemplate}
      <h2>Criar sua conta</h2>
      <p class="subtitle">Junte-se ao Saudável Nutri hoje</p>
      
      <div id="error-box" class="error-message" style="${errorMessage ? 'display: block' : ''}">${errorMessage}</div>
      
      <form id="signup-form">
        <div class="form-group">
          <label for="full-name">Nome Completo</label>
          <input type="text" id="full-name" placeholder="Ex: Maria Oliveira" required>
        </div>
        <div class="form-group">
          <label for="preferred-name">Como prefere ser chamado?</label>
          <input type="text" id="preferred-name" placeholder="Ex: Nutri Maria" required>
        </div>
        <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 0;">
          <div class="form-group">
            <label for="crn">CRN (Registro)</label>
            <input type="text" id="crn" placeholder="Ex: 12345/P" required>
          </div>
          <div class="form-group">
            <label for="prof-telefone">Telefone</label>
            <input type="text" id="prof-telefone" placeholder="(00) 00000-0000" required>
          </div>
        </div>
        <div class="form-group">
          <label for="especialidade">Especialidade</label>
          <input type="text" id="especialidade" placeholder="Ex: Nutrição Esportiva" required>
        </div>
        <div class="form-group">
          <label for="email">E-mail</label>
          <input type="email" id="email" placeholder="seu@email.com" required>
        </div>
        <div class="form-group">
          <label for="password">Senha</label>
          <div class="password-wrapper">
            <input type="password" id="password" placeholder="Mínimo 6 caracteres" minlength="6" required>
            <button type="button" class="toggle-password" id="toggle-signup-password">${eyeClosedIcon}</button>
          </div>
        </div>
        <div class="form-group">
          <label for="confirm-password">Confirmar Senha</label>
          <input type="password" id="confirm-password" placeholder="••••••••" minlength="6" required>
        </div>
        <button type="submit" ${loading ? 'disabled' : ''}>
          ${loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
      
      <div class="footer-link">
        Já tem conta? <a href="#" id="go-login">Faça login</a>
      </div>
    </div>
  </div>
`

const forgotPasswordTemplate = () => `
  <div class="auth-page">
    <div class="card auth-card">
      ${logoTemplate}
      <h2>Recuperar senha</h2>
      <p class="subtitle">Enviaremos um link para o seu e-mail</p>
      
      <div id="error-box" class="error-message" style="${errorMessage ? 'display: block' : ''}">${errorMessage}</div>
      <div id="success-box" class="success-message" style="${successMessage ? 'display: block; background: #f0fff4; color: #27ae60; padding: 12px; border-radius: 10px; margin-bottom: 20px;' : 'display: none'}">${successMessage}</div>
      
      <form id="forgot-password-form">
        <div class="form-group">
          <label for="reset-email">E-mail</label>
          <input type="email" id="reset-email" placeholder="seu@email.com" required>
        </div>
        <button type="submit" ${loading ? 'disabled' : ''}>
          ${loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>
      
      <div class="footer-link">
        <a href="#" id="back-to-login">Voltar para o login</a>
      </div>
    </div>
  </div>
`

const sidebarTemplate = () => `
  <aside class="sidebar">
    <div class="logo-container">
      <div class="apple-glass"></div>
      <div class="logo-text">Saudável Nutri</div>
    </div>
    
    <nav class="nav-menu">
      <div class="nav-item ${view === 'dashboard' ? 'active' : ''}" id="nav-dashboard">
        <span>📊 Dashboard</span>
      </div>
      <div class="nav-item ${view === 'patients' || view === 'patient-form' ? 'active' : ''}" id="nav-patients">
        <span>👥 Pacientes</span>
      </div>
      <div class="nav-item ${view === 'profile' ? 'active' : ''}" id="nav-profile">
        <span>👤 Perfil</span>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <div class="nav-item" id="logout-btn">
        <span>🚪 Sair</span>
      </div>
    </div>
  </aside>
`

const dashboardTemplate = () => `
  <div class="dashboard-layout">
    ${sidebarTemplate()}
    <main class="main-content">
      <header>
        <h1>Olá, ${currentUser?.user_metadata?.preferred_name || 'Nutri'}!</h1>
        <p style="color: var(--text-light)">Aqui está o que está acontecendo hoje.</p>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="icon">👥</div>
          <div class="value">${dashboardData.totalPatients}</div>
          <div class="label">Total de Pacientes</div>
        </div>
        <div class="stat-card">
          <div class="icon">📅</div>
          <div class="value">${dashboardData.weeklyConsultations}</div>
          <div class="label">Consultas na Semana</div>
        </div>
        <div class="stat-card">
          <div class="icon">⚠️</div>
          <div class="value">${dashboardData.patientsWithoutReturn.length}</div>
          <div class="label">Pacientes sem Retorno</div>
        </div>
      </div>

      <div class="dashboard-sections">
        <section class="card section-card">
          <h3>⚠️ Pacientes sem retorno (> 30 dias)</h3>
          <div class="patient-list-mini">
            ${dashboardData.patientsWithoutReturn.length > 0 
              ? dashboardData.patientsWithoutReturn.map(p => `
                  <div class="patient-item-mini">
                    <span>${p.nome}</span>
                    <span class="tag">Última: ${new Date(p.ultima_consulta).toLocaleDateString()}</span>
                  </div>
                `).join('')
              : '<p class="empty-text">Tudo em dia!</p>'
            }
          </div>
        </section>
      </div>
    </main>
  </div>
`

const patientListTemplate = () => `
  <div class="dashboard-layout">
    ${sidebarTemplate()}
    <main class="main-content">
      <div class="page-header">
        <h1>Pacientes</h1>
        <button class="btn-primary" id="btn-new-patient">
          <span>+ Novo Paciente</span>
        </button>
      </div>

      <div class="search-container" style="margin-bottom: 30px;">
        <span class="search-icon">🔍</span>
        <input type="text" id="patient-search" class="search-input" placeholder="Buscar por nome..." value="${searchTerm}">
      </div>

      <div class="patient-grid">
        ${loading && patients.length === 0 ? '<div class="empty-state">Carregando pacientes...</div>' : 
          patients.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 
            ? patients.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())).map(p => `
                <a href="#" class="patient-card" data-id="${p.id}">
                  <h4>${p.nome}</h4>
                  <div class="info">
                    Objetivo: ${p.objetivos && p.objetivos.length > 0 ? p.objetivos[0] : 'Não definido'}
                  </div>
                  <div class="tag">Última consulta: ${p.ultima_consulta ? new Date(p.ultima_consulta).toLocaleDateString() : 'Nenhuma'}</div>
                </a>
              `).join('')
            : '<div class="empty-state">Nenhum paciente encontrado</div>'
        }
      </div>
    </main>
  </div>
`

const patientFormTemplate = () => {
  const age = patientFormData.data_nascimento ? Math.floor((new Date().getTime() - new Date(patientFormData.data_nascimento).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : ''
  const imc = (patientFormData.peso_inicial && patientFormData.altura) 
    ? (parseFloat(patientFormData.peso_inicial) / ((parseFloat(patientFormData.altura) / 100) * (parseFloat(patientFormData.altura) / 100))).toFixed(1)
    : ''

  return `
  <div class="dashboard-layout">
    ${sidebarTemplate()}
    <main class="main-content">
      <div class="page-header">
        <h1>Novo Paciente</h1>
        <button class="btn-secondary" id="btn-cancel-patient">Cancelar</button>
      </div>

      <div class="form-container">
        <div class="form-tabs">
          <button class="tab-btn ${currentTab === 'pessoal' ? 'active' : ''}" data-tab="pessoal">Pessoal</button>
          <button class="tab-btn ${currentTab === 'clinico' ? 'active' : ''}" data-tab="clinico">Clínico</button>
          <button class="tab-btn ${currentTab === 'habitos' ? 'active' : ''}" data-tab="habitos">Hábitos</button>
        </div>

        <form id="patient-form">
          <!-- Aba Pessoal -->
          <div class="tab-content ${currentTab === 'pessoal' ? 'active' : ''}">
            <div class="form-grid">
              <div class="form-group full">
                <label>Nome Completo *</label>
                <input type="text" name="nome" placeholder="Nome completo" required value="${patientFormData.nome}">
              </div>
              <div class="form-group">
                <label>Data de Nascimento</label>
                <input type="date" name="data_nascimento" id="form-dob" value="${patientFormData.data_nascimento}">
              </div>
              <div class="form-group">
                <label>Idade</label>
                <input type="text" id="form-age" placeholder="Calculado" readonly value="${age ? age + ' anos' : ''}">
              </div>
              <div class="form-group">
                <label>Sexo</label>
                <select name="sexo" style="width:100%; padding:12px; border-radius:12px; border:2px solid #edf2f7;">
                  <option value="" ${patientFormData.sexo === '' ? 'selected' : ''}>Selecione</option>
                  <option value="Feminino" ${patientFormData.sexo === 'Feminino' ? 'selected' : ''}>Feminino</option>
                  <option value="Masculino" ${patientFormData.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                  <option value="Outro" ${patientFormData.sexo === 'Outro' ? 'selected' : ''}>Outro</option>
                </select>
              </div>
              <div class="form-group">
                <label>E-mail</label>
                <input type="email" name="email" placeholder="email@exemplo.com" value="${patientFormData.email}">
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input type="text" name="telefone" placeholder="(00) 0000-0000" id="form-phone" value="${patientFormData.telefone}">
              </div>
              <div class="form-group">
                <label>WhatsApp</label>
                <input type="text" name="whatsapp" placeholder="(00) 90000-0000" id="form-whatsapp" value="${patientFormData.whatsapp}">
              </div>
            </div>
          </div>

          <!-- Aba Clínico -->
          <div class="tab-content ${currentTab === 'clinico' ? 'active' : ''}">
            <div class="form-grid">
              <div class="form-group input-with-suffix">
                <label>Peso Atual</label>
                <input type="number" step="0.1" name="peso_inicial" id="form-weight" value="${patientFormData.peso_inicial}">
                <span class="input-suffix">kg</span>
              </div>
              <div class="form-group input-with-suffix">
                <label>Altura</label>
                <input type="number" name="altura" id="form-height" value="${patientFormData.altura}">
                <span class="input-suffix">cm</span>
              </div>
              <div class="form-group">
                <label>IMC</label>
                <input type="text" id="form-imc" placeholder="Calculado" readonly value="${imc}">
              </div>
              <div class="form-group">
                <label>Nível de Atividade</label>
                <select name="nivel_atividade" style="width:100%; padding:12px; border-radius:12px; border:2px solid #edf2f7;">
                  <option value="" ${patientFormData.nivel_atividade === '' ? 'selected' : ''}>Selecione</option>
                  <option value="Sedentário" ${patientFormData.nivel_atividade === 'Sedentário' ? 'selected' : ''}>Sedentário</option>
                  <option value="Levemente ativo" ${patientFormData.nivel_atividade === 'Levemente ativo' ? 'selected' : ''}>Levemente ativo</option>
                  <option value="Moderadamente ativo" ${patientFormData.nivel_atividade === 'Moderadamente ativo' ? 'selected' : ''}>Moderadamente ativo</option>
                  <option value="Muito ativo" ${patientFormData.nivel_atividade === 'Muito ativo' ? 'selected' : ''}>Muito ativo</option>
                  <option value="Extremamente ativo" ${patientFormData.nivel_atividade === 'Extremamente ativo' ? 'selected' : ''}>Extremamente ativo</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-top:20px;">
              <label>Objetivo</label>
              <div class="checkbox-group">
                ${['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => `
                  <label class="checkbox-item"><input type="checkbox" name="objetivos" value="${obj}" ${patientFormData.objetivos.includes(obj) ? 'checked' : ''}> ${obj}</label>
                `).join('')}
              </div>
              <input type="text" name="objetivo_texto" placeholder="Outros objetivos..." style="margin-top:10px;" value="${patientFormData.objetivo_texto}">
            </div>

            <div class="form-group" style="margin-top:20px;">
              <label>Patologias</label>
              <div class="checkbox-group">
                ${['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'SOP', 'Doença celíaca', 'Nenhuma'].map(pat => `
                  <label class="checkbox-item"><input type="checkbox" name="patologias" value="${pat}" ${patientFormData.patologias.includes(pat) ? 'checked' : ''}> ${pat}</label>
                `).join('')}
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Medicamentos</label>
                <input type="text" name="medicamentos" placeholder="Lista de medicamentos" value="${patientFormData.medicamentos}">
              </div>
              <div class="form-group">
                <label>Suplementos</label>
                <input type="text" name="suplementos" placeholder="Lista de suplementos" value="${patientFormData.suplementos}">
              </div>
            </div>
          </div>

          <!-- Aba Hábitos -->
          <div class="tab-content ${currentTab === 'habitos' ? 'active' : ''}">
            <div class="form-grid">
              <div class="form-group">
                <label>Refeições por dia</label>
                <input type="number" name="refeicoes_por_dia" value="${patientFormData.refeicoes_por_dia}">
              </div>
              <div class="form-group">
                <label>Horário que acorda</label>
                <input type="text" name="horario_acorda" placeholder="Ex: 06:30" id="form-wake" value="${patientFormData.horario_acorda}">
              </div>
              <div class="form-group">
                <label>Horário que dorme</label>
                <input type="text" name="horario_dorme" placeholder="Ex: 22:00" id="form-sleep" value="${patientFormData.horario_dorme}">
              </div>
              <div class="form-group input-with-suffix">
                <label>Água por dia</label>
                <input type="number" step="0.1" name="litros_agua" value="${patientFormData.litros_agua}">
                <span class="input-suffix">litros</span>
              </div>
            </div>
            <div class="form-group" style="margin-top:20px;">
              <label>Atividade Física?</label>
              <select name="atividade_fisica" id="form-exercise" style="width:100%; padding:12px; border-radius:12px; border:2px solid #edf2f7;">
                <option value="false" ${patientFormData.atividade_fisica === 'false' ? 'selected' : ''}>Não</option>
                <option value="true" ${patientFormData.atividade_fisica === 'true' ? 'selected' : ''}>Sim</option>
              </select>
              <input type="text" name="atividade_fisica_descricao" placeholder="Qual atividade e frequência?" style="margin-top:10px; display:${patientFormData.atividade_fisica === 'true' ? 'block' : 'none'};" id="form-exercise-desc" value="${patientFormData.atividade_fisica_descricao}">
            </div>
            <div class="form-group" style="margin-top:20px;">
              <label>Observações</label>
              <textarea name="observacoes" rows="4" style="width:100%; padding:12px; border-radius:12px; border:2px solid #edf2f7; font-family:inherit;">${patientFormData.observacoes}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" style="width:auto;" ${loading ? 'disabled' : ''}>
              ${loading ? 'Salvando...' : 'Salvar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
  <div id="toast" class="toast">✓ Paciente salvo com sucesso!</div>
`
}

const profileTemplate = () => `
  <div class="dashboard-layout">
    ${sidebarTemplate()}
    <main class="main-content">
      <header>
        <h1>Meu Perfil</h1>
        <p style="margin-bottom: 30px; color: var(--text-light)">Gerencie sua conta e segurança</p>
      </header>

      <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
        <div class="stat-card" style="text-align: left;">
          <h3 style="margin-bottom: 20px;">Informações Pessoais</h3>
          
          <div id="personal-error" class="error-message"></div>
          <div id="personal-success" class="success-message" style="display: none; background: #f0fff4; color: #27ae60; padding: 12px; border-radius: 10px; margin-bottom: 20px;"></div>

          <form id="update-profile-form">
            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" id="prof-full-name" value="${currentUser?.user_metadata?.full_name || ''}" required>
              </div>
              <div class="form-group">
                <label>Como prefere ser chamado</label>
                <input type="text" id="prof-preferred-name" value="${currentUser?.user_metadata?.preferred_name || ''}" required>
              </div>
              <div class="form-group">
                <label>CRN</label>
                <input type="text" id="prof-crn" value="${currentUser?.user_metadata?.crn || ''}" required>
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input type="text" id="prof-phone" value="${currentUser?.user_metadata?.telefone || ''}" required>
              </div>
            </div>
            <div class="form-group">
              <label>Especialidade</label>
              <input type="text" id="prof-specialty" value="${currentUser?.user_metadata?.especialidade || ''}" required>
            </div>
            <div class="form-group">
              <label>E-mail (Login)</label>
              <input type="email" id="prof-email" value="${currentUser?.email || ''}" required>
            </div>
            <button type="submit" class="btn-primary" ${loading ? 'disabled' : ''}>
              ${loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        <div class="stat-card" style="text-align: left;">
          <h3 style="margin-bottom: 20px;">Segurança</h3>
          <p style="font-size: 14px; color: var(--text-light); margin-bottom: 20px;">
            Utilize o formulário abaixo para alterar sua senha se necessário.
          </p>
          
          <div id="profile-error" class="error-message"></div>
          <div id="profile-success" class="success-message" style="display: none; background: #f0fff4; color: #27ae60; padding: 12px; border-radius: 10px; margin-bottom: 20px;"></div>

          <form id="update-password-form">
            <div class="form-group">
              <label>Nova Senha</label>
              <div class="password-wrapper">
                <input type="password" id="new-password" placeholder="Mínimo 6 caracteres" minlength="6" required>
                <button type="button" class="toggle-password" id="toggle-new-password">${eyeClosedIcon}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Confirmar Nova Senha</label>
              <input type="password" id="confirm-new-password" placeholder="••••••••" minlength="6" required>
            </div>
            <button type="submit" class="btn-primary" ${loading ? 'disabled' : ''}>
              ${loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
`

const patientProfileTemplate = () => {
  if (!selectedPatient) return '<div class="main-content">Carregando perfil...</div>'

  return `
  <div class="dashboard-layout">
    ${sidebarTemplate()}
    <main class="main-content">
      <div class="page-header">
        <div>
          <h1 style="margin-bottom: 5px;">${selectedPatient.nome}</h1>
          <p style="color: var(--text-light)">Perfil do Paciente</p>
        </div>
        <button class="btn-secondary" id="btn-back-patients">← Voltar</button>
      </div>

      <div class="profile-container">
        <!-- Seção 1 -->
        <section class="profile-section">
          <div class="section-header">
            <h2>👤 Dados do Paciente</h2>
            <button class="btn-primary" id="btn-save-profile">Salvar Alterações</button>
          </div>
          
          <div class="form-tabs">
            <button class="tab-btn ${currentTab === 'pessoal' ? 'active' : ''}" data-tab="pessoal">Pessoal</button>
            <button class="tab-btn ${currentTab === 'clinico' ? 'active' : ''}" data-tab="clinico">Clínico</button>
            <button class="tab-btn ${currentTab === 'habitos' ? 'active' : ''}" data-tab="habitos">Hábitos</button>
          </div>

          <form id="edit-patient-form" style="padding-top: 20px;">
            <div class="tab-content ${currentTab === 'pessoal' ? 'active' : ''}">
              <div class="form-grid">
                <div class="form-group full">
                  <label>Nome Completo *</label>
                  <input type="text" name="nome" value="${selectedPatient.nome}" required>
                </div>
                <div class="form-group">
                  <label>E-mail</label>
                  <input type="email" name="email" value="${selectedPatient.email || ''}">
                </div>
                <div class="form-group">
                  <label>Telefone</label>
                  <input type="text" name="telefone" value="${selectedPatient.telefone || ''}">
                </div>
              </div>
            </div>
            
            <div class="tab-content ${currentTab === 'clinico' ? 'active' : ''}">
              <div class="form-grid">
                <div class="form-group">
                  <label>Peso Inicial (kg)</label>
                  <input type="number" step="0.1" name="peso_inicial" value="${selectedPatient.peso_inicial || ''}">
                </div>
                <div class="form-group">
                  <label>Altura (cm)</label>
                  <input type="number" name="altura" value="${selectedPatient.altura || ''}">
                </div>
                <div class="form-group full">
                  <label>Objetivo Principal</label>
                  <input type="text" name="objetivo_texto" value="${selectedPatient.objetivo_texto || ''}">
                </div>
              </div>
            </div>

            <div class="tab-content ${currentTab === 'habitos' ? 'active' : ''}">
              <div class="form-group full">
                <label>Observações Gerais</label>
                <textarea name="observacoes" rows="4" style="width:100%; padding:12px; border-radius:12px; border:2px solid #edf2f7; font-family:inherit;">${selectedPatient.observacoes || ''}</textarea>
              </div>
            </div>
          </form>
        </section>

        <!-- Seção 2 -->
        <section class="profile-section">
          <div class="section-header">
            <h2>📅 Consultas</h2>
            <button class="btn-primary" id="btn-open-consultation">+ Nova Consulta</button>
          </div>

          <div class="consultations-layout">
            <div class="chart-wrapper">
              <h3 style="margin-bottom: 15px; font-size: 14px; color: var(--text-light);">EVOLUÇÃO DE PESO</h3>
              ${patientConsultations.length === 0 ? '<div class="empty-state" style="text-align: center; padding-top: 50px;">Nenhuma consulta registrada ainda</div>' : '<canvas id="weightChart"></canvas>'}
            </div>

            <div class="consultation-list">
              <h3 style="margin-bottom: 10px; font-size: 14px; color: var(--text-light);">HISTÓRICO</h3>
              ${patientConsultations.length === 0 ? '<p class="empty-state">Sem histórico.</p>' : 
                patientConsultations.map(c => `
                  <div class="consultation-card">
                    <div class="cons-header">
                      <div class="cons-date">${new Date(c.data_consulta).toLocaleDateString('pt-BR')}</div>
                      <div class="tag">Retorno: ${c.proximo_retorno ? new Date(c.proximo_retorno).toLocaleDateString('pt-BR') : 'Não definido'}</div>
                    </div>
                    <div class="cons-metrics">
                      <div class="metric-item">
                        <span class="metric-label">Peso</span>
                        <span class="metric-value">${c.peso} kg</span>
                      </div>
                      <div class="metric-item">
                        <span class="metric-label">Cintura</span>
                        <span class="metric-value">${c.cintura || '-'} cm</span>
                      </div>
                      <div class="metric-item">
                        <span class="metric-label">Quadril</span>
                        <span class="metric-value">${c.quadril || '-'} cm</span>
                      </div>
                      <div class="metric-item">
                        <span class="metric-label">% Gordura</span>
                        <span class="metric-value">${c.percentual_gordura || '-'} %</span>
                      </div>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </section>

        <!-- Seção 3 -->
        <section class="profile-section">
          <div class="section-header">
            <h2>🥗 Planos Alimentares</h2>
            <button class="btn-primary" id="btn-generate-plan" ${isGeneratingPlan ? 'disabled' : ''}>
              ${isGeneratingPlan ? '⌛ Gerando...' : '✨ Gerar com IA'}
            </button>
          </div>
          
          ${isGeneratingPlan ? `
            <div class="loading-state" style="padding: 40px; text-align: center;">
              <div class="spinner"></div>
              <p style="margin-top: 15px; color: var(--text-light)">Nossa IA está elaborando o melhor plano para ${selectedPatient.nome}...</p>
            </div>
          ` : ''}

          <div class="plan-history">
            ${patientPlans.length === 0 && !isGeneratingPlan ? '<p class="empty-state">Nenhum plano alimentar gerado ainda</p>' : 
              patientPlans.map(p => `
                <div class="plan-item" data-id="${p.id}">
                  <div class="plan-date">Plano de ${new Date(p.created_at).toLocaleDateString('pt-BR')}</div>
                  <button class="btn-icon view-plan-btn" data-id="${p.id}">👁️</button>
                </div>
              `).join('')
            }
          </div>
        </section>
      </div>
    </main>

    <!-- Modal de Plano Alimentar (Geração/Edição/Visualização) -->
    <div class="modal-overlay ${isPlanModalOpen ? 'show' : ''}" id="plan-modal">
      <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <h2>🥗 Plano Alimentar</h2>
          <button class="btn-secondary" id="btn-close-plan-modal">Fechar</button>
        </div>
        
        <div id="plan-content">
          ${generatedPlan ? renderPlanEditor(generatedPlan) : '<p>Carregando...</p>'}
        </div>

        <div style="display: flex; gap: 15px; margin-top: 30px; position: sticky; bottom: 0; background: white; padding-top: 15px; border-top: 1px solid #eee;">
          <button type="button" class="btn-secondary" style="flex: 1;" id="btn-cancel-plan">Cancelar</button>
          ${!generatedPlan?.id ? `<button type="button" class="btn-primary" style="flex: 2;" id="btn-save-plan">💾 Salvar Plano no Prontuário</button>` : ''}
        </div>
      </div>
    </div>
    
    <div class="modal-overlay ${isConsultationModalOpen ? 'show' : ''}" id="consultation-modal">
      <div class="modal-content">
        <h2 style="margin-bottom: 20px;">Nova Consulta</h2>
        <form id="new-consultation-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Data *</label>
              <input type="date" name="data_consulta" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
              <label>Peso (kg) *</label>
              <input type="number" step="0.1" name="peso" required>
            </div>
            <div class="form-group">
              <label>Cintura (cm)</label>
              <input type="number" step="0.1" name="cintura">
            </div>
            <div class="form-group">
              <label>Quadril (cm)</label>
              <input type="number" step="0.1" name="quadril">
            </div>
            <div class="form-group">
              <label>% Gordura</label>
              <input type="number" step="0.1" name="percentual_gordura">
            </div>
            <div class="form-group">
              <label>Próximo Retorno</label>
              <input type="date" name="proximo_retorno">
            </div>
          </div>
          <div class="form-group full" style="margin-top: 15px;">
            <label>Observações</label>
            <textarea name="observacoes" rows="3" style="width:100%; padding:12px; border-radius:12px; border:2px solid #edf2f7; font-family:inherit;"></textarea>
          </div>
          <div style="display: flex; gap: 15px; margin-top: 20px;">
            <button type="button" class="btn-secondary" id="btn-close-modal">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar Consulta</button>
          </div>
        </form>
      </div>
    </div>

    <div id="toast" class="toast">✓ Alterações salvas com sucesso!</div>
  </div>
  `
}

// --- Functions ---

function renderPlanEditor(plan: any) {
  const days = plan.plano_semanal || []
  
  return `
    <div class="plan-editor">
      ${days.map((d: any, dayIdx: number) => `
        <div class="day-card" style="margin-bottom: 30px; border: 1px solid #eee; border-radius: 15px; padding: 20px;">
          <h3 style="margin-bottom: 20px; color: var(--primary); display: flex; align-items: center; gap: 10px;">
            📅 ${d.dia}
          </h3>
          <div class="meals-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            ${Object.entries(d.refeicoes).map(([mealKey, options]: [string, any]) => `
              <div class="meal-group">
                <label style="font-weight: 600; text-transform: capitalize; display: block; margin-bottom: 10px;">
                  ${mealKey.replace(/_/g, ' ')}
                </label>
                <div class="options-list" style="display: flex; flex-direction: column; gap: 8px;">
                  ${options.map((opt: string, optIdx: number) => `
                    <input type="text" 
                      class="plan-input" 
                      data-day="${dayIdx}" 
                      data-meal="${mealKey}" 
                      data-option="${optIdx}" 
                      value="${opt}" 
                      style="width: 100%; padding: 8px 12px; border: 1px solid #edf2f7; border-radius: 8px; font-size: 14px;">
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `
}

async function handleGeneratePlan() {
  if (!selectedPatient) return
  
  isGeneratingPlan = true
  render()
  
  try {
    const { data, error } = await supabase.functions.invoke('gerar-plano', {
      body: { dados_do_paciente: selectedPatient }
    })
    
    if (error) {
      // Tentar extrair mensagem amigável do corpo do erro
      try {
        const errBody = await error.context.json()
        throw new Error(errBody.error || 'Erro desconhecido na geração')
      } catch (e: any) {
        throw new Error(e.message || 'Erro na comunicação com a IA')
      }
    }
    
    generatedPlan = data
    isPlanModalOpen = true
  } catch (error: any) {
    alert(error.message)
    console.error(error)
  } finally {
    isGeneratingPlan = false
    render()
  }
}

async function handleSavePlan() {
  if (!selectedPatient || !generatedPlan) return
  
  // Collect data from inputs
  const updatedPlan = { ...generatedPlan }
  const inputs = document.querySelectorAll('.plan-input') as NodeListOf<HTMLInputElement>
  
  inputs.forEach(input => {
    const dayIdx = parseInt(input.dataset.day!)
    const meal = input.dataset.meal!
    const optIdx = parseInt(input.dataset.option!)
    updatedPlan.plano_semanal[dayIdx].refeicoes[meal][optIdx] = input.value
  })

  loading = true
  render()
  
  try {
    const { error } = await supabase
      .from('planos_alimentares')
      .insert([{
        paciente_id: selectedPatient.id,
        conteudo: updatedPlan
      }])
    
    if (error) throw error
    
    isPlanModalOpen = false
    generatedPlan = null
    await loadPatientProfile(selectedPatient.id)
    showToast('Plano alimentar salvo com sucesso!')
  } catch (error: any) {
    alert('Erro ao salvar plano: ' + error.message)
  } finally {
    loading = false
    render()
  }
}

function render() {
  if (view === 'login') app.innerHTML = loginTemplate()
  else if (view === 'signup') app.innerHTML = signupTemplate()
  else if (view === 'forgot-password') app.innerHTML = forgotPasswordTemplate()
  else if (view === 'dashboard') {
    app.innerHTML = dashboardTemplate()
    if (!loading && dashboardData.totalPatients === 0) {
      loadDashboardData()
    }
  }
  else if (view === 'patients') {
    app.innerHTML = patientListTemplate()
    if (!loading && patients.length === 0) {
      loadPatients()
    }
  }
  else if (view === 'patient-form') {
    app.innerHTML = patientFormTemplate()
  }
  else if (view === 'profile') {
    app.innerHTML = profileTemplate()
  }
  else if (view === 'patient-profile') {
    app.innerHTML = patientProfileTemplate()
    if (patientConsultations.length > 0) {
      setTimeout(renderWeightChart, 100)
    }
  }
  
  attachEvents()
}

async function loadPatients() {
  if (!currentUser) return
  loading = true
  render()
  
  const { data } = await supabase
    .from('pacientes')
    .select(`
      id, nome, objetivos,
      consultas ( data_consulta )
    `)
    .eq('nutricionista_id', currentUser.id)
    .order('nome')
  
  patients = (data || []).map(p => ({
    ...p,
    ultima_consulta: p.consultas?.length > 0 
      ? p.consultas.reduce((latest: any, c: any) => {
          const d = new Date(c.data_consulta)
          return (!latest || d > latest) ? d : latest
        }, null)
      : null
  }))
  
  loading = false
  render()
}

async function loadDashboardData() {
  if (!currentUser) return
  
  loading = true
  render()
  
  try {
    // 1. Total Patients
    const { count: totalPatients } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .eq('nutricionista_id', currentUser.id)
    
    // 2. Weekly Consultations
    const startOfWeek = new Date()
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Sunday
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const { data: consultations } = await supabase
      .from('consultas')
      .select('id, paciente!inner(nutricionista_id)')
      .eq('paciente.nutricionista_id', currentUser.id)
      .gte('data_consulta', startOfWeek.toISOString())
      .lte('data_consulta', endOfWeek.toISOString())

    // 3. Patients Without Return
    // Requirement: last consulta > 30 days ago AND no future return scheduled
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch all patients with their consultations
    const { data: patientsWithConsultas } = await supabase
      .from('pacientes')
      .select(`
        id, 
        nome,
        consultas (
          data_consulta,
          proximo_retorno
        )
      `)
      .eq('nutricionista_id', currentUser.id)

    const patientsWithoutReturn = (patientsWithConsultas || []).filter(p => {
      if (!p.consultas || p.consultas.length === 0) return false
      
      const lastConsulta = p.consultas.reduce((latest: any, c: any) => {
        const d = new Date(c.data_consulta)
        return (!latest || d > latest) ? d : latest
      }, null)
      
      const hasFutureReturn = p.consultas.some((c: any) => {
        if (!c.proximo_retorno) return false
        return new Date(c.proximo_retorno) > new Date()
      })
      
      return lastConsulta < thirtyDaysAgo && !hasFutureReturn
    }).map(p => ({
      id: p.id,
      nome: p.nome,
      ultima_consulta: p.consultas.reduce((latest: any, c: any) => {
        const d = new Date(c.data_consulta)
        return (!latest || d > latest) ? d : latest
      }, null)
    }))

    dashboardData = {
      totalPatients: totalPatients || 0,
      weeklyConsultations: consultations?.length || 0,
      patientsWithoutReturn
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading = false
    render()
  }
}

async function loadPatientProfile(id: string) {
  loading = true
  render()
  
  try {
    // 1. Fetch Patient
    const { data: patient } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single()
    
    selectedPatient = patient

    // 2. Fetch Consultations
    const { data: consultations } = await supabase
      .from('consultas')
      .select('*')
      .eq('paciente_id', id)
      .order('data_consulta', { ascending: false })
    
    patientConsultations = consultations || []

    // 3. Fetch Plans
    const { data: plans } = await supabase
      .from('planos_alimentares')
      .select('*')
      .eq('paciente_id', id)
      .order('created_at', { ascending: false })
    
    patientPlans = plans || []

  } catch (error) {
    console.error('Error loading patient profile:', error)
  } finally {
    loading = false
    view = 'patient-profile'
    render()
  }
}

async function handleSavePatientProfile(e: Event) {
  e.preventDefault()
  if (!selectedPatient) return

  const formData = new FormData(document.querySelector('#edit-patient-form') as HTMLFormElement)
  const updates = Object.fromEntries(formData.entries())
  
  loading = true
  render()

  const { error } = await supabase
    .from('pacientes')
    .update(updates)
    .eq('id', selectedPatient.id)
  
  if (error) {
    alert('Erro ao salvar alterações: ' + error.message)
  } else {
    // Update local state
    selectedPatient = { ...selectedPatient, ...updates }
    showToast('Alterações salvas com sucesso!')
  }
  
  loading = false
  render()
}

async function handleSaveConsultation(e: Event) {
  e.preventDefault()
  if (!selectedPatient) return

  const form = document.querySelector('#new-consultation-form') as HTMLFormElement
  const formData = new FormData(form)
  const data: any = Object.fromEntries(formData.entries())
  
  // Format numeric values
  data.paciente_id = selectedPatient.id
  data.peso = parseFloat(data.peso)
  data.cintura = data.cintura ? parseFloat(data.cintura) : null
  data.quadril = data.quadril ? parseFloat(data.quadril) : null
  data.percentual_gordura = data.percentual_gordura ? parseFloat(data.percentual_gordura) : null
  
  loading = true
  render()

  const { error } = await supabase
    .from('consultas')
    .insert([data])
  
  if (error) {
    alert('Erro ao salvar consulta: ' + error.message)
  } else {
    isConsultationModalOpen = false
    await loadPatientProfile(selectedPatient.id)
    showToast('Consulta salva com sucesso!')
  }
  
  loading = false
  render()
}

function showToast(message: string) {
  const toast = document.querySelector('#toast')
  if (toast) {
    toast.textContent = '✓ ' + message
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 3000)
  }
}

let weightChart: any = null

function renderWeightChart() {
  const ctx = document.getElementById('weightChart') as HTMLCanvasElement
  if (!ctx) return

  if (weightChart) {
    weightChart.destroy()
  }

  const sortedConsultations = [...patientConsultations].sort((a, b) => 
    new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
  )

  const labels = sortedConsultations.map(c => new Date(c.data_consulta).toLocaleDateString('pt-BR'))
  const data = sortedConsultations.map(c => c.peso)

  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Peso (kg)',
        data: data,
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2ecc71',
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: '#f0f0f0' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  })
}

function attachEvents() {
  // Navigation
  document.querySelector('#go-signup')?.addEventListener('click', (e) => {
    e.preventDefault()
    view = 'signup'
    errorMessage = ''
    render()
  })
  
  document.querySelector('#go-login')?.addEventListener('click', (e) => {
    e.preventDefault()
    view = 'login'
    errorMessage = ''
    successMessage = ''
    render()
  })

  document.querySelector('#go-forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault()
    view = 'forgot-password'
    errorMessage = ''
    successMessage = ''
    render()
  })

  document.querySelector('#back-to-login')?.addEventListener('click', (e) => {
    e.preventDefault()
    view = 'login'
    errorMessage = ''
    successMessage = ''
    render()
  })

  // Password Toggle
  const toggles = [
    { btn: '#toggle-login-password', input: '#password' },
    { btn: '#toggle-signup-password', input: '#password' },
    { btn: '#toggle-new-password', input: '#new-password' }
  ]
  toggles.forEach(t => {
    document.querySelector(t.btn)?.addEventListener('click', () => {
      const input = document.querySelector(t.input) as HTMLInputElement
      if (input.type === 'password') {
        input.type = 'text'
        document.querySelector(t.btn)!.innerHTML = eyeOpenIcon
      } else {
        input.type = 'password'
        document.querySelector(t.btn)!.innerHTML = eyeClosedIcon
      }
    })
  })

  document.querySelector('#nav-dashboard')?.addEventListener('click', () => {
    view = 'dashboard'
    render()
  })

  document.querySelector('#nav-patients')?.addEventListener('click', () => {
    view = 'patients'
    render()
  })

  document.querySelector('#nav-profile')?.addEventListener('click', () => {
    view = 'profile'
    errorMessage = ''
    successMessage = ''
    render()
  })

  document.querySelector('#btn-new-patient')?.addEventListener('click', () => {
    view = 'patient-form'
    currentTab = 'pessoal'
    render()
  })

  document.querySelector('#btn-cancel-patient')?.addEventListener('click', () => {
    view = 'patients'
    render()
  })

  // Patient Search
  document.querySelector('#patient-search')?.addEventListener('input', (e) => {
    searchTerm = (e.target as HTMLInputElement).value
    render()
    document.querySelector<HTMLInputElement>('#patient-search')?.focus()
  })

  // Form Change Listeners to preserve state
  document.querySelector('#patient-form')?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const name = target.name
    if (!name) return
    
    if (target.type === 'checkbox') {
      const formData = new FormData(document.querySelector('#patient-form') as HTMLFormElement)
      patientFormData[name] = formData.getAll(name)
    } else {
      patientFormData[name] = target.value
    }

    if (name === 'data_nascimento') calculateAge()
    if (name === 'peso_inicial' || name === 'altura') calculateIMC()
  })

  document.querySelector('#patient-form')?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement
    if (target.name === 'atividade_fisica') {
      patientFormData.atividade_fisica = target.value
      render()
    }
    if (target.tagName === 'SELECT') {
      patientFormData[target.name] = target.value
    }
  })

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Save current form data before switching (Creation Form)
      const form = document.querySelector('#patient-form') as HTMLFormElement
      if (form) {
        const formData = new FormData(form)
        const entries = Object.fromEntries(formData.entries())
        Object.keys(entries).forEach(key => {
          if (key === 'objetivos' || key === 'patologias') {
            patientFormData[key] = formData.getAll(key)
          } else {
            patientFormData[key] = entries[key]
          }
        })
      }
      
      // Save current form data before switching (Profile Form)
      const editForm = document.querySelector('#edit-patient-form') as HTMLFormElement
      if (editForm && selectedPatient) {
        const formData = new FormData(editForm)
        const entries = Object.fromEntries(formData.entries())
        selectedPatient = { ...selectedPatient, ...entries }
      }

      currentTab = (btn as HTMLElement).dataset.tab as any
      render()
    })
  })

  // Form Calculations
  document.querySelector('#form-dob')?.addEventListener('change', calculateAge)
  document.querySelector('#form-weight')?.addEventListener('input', calculateIMC)
  document.querySelector('#form-height')?.addEventListener('input', calculateIMC)
  document.querySelector('#form-exercise')?.addEventListener('change', (e) => {
    const desc = document.querySelector('#form-exercise-desc') as HTMLElement
    desc.style.display = (e.target as HTMLSelectElement).value === 'true' ? 'block' : 'none'
  })

  // Time formatting
  const timeFields = ['#form-wake', '#form-sleep']
  timeFields.forEach(selector => {
    document.querySelector(selector)?.addEventListener('blur', (e) => {
      const input = e.target as HTMLInputElement
      let val = input.value.replace(/\D/g, '')
      if (val.length === 1) val = '0' + val + ':00'
      else if (val.length === 2) val = val + ':00'
      else if (val.length === 3) val = '0' + val[0] + ':' + val.slice(1)
      else if (val.length === 4) val = val.slice(0, 2) + ':' + val.slice(2)
      input.value = val
    })
  })

  // Patient Form Submit
  document.querySelector('#patient-form')?.addEventListener('submit', handlePatientSubmit)

  // Auth Forms
  document.querySelector('#login-form')?.addEventListener('submit', handleLogin)
  document.querySelector('#signup-form')?.addEventListener('submit', handleSignup)
  document.querySelector('#forgot-password-form')?.addEventListener('submit', handleForgotPassword)
  document.querySelector('#update-password-form')?.addEventListener('submit', handleUpdatePassword)
  document.querySelector('#update-profile-form')?.addEventListener('submit', handleUpdateProfile)
  
  // Logout
  document.querySelector('#logout-btn')?.addEventListener('click', handleLogout)
  
  // Patient links
  document.querySelectorAll('.patient-card, .patient-item, .patient-item-mini').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const id = (link as HTMLElement).dataset.id
      if (id) loadPatientProfile(id)
    })
  })

  // Profile Section Events
  document.querySelector('#btn-back-patients')?.addEventListener('click', () => {
    view = 'patients'
    render()
  })

  document.querySelector('#btn-save-profile')?.addEventListener('click', handleSavePatientProfile)

  document.querySelector('#btn-open-consultation')?.addEventListener('click', () => {
    isConsultationModalOpen = true
    render()
  })

  document.querySelector('#btn-close-modal')?.addEventListener('click', () => {
    isConsultationModalOpen = false
    render()
  })

  document.querySelector('#new-consultation-form')?.addEventListener('submit', handleSaveConsultation)

  // Meal Plan Events
  document.querySelector('#btn-generate-plan')?.addEventListener('click', handleGeneratePlan)
  
  document.querySelector('#btn-save-plan')?.addEventListener('click', handleSavePlan)
  
  document.querySelector('#btn-close-plan-modal')?.addEventListener('click', () => {
    isPlanModalOpen = false
    generatedPlan = null
    render()
  })
  
  document.querySelector('#btn-cancel-plan')?.addEventListener('click', () => {
    isPlanModalOpen = false
    generatedPlan = null
    render()
  })

  document.querySelectorAll('.view-plan-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const id = (btn as HTMLElement).dataset.id
      const plan = patientPlans.find(p => p.id === id)
      if (plan) {
        generatedPlan = { ...plan.conteudo, id: plan.id }
        isPlanModalOpen = true
        render()
      }
    })
  })
}

function calculateAge() {
  const dob = (document.querySelector('#form-dob') as HTMLInputElement).value
  if (!dob) return
  const age = Math.floor((new Date().getTime() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  const ageInput = document.querySelector('#form-age') as HTMLInputElement
  if (ageInput) ageInput.value = age + ' anos'
}

function calculateIMC() {
  const weight = parseFloat((document.querySelector('#form-weight') as HTMLInputElement).value)
  const height = parseFloat((document.querySelector('#form-height') as HTMLInputElement).value)
  if (weight && height) {
    const imc = (weight / ((height / 100) * (height / 100))).toFixed(1)
    const imcInput = document.querySelector('#form-imc') as HTMLInputElement
    if (imcInput) imcInput.value = imc
  }
}

async function handlePatientSubmit(e: Event) {
  e.preventDefault()
  
  const data = { ...patientFormData }
  
  // Final clean up and types
  data.nutricionista_id = currentUser.id
  data.atividade_fisica = data.atividade_fisica === 'true'
  data.peso_inicial = data.peso_inicial ? parseFloat(data.peso_inicial) : null
  data.altura = data.altura ? parseFloat(data.altura) : null
  data.refeicoes_por_dia = data.refeicoes_por_dia ? parseInt(data.refeicoes_por_dia) : null
  data.litros_agua = data.litros_agua ? parseFloat(data.litros_agua) : null

  loading = true
  render()
  
  const { error } = await supabase
    .from('pacientes')
    .insert([data])
    .select()
    .single()
  
  if (error) {
    alert('Erro ao salvar paciente: ' + error.message)
    loading = false
    render()
  } else {
    // Show Toast
    const toast = document.querySelector('#toast')
    toast?.classList.add('show')
    
    // Reset form state
    patientFormData = {
      nome: '',
      data_nascimento: '',
      sexo: '',
      email: '',
      telefone: '',
      whatsapp: '',
      peso_inicial: '',
      altura: '',
      nivel_atividade: '',
      objetivos: [],
      objetivo_texto: '',
      patologias: ['Nenhuma'],
      medicamentos: '',
      suplementos: '',
      refeicoes_por_dia: '',
      horario_acorda: '',
      horario_dorme: '',
      litros_agua: '',
      atividade_fisica: 'false',
      atividade_fisica_descricao: '',
      observacoes: ''
    }

    setTimeout(() => {
      toast?.classList.remove('show')
      patients = [] // Force reload
      view = 'patients'
      render()
    }, 2000)
  }
}

async function handleLogin(e: Event) {
  e.preventDefault()
  const emailInput = document.querySelector('#email') as HTMLInputElement
  const passwordInput = document.querySelector('#password') as HTMLInputElement
  
  if (!emailInput || !passwordInput) return

  const email = emailInput.value
  const password = passwordInput.value
  
  loading = true
  errorMessage = ''
  successMessage = ''
  render()
  
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      console.error('Login error:', error)
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'E-mail ou senha incorretos. Verifique suas credenciais.'
      } else if (error.message === 'Email not confirmed') {
        errorMessage = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.'
      } else {
        errorMessage = 'Erro ao entrar: ' + error.message
      }
      loading = false
      render()
    }
    // Success will be handled by onAuthStateChange
  } catch (err: any) {
    errorMessage = 'Erro inesperado: ' + err.message
    loading = false
    render()
  }
}

async function handleForgotPassword(e: Event) {
  e.preventDefault()
  const emailInput = document.querySelector('#reset-email') as HTMLInputElement
  if (!emailInput) return

  const email = emailInput.value
  
  loading = true
  errorMessage = ''
  successMessage = ''
  render()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  })
  
  if (error) {
    errorMessage = 'Erro ao enviar e-mail: ' + error.message
  } else {
    if (email.includes('teste@teste') || email.includes('teste@nutri.com')) {
      successMessage = 'E-mail de recuperação enviado para mh68.senai@gmail.com!'
    } else {
      successMessage = 'E-mail de recuperação enviado! Verifique sua caixa de entrada.'
    }
  }
  
  loading = false
  render()
}

async function handleUpdatePassword(e: Event) {
  e.preventDefault()
  const newPassword = (document.querySelector('#new-password') as HTMLInputElement).value
  const confirmPassword = (document.querySelector('#confirm-new-password') as HTMLInputElement).value
  
  const errorBox = document.querySelector('#profile-error') as HTMLElement
  const successBox = document.querySelector('#profile-success') as HTMLElement
  
  if (newPassword !== confirmPassword) {
    errorBox.textContent = 'As senhas não coincidem.'
    errorBox.style.display = 'block'
    return
  }
  
  loading = true
  render()
  
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  
  if (error) {
    errorBox.textContent = 'Erro ao atualizar: ' + error.message
    errorBox.style.display = 'block'
    successBox.style.display = 'none'
  } else {
    successBox.textContent = 'Senha atualizada com sucesso!'
    successBox.style.display = 'block'
    errorBox.style.display = 'none'
    // Clear fields
    const form = document.querySelector('#update-password-form') as HTMLFormElement
    form.reset()
  }
  
  loading = false
  render()
}

async function handleUpdateProfile(e: Event) {
  e.preventDefault()
  const fullName = (document.querySelector('#prof-full-name') as HTMLInputElement).value
  const preferredName = (document.querySelector('#prof-preferred-name') as HTMLInputElement).value
  const crn = (document.querySelector('#prof-crn') as HTMLInputElement).value
  const phone = (document.querySelector('#prof-phone') as HTMLInputElement).value
  const specialty = (document.querySelector('#prof-specialty') as HTMLInputElement).value
  const email = (document.querySelector('#prof-email') as HTMLInputElement).value
  
  const errorBox = document.querySelector('#personal-error') as HTMLElement
  const successBox = document.querySelector('#personal-success') as HTMLElement
  
  loading = true
  render()
  
  const { error } = await supabase.auth.updateUser({
    email: email,
    data: {
      full_name: fullName,
      preferred_name: preferredName,
      crn: crn,
      telefone: phone,
      especialidade: specialty
    }
  })
  
  if (error) {
    errorBox.textContent = 'Erro ao atualizar: ' + error.message
    errorBox.style.display = 'block'
    successBox.style.display = 'none'
  } else {
    successBox.textContent = 'Perfil atualizado com sucesso!'
    if (email !== currentUser.email) {
      successBox.textContent += ' Verifique seu novo e-mail para confirmar a alteração.'
    }
    successBox.style.display = 'block'
    errorBox.style.display = 'none'
  }
  
  loading = false
  render()
}

async function handleSignup(e: Event) {
  e.preventDefault()
  const fullName = (document.querySelector('#full-name') as HTMLInputElement).value
  const preferredName = (document.querySelector('#preferred-name') as HTMLInputElement).value
  const crn = (document.querySelector('#crn') as HTMLInputElement).value
  const phone = (document.querySelector('#prof-telefone') as HTMLInputElement).value
  const specialty = (document.querySelector('#especialidade') as HTMLInputElement).value
  const email = (document.querySelector('#email') as HTMLInputElement).value
  const password = (document.querySelector('#password') as HTMLInputElement).value
  const confirmPassword = (document.querySelector('#confirm-password') as HTMLInputElement).value
  
  if (password !== confirmPassword) {
    errorMessage = 'As senhas não coincidem.'
    render()
    return
  }
  
  loading = true
  errorMessage = ''
  render()
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        preferred_name: preferredName,
        crn: crn,
        telefone: phone,
        especialidade: specialty
      }
    }
  })
  
  if (error) {
    errorMessage = 'Erro ao criar conta: ' + error.message
    loading = false
    render()
  } else {
    // Supabase might require email confirmation, but usually redirects or shows message
    errorMessage = 'Conta criada! Verifique seu e-mail ou faça login.'
    loading = false
    view = 'login'
    render()
  }
}

async function handleLogout() {
  await supabase.auth.signOut()
}

// --- Init ---

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session)
  currentUser = session?.user
  
  if (session) {
    view = 'dashboard'
  } else {
    // Avoid resetting view if user is already on signup
    if (view !== 'signup') view = 'login'
  }
  
  loading = false
  render()
})

// Initial Check
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user
    view = 'dashboard'
  }
  render()
})
