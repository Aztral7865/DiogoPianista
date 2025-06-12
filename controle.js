// ATUALIZADO: Importamos 'updateDoc' e 'doc' do Firestore para a edição
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, doc, setDoc, collectionGroup, query, where, Timestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";

// --- Configuração do Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyCe29-1INkXI_3y_p0_ye0CGQi_VoFbYnY",
    authDomain: "bd-controle-de-alunos.firebaseapp.com",
    projectId: "bd-controle-de-alunos",
    storageBucket: "bd-controle-de-alunos.firebasestorage.app",
    messagingSenderId: "196611678002",
    appId: "1:196611678002:web:fdc0b28a0737b9c0a0412b"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variáveis globais
let calendario;
let listaDeAlunos = [];

// ======================================================= //
//  1. INICIALIZAÇÃO E ROTINAS GERAIS
// ======================================================= //
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            setupUI();
            carregarDadosIniciais();
        } else {
            window.location.href = "index.html";
        }
    });
});

function setupUI() {
    setupNavigation();
    setupAddAlunoModal();
    setupAddAulaModal();
    setupLogout();
    inicializarCalendario();
    setupEventListenersTabelaAlunos();

    const mobileMenuToggles = document.querySelectorAll('.mobile-menu-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (sidebar) {
        mobileMenuToggles.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                sidebar.classList.add('active');
            });
        });

        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        }

        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }
}

// ✅ FUNÇÃO PRINCIPAL DE DADOS ATUALIZADA ✅
async function carregarDadosIniciais() {
    try {
        // Busca todos os alunos, aulas e pagamentos de uma vez
        const [alunosSnapshot, pagamentosSnapshot, aulasSnapshot] = await Promise.all([
            getDocs(collection(db, "alunos")),
            getDocs(query(collectionGroup(db, 'pagamentos'), where('mes_referencia', '==', getMesRef(new Date())))),
            getDocs(collection(db, "aulas"))
        ]);

        listaDeAlunos = alunosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pagamentosDoMes = pagamentosSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        const aulasAvulsas = aulasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Separa os alunos por status
        const alunosAtivos = listaDeAlunos.filter(a => a.status === 'Ativo');
        const alunosInativos = listaDeAlunos.filter(a => a.status !== 'Ativo');

        // Renderiza as seções com os dados filtrados
        renderizarTabelaAlunos(alunosAtivos, document.getElementById('listaAlunosDashboard'));
        renderizarPagamentos(alunosAtivos, pagamentosDoMes);
        renderizarCards(alunosAtivos, pagamentosDoMes);
        atualizarEventosCalendario(alunosAtivos, aulasAvulsas);
        renderizarHistoricoAlunos(alunosInativos, document.getElementById('listaAlunosHistorico')); // Nova chamada

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}


// ======================================================= //
//  2. NAVEGAÇÃO E MODAIS
// ======================================================= //
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a, .sidebar-footer .logout-button');
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            if (link.id === 'logoutBtn') return;

            e.preventDefault();
            document.querySelectorAll('.modal-container.active').forEach(modal => modal.classList.remove('active'));

            const href = link.getAttribute('href');
            if (href === '#') return;
            showSection(href.substring(1));

            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            if (link.closest('.sidebar-nav')) {
                link.classList.add('active');
            }

            document.querySelector('.sidebar')?.classList.remove('active');
        });
    });
}


function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });

    if (sectionId === 'agendar-section' && calendario) {
        setTimeout(() => calendario.updateSize(), 10);
    }
}

