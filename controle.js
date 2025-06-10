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
    // NOVO: Chamamos a função para configurar os cliques na tabela de alunos
    setupEventListenersTabelaAlunos();
}

async function carregarDadosIniciais() {
    try {
        const [alunosSnapshot, pagamentosSnapshot, aulasSnapshot] = await Promise.all([
            getDocs(collection(db, "alunos")),
            getDocs(query(collectionGroup(db, 'pagamentos'), where('mes_referencia', '==', getMesRef(new Date())))),
            getDocs(collection(db, "aulas"))
        ]);

        listaDeAlunos = alunosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pagamentosDoMes = pagamentosSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        const aulasAvulsas = aulasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        renderizarTabelaAlunos(listaDeAlunos, document.getElementById('listaAlunosDashboard'));
        renderizarPagamentos(listaDeAlunos, pagamentosDoMes);
        renderizarCards(listaDeAlunos, pagamentosDoMes);
        atualizarEventosCalendario(listaDeAlunos, aulasAvulsas);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// ======================================================= //
//  2. NAVEGAÇÃO E MODAIS
// ======================================================= //
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href === '#') return;
            showSection(href.substring(1));
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
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

// ATUALIZADO: A lógica de submissão do formulário agora diferencia entre ADICIONAR e EDITAR
function setupAddAlunoModal() {
    const modal = document.getElementById('add-aluno-modal');
    const form = document.getElementById('form-add-aluno');
    const modalTitle = document.getElementById('aluno-modal-title');

    // Abre o modal para ADICIONAR um novo aluno
    document.querySelectorAll('.add-aluno-btn').forEach(btn => btn.addEventListener('click', () => {
        form.reset(); // Limpa o formulário
        modalTitle.textContent = 'Adicionar Novo Aluno'; // Define o título para "Adicionar"
        form['aluno-id-edit'].value = ''; // Garante que o campo de ID esteja vazio
        modal.classList.add('active');
    }));

    // Fecha o modal
    document.querySelectorAll('#add-aluno-modal .close-modal-btn, #add-aluno-modal .cancel-modal-btn').forEach(btn => btn.addEventListener('click', () => {
        modal.classList.remove('active');
    }));

    // Lógica de submissão do formulário
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
            status: 'Ativo'
        };

        try {
            if (idParaEditar) {
                // MODO DE EDIÇÃO: Atualiza um documento existente
                const alunoRef = doc(db, 'alunos', idParaEditar);
                await updateDoc(alunoRef, dadosAluno);
                alert('Aluno atualizado com sucesso!');
            } else {
                // MODO DE ADIÇÃO: Cria um novo documento
                dadosAluno.criado_em = serverTimestamp();
                await addDoc(collection(db, "alunos"), dadosAluno);
                alert('Aluno adicionado com sucesso!');
            }

            form.reset();
            modal.classList.remove('active');
            carregarDadosIniciais(); // Recarrega os dados para mostrar as alterações
        } catch (error) {
            console.error("Erro ao salvar aluno:", error);
            alert("Não foi possível salvar as informações do aluno.");
        }
    });
}

// NOVO: Função para abrir o modal de edição e preencher com dados
function abrirModalDeEdicao(aluno) {
    const modal = document.getElementById('add-aluno-modal');
    const form = document.getElementById('form-add-aluno');
    const modalTitle = document.getElementById('aluno-modal-title');

    // 1. Mudar o título do modal
    modalTitle.textContent = 'Editar Aluno';

    // 2. Preencher o formulário com os dados do aluno
    form['aluno-id-edit'].value = aluno.id; // IMPORTANTE: Define o ID no campo oculto
    form['nome-completo'].value = aluno.nome_completo;
    form['email'].value = aluno.email || '';
    form['instrumento-principal'].value = aluno.instrumento_principal || '';
    form['nivel-proficiencia'].value = aluno.nivel || '';
    form['valor-mensalidade'].value = aluno.valor_mensalidade || 0;
    form['dia-semana'].value = aluno.dia_semana || '';
    form['horario-aula'].value = aluno.horario_aula || '';

    // 3. Abrir o modal
    modal.classList.add('active');
}

