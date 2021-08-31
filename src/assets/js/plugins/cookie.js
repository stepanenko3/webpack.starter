'use strict';

import Cookies from 'js-cookie';

class CookieConfirm {
    constructor(cfg) {
        cfg = utils.extend({
            selector: '.cookie-message',
            btnSelector: '.btn',
        }, cfg);

        const wrapper = typeof cfg.selector === 'string'
            ? document.querySelector(cfg.selector)
            : cfg.selector;

        if (!wrapper) return;

        const btn = wrapper.querySelector(cfg.btnSelector);
        if (!btn) return;
        
        utils.event([btn], 'click', () => {
            Cookies.set('cookie-confirm', 'demo-text');
            wrapper.remove();
        }, {
            once: true,
        })
    }
}

export default CookieConfirm;