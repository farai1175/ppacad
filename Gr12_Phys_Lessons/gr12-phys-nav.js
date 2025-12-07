/* GR12 Physics lessons — shared navigation script
   Binds to elements with classes: 'nav-btn prev' and 'nav-btn next'
   Expects lesson filenames like 'lessN.html'.
*/
(function(){
    'use strict';

    function getCurrentLesson() {
        const m = window.location.pathname.match(/less(\d+)\.html$/i);
        return m ? parseInt(m[1], 10) : null;
    }

    function detectMaxLesson() {
        const links = Array.from(document.querySelectorAll('a[href]'));
        const nums = links.map(a => {
            const mm = a.getAttribute('href').match(/less(\d+)\.html$/i);
            return mm ? parseInt(mm[1], 10) : null;
        }).filter(n => Number.isFinite(n));
        if (nums.length === 0) return null;
        return Math.max.apply(null, nums);
    }

    function buildTargetHref(nextNum) {
        return window.location.pathname.replace(/less\d+\.html$/i, `less${nextNum}.html`);
    }

    function setDisabledState(el, disabled) {
        if (!el) return;
        const tag = el.tagName && el.tagName.toLowerCase();
        if (tag === 'button' || tag === 'input') {
            el.disabled = !!disabled;
        } else {
            if (disabled) {
                el.setAttribute('aria-disabled', 'true');
                el.classList.add('disabled');
            } else {
                el.removeAttribute('aria-disabled');
                el.classList.remove('disabled');
            }
        }
    }

    function navigateToLesson(num) {
        if (!num) return;
        const href = buildTargetHref(num);
        window.location.href = href;
    }

    function attachHandlers() {
        const current = getCurrentLesson();
        if (current === null) return;

        const detectedMax = detectMaxLesson();
        const minLesson = 1;
        const maxLesson = detectedMax || current;

        const prevEls = document.querySelectorAll('.nav-btn.prev');
        const nextEls = document.querySelectorAll('.nav-btn.next');

        prevEls.forEach(el => {
            el.addEventListener('click', function(e){
                if (e && e.preventDefault) e.preventDefault();
                const target = current - 1;
                if (target < minLesson) return;
                navigateToLesson(target);
            });
            setDisabledState(el, current <= minLesson);
        });

        nextEls.forEach(el => {
            el.addEventListener('click', function(e){
                if (e && e.preventDefault) e.preventDefault();
                const target = current + 1;
                if (target > maxLesson) return;
                navigateToLesson(target);
            });
            setDisabledState(el, current >= maxLesson);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachHandlers);
    } else {
        attachHandlers();
    }

})();