// NOVO: Função para "ouvir" os cliques nos botões da tabela de alunos
function setupEventListenersTabelaAlunos() {
    const tabelaBody = document.getElementById('listaAlunosDashboard');

    tabelaBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.btn-edit-aluno');
        if (editButton) {
            const alunoId = editButton.dataset.id;
            // Encontra o objeto completo do aluno na nossa lista local
            const alunoParaEditar = listaDeAlunos.find(a => a.id === alunoId);
            if (alunoParaEditar) {
                abrirModalDeEdicao(alunoParaEditar);
            }
        }
    });
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
        listaDeAlunos.forEach(aluno => {
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
            listaDeAlunos.forEach(aluno => {
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

function atualizarEventosCalendario(alunos, aulasAvulsas) {
    if (!calendario) return;
    const eventos = [];
    alunos.forEach(aluno => {
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
//  4. RENDERIZAÇÃO DAS OUTRAS SEÇÕES
// ======================================================= //
// ATUALIZADO: O botão de editar agora tem uma classe e um 'data-id'
function renderizarTabelaAlunos(alunos, tableBody) {
    tableBody.innerHTML = '';
    if (!alunos || alunos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Nenhum aluno cadastrado.</td></tr>';
        return;
    }
    alunos.forEach((aluno, index) => {
        const diaFixo = aluno.dia_semana && aluno.dia_semana !== "" ? ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][parseInt(aluno.dia_semana)] : null;
        const proximaAulaTexto = diaFixo ? `${diaFixo} ${aluno.horario_aula}` : '--';
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><div class="aluno-info"><img src="https://i.pravatar.cc/40?img=${index + 1}" alt="Foto"><div><span class="aluno-nome">${aluno.nome_completo}</span><span class="aluno-email">${aluno.email}</span></div></div></td>
            <td><span class="tag tag-instrumento">${aluno.instrumento_principal}</span></td>
            <td>${aluno.nivel}</td>
            <td>${proximaAulaTexto}</td>
            <td><span class="tag tag-pagamento-pendente">Pendente</span></td>
            <td class="acoes-botoes">
                <button title="Ver"><i class="fa-regular fa-eye"></i></button>
                <button class="btn-edit-aluno" data-id="${aluno.id}" title="Editar"><i class="fa-regular fa-pen-to-square"></i></button>
                <button title="Excluir"><i class="fa-regular fa-trash-can"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderizarPagamentos(alunos, pagamentosDoMes) {
    const tableBody = document.getElementById('listaPagamentos');
    const header = document.getElementById('header-pagamentos');
    tableBody.innerHTML = '';
    const agora = new Date();
    const nomeMes = agora.toLocaleString('pt-BR', { month: 'long' });
    header.textContent = `Pagamentos de ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${agora.getFullYear()}`;
    if (!alunos || alunos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3">Nenhum aluno para exibir.</td></tr>';
        return;
    }
    alunos.forEach((aluno, index) => {
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

function renderizarCards(alunos, pagamentosDoMes) {
    const totalAlunos = alunos.filter(a => a.status === 'Ativo').length;
    document.getElementById('total-alunos').textContent = totalAlunos;
    atualizarCardPercentual('alunos-growth', 0);

    const receitaMesAtual = pagamentosDoMes.filter(p => p.status === 'Pago').reduce((acc, p) => acc + p.valor, 0);
    document.getElementById('receita-mensal').textContent = `R$ ${receitaMesAtual.toFixed(2).replace('.', ',')}`;
    atualizarCardPercentual('receita-growth', 0);

    document.getElementById('aulas-semana').textContent = "--";
    atualizarCardPercentual('aulas-growth', 0);
    document.getElementById('horas-ensino').textContent = "--h";
    atualizarCardPercentual('horas-growth', 0);
}

// ======================================================= //
//  5. FUNÇÕES DE APOIO E EVENTOS
// ======================================================= //
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

function atualizarCardPercentual(elementId, percentual) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const p = Math.round(percentual);
    el.textContent = (p >= 0 ? '+' : '') + p + '%';
    el.classList.remove('text-green', 'text-red');
    if (p > 0) el.classList.add('text-green');
    else if (p < 0) el.classList.add('text-red');
}

function getMesRef(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
