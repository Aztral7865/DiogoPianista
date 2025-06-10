import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 🔹 Configuração do Firebase
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

// 🔥 Splash Screen e Ativação do Site
document.addEventListener('DOMContentLoaded', () => {
    const discoverButton = document.getElementById('discover-button');
    const splashScreen = document.getElementById('splash-screen');
    const siteWrapper = document.getElementById('site-content-wrapper');

    if (siteWrapper) {
        siteWrapper.style.display = 'none';
        siteWrapper.style.opacity = '0';
    }

    function activateMainContent() {
        const template = document.getElementById('conteudo-principal-template');

        if (!siteWrapper) {
            console.error("Elemento #site-content-wrapper não encontrado!");
            return;
        }

        if (template) {
            siteWrapper.innerHTML = "";
            siteWrapper.appendChild(template.content.cloneNode(true));

            siteWrapper.style.display = "block";
            void siteWrapper.offsetWidth;
            siteWrapper.style.opacity = "1";

            initializeSiteLogic();
            setupLoginForm();
        } else {
            console.error("Template não encontrado!");
        }
    }

    if (discoverButton) {
        discoverButton.addEventListener('click', () => {
            splashScreen.classList.add('efeito-camera-zoom');
            setTimeout(() => {
                splashScreen.style.display = "none";
                activateMainContent();
            }, 1900);
        });
    } else {
        console.warn("Botão 'discover-button' não encontrado. Ativando conteúdo principal sem splash.");
        activateMainContent();
    }
});

function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");
            const loginError = document.getElementById("loginError");

            if (!emailInput || !passwordInput || !loginError) {
                console.error("Elementos do formulário de login não encontrados após carregamento.");
                return;
            }

            const email = emailInput.value;
            const senha = passwordInput.value;

            signInWithEmailAndPassword(auth, email, senha)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log("Login realizado! UID:", user.uid);
                    window.location.href = "controle.html";
                })
                .catch((error) => {
                    const loginError = document.getElementById("loginError");
                    loginError.style.display = "block";
                    console.error("FALHA NO LOGIN - CÓDIGO DO ERRO:", error.code);

                    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                        loginError.textContent = "E-mail ou senha inválidos. Verifique os dados e tente novamente.";
                    } else {
                        loginError.textContent = "Ocorreu um erro inesperado. Tente novamente mais tarde.";
                    }
                });
        });
    } else {
        console.warn("Formulário de login (#loginForm) não encontrado. Firebase login não configurado.");
    }
}

