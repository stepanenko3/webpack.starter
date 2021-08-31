'use strict';

class Dynamic {
    constructor(cfg) {
        this.cfg = utils.extend({
            selector: '[data-dynamic]',
            maxFieldsets: 10,
            fieldsetSelector: 'fieldset[data-dynamic-clone]',
            cloneButtonSelector: '[data-dynamic-button]',
            removeButtonSelector: '[data-dynamic-remove]',
            afterClone: () => { },
            beforeClone: () => { },
            afterRemove: () => { },
        }, cfg);

        this.wrapper = typeof this.cfg.selector === 'string'
            ? document.querySelector(this.cfg.selector)
            : this.cfg.selector;

        if (!this.wrapper) return;

        this.cloneButton = this.wrapper.querySelector(this.cfg.cloneButtonSelector);
        this.setFieldsets();

        this.subs = [];
        this.bindEvents();
    }

    rebindEvents() {
        this.subs.map(s => s.unsubscribe());
        this.bindEvents();
    }

    bindEvents() {
        this.subs.push(utils.event([this.cloneButton], 'click', () => this.clone()));

        const closeButtons = utils.n(this.cfg.removeButtonSelector, this.wrapper);
        if (closeButtons && closeButtons.length > 0)
            this.subs.push(utils.event(closeButtons, 'click'), e => this.remove(e.target));

        return sub;
    }

    setFieldsets() {
        this.fieldsets = utils.n(this.cfg.fieldsetSelector, this.wrapper);

        let count = 1;
        this.fieldsets.map(el => {
            utils.n('input,select,textarea', el)
                .map(input => {
                    utils.renameField(input, 'id', count);
                    utils.renameField(input, 'name', count, true);
                });

            utils.n('label[for]', el)
                .map(input => utils.renameField(input, 'for', count));

            utils.n('[data-dynamic-counter]', el)
                .map(input => utils.renameField(input, input.getAttribute('data-dynamic-counter'), count));

            utils.n('[data-dynamic-counter-name]', el)
                .map(input => utils.renameField(input, input.getAttribute('data-dynamic-counter-name'), count, true));

            count++;
        });
    }

    clone() {
        if (!this.fieldsets || this.fieldsets.length <= 0) {
            alert('nothing to clone');
            return;
        }

        if (this.fieldsets.length >= this.cfg.maxFieldsets) {
            alert(`max ${this.cfg.maxFieldsets} fieldsets`);
            return;
        }

        this.cfg.beforeClone(this.wrapper);

        const clone = this.fieldsets[this.fieldsets.length - 1].cloneNode(true);

        utils.n('.invalid', clone).map(n => n.classList.remove('invalid'));
        utils.n('.form-field__error', clone).map(n => n.remove());

        utils.n('input,select,textarea', clone).map(el => {
            const type = el.type.toLowerCase();
            const tag = el.tagName.toLowerCase();

            if (type == 'text' || type == 'password' || tag == 'textarea')
                el.value = '';

            else if (type == 'checkbox' || type == 'radio')
                el.checked = false;

            else if (tag == 'select')
                el.selectedIndex = -1;
        });

        this.cloneButton.parentNode.insertBefore(clone, this.cloneButton);

        this.setFieldsets();
        this.rebindEvents();
        this.cfg.afterClone(this.wrapper);
    }

    remove(el) {
        if (!this.fieldsets || this.fieldsets.length <= 1) return;

        el.closest(this.cfg.fieldsetSelector).remove();
        this.setFieldsets();
        this.rebindEvents();
        this.cfg.afterRemove(this.wrapper);
    }
}

export default Dynamic;