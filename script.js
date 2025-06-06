
document.addEventListener('DOMContentLoaded', () => {

    const discoverButton = document.getElementById('discover-button');
    const splashScreen = document.getElementById('splash-screen');
    const siteWrapper = document.getElementById('site-content-wrapper');

    function activateMainContent() {
        const template = document.getElementById('conteudo-principal-template');
        if (template) {
            siteWrapper.classList.add('conteudo-esmaecido');

            const content = template.content.cloneNode(true);
            siteWrapper.appendChild(content);

            setTimeout(() => {
                siteWrapper.classList.remove('conteudo-esmaecido');
            }, 50);

            //Ativa a lógica do site (menus, abas, etc.) como sempre.
            initializeSiteLogic();
        }
    }

    // Evento de clique no botão da splash screen
    if (discoverButton) {
        discoverButton.addEventListener('click', () => {
            splashScreen.classList.add('efeito-camera-zoom');

            setTimeout(() => {
                activateMainContent();
            }, 1900); // Espera 1.9 segundos

        }, { once: true }); // O { once: true } garante que o clique só funcione uma vez.
    }
});


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
                } else {
                    section.classList.remove('visible-section');
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

        if (isAboutTarget && performAutoScroll) {
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
            }, 1000);
        } else if (!isAboutTarget) {
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

    const tabButtons = document.querySelectorAll('.servicos-tabs .tab-button');
    const tabContents = document.querySelectorAll('.servicos-content .tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const servicosSection = document.getElementById('servicos');
            if (servicosSection && servicosSection.classList.contains('visible-section')) {
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

    const formContato = document.getElementById('formContato');

    if (formContato) {
        formContato.addEventListener('submit', function (event) {
            event.preventDefault();

            const nome = document.getElementById('nome').value;
            const assunto = document.getElementById('assunto').value;
            const mensagem = document.getElementById('mensagem').value;
            const numeroWhatsApp = '5548992183310';

            const mensagemTemplate = `Olá! me chamo *${nome}*!\n\nGostaria de falar sobre: *${assunto}*.\n\n${mensagem}`;

            const mensagemCodificada = encodeURIComponent(mensagemTemplate);

            const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;

            window.open(linkWhatsApp, '_blank');
        });
    }

}
