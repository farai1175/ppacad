// Grade 12 Mathematics Lessons Navigation
// Automatically enables Previous/Next navigation between lesson files

(function() {
    'use strict';

    // Get current lesson number from URL
    function getCurrentLesson() {
        const match = window.location.pathname.match(/less(\d+)\.html$/i);
        return match ? parseInt(match[1], 10) : null;
    }

    // Detect maximum lesson number by scanning page links
    function detectMaxLesson() {
        const links = document.querySelectorAll('a[href*="less"]');
        let maxLesson = 0;
        links.forEach(link => {
            const href = link.getAttribute('href');
            const match = href.match(/less(\d+)\.html$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxLesson) maxLesson = num;
            }
        });
        return maxLesson || 33; // Default to 33 if no links found
    }

    // Build target URL for lesson navigation
    function buildTargetHref(lessonNum) {
        return `less${lessonNum}.html`;
    }

    // Set disabled state on navigation element
    function setDisabledState(el, disabled) {
        if (!el) return;

        if (el.tagName === 'BUTTON') {
            el.disabled = disabled;
        } else if (el.tagName === 'A') {
            if (disabled) {
                el.setAttribute('aria-disabled', 'true');
                el.classList.add('disabled');
            } else {
                el.removeAttribute('aria-disabled');
                el.classList.remove('disabled');
            }
        }
    }

    // Navigate to lesson
    function navigateToLesson(lessonNum) {
        const href = buildTargetHref(lessonNum);
        window.location.href = href;
    }

    // Attach click handlers to navigation elements
    function attachHandlers() {
        const currentLesson = getCurrentLesson();
        const maxLesson = detectMaxLesson();

        if (!currentLesson) return;

        const prevButtons = document.querySelectorAll('.nav-btn.prev');
        const nextButtons = document.querySelectorAll('.nav-btn.next');

        // Attach prev button handlers
        prevButtons.forEach(btn => {
            const prevLesson = currentLesson - 1;
            const isPrevDisabled = prevLesson < 1;

            setDisabledState(btn, isPrevDisabled);

            if (!isPrevDisabled) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateToLesson(prevLesson);
                });
            }
        });

        // Attach next button handlers
        nextButtons.forEach(btn => {
            const nextLesson = currentLesson + 1;
            const isNextDisabled = nextLesson > maxLesson;

            setDisabledState(btn, isNextDisabled);

            if (!isNextDisabled) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateToLesson(nextLesson);
                });
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachHandlers);
    } else {
        attachHandlers();
    }
})();
