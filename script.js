document.addEventListener('DOMContentLoaded', function () {

    // Atualiza o ano no rodapé
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    const contentSections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link');
    const sectionTriggerButtons = document.querySelectorAll('.section-trigger-button');
    const parallaxBanner = document.getElementById('parallax-banner');
    const header = document.querySelector('header');

    function showSection(targetId, performAutoScroll = false) {
        const isAboutTarget = (targetId === 'sobre');

        // Controla visibilidade do parallax banner
        if (isAboutTarget) {
            parallaxBanner.classList.add('visible-section');
        } else {
            parallaxBanner.classList.remove('visible-section');
        }

        // Controla visibilidade das seções principais em <main>
        contentSections.forEach(section => {
            if (section.id !== 'parallax-banner') { // Não mexer no parallax aqui, pois já foi tratado
                if (section.id === targetId) {
                    section.classList.add('visible-section');
                } else {
                    section.classList.remove('visible-section');
                }
            }
        });

        // Atualiza a classe 'active-link' nos links da navegação principal
        navLinks.forEach(link => {
            link.classList.remove('active-link');
            const linkTarget = link.getAttribute('href').substring(1);
            if (linkTarget === targetId) {
                link.classList.add('active-link');
            }
        });

        // Scroll automático
        if (isAboutTarget && performAutoScroll) {
            window.scrollTo(0, 0); // Garante que a página esteja no topo antes do timeout

            setTimeout(() => {
                const secaoSobre = document.getElementById('sobre');
                if (secaoSobre && header) {
                    const headerHeight = header.offsetHeight;
                    const secaoSobreTop = secaoSobre.offsetTop; // Posição do topo da seção 'sobre'

                    const scrollToPosition = secaoSobreTop - headerHeight;

                    window.scrollTo({
                        top: scrollToPosition,
                        behavior: 'smooth'
                    });
                }
            }, 1000); // 2.5 segundos
        } else if (!isAboutTarget) { // Scroll para o topo de outras seções ao navegar
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
            showSection(targetId, false); // performAutoScroll é false para cliques normais
        });
    });

    sectionTriggerButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId, false);
        });
    });

    // Estado inicial: Mostrar parallax e a seção "Sobre Mim" E EXECUTAR O SCROLL AUTOMÁTICO
    showSection('sobre', true);

    // Funcionalidade das Abas da Seção Serviços
    const tabButtons = document.querySelectorAll('.servicos-tabs .tab-button');
    const tabContents = document.querySelectorAll('.servicos-content .tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (document.getElementById('servicos').classList.contains('visible-section')) {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                const targetTabId = button.getAttribute('data-tab');
                const targetContent = document.getElementById(targetTabId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            }
        });
    });
});