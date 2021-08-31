'use strict';

class TinyFade {
    constructor(cfg = {}) {
        this.cfg = utils.extend({
            attribute: 'tinyfade',
            imageAttribute: 'tinyfade-img',
            webpAttribute: 'tinyfade-webp',
            videoAttribute: 'tinyfade-video',
            image360folder: 'tinyfade-360-folder',
            image360filename: 'tinyfade-360-filename',
            image360amount: 'tinyfade-360-amount',
            nav: true,
            thumbs: true,
            autoplay: false,
            counter: true,
            autoplayTime: 1000,
        }, cfg);

        this.setListeners();
    }

    setListeners() {
        const elements = utils.n(`[${this.cfg.attribute}]`);
        if (!elements.length) return;

        utils.event(elements, 'click', e => {
            const target = utils.getEl(e.target, `[${this.cfg.attribute}]`);
            this.open(target);
        });

        utils.event([document], 'keyup', e => {
            if (e.key == 'Escape') this.close();
        }, {
            debounceTime: 100,
        });

        utils.event([document], 'keydown', e => {
            if (e.key == 'ArrowRight') this.next();
            if (e.key == 'ArrowLeft') this.prev();
        }, {
            debounceTime: 50,
        });
    }

    setDefaults(target) {
        this.subs = [];
        this.target = target;
        this.name = target.getAttribute(this.cfg.attribute);

        this.images = this.getImages(this.name);
        this.WEBPs = this.getWEBPs(this.name);
        this.videos = this.getVideos(this.name);
        this.images360 = this.getImages360(this.name);

        this.totalCount = this.images.length + this.videos.length + Object.keys(this.images360).length;

        const imagesIndex = this.images.indexOf(this.target.getAttribute(this.cfg.imageAttribute));
        const videosIndex = this.videos.indexOf(this.target.getAttribute(this.cfg.videoAttribute));
        const images360index = Object.keys(this.images360).indexOf(`${this.target.getAttribute(this.cfg.image360folder)}${this.target.getAttribute(this.cfg.image360filename)}`);

        if (videosIndex === -1 && imagesIndex === -1) {
            this.index = images360index + this.images.length + this.videos.length;
        } else if (imagesIndex === -1) {
            this.index = videosIndex + this.images.length;
        } else {
            this.index = imagesIndex;
        }

        this.template = this.getTemplate();
        this.targetClone = this.getTargetClone();
        this.thumbsEl = this.template.querySelector('.tinyfade-thumbs');
        this.thumbsWrapper = this.template.querySelector('.tinyfade-thumbs__wrapper');
        this.thumbs = utils.n('.tinyfade-thumbs__item', this.template);
        this.items = utils.n('.tinyfade__item', this.template);
        this.counter = this.template.querySelector('.tinyfade__counter');
        this.prevEl = this.template.querySelector('.tinyfade-nav__prev');
        this.nextEl = this.template.querySelector('.tinyfade-nav__next');
    }

    open(target) {
        this.setDefaults(target);
        this.target.dispatchEvent(utils.createCustomEvent('tinyfade:open'));

        document.body.appendChild(this.template);
        // document.body.appendChild(this.targetClone);
        utils.disableScroll(this.template);

        if (window.CI360) {
            window.CI360.init({
                responsive: false,
            });
        }

        this.bindEvents();
        this.set(this.index);
    }

    close() {
        if (!this.target || !this.template) return;

        this.target.dispatchEvent(utils.createCustomEvent('tinyfade:close'));

        utils.event([this.template], 'transitionend', () => {
            this.detach();

            this.target.dispatchEvent(utils.createCustomEvent('tinyfade:closed'));
            this.target = null;
        }, {
            once: true,
        });

        this.template.classList.remove('open');
        this.template.classList.remove('opened');
        utils.clearAllScrollLocks();
    }