function setupAddAlunoModal() {
    const modal = document.getElementById('add-aluno-modal');
    const form = document.getElementById('form-add-aluno');
    const modalTitle = document.getElementById('aluno-modal-title');

    document.querySelectorAll('.add-aluno-btn').forEach(btn => btn.addEventListener('click', () => {
        form.reset();
        modalTitle.textContent = 'Adicionar Novo Aluno';
        form['aluno-id-edit'].value = '';
        modal.classList.add('active');
    }));

    document.querySelectorAll('#add-aluno-modal .close-modal-btn, #add-aluno-modal .cancel-modal-btn').forEach(btn => btn.addEventListener('click', () => {
        modal.classList.remove('active');
    }));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idParaEditar = form['aluno-id-edit'].value;

        const dadosAluno = {
            nome_completo: form['nome-completo'].value,
            email: form['email'].value,
            instrumento_principal: form['instrumento-principal'].value,
            nivel: form['nivel-proficiencia'].value,
            valor_mensalidade: parseFloat(form['valor-mensalidade'].value) || 0,
            dia_semana: form['dia-semana'].value,
            horario_aula: form['horario-aula'].value,
            status: 'Ativo' // Sempre adiciona ou edita como 'Ativo'
        };

        try {
            if (idParaEditar) {
                const alunoRef = doc(db, 'alunos', idParaEditar);
                await updateDoc(alunoRef, dadosAluno);
                alert('Aluno atualizado com sucesso!');
            } else {
                dadosAluno.criado_em = serverTimestamp();
                await addDoc(collection(db, "alunos"), dadosAluno);
                alert('Aluno adicionado com sucesso!');
            }

            form.reset();
            modal.classList.remove('active');
            carregarDadosIniciais();
        } catch (error) {
            console.error("Erro ao salvar aluno:", error);
            alert("Não foi possível salvar as informações do aluno.");
        }
    });
}

function abrirModalDeEdicao(aluno) {
    const modal = document.getElementById('add-aluno-modal');
    const form = document.getElementById('form-add-aluno');
    const modalTitle = document.getElementById('aluno-modal-title');

    modalTitle.textContent = 'Editar Aluno';
    form['aluno-id-edit'].value = aluno.id;
    form['nome-completo'].value = aluno.nome_completo;
    form['email'].value = aluno.email || '';
    form['instrumento-principal'].value = aluno.instrumento_principal || '';
    form['nivel-proficiencia'].value = aluno.nivel || '';
    form['valor-mensalidade'].value = aluno.valor_mensalidade || 0;
    form['dia-semana'].value = aluno.dia_semana || '';
    form['horario-aula'].value = aluno.horario_aula || '';

    modal.classList.add('active');
}

// ✅ FUNÇÃO DE EVENTOS ATUALIZADA ✅
function setupEventListenersTabelaAlunos() {
    // Delegação de eventos para as duas tabelas
    const dashboardTabela = document.getElementById('listaAlunosDashboard');
    const historicoTabela = document.getElementById('listaAlunosHistorico');

    // Listener para a tabela de alunos ativos
    if (dashboardTabela) {
        dashboardTabela.addEventListener('click', (e) => {
            const editButton = e.target.closest('.btn-edit-aluno');
            const inactivateButton = e.target.closest('.btn-inactivate-aluno');

            if (editButton) {
                const alunoId = editButton.dataset.id;
                const alunoParaEditar = listaDeAlunos.find(a => a.id === alunoId);
                if (alunoParaEditar) {
                    abrirModalDeEdicao(alunoParaEditar);
                }
            }

            if (inactivateButton) {
                const alunoId = inactivateButton.dataset.id;
                if (confirm('Tem certeza que deseja inativar este aluno? Ele sairá da lista de ativos mas seus dados serão mantidos no histórico.')) {
                    inativarAluno(alunoId);
                }
            }
        });
    }

    // Listener para a tabela de histórico
    if (historicoTabela) {
        historicoTabela.addEventListener('click', (e) => {
            const reactivateButton = e.target.closest('.btn-reactivate-aluno');
            if (reactivateButton) {
                const alunoId = reactivateButton.dataset.id;
                if (confirm('Deseja reativar este aluno? Ele voltará para a lista de alunos ativos.')) {
                    reativarAluno(alunoId);
                }
            }
        });
    }
}


