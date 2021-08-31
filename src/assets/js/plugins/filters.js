'use strict';

import serialize from 'form-serialize';

class Filters {
    constructor(cfg) {
        this.cfg = utils.extend({
            selector: '.modal--filters form',
            shadowSelector: '.filter, .filter2'
        }, cfg);

        this.wrapper = typeof this.cfg.selector === 'string'
            ? document.querySelector(this.cfg.selector)
            : this.cfg.selector;

        this.shadow = typeof this.cfg.shadowSelector === 'string'
            ? document.querySelector(this.cfg.shadowSelector)
            : this.cfg.shadowSelector;

        if (!this.wrapper || !this.shadow) return;

        this.subs = [];
        this.bindEvents()

        this.debounseProcessed = utils.debounceTime(() => this.processedFilters(), 300);
    }

    rebindEvents() {
        this.subs.map(s => s.unsubscribe());
        this.bindEvents();
    }

    bindEvents() {
        [
            ...this.bindToggleCheckboxRadio(),
            this.bindToggleClick(),
            this.bindClickOutside(),
            this.bindResetButtons(),
            this.bindSaveButtons(),
            this.bindFiltersChange(),
        ].map(s => s ? this.subs.push(s) : null);
    }

    bindFiltersChange() {
        return utils.event(utils.n('.filter2 input:not([shuffle-search-input])'), 'change', () => this.debounseProcessed());
    }

    bindToggleClick() {
        if (!this.shadow) return null;
        return utils.event('.filter-item__toggle', 'click', this.shadow, e => {
            const parent = e.target.closest('.filter-item');
            if (parent.classList.contains('active')) {
                parent.classList.remove('active');
                // processedFilters();
            } else {
                const activeSiblings = utils.getSiblings(parent, (e) => e.classList.contains('active'));
                if (activeSiblings.length > 0) {
                    activeSiblings.map(e => e.classList.remove('active'));
                    // processedFilters();
                }
                parent.classList.add('active');
            }
        });
    }

    bindClickOutside() {
        if (!this.shadow) return null;
        return utils.event([document], 'click', e => {
            const filters = utils.n('.filter-item', this.shadow);
            filters.map(filter => filter.contains(e.target) ? '' : filter.classList.remove('active'))
        });
    }

    bindToggleCheckboxRadio() {
        if (!this.shadow) return null;

        const selector = '.filter-checkbox input, .filter-radio input, .filter-color input';
        const filters = utils.n(selector, this.wrapper)
            .concat(this.shadow ? utils.n(selector, this.shadow) : []);

        if (!filters.length) return null;

        const changeFn = e => {
            const filterItem = e.target.closest('.filter-item');

            utils.getSiblings(e.target, (e) => e.matches('input'))
                .map(input => input.checked = !input.checked);

            const checked = utils.n('input[type="checkbox"]:checked, input[type="radio"]:checked', filterItem);

            utils.n('[filters-reset-btn]', filterItem)
                .map(btn => (checked.length > 0) ? btn.classList.remove('disabled') : btn.classList.add('disabled'));

            utils.n('[filters-reset-all-btn]', this.wrapper)
                .map(btn => (checked.length > 0) ? btn.classList.remove('disabled') : btn.classList.add('disabled'));
        };

        return [
            utils.event(filters, 'change', changeFn),
            utils.event(filters, 'tw-change', changeFn),
        ];
    }

    bindSaveButtons() {
        const saveBtns = utils.n('[filters-save-btn]', this.wrapper)
            .concat(this.shadow ? utils.n('[filters-save-btn]') : []);

        return utils.event(saveBtns, 'click', () => this.processedFilters());
    }

    bindResetButtons() {
        const selector = '[filters-reset-btn], [filters-reset-all-btn]';
        let resetBtns = utils.n(selector, this.wrapper)
            .concat(this.shadow ? utils.n(selector, this.shadow) : []);

        return utils.event(resetBtns, 'click', e => {
            const parent = !e.target.matches('[filters-reset-all-btn]')
                ? e.target.closest('.filter-item') : null;

            const checksSelector = 'input[type="checkbox"], input[type="radio"]';
            const checks = utils.n(checksSelector, parent || this.wrapper)
                .concat(!parent && this.shadow ? utils.n(checksSelector, this.shadow) : []);

            const inputsSelector = 'select, input[type="text"], input[type="hidden"], input[type="number"]';
            const inputs = utils.n(inputsSelector, parent || this.wrapper)
                .concat(!parent && this.shadow ? utils.n(inputsSelector, this.shadow) : [])
                .filter(item => !item.matches('[data-slider-from], [data-slider-to]'));

            e.target.classList.add('disabled');
            checks.map(input => {
                input.checked = false;
                utils.dispatchEvent(input, 'change');
            });
            inputs.map(input => {
                input.value = '';
                utils.dispatchEvent(input, 'keyup');
            });
        });
    }

    getData() {
        if (!this.wrapper || !this.shadow) return;

        return serialize(this.wrapper, { hash: true });
    }

    processedFilters() {
        const objectTypeEl = this.wrapper.querySelector('input[name="objectType"]');
        if (!objectTypeEl) return;

        let slugs = [];

        utils.n('.filter-hidden, .filter-item', this.wrapper)
            .map(item => {
                const slug = item.getAttribute('data-slug');
                const tmpSlugs = utils.n('input[type="checkbox"]:checked, input[type="radio"]:checked, input[type="hidden"]:not([name="objectType"])', item)
                    .map(e => e.getAttribute('data-slug'))

                if (slug && tmpSlugs.length > 0) {
                    tmpSlugs.unshift(slug);
                }

                slugs = slugs.concat(tmpSlugs);

                const min = parseFloat(item.getAttribute('data-min') || 0),
                    max = parseFloat(item.getAttribute('data-max') || 0),
                    minInput = item.querySelector('[data-input="min"]'),
                    maxInput = item.querySelector('[data-input="max"]'),
                    minValue = minInput ? parseFloat(minInput.value) : 0,
                    maxValue = maxInput ? parseFloat(maxInput.value) : 0;

                if (!min || !max || !minValue || !maxValue || (min == minValue && max == maxValue)) return;

                slugs.push(slug);
                slugs.push(`${minValue}-${maxValue}`);
            });

        window.location.href = utils.generateUrl(objectTypeEl.value.replace('.', '/'), slugs);
    }
}

export default Filters;