    bindEvents() {
        const closeEl = this.template.querySelector('.tinyfade__close');
        if (closeEl) this.subs.push(utils.event([closeEl], 'click', () => this.close()));

        if (this.template) this.subs.push(utils.event([this.template], 'transitionend', () => {
            this.template.classList.add('opened');
            this.template.classList.remove('open');

            this.target.dispatchEvent(utils.createCustomEvent('tinyfade:opened'));
        }, {
            once: true,
        }));

        if (this.prevEl) this.subs.push(utils.event([this.prevEl], 'click', () => this.prev()));
        if (this.nextEl) this.subs.push(utils.event([this.nextEl], 'click', () => this.next()));

        if (this.thumbs) this.subs.push(utils.event(this.thumbs, 'click', e => {
            const thumb = utils.getEl(e.target, '.tinyfade-thumbs__item');
            this.set(this.thumbs.indexOf(thumb) || 0);
        }));
    }

    prev() {
        if (this.index <= 0)
            this.set(this.totalCount - 1)
        else
            this.set(this.index - 1);
    }

    next() {
        if (this.index >= this.totalCount - 1)
            this.set(0)
        else
            this.set(this.index + 1);
    }

    set(index) {
        this.index = index;

        this.thumbsEl.classList.toggle('without-scroll', this.thumbs.length <= 4);

        this.thumbs.map(n => n.classList.remove('active'));
        this.thumbs[index].classList.add('active');

        this.items.map(n => n.classList.remove('active'));
        this.items[index].classList.add('active');

        this.template.classList.toggle('tinyfade--video', this.items[index].classList.contains('video'));

        this.counter.querySelector('.current').innerHTML = index + 1;

        let offset = 0;

        if (this.thumbs.length > 4) {
            const onLeft = index < 2;
            const onRight = index > this.totalCount - 3;

            const width = utils.outerWidth(this.thumbs[0]);

            if (index > 2) offset = (width / 2) + (width * (index - 2))
            if (index === 2) offset = width / 2;
            if (onRight) offset = (width * (this.totalCount - 4))
            if (onLeft) offset = 0;

            this.thumbsEl.classList.toggle('onLeft', onLeft);
            this.thumbsEl.classList.toggle('onRight', onRight);
        } else {
            this.thumbsEl.classList.remove('onLeft');
            this.thumbsEl.classList.remove('onRight');
        }

        this.thumbsWrapper.style.transform = `translate3d(${offset * -1}px, 0, 0)`;

        utils.stopVideos(this.template);
    }

    detach() {
        if (!this.template) return;

        this.subs.map(s => s.unsubscribe());

        this.template.removeEventListener('transitionend', () => this.handleCloseEnd());
        this.template.remove();
    }

    getImages(name) {
        const images = utils.n(`[${this.cfg.attribute}="${name}"]`)
            .map(n => n.getAttribute(this.cfg.imageAttribute))
            .filter(n => !!n);

        return [...new Set(images)];
    }

    getWEBPs(name) {
        const images = utils.n(`[${this.cfg.attribute}="${name}"]`)
            .map(n => n.getAttribute(this.cfg.webpAttribute))
            .filter(n => !!n);

        return [...new Set(images)];
    }

    getVideos(name) {
        return utils.n(`[${this.cfg.attribute}="${name}"]`)
            .map(n => n.getAttribute(this.cfg.videoAttribute))
            .filter(n => !!n);
    }

    getImages360(name) {
        let data = {};
        utils.n(`[${this.cfg.attribute}="${name}"]`).map(n => {
            if (!n.hasAttribute(this.cfg.image360folder)) return;

            let template = `${n.getAttribute(this.cfg.image360folder)}${n.getAttribute(this.cfg.image360filename)}`;

            data[template] = {
                folder: n.getAttribute(this.cfg.image360folder),
                filename: n.getAttribute(this.cfg.image360filename),
                amount: n.getAttribute(this.cfg.image360amount),
            };
        });

        return data;
    }

