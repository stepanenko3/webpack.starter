'use strict';

class ShowMore {
    constructor(selector) {
        this.wrapper = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (!this.wrapper) return;
        
        this.subs = [];

        if (utils.isVisible(this.wrapper)) {
            this.process();
        }
    }

    unsubscribe() {
        this.subs.map(s => s.unsubscribe());
    }

    process() {
        const togglers = utils.n('[show-more-toggler]', this.wrapper.parentNode);

        if (this.wrapper.scrollHeight > parseInt(getComputedStyle(this.wrapper).maxHeight)) {
            if (togglers.length > 1) return;

            this.wrapper.classList.remove('open');

            let toggler = this.wrapper.parentNode.querySelector('[show-more-toggler]');

            if (!toggler) {
                this.wrapper.insertAdjacentHTML('afterend', `<div show-more-toggler
                    data-more-text="${this.wrapper.getAttribute('data-more-text')}"
                    data-less-text="${this.wrapper.getAttribute('data-less-text')}"></div>`);

                toggler = this.wrapper.parentNode.querySelector('[show-more-toggler]');
            }

            this.subs.push(utils.event([toggler], 'click', e => {
                const t = utils.getEl(e.target, '[show-more-toggler]');
                const state = t.getAttribute('show-more-toggler');

                this.setState(state !== 'open');
            }));

            this.subs.push(utils.event([window], 'resize', () => {
                const state = toggler.getAttribute('show-more-toggler');
                this.setState(state === 'open');
            }, {
                debounceTime: 100,
            }));
        } else {
            this.wrapper.classList.add('open');
            togglers.map(n => n.classList.add('disabled'));
        }
    }

    setState(state) {
        const toggler = this.wrapper.parentNode.querySelector('[show-more-toggler]');
        const t = utils.getEl(toggler, '[show-more-toggler]');

        if (state) {
            t.setAttribute('show-more-toggler', 'open');
            this.wrapper.classList.add('open');
        } else {
            t.setAttribute('show-more-toggler', 'closed');
            this.wrapper.classList.remove('open');
        }
    }
}

export default ShowMore;