'use strict';

class TwoWay {
    constructor(cfg) {
        this.cfg = utils.extend({
            bindAttribute: 'data-tw-bind',
            dispatchAttribute: 'data-tw-dispatch',
            log: () => { },
        }, cfg);

        this.scope = {};
        this.events = [];

        this.bind();
    }

    bind() {
        this.events.map(e => e.unsubscribe());
        this.elements = utils.n(`[${this.cfg.bindAttribute}]`);

        this.elements.map(element => {
            // execute scope setter
            if (element.type === 'text' || element.type === 'textarea' || element.type === 'number') {
                let propToBind = element.getAttribute(this.cfg.bindAttribute);
                this.addScopeProp(propToBind);

                this.events.push(utils.event([element], 'keyup', () => this.scope[propToBind] = element.value));
            }
            else if (element.type === 'select-one') {
                let propToBind = element.getAttribute(this.cfg.bindAttribute);
                this.addScopeProp(propToBind);

                this.events.push(utils.event([element], 'change', () => this.scope[propToBind] = element.options[element.selectedIndex].value));
            }
            else if (element.type === 'radio' || element.type === 'checkbox') {
                let propToBind = element.getAttribute(this.cfg.bindAttribute);
                this.addScopeProp(propToBind);

                this.events.push(utils.event([element], 'change', () => this.scope[propToBind] = element.checked ? element.value : null));
            }
        });
    }

    set(key, value) {
        this.scope[key] = value;
    }

    get(key) {
        return this.scope[key];
    }

    addScopeProp(prop) {
        // add property if needed
        if (!this.scope.hasOwnProperty(prop)) {
            // value to populate with newvalue
            let value;
            Object.defineProperty(this.scope, prop, {
                set: (newValue) => {
                    value = newValue;
                    this.elements.map(element => {
                        // change value to binded elements
                        if (element.getAttribute(this.cfg.bindAttribute) === prop) {
                            if (element.type && (element.type === 'text' || element.type === 'textarea' || element.type === 'number')) {
                                element.value = newValue;
                            }
                            else if (element.type === 'select-one') {
                                element.value = newValue;
                            }
                            else if(element.type === 'radio' || element.type === 'checkbox') {
                                element.toggleAttribute('checked', element.value == newValue);
                                element.checked = element.value == newValue;
                            }
                            else if (!element.type) {
                                element.innerHTML = newValue;
                            }

                            utils.dispatchEvent(element, element.getAttribute(this.cfg.dispatchAttribute) || 'tw-change');
                        }
                    });
                },
                get: () => {
                    return value;
                },
                enumerable: true
            });
        }
    }

    log() {
        utils.objectMap(this.scope, (val, key) => console.log(key + ': ' + val));
    }
}

export default TwoWay;