    getTemplate() {
        let template = document.createElement('div');
        template.classList.add('tinyfade');

        template.innerHTML = `<div class="tinyfade-header">
            <div class="container">
                <div class="tinyfade-header__i">
                    <div class="logob logob--lg">
                        <svg class="logob-svg">
                            <use xlink:href="#logo-full"></use>
                        </svg>
                        <a class="logob-link" href="${document.querySelector('a.logob-link').href || '/'}"></a>
                    </div>

                    <div class="tinyfade__close"></div>
                </div>
            </div>
        </div>

        <div class="tinyfade__wrapper">
            <div class="tinyfade__content">
                <div class="tinyfade__items">${this.getItems()}</div>
                ${this.getNav()}
            </div>
            <div class="tinyfade__sidebar">
                ${this.getThumbs()}
                ${this.getCounter()}
            </div>
        </div>`;

        return template;
    }

    getNav() {
        if (!this.cfg.nav || this.totalCount <= 1) return '';

        return `<div class="tinyfade-nav">
            <div class="tinyfade-nav__prev"></div>
            <div class="tinyfade-nav__next"></div>
        </div>`;
    }

    getThumbs() {
        if (!this.cfg.thumbs) return '';

        let thumbs = [];

        this.images.map((n, i) => thumbs.push(`<div class="tinyfade-thumbs__item">
            <picture>
                ${this.WEBPs[i] ? '<source type="image/webp" srcset="' + this.WEBPs[i] + '">' : ''}
                <img src="${n}" />
            </picture>
        </div>`));

        this.videos.map((n, i) => thumbs.push(`<div class="tinyfade-thumbs__item video">
            <span class="icon video"></span>
        </div>`));

        utils.objectMap(this.images360, (n, i) => thumbs.push(`<div class="tinyfade-thumbs__item image360">
            <span class="icon degrees-360"></span>
        </div>`));

        return `<div class="tinyfade-thumbs">
            <div class="tinyfade-thumbs__wrapper">
                ${thumbs.join('')}
            </div>
        </div>`;
    }

    getCounter() {
        if (!this.cfg.counter) return '';

        return `<div class="tinyfade__counter">
            <span class="current"></span>
            <span class="total">${this.totalCount}</span>
        </div>`;
    }

    getItems() {
        let items = [];

        this.images.map((n, i) => items.push(`<div class="tinyfade__item">
            <picture>
                ${this.WEBPs[i] ? '<source type="image/webp" srcset="' + this.WEBPs[i] + '">' : ''}
                <img src="${n}" />
            </picture>
        </div>`));

        this.videos.map((n, i) => items.push(`<div class="tinyfade__item video">
            <iframe src="${n.indexOf('youtube') !== -1 ? (n + (n.indexOf('?') === -1 ? '?' : '&') + 'enablejsapi=1') : n}"></iframe>
        </div>`));

        utils.objectMap(this.images360, (val, key) => items.push(`<div class="tinyfade__item video">
            <div class="cloudimage-360"
                folder="${val.folder}"
                filename="${val.filename}"
                amount="${val.amount}"
                logo-src="/assets/img/degrees-360.svg"
                responsive="false"
            ></div>
        </div>`))

        return items.join('');
    }

    getTargetClone() {
        let template = document.createElement('div');
        let coords = utils.getCoords(this.target);
        let image = this.target.getAttribute(this.cfg.imageAttribute);
        let webp = this.target.getAttribute(this.cfg.webpAttribute);

        template.classList.add('tinyfade-shadow');
        template.setAttribute('style', `position: absolute; top: 0; left: 0; width: ${this.target.offsetWidth}px; height: ${this.target.offsetHeight}; transition: all .5s ease; transform: translate3d(${coords.left}px, ${coords.top}px, 0)`);

        template.innerHTML = `<picture>
            ${webp ? '<source type="image/webp" srcset="' + webp + '">' : ''}
            <img src="${image}" />
        </picture>`;

        return template;
    }
}

export default TinyFade;
