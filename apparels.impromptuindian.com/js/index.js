// Mobile menu toggle
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');

        // Toggle icon between menu and X
        const icon = menuBtn.querySelector('i');
        if (icon) {
            const isMenuOpen = !mobileMenu.classList.contains('hidden');
            icon.setAttribute('data-lucide', isMenuOpen ? 'x' : 'menu');
            lucide.createIcons(); // Reinitialize icons
        }
    });

    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            const icon = menuBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            }
        });
    });
}

// ScrollReveal animations - Initialize after page load to avoid blocking
if (typeof ScrollReveal !== 'undefined') {
    // Use requestAnimationFrame to defer initialization
    requestAnimationFrame(() => {
        ScrollReveal().reveal('.reveal', {
            distance: '40px',
            duration: 800,
            easing: 'ease-in-out',
            origin: 'bottom',
            interval: 150
        });
    });
}

// Initialize Lucide icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}
