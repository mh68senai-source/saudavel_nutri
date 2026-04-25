import './style.css'
import { supabase } from './supabase'

const app = document.querySelector<HTMLDivElement>('#app')!

// --- State ---
let view: 'login' | 'signup' | 'dashboard' | 'patients' | 'patient-form' | 'forgot-password' | 'profile' = 'login'
let loading = false
let errorMessage = ''
let successMessage = ''
let currentUser: any = null

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
            <button type="button" class="toggle-password" id="toggle-login-password">${eyeOpenIcon}</button>
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
          <input type="text" id="full-name" placeholder="Seu nome" required>
        </div>
        <div class="form-group">
          <label for="email">E-mail</label>
          <input type="email" id="email" placeholder="seu@email.com" required>
        </div>
        <div class="form-group">
          <label for="password">Senha</label>
          <div class="password-wrapper">
            <input type="password" id="password" placeholder="Mínimo 6 caracteres" minlength="6" required>
            <button type="button" class="toggle-password" id="toggle-signup-password">${eyeOpenIcon}</button>
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
          <div class="form-group">
            <label>Nome</label>
            <input type="text" value="${currentUser?.user_metadata?.full_name || ''}" readonly style="background: #f8f9fa;">
          </div>
          <div class="form-group">
            <label>E-mail</label>
            <input type="text" value="${currentUser?.email || ''}" readonly style="background: #f8f9fa;">
          </div>
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
                <button type="button" class="toggle-password" id="toggle-new-password">${eyeOpenIcon}</button>
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
}

// --- Functions ---

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
        document.querySelector(t.btn)!.innerHTML = eyeClosedIcon
      } else {
        input.type = 'password'
        document.querySelector(t.btn)!.innerHTML = eyeOpenIcon
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
      // Save current form data before switching
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
  
  // Logout
  document.querySelector('#logout-btn')?.addEventListener('click', handleLogout)
  
  // Patient links
  document.querySelectorAll('.patient-card, .patient-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const id = (link as HTMLElement).dataset.id
      alert(`Navegando para o perfil do paciente: ${id}`)
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
  
  const { data: newPatient, error } = await supabase
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

async function handleSignup(e: Event) {
  e.preventDefault()
  const fullName = (document.querySelector('#full-name') as HTMLInputElement).value
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
        full_name: fullName
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
