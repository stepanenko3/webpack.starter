'use strict';

import Cookies from 'js-cookie';
import axios from 'axios';

class ColorTheme {
    constructor(cfg) {
        this.cfg = utils.extend({
            theme: '',
            systemDetect: true,
            userDetect: true,
            cookieDetect: true,
            detectBySun: true,
            default: 'light',
            callback: () => { },
        }, cfg);

        this.theme = '';

        this.bindEvents();
        this.setTheme(this.cfg.theme);
    }

    bindEvents() {
        if (!this.cfg.systemDetect) return;

        const themeMatch = window.matchMedia("(prefers-color-scheme: dark)");

        try {
            // Chrome & Firefox
            themeMatch.addEventListener('change', () => this.setTheme());
        } catch (e1) {
            try {
                // Safari
                themeMatch.addListener(() => this.setTheme());
            } catch (e2) {
                console.error(e2);
            }
        }
    }

    setTheme(theme = null, remember = false) {
        let themeSecondary = theme || document.body.getAttribute('data-color-theme') || 'auto';

        document.body.setAttribute('data-color-theme', themeSecondary);
        utils.n('[data-set-theme]').map(n => n.classList.remove('active'));
        utils.n(`[data-set-theme="${themeSecondary}"]`).map(n => n.classList.add('active'));

        if (remember) {
            Cookies.set('color-theme', themeSecondary);

            axios({
                url: settings.links.themeUpdate,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': utils.csrf(),
                },
                data: { theme: themeSecondary },
            });
        }

        if (['light', 'dark'].indexOf(theme) === -1)
            theme = this.detect();

        document.body.classList.toggle('dark', theme === 'dark');

        this.theme = theme;
        Cookies.set('current-theme', theme);

        this.cfg.callback(theme);
    }

    get() {
        return this.theme;
    }

    detect() {
        const themes = ['light', 'dark'];
        const userTheme = document.body.getAttribute('data-color-theme');
        const cookieTheme = Cookies.get('theme');
        const systemTheme = this.detectSystemTheme();
        const themeBySun = document.body.getAttribute('data-theme-by-sun');

        if (this.cfg.userDetect && userTheme != 'auto' && themes.indexOf(userTheme) !== -1)
            return userTheme;

        if (this.cfg.cookieDetect && userTheme != 'auto' && cookieTheme != 'auto' && themes.indexOf(cookieTheme) !== -1)
            return cookieTheme;

        if (this.cfg.systemDetect && systemTheme && themes.indexOf(systemTheme) !== -1)
            return systemTheme;

        if (this.cfg.detectBySun && themeBySun && themes.indexOf(themeBySun) !== -1)
            return themeBySun;

        return this.cfg.default;
    }

    detectSystemTheme() {
        if (!window.matchMedia) return;

        const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        const isLightTheme = window.matchMedia("(prefers-color-scheme: light)").matches

        if (isDarkTheme)
            return 'dark';

        else if (isLightTheme)
            return 'light';

        return;
    }
}

export default ColorTheme;