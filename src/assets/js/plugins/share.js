'use strict';

class Share {
    constructor(cfg) {
        cfg = utils.extend({
            selector: 'a.share-button',
            width: 500,
            height: 500,
        }, cfg);

        const links = utils.n(cfg.selector);
        if (links.length <= 0) return;

        utils.event(links, 'click', e => {
            const t = utils.getEl(e.target, cfg.selector);
            const link = t.getAttribute('href');

            if (link.startsWith('http://') || link.startsWith('https://')) {
                e.preventDefault();

                utils.popupCenter({
                    title: t.innerText,
                    url: t.getAttribute('href'),
                    w: cfg.width,
                    h: cfg.height,
                });
            }
        });

        const navigationShare = utils.n('[navigator-share]');
        if (navigationShare && navigationShare.length > 0) {
            if (navigator.share) {
                const url = document.querySelector('link[rel=canonical]') &&
                    document.querySelector('link[rel=canonical]').href ||
                    window.location.href;

                const title = document.querySelector('h1').textContent ||
                    document.title;

                utils.event(navigationShare, 'click', () => navigator.share({
                    title: url,
                    // text: utils.meta('description'),
                    // url: url,
                })
                    .then(() => utils.notify('Thanks! 😄', {
                        style: {
                            background: 'var(--color-success-500)',
                        },
                    }))
                    .catch(() => utils.notify(`Couldn't share 🙁`))
                );
            } else {
                navigationShare.map(n => n.remove());
            }
        }
    }
}

export default Share;