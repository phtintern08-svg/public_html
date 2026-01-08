
// Show articles immediately without waiting for DOMContentLoaded
(function() {
    'use strict';
    
    // Immediately show initial articles (no waiting for DOMContentLoaded)
    // This runs as soon as the script loads, before DOMContentLoaded
    if (document.readyState === 'loading') {
        // DOM is still loading, use DOMContentLoaded
        document.addEventListener('DOMContentLoaded', showInitialArticles);
    } else {
        // DOM is already loaded
        showInitialArticles();
    }
    
    function showInitialArticles() {
        const articles = document.querySelectorAll('.blog-article');
        const itemsToShowInitially = 6;
        
        // Show first 6 articles immediately
        articles.forEach((article, index) => {
            if (index < itemsToShowInitially) {
                article.classList.remove('hidden');
                article.style.opacity = '1';
            } else {
                article.classList.add('hidden');
            }
        });
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const articles = document.querySelectorAll('.blog-article');
    const loadMoreBtn = document.getElementById('load-more-btn');

    let currentCategory = 'all';
    let itemsToShow = 6; // Show 6 articles initially (changed from 3)
    const itemsPerLoad = 3;

    function updateArticles() {
        let visibleCount = 0;
        let totalMatches = 0;

        articles.forEach(article => {
            const articleCategory = article.getAttribute('data-category');
            // Allow partial match so one article can belong to multiple categories
            // e.g. "customers vendors" matches "customers"
            const matches = currentCategory === 'all' || articleCategory.includes(currentCategory);

            if (matches) {
                totalMatches++;
                if (visibleCount < itemsToShow) {
                    article.classList.remove('hidden');
                    visibleCount++;
                } else {
                    article.classList.add('hidden');
                }
            } else {
                article.classList.add('hidden');
            }
        });

        // Hide load more button if all matching articles are shown
        if (loadMoreBtn) {
            if (visibleCount >= totalMatches) {
                loadMoreBtn.classList.add('hidden');
            } else {
                loadMoreBtn.classList.remove('hidden');
            }
        }

        // Trigger ScrollReveal for newly visible items if needed (non-blocking)
        if (window.ScrollReveal) {
            // Use requestAnimationFrame to avoid blocking
            requestAnimationFrame(() => {
                ScrollReveal().sync();
            });
        }
    }

    // Filter Click Handlers
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button style
            filterBtns.forEach(b => {
                b.classList.remove('bg-[#1273EB]', 'text-white');
                b.classList.add('bg-white', 'text-gray-600');
            });
            btn.classList.remove('bg-white', 'text-gray-600');
            btn.classList.add('bg-[#1273EB]', 'text-white');

            // Update filter state
            currentCategory = btn.getAttribute('data-filter');
            itemsToShow = itemsPerLoad; // Reset visible count on filter change
            updateArticles();
        });
    });

    // Load More Click Handler
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            itemsToShow += itemsPerLoad;
            updateArticles();
        });
    }

    // Initial load
    updateArticles();
});

// SPA Hash Routing Logic
function handleHashChange() {
    const hash = window.location.hash;
    const listing = document.getElementById('blog-listing');
    const detailsView = document.getElementById('blog-details-view');
    const articles = document.querySelectorAll('.article-content');

    // 1. Show Listing
    if (!hash || hash === '#' || hash === '#blog-listing') {
        listing.classList.remove('hidden');
        detailsView.classList.add('hidden');
        articles.forEach(el => el.classList.add('hidden'));

        // If returning to listing, we might want to preserve scroll position, 
        // but for now scrolling to top of listing is safe
        if (hash === '#') window.scrollTo(0, 0);
        return;
    }

    // 2. Show Article Details
    const articleId = hash.substring(1); // remove #
    const targetArticle = document.getElementById(articleId);

    if (targetArticle && targetArticle.classList.contains('article-content')) {
        listing.classList.add('hidden');
        detailsView.classList.remove('hidden');

        // Hide other articles
        articles.forEach(el => el.classList.add('hidden'));

        // Show target
        targetArticle.classList.remove('hidden');

        window.scrollTo(0, 0);
    } else {
        // Fallback if ID not found
        listing.classList.remove('hidden');
        detailsView.classList.add('hidden');
    }
}

// Initialize hash routing
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange);