function setupAddAulaModal() {
    const modal = document.getElementById('add-aula-modal');
    const formSection = document.getElementById('form-add-aula');
    const viewSection = document.getElementById('view-aula-section');
    const selectAluno = document.getElementById('select-aluno-aula');
    const dataAulaInput = document.getElementById('data-aula');

    const openModalToAdd = () => {
        formSection.style.display = 'block';
        viewSection.style.display = 'none';

        dataAulaInput.value = '';
        selectAluno.innerHTML = '<option value="" disabled selected>Selecione um aluno</option>';
        listaDeAlunos.filter(a => a.status === 'Ativo').forEach(aluno => { // Apenas alunos ativos podem agendar
            const option = document.createElement('option');
            option.value = aluno.id;
            option.textContent = aluno.nome_completo;
            option.dataset.alunoNome = aluno.nome_completo;
            selectAluno.appendChild(option);
        });
        modal.classList.add('active');
    };

    document.getElementById('btn-nova-aula').addEventListener('click', openModalToAdd);

    document.getElementById('btn-show-form-add-aula').addEventListener('click', () => {
        viewSection.style.display = 'none';
        formSection.style.display = 'block';
    });

    document.getElementById('btn-back-to-view').addEventListener('click', () => {
        formSection.style.display = 'none';
        viewSection.style.display = 'block';
    });

    const closeAndResetModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            viewSection.style.display = 'block';
            formSection.style.display = 'none';
        }, 200);
    };

    modal.querySelectorAll('.close-modal-btn, .cancel-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeAndResetModal);
    });

    formSection.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dataStr = formSection['data-aula'].value;
        const horaStr = formSection['horario-nova-aula'].value;
        const selectedOption = selectAluno.options?.[selectAluno.selectedIndex];

        if (!selectedOption || !selectedOption.value) {
            alert('Por favor, selecione um aluno.');
            return;
        }

        const dataHora = new Date(`${dataStr}T${horaStr}`);
        const dataTimestamp = Timestamp.fromDate(dataHora);

        const novaAula = {
            alunoId: selectedOption.value,
            alunoNome: selectedOption.dataset.alunoNome,
            start: dataTimestamp,
            tipo: 'avulsa'
        };

        try {
            await addDoc(collection(db, "aulas"), novaAula);
            formSection.reset();
            closeAndResetModal();
            carregarDadosIniciais();
        } catch (error) {
            console.error("Erro ao agendar aula:", error);
            alert("Não foi possível agendar a aula.");
        }
    });
}

function setupLogout() {
    const logoutButton = document.getElementById("logoutBtn");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            signOut(auth).catch((error) => console.error("Erro ao fazer logout:", error));
        });
    }
}

// ======================================================= //
//  3. LÓGICA DO CALENDÁRIO
// ======================================================= //
function inicializarCalendario() {
    const calendarEl = document.getElementById('calendario');
    if (!calendarEl || calendario) return;

    const modal = document.getElementById('add-aula-modal');
    const viewSection = document.getElementById('view-aula-section');
    const formSection = document.getElementById('form-add-aula');
    const viewTitle = document.getElementById('view-aula-title');
    const viewList = document.getElementById('view-aula-list');
    const dataAulaInput = document.getElementById('data-aula');
    const selectAluno = document.getElementById('select-aluno-aula');

    calendario = new FullCalendar.Calendar(calendarEl, {
        locale: 'pt-br',
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        buttonText: { today: 'Hoje', month: 'Mês', week: 'Semana' },
        height: 'auto',
        events: [],
        eventClick: (info) => {
            console.log("Evento clicado:", info.event);
        },
        dateClick: (info) => {
            viewSection.style.display = 'block';
            formSection.style.display = 'none';

            const clickedDate = info.date;
            const eventsOnDate = calendario.getEvents().filter(event => {
                return new Date(event.start).toDateString() === clickedDate.toDateString();
            }).sort((a, b) => a.start - b.start);

            viewTitle.textContent = `Aulas de ${clickedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`;

            if (eventsOnDate.length > 0) {
                viewList.innerHTML = '<ul>' + eventsOnDate.map(event => {
                    const time = event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return `<li><strong>${time}</strong> - ${event.title}</li>`;
                }).join('') + '</ul>';
            } else {
                viewList.innerHTML = '<p>Nenhuma aula agendada para este dia.</p>';
            }

            const userTimezoneOffset = clickedDate.getTimezoneOffset() * 60000;
            const correctedDate = new Date(clickedDate.getTime() - userTimezoneOffset);
            dataAulaInput.value = correctedDate.toISOString().slice(0, 10);

            selectAluno.innerHTML = '<option value="" disabled selected>Selecione um aluno</option>';
            listaDeAlunos.filter(a => a.status === 'Ativo').forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id;
                option.textContent = aluno.nome_completo;
                option.dataset.alunoNome = aluno.nome_completo;
                selectAluno.appendChild(option);
            });
            modal.classList.add('active');
        }
    });
    calendario.render();
}

