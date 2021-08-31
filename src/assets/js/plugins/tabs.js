'use strict';

class TabsModule {
    constructor(cfg) {
        this.cfg = utils.extend({
            wrapper: '[data-tabs]',
            selectors: {
                buttonLeft: '[data-tabs-left]',
                buttonRight: '[data-tabs-right]',
                indicator: '[data-tabs-indicator]',
                nav: '[data-tabs-nav]',
                contents: '[data-tabs-contents]',
            },
            colors: [
                'var(--color-primary-500)',
            ],
            change: (target) => { },
        }, cfg);

        this.setElements();

        if (!this.wrapper || !this.contents) return;

        let selected = this.contents.querySelector('.active');
        if (!selected) {
            selected = utils.firstChild(this.contents);
            selected.classList.toggle('active', true);

            const tab = selected.getAttribute('data-tab-toggle');
            if (tab) {
                const content = this.wrapper.querySelector(`[data-tab-content="${tab}"]`);
                utils.getSiblings(content, (n) => n.hasAttribute('data-tab-content'))
                    .map(n => n.classList.remove('active'));

                if (content) content.classList.add('active')
            }
            
            this.cfg.change(this.wrapper);
        }

        this.events = [];
        this.contentsClickListener();
    }

    setElements() {
        this.wrapper = typeof this.cfg.wrapper === 'string'
            ? document.querySelector(this.cfg.wrapper)
            : this.cfg.wrapper;

        if (!this.wrapper) return;

        this.contents = this.wrapper.querySelector(this.cfg.selectors.contents);
    }

    contentsClickListener() {
        const items = utils.n('.tabs-menu__item', this.wrapper);
        this.events.push(utils.event(items, 'click', e => {
            const t = utils.getEl(e.target, '.tabs-menu__item');
            items.map(n => n.classList.toggle('active', false));
            
            t.classList.toggle('active', true);
            const tab = t.getAttribute('data-tab-toggle');
            if (tab) {
                const content = this.wrapper.querySelector(`[data-tab-content="${tab}"]`);
                utils.getSiblings(content, (n) => n.hasAttribute('data-tab-content'))
                    .map(n => n.classList.remove('active'));

                if (content) content.classList.add('active');
                this.cfg.change(this.wrapper);
            }
        }));
    }
}

export default TabsModule;