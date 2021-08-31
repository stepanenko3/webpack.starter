'use strict';

class CodeInput {
    constructor(cfg) {
        this.cfg = utils.extend({
            key: 'otc',
            callback: () => { },
        }, cfg);

        this.el = document.querySelector(`.${this.cfg.key}`);
        if (!this.el) return;

        this.input1 = this.el.querySelector(`#${this.cfg.key}-1`);
        this.inputs = utils.n('input[type="number"]', this.el);

        this.subs = [];
        this.run();
    }

    run() {
        /**
         * Control on keyup to catch what the user intent to do.
         * I could have check for numeric key only here, but I didn't.
         */
        this.subs.push(utils.event(this.inputs, 'keydown', e => {
            // Break if Shift, Tab, CMD, Option, Control.
            if (e.keyCode === 16 || e.keyCode === 9 || e.keyCode === 224 || e.keyCode === 18 || e.keyCode === 17) {
                return;
            }

            // On Backspace or left arrow, go to the previous field.
            if ((e.keyCode === 8 || e.keyCode === 37) && e.target.previousElementSibling && e.target.previousElementSibling.tagName === "INPUT") {
                e.target.previousElementSibling.select();
            } else if (e.keyCode !== 8 && e.keyCode !== 37 && e.target.nextElementSibling) {
                e.target.nextElementSibling.select();
            }

            // If the target is populated to quickly, value length can be > 1
            if (e.target.value.length > 1 && e.target.checkValidity()) {
                this.splitNumber(e);
            }

            // if (e.target.checkValidity()) {

            // }
        }));

        /**
         * Better control on Focus
         * - don't allow focus on other field if the first one is empty
         * - don't allow focus on field if the previous one if empty (debatable)
         * - get the focus on the first empty field
         */
        this.subs.push(utils.event(this.inputs, 'focus', e => {
            // If the focus element is the first one, do nothing
            if (e.target === this.input1) return;

            // If value of input 1 is empty, focus it.
            if (this.input1.value == '') {
                this.input1.focus();
            }

            // If value of a previous input is empty, focus it.
            // To remove if you don't wanna force user respecting the fields order.
            if (e.target.previousElementSibling.value == '') {
                e.target.previousElementSibling.focus();
            }
        }));

        /**
         * Handle copy/paste of a big number.
         * It catches the value pasted on the first field and spread it into the inputs.
         */
        this.input1.addEventListener('input', e => this.splitNumber(e));
    }

    splitNumber(e) {
        let data = e.data || e.target.value; // Chrome doesn't get the e.data, it's always empty, fallback to value then.
        if (!data) return; // Shouldn't happen, just in case.
        if (data.length === 1) return; // Here is a normal behavior, not a paste action.

        this.popuNext(e.target, data);
        //for (i = 0; i < data.length; i++ ) { ins[i].value = data[i]; }
    }

    popuNext(el, data) {
        el.value = data[0]; // Apply first item to first input
        data = data.substring(1); // remove the first char.
        el.select();
        if (el.nextElementSibling && data.length) {
            // Do the same with the next element and next data
            this.popuNext(el.nextElementSibling, data);
        }
    }
}

export default CodeInput;
