// script.js

document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const splashScreen = document.getElementById('splash-screen');
    const discoverButton = document.getElementById('discover-button');
    const siteContent = document.getElementById('site-content');
    const mainNav = document.getElementById('main-nav');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuDropdown = document.getElementById('mobile-menu');
    const navItems = document.querySelectorAll('.main-nav .nav-item, .mobile-menu-dropdown .mobile-nav-item');
    const sections = document.querySelectorAll('.content-section');
    const currentYearSpan = document.getElementById('current-year');

    // Define o ano atual no rodapé
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Lógica da Splash Screen (Sempre visível ao carregar) ---

    // Mostra a splash screen e esconde o conteúdo principal e navbar
    splashScreen.style.display = 'flex';
    siteContent.classList.add('hidden-content');
    mainNav.style.opacity = '0';
    mainNav.style.visibility = 'hidden';

    // Oculta o overlay de carregamento após um pequeno atraso
    setTimeout(() => {
        loadingOverlay.classList.add('fade-out');
        loadingOverlay.addEventListener('transitionend', () => {
            loadingOverlay.style.display = 'none';
        }, { once: true });
    }, 800); // 0.8 segundos para o spinner

    // Adiciona um listener para o botão "Descobrir o Site"
    if (discoverButton) {
        discoverButton.addEventListener('click', () => {
            // Inicia a animação de saída da splash screen (zoom IN e blur OUT)
            splashScreen.classList.add('zoom-in-blur-out');

            // Mostra o conteúdo principal logo após iniciar a transição da splash screen
            // para que as animações ocorram em paralelo
            siteContent.classList.remove('hidden-content');
            siteContent.classList.add('show-content');

            // Quando a animação de saída da splash screen terminar, esconda-a.
            // Isso evita que ela fique visível caso a transição do siteContent seja mais rápida.
            splashScreen.addEventListener('transitionend', () => {
                splashScreen.style.display = 'none';
                // Remove o event listener para evitar múltiplas chamadas
                splashScreen.removeEventListener('transitionend', arguments.callee);
            }, { once: true });


            // Revela a navbar com um pequeno delay após o site aparecer (sincronizado com a transição)
            setTimeout(() => {
                mainNav.style.opacity = '1';
                mainNav.style.visibility = 'visible';
            }, 1000); // Atraso de 1s, deve ser um pouco menos que a duração da transição total (1.5s)

            // Rolagem suave para a primeira seção do site (Sobre Diogo)
            const aboutMeSection = document.getElementById('about-me');
            if (aboutMeSection) {
                // Atraso para garantir que a transição do site tenha ocorrido antes da rolagem
                setTimeout(() => {
                    window.scrollTo({
                        top: aboutMeSection.offsetTop - mainNav.offsetHeight,
                        behavior: 'smooth'
                    });
                }, 1800); // Atraso de 1.8s (1s para navbar + 0.8s para rolagem), ajustável.
            }
        });
    }

    // --- Lógica do Menu Mobile ---
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuDropdown.classList.toggle('show');
            // Altera o ícone do botão
            mobileMenuToggle.querySelector('i').classList.toggle('fa-bars');
            mobileMenuToggle.querySelector('i').classList.toggle('fa-times');

            // Fechar o menu ao clicar fora dele
            if (mobileMenuDropdown.classList.contains('show')) {
                document.addEventListener('click', closeMobileMenuOutside, true);
            } else {
                document.removeEventListener('click', closeMobileMenuOutside, true);
            }
        });
    }

    function closeMobileMenuOutside(event) {
        if (!mobileMenuDropdown.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
            mobileMenuDropdown.classList.remove('show');
            mobileMenuToggle.querySelector('i').classList.remove('fa-times');
            mobileMenuToggle.querySelector('i').classList.add('fa-bars');
            document.removeEventListener('click', closeMobileMenuOutside, true);
        }
    }

    // Navegação Suave (Scroll para Seções)
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = item.dataset.section;
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                mobileMenuDropdown.classList.remove('show');
                mobileMenuToggle.querySelector('i').classList.remove('fa-times');
                mobileMenuToggle.querySelector('i').classList.add('fa-bars');

                window.scrollTo({
                    top: targetSection.offsetTop - mainNav.offsetHeight,
                    behavior: 'smooth'
                });

                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });

    // Observador para adicionar 'active' aos links da navbar ao scroll
    // E para adicionar a classe 'in-view' para animar conteúdo das seções
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');

                if (splashScreen.style.display === 'none') {
                    navItems.forEach(item => {
                        if (item.dataset.section === entry.target.id) {
                            item.classList.add('active');
                        } else {
                            item.classList.remove('active');
                        }
                    });
                }
            } else {
                 entry.target.classList.remove('in-view');
            }
        });
    }, observerOptions);

    // Observa todas as seções de conteúdo
    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Lógica para ativar o link da navbar no carregamento inicial da página (após a splash screen)
    window.addEventListener('load', () => {
        if (splashScreen.style.display === 'none') {
            let currentActiveSectionId = '';
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                    currentActiveSectionId = section.id;
                }
            });

            if (currentActiveSectionId) {
                navItems.forEach(item => {
                    if (item.dataset.section === currentActiveSectionId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        }
    });
});