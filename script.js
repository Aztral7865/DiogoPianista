// script.js

document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const splashScreen = document.getElementById('splash-screen');
    const chopinQuote = document.getElementById('chopin-quote');
    const discoverButton = document.getElementById('discover-button');
    const siteContent = document.getElementById('site-content');
    const mainNav = document.getElementById('main-nav');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuDropdown = document.getElementById('mobile-menu');
    const navItems = document.querySelectorAll('.main-nav .nav-item, .mobile-menu-dropdown .mobile-nav-item');
    const sections = document.querySelectorAll('.content-section');
    const currentYearSpan = document.getElementById('current-year');
    const darkenOverlay = document.getElementById('darken-overlay');

    // Define o ano atual no rodapé (se o elemento existir)
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Lógica da Splash Screen ---

    // Garante que a splash screen é exibida e o conteúdo principal/navbar estão ocultos ao carregar
    splashScreen.style.display = 'flex';
    siteContent.classList.add('hidden-content'); // Esconde o conteúdo principal inicialmente
    mainNav.style.opacity = '0';
    mainNav.style.visibility = 'hidden';

    // Oculta o overlay de carregamento após a página carregar
    window.addEventListener('load', () => {
        loadingOverlay.classList.add('fade-out');
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            // REMOVIDO DAQUI: darkenOverlay.classList.add('active-darken');
            // A classe 'active-darken' será adicionada APENAS no clique do botão.
        }, 500); // Tempo para o fade-out do loading overlay
    });

    // Event listener para o botão de descoberta
    if (discoverButton) {
        discoverButton.addEventListener('click', () => {
            // AQUI: Adiciona a classe 'active-darken' APENAS QUANDO O BOTÃO É CLICADO
            darkenOverlay.classList.add('active-darken');

            // Adiciona a classe que faz o zoom-in e blur-out na splash screen
            splashScreen.classList.add('zoom-in-blur-out');

            // Delay para permitir a animação da splash screen antes de esconder e mostrar o conteúdo
            setTimeout(() => {
                splashScreen.style.display = 'none'; // Esconde a splash screen completamente
                // Se o overlay já escureceu, ao esconder a splash screen, ele também some
                // Não precisamos remover 'active-darken' aqui, pois a splash screen toda some
                // splashScreen.classList.remove('active-darken'); // Esta linha pode ser removida ou mantida, não fará diferença visível

                // Mostra o conteúdo principal e a navbar com a transição
                siteContent.classList.remove('hidden-content');
                siteContent.classList.add('show-content'); // Ativa a transição de entrada do site-content
                mainNav.style.opacity = '1';
                mainNav.style.visibility = 'visible'; // Torna a navbar visível

                // Lógica para ativar o link da navbar para a primeira seção visível (normalmente "Sobre Diogo")
                const aboutMeNavLink = document.querySelector('.nav-item[data-section="about-me"]');
                if (aboutMeNavLink) {
                    navItems.forEach(item => item.classList.remove('active')); // Remove de todos
                    aboutMeNavLink.classList.add('active'); // Ativa a seção "Sobre Diogo"
                }

            }, 1800); // Ajustado para 1.8s (1800ms) para sincronizar com a transição de 2s da splashScreen (dei uma margem)
        });
    }

    // --- Lógica do Mobile Menu ---
    if (mobileMenuToggle && mobileMenuDropdown) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuDropdown.classList.toggle('show');
        });

        mobileMenuDropdown.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                mobileMenuDropdown.classList.remove('show');
            });
        });

        document.addEventListener('click', (event) => {
            if (!mobileMenuDropdown.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                mobileMenuDropdown.classList.remove('show');
            }
        });
    }

    // --- Lógica de Scroll e Navbar Ativação/Rolagem Suave ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const targetSectionId = item.dataset.section;
            const targetSection = document.getElementById(targetSectionId);

            if (targetSection) {
                const navHeight = mainNav.offsetHeight;
                const sectionTop = targetSection.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({
                    top: sectionTop,
                    behavior: 'smooth'
                });
            }

            if (mobileMenuDropdown.classList.contains('show')) {
                mobileMenuDropdown.classList.remove('show');
            }
        });
    });

    // Observer para animar as seções conforme elas entram na viewport
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');

                const currentActiveSectionId = entry.target.id;
                navItems.forEach(item => {
                    if (item.dataset.section === currentActiveSectionId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });

            } else {
                 entry.target.classList.remove('in-view');
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });
});