function atualizarEventosCalendario(alunosAtivos, aulasAvulsas) { // Agora recebe só os ativos
    if (!calendario) return;
    const eventos = [];
    alunosAtivos.forEach(aluno => {
        if (aluno.dia_semana && aluno.horario_aula) {
            eventos.push({
                title: aluno.nome_completo,
                daysOfWeek: [parseInt(aluno.dia_semana)],
                startTime: aluno.horario_aula,
                extendedProps: { alunoId: aluno.id, tipo: 'recorrente' }
            });
        }
    });
    aulasAvulsas.forEach(aula => {
        eventos.push({
            title: aula.alunoNome,
            start: aula.start.toDate(),
            extendedProps: { alunoId: aula.alunoId, tipo: 'avulsa', docId: aula.id },
            backgroundColor: '#1E90FF',
            borderColor: '#1E90FF'
        });
    });
    calendario.removeAllEventSources();
    calendario.addEventSource(eventos);
}

// ======================================================= //
//  4. FUNÇÕES DE RENDERIZAÇÃO
// ======================================================= //

// ✅ FUNÇÃO ATUALIZADA PARA INATIVAR ✅
function renderizarTabelaAlunos(alunosAtivos, tableBody) {
    tableBody.innerHTML = '';
    if (!alunosAtivos || alunosAtivos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Nenhum aluno ativo.</td></tr>';
        return;
    }
    alunosAtivos.forEach((aluno, index) => {
        const diaFixo = aluno.dia_semana && aluno.dia_semana !== "" ? ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][parseInt(aluno.dia_semana)] : null;
        const proximaAulaTexto = diaFixo ? `${diaFixo} ${aluno.horario_aula}` : '--';
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><div class="aluno-info"><img src="https://i.pravatar.cc/40?img=${index + 1}" alt="Foto"><div><span class="aluno-nome">${aluno.nome_completo}</span><span class="aluno-email">${aluno.email}</span></div></div></td>
            <td><span class="tag tag-instrumento">${aluno.instrumento_principal}</span></td>
            <td>${aluno.nivel}</td>
            <td>${proximaAulaTexto}</td>
            <td><span class="tag tag-pagamento-pendente">Pendente</span></td>
            <td class="acoes-botoes">
                <button class="btn-edit-aluno" data-id="${aluno.id}" title="Editar"><i class="fa-regular fa-pen-to-square"></i></button>
                <button class="btn-inactivate-aluno" data-id="${aluno.id}" title="Inativar"><i class="fa-solid fa-user-slash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// ✅ NOVA FUNÇÃO PARA O HISTÓRICO ✅
function renderizarHistoricoAlunos(alunosInativos, tableBody) {
    tableBody.innerHTML = '';
    if (!alunosInativos || alunosInativos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">Nenhum aluno no histórico.</td></tr>';
        return;
    }
    alunosInativos.forEach((aluno, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><div class="aluno-info"><img src="https://i.pravatar.cc/40?img=h${index + 1}" alt="Foto"><div><span class="aluno-nome">${aluno.nome_completo}</span><span class="aluno-email">${aluno.email}</span></div></div></td>
            <td><span class="tag tag-instrumento">${aluno.instrumento_principal}</span></td>
            <td>${aluno.nivel}</td>
            <td><span class="tag tag-pagamento-atrasado">${aluno.status || 'Inativo'}</span></td>
            <td class="acoes-botoes">
                <button class="btn-reactivate-aluno" data-id="${aluno.id}" title="Reativar Aluno"><i class="fa-solid fa-user-check"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderizarPagamentos(alunosAtivos, pagamentosDoMes) { // Recebe só os ativos
    const tableBody = document.getElementById('listaPagamentos');
    const header = document.getElementById('header-pagamentos');
    tableBody.innerHTML = '';
    const agora = new Date();
    const nomeMes = agora.toLocaleString('pt-BR', { month: 'long' });
    header.textContent = `Pagamentos de ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${agora.getFullYear()}`;
    if (!alunosAtivos || alunosAtivos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3">Nenhum aluno ativo para exibir.</td></tr>';
        return;
    }
    alunosAtivos.forEach((aluno, index) => {
        const pagamentoAluno = pagamentosDoMes.find(p => p.alunoId === aluno.id);
        const statusAtual = pagamentoAluno ? pagamentoAluno.status : 'Pendente';
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><div class="aluno-info"><img src="https://i.pravatar.cc/40?img=${index + 1}" alt="Foto"><div><span class="aluno-nome">${aluno.nome_completo}</span></div></div></td>
            <td>R$ ${aluno.valor_mensalidade ? aluno.valor_mensalidade.toFixed(2).replace('.', ',') : '0,00'}</td>
            <td><select class="status-pagamento-select" data-aluno-id="${aluno.id}" data-valor="${aluno.valor_mensalidade || 0}"><option value="Pendente" ${statusAtual === 'Pendente' ? 'selected' : ''}>Pendente</option><option value="Pago" ${statusAtual === 'Pago' ? 'selected' : ''}>Pago</option><option value="Atrasado" ${statusAtual === 'Atrasado' ? 'selected' : ''}>Atrasado</option></select></td>
        `;
        tableBody.appendChild(tr);
    });
    document.querySelectorAll('.status-pagamento-select').forEach(select => {
        select.addEventListener('change', handleStatusChange);
    });
}

function renderizarCards(alunosAtivos, pagamentosDoMes) { // Recebe só os ativos
    document.getElementById('total-alunos').textContent = alunosAtivos.length;

    const receitaMesAtual = alunosAtivos.reduce((acc, aluno) => {
        const pagamento = pagamentosDoMes.find(p => p.alunoId === aluno.id && p.status === 'Pago');
        return acc + (pagamento ? pagamento.valor : 0);
    }, 0);
    document.getElementById('receita-mensal').textContent = `R$ ${receitaMesAtual.toFixed(2).replace('.', ',')}`;

    // As demais métricas podem ser calculadas aqui
    document.getElementById('aulas-semana').textContent = "--";
    document.getElementById('horas-ensino').textContent = "--h";
}

// ======================================================= //
//  5. FUNÇÕES DE AÇÃO E APOIO
// ======================================================= //

// ✅ NOVAS FUNÇÕES DE INATIVAR E REATIVAR ✅
async function inativarAluno(id) {
    try {
        const alunoRef = doc(db, 'alunos', id);
        await updateDoc(alunoRef, { status: 'Inativo' });
        alert('Aluno inativado com sucesso!');
        carregarDadosIniciais(); // Recarrega tudo para atualizar as telas
    } catch (error) {
        console.error("Erro ao inativar aluno:", error);
        alert('Ocorreu um erro ao inativar o aluno.');
    }
}

async function reativarAluno(id) {
    try {
        const alunoRef = doc(db, 'alunos', id);
        await updateDoc(alunoRef, { status: 'Ativo' });
        alert('Aluno reativado com sucesso!');
        carregarDadosIniciais(); // Recarrega tudo para atualizar as telas
    } catch (error) {
        console.error("Erro ao reativar aluno:", error);
        alert('Ocorreu um erro ao reativar o aluno.');
    }
}

async function handleStatusChange(event) {
    const select = event.target;
    const novoStatus = select.value;
    const alunoId = select.dataset.alunoId;
    const valor = parseFloat(select.dataset.valor);
    const mesReferencia = getMesRef(new Date());

    try {
        const pagamentosRef = doc(db, 'alunos', alunoId, 'pagamentos', mesReferencia);
        await setDoc(pagamentosRef, {
            status: novoStatus,
            valor: valor,
            alunoId: alunoId,
            mes_referencia: mesReferencia,
            atualizado_em: serverTimestamp()
        }, { merge: true });

        carregarDadosIniciais();
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
    }
}

function getMesRef(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