// 🔹 Lógica do site (ativação de abas, menus e seções)
function initializeSiteLogic() {
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    const contentSections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link');
    const sectionTriggerButtons = document.querySelectorAll('.section-trigger-button');
    const parallaxBanner = document.getElementById('parallax-banner');
    const header = document.querySelector('header');

    contentSections.forEach(section => {
        if (section.id !== 'parallax-banner') {
            section.style.display = 'none';
        }
    });

    function showSection(targetId, performAutoScroll = false) {
        const isAboutTarget = (targetId === 'sobre');

        if (parallaxBanner) {
            if (isAboutTarget) {
                parallaxBanner.classList.add('visible-section');
            } else {
                parallaxBanner.classList.remove('visible-section');
            }
        }

        contentSections.forEach(section => {
            if (section.id !== 'parallax-banner') {
                if (section.id === targetId) {
                    section.classList.add('visible-section');
                    section.style.display = 'block';
                } else {
                    section.classList.remove('visible-section');
                    section.style.display = 'none';
                }
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active-link');
            const linkTarget = link.getAttribute('href').substring(1);
            if (linkTarget === targetId) {
                link.classList.add('active-link');
            }
        });

        if (performAutoScroll) {
            window.scrollTo(0, 0);
            setTimeout(() => {
                const secaoSobre = document.getElementById('sobre');
                if (secaoSobre && header) {
                    const headerHeight = header.offsetHeight;
                    const secaoSobreTop = secaoSobre.offsetTop;
                    const scrollToPosition = secaoSobreTop - headerHeight;
                    window.scrollTo({
                        top: scrollToPosition,
                        behavior: 'smooth'
                    });
                }
            }, 650);
        } else {
            const targetSectionElement = document.getElementById(targetId);
            if (targetSectionElement && header) {
                const headerHeight = header.offsetHeight;
                const sectionTop = targetSectionElement.offsetTop;
                window.scrollTo({
                    top: sectionTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId, false);
        });
    });

    sectionTriggerButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId, false);
        });
    });

    showSection('sobre', true);

    // ATUALIZADO: Lógica do carrossel com loop infinito bidirecional
    const carouselContainers = document.querySelectorAll('.carousel-container');

    carouselContainers.forEach(container => {
        const track = container.querySelector('.carousel-track');
        if (!track || !track.children.length) return;

        let slides = Array.from(track.children);
        const nextButton = container.querySelector('.carousel-button.next');
        const prevButton = container.querySelector('.carousel-button.prev');

        // 1. Lógica de clonagem para loop infinito em ambas as direções
        const firstClone = slides[0].cloneNode(true);
        firstClone.id = 'first-clone';

        const lastClone = slides[slides.length - 1].cloneNode(true);
        lastClone.id = 'last-clone';

        track.appendChild(firstClone);
        track.insertBefore(lastClone, slides[0]);

        // ATUALIZADO: A lista de slides agora inclui os clones
        slides = Array.from(track.children);

        let currentIndex = 1; // Começa no primeiro slide REAL
        let slideInterval;

        // 2. Define a posição inicial sem animação
        const slideWidth = slides[1].getBoundingClientRect().width;
        track.style.transition = 'none';
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

        // Função unificada para mover os slides
        function moveToSlide(index) {
            track.style.transition = 'transform 0.6s ease-in-out';
            currentIndex = index;
            track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        }

        // 3. Evento que acontece AO FINAL da animação para fazer o "salto"
        track.addEventListener('transitionend', () => {
            if (slides[currentIndex].id === 'first-clone') {
                track.style.transition = 'none';
                currentIndex = 1; // Volta para o primeiro slide real
                track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            }

            if (slides[currentIndex].id === 'last-clone') {
                track.style.transition = 'none';
                currentIndex = slides.length - 2; // Volta para o último slide real
                track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            }
        });

        function startSlideShow() {
            stopSlideShow();
            slideInterval = setInterval(() => moveToSlide(currentIndex + 1), 6000);
        }

        function stopSlideShow() {
            clearInterval(slideInterval);
        }

        // 4. Lógica ATUALIZADA para os botões
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                moveToSlide(currentIndex + 1);
                startSlideShow();
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                moveToSlide(currentIndex - 1);
                startSlideShow();
            });
        }

        // Inicia o slideshow automático quando a página carrega
        // Força a transição a ser reativada após o posicionamento inicial
        setTimeout(() => {
            track.style.transition = 'transform 0.6s ease-in-out';
            startSlideShow();
        }, 50);

    });

    // Lógica das abas de serviço
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const targetTab = button.dataset.tab;
            document.getElementById(targetTab).classList.add('active');
        });
    });

    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('controle-login');
        });
    }
}

// 🔹 Funções para manipular alunos no Firebase Firestore (sem alterações)
async function adicionarAluno(dadosAluno) {
    try {
        const docRef = await addDoc(collection(db, "alunos"), dadosAluno);
        console.log("Aluno cadastrado com ID:", docRef.id);
    } catch (e) {
        console.error("Erro ao adicionar aluno:", e);
    }
}

async function listarAlunos() {
    try {
        const querySnapshot = await getDocs(collection(db, "alunos"));
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
        });
    } catch (e) {
        console.error("Erro ao buscar alunos:", e);
    }
}

async function atualizarAluno(id, novosDados) {
    try {
        const alunoRef = doc(db, "alunos", id);
        await updateDoc(alunoRef, novosDados);
        console.log("Aluno atualizado!");
    } catch (e) {
        console.error("Erro ao atualizar aluno:", e);
    }
}

async function excluirAluno(id) {
    try {
        await deleteDoc(doc(db, "alunos", id));
        console.log("Aluno excluído!");
    } catch (e) {
        console.error("Erro ao excluir aluno:", e);
    }
}

