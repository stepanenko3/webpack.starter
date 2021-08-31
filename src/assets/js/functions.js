'use strict';

import IMask from 'imask';
import autocomplete from 'autocompleter';
import Fuse from 'fuse.js'
import axios from 'axios';

export const updateCountTotal = (key, res = null) => {
    utils.n(`[data-${key}-toggle]`).map(n => {
        n.classList.toggle('empty', !res.count);
    });

    utils.n(`[data-${key}-count]`).map(n => {
        n.innerHTML = res.count || 0;
        n.classList.toggle('empty', !res.count);
    });

    utils.n(`[data-${key}-total]`).map(n => {
        n.innerHTML = res.total || '';
        n.classList.toggle('empty', !res.count);
    });
}

let masks;
export const bindMask = () => {
    if (masks) masks.map(n => n.destroy());

    masks = utils.n('input[data-mask]').map(n => IMask(n, {
        mask: n.getAttribute('data-mask'),
    }));
}

const toggleHidden = (t) => {
    const input = t.querySelector('input[type="checkbox"]');
    const id = t.getAttribute('data-toggle-hidden');

    const el = document.getElementById(id);
    if (!el) return;

    if (input.checked) el.classList.remove('hidden');
    else el.classList.add('hidden');
}

let toggleHiddenSub = null;
export const bindToggleHidden = () => {
    if (toggleHiddenSub)
        toggleHiddenSub.unsubscribe();

    toggleHiddenSub = utils.event('[data-toggle-hidden]', 'change', e => toggleHidden(e.currentTarget));

    utils.n('[data-toggle-hidden]')
        .map(t => toggleHidden(t))
}


let autocompletes = [];
export const bindAutocomplete = () => {
    autocompletes.map(n => n.destroy());

    utils.n('.autocomplete[data-ajax]').map(select => {
        const url = select.getAttribute('data-ajax');
        if (!url) return;

        const top = select.classList.contains('autocomplete--top');

        const setInputValue = (select, value) => {
            const valueEl = utils.findFirst(utils.getSiblings(select, n => n.hasAttribute('data-input-value')));
            if (valueEl && value && valueEl.value != value) {
                valueEl.value = value;
                utils.dispatchEvent(valueEl, 'change');
            }
        }

        autocompletes.push(autocomplete({
            input: select,
            emptyMsg: 'No items found',
            minLength: 0,
            debounceWaitMs: 350,
            preventSubmit: true,
            className: 'autocomplete-res',
            showOnFocus: true,
            customize: function (input, inputRect, container) {
                if (top) {
                    container.style.top = "";
                    container.style.bottom = (window.innerHeight - inputRect.bottom + input.offsetHeight) + "px";
                }
            },
            fetch: (text, update) => {
                setInputValue(select, '');
                utils.progress.start();

                let paramsSrc = select.getAttribute('data-params');
                let params = {};

                if (paramsSrc) {
                    eval('params=' + paramsSrc);

                    params = utils.objectFilter(utils.objectMap(params, (val, key) => {
                        const input = document.querySelector(`[name="${val}"]`);

                        return input ? input.value : null;
                    }), (val) => !val);
                }

                const queryParams = utils.serialize({
                    q: text.toLowerCase(),
                    ...params,
                });

                return axios({
                    url: url.indexOf('?') === -1 ? `${url}?${queryParams}` : `${url}&${queryParams}`,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': utils.csrf(),
                    },
                })
                    .then(function (res) {
                        if (res.status === 200 && res.data) {
                            update(res.data.map(n => ({
                                label: n.text,
                                value: n.id,
                                subtext: n.subtext
                            })));
                        }

                        utils.progress.done();
                    })
                    .catch(function (error) {
                        utils.progress.done();
                    });
            },
            onSelect: (item) => {
                if (typeof item.value === 'string' && item.value.indexOf('://') !== -1) {
                    document.location.href = item.value;
                } else {
                    setInputValue(select, item.value);
                    select.value = item.label;
                }
            },
            render: (item, currentValue) => {
                let el = null;

                if (typeof item.value === 'string' && item.value.indexOf('://') !== -1) {
                    el = document.createElement('a');
                    el.setAttribute('href', item.value);
                } else {
                    el = document.createElement('div');
                }

                el.classList.add('autocomplete__item');

                let text = item.label;
                if (item.subtext) text += ` <span>${item.subtext}</span>`;

                el.innerHTML = text;
                return el;
            },
            noResults: () => { },
        }));
    });
}


let shuffleSearchSub = null;
export const bindShuffleSearch = () => {
    if (shuffleSearchSub) shuffleSearchSub.unsubscribe();
    utils.n('[shuffle-search-input]').map(input => {
        const wrapper = utils.getEl(input, '[shuffle-search]');
        if (!wrapper) return;

        const items = utils.n('[shuffle-search-item]', wrapper);
        const data = items.map(n => ({
            title: n.getAttribute('shuffle-search-item'),
            el: n,
        }));

        const shuffleFuse = new Fuse(data, {
            includeScore: true,
            keys: ['title']
        });

        shuffleSearchSub = utils.event([input], 'input', e => {
            const val = e.target.value.toLowerCase();

            if (!val) {
                items.map(n => {
                    n.classList.remove('hidden');
                    n.style.order = 0;
                });
            } else {
                items.map(n => {
                    n.classList.add('hidden');
                    n.style.order = 9999;
                });

                shuffleFuse.search(val).map((n, index) => {
                    n.item.el.classList.remove('hidden');
                    n.item.el.style.order = index;
                });
            }
        });
    });
}

export const openFAQItem = (el) => {
    const _class = el.getAttribute('faq-class');
    const _attr = el.getAttribute('faq-attr');

    utils.getSiblings(el, (n) => n.matches('[faq]')).map(n => {
        if (_class) n.classList.remove(_class);
        if (_attr) n.removeAttribute(_attr);
    });

    if (_class) el.classList.toggle(_class);
    if (_attr) el.toggleAttribute(_attr);
}

let FAQSub = null;
export const bindFAQ = () => {
    if (FAQSub) FAQSub.unsubscribe();

    FAQSub = utils.event('[faq-toggle]', 'click', e => {
        e.preventDefault();
        const el = utils.getEl(e.target, '[faq]');
        openFAQItem(el);
    });
}

// export async function preloadJSON(url, target) {
//     return await axios({
//         url: url,
//         method: 'GET',
//         headers: {
//             'X-Requested-With': 'XMLHttpRequest',
//             'X-CSRF-TOKEN': utils.csrf()
//         },
//     })
//         .then(function (res) {
//             if (res && res.data && res.status === 200) {
//                 eval(`${target} = ${JSON.stringify(res.data)}`);
//             }
//         })
//         .catch(utils.handleError);
// }
