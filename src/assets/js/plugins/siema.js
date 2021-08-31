import LazyLoad from 'vanilla-lazyload';

/**
 * Hi :-) This is a class representing a Siema.
 */

export default class Siema {
    /**
     * Create a Siema.
     * @param {Object} options - Optional settings object.
     */
    constructor(options) {
        // Merge defaults with user's settings
        this.config = Siema.mergeSettings(options);

        // Resolve selector's type
        this.selector = typeof this.config.selector === 'string' ?
            document.querySelector(this.config.selector) :
            this.config.selector;

        // Early throw if selector doesn't exists
        if (this.selector === null) {
            throw new Error('Something wrong with your selector 😭');
        }

        // Resolve sliderFrame
        this.sliderFrame = typeof this.config.sliderFrame === 'string' ?
            this.selector.querySelector(this.config.sliderFrame) :
            this.config.sliderFrame;

        // update perPage number dependable of user value
        this.resolveSlidesNumber();

        // Create global references
        this.selectorWidth = this.selector.clientWidth;
        this.innerElements = [].slice.call(this.sliderFrame.children);
        this.currentSlide = this.config.loop ?
            this.config.startIndex % this.innerElements.length :
            Math.max(0, Math.min(this.config.startIndex, this.innerElements.length - this.perPage));
        this.transformProperty = Siema.webkitOrNot();

        // Bind all event handlers for referencability
        ['resizeHandler', 'touchstartHandler', 'touchendHandler', 'touchmoveHandler', 'mousedownHandler', 'mouseupHandler', 'mouseleaveHandler', 'mousemoveHandler', 'clickHandler'].forEach(method => {
            this[method] = this[method].bind(this);
        });

        // Build markup and apply required styling to elements
        this.init();
    }


    /**
     * Overrides default settings with custom ones.
     * @param {Object} options - Optional settings object.
     * @returns {Object} - Custom Siema settings.
     */
    static mergeSettings(options) {
        const settings = {
            selector: '.carousel-container',
            sliderFrame: '.carousel-wrapper',
            duration: 300,
            easing: 'ease-out',
            perPage: 1,
            startIndex: 0,
            draggable: true,
            multipleDrag: true,
            threshold: 20,
            loop: false,
            rtl: false,
            onInit: () => {},
            onChange: () => {},


            prevEl: '.carousel-prev',
            nextEl: '.carousel-next',
            dotClass: 'carousel-dot',

            lazy: true,
            nav: true,
            dots: '.carousel-dots',
            dotsWrapperSelector: '.carousel-dots-wrapper',
        };

        return utils.extend(settings, Object.assign({}, options));
    }


    /**
     * Determine if browser supports unprefixed transform property.
     * Google Chrome since version 26 supports prefix-less transform
     * @returns {string} - Transform property supported by client.
     */
    static webkitOrNot() {
        const style = document.documentElement.style;
        if (typeof style.transform === 'string') {
            return 'transform';
        }
        return 'WebkitTransform';
    }

    /**
     * Attaches listeners to required events.
     */
    attachEvents() {        
        // Resize element on window resize
        window.addEventListener('resize', this.resizeHandler);

        // If element is draggable / swipable, add event handlers
        if (this.config.draggable) {
            // Keep track pointer hold and dragging distance
            this.pointerDown = false;
            this.drag = {
                startX: 0,
                endX: 0,
                startY: 0,
                letItGo: null,
                preventClick: false,
            };

            const eventOptions = { passive: true };

            // Touch events
            this.selector.addEventListener('touchstart', this.touchstartHandler, eventOptions);
            this.selector.addEventListener('touchend', this.touchendHandler, eventOptions);
            this.selector.addEventListener('touchmove', this.touchmoveHandler, eventOptions);

            // Mouse events
            this.selector.addEventListener('mousedown', this.mousedownHandler, eventOptions);
            this.selector.addEventListener('mouseup', this.mouseupHandler, eventOptions);
            this.selector.addEventListener('mouseleave', this.mouseleaveHandler, eventOptions);
            this.selector.addEventListener('mousemove', this.mousemoveHandler, eventOptions);

            // Click
            this.selector.addEventListener('click', this.clickHandler);
        }
    }


    /**
     * Detaches listeners from required events.
     */
    detachEvents() {
        window.removeEventListener('resize', this.resizeHandler);
        this.selector.removeEventListener('touchstart', this.touchstartHandler);
        this.selector.removeEventListener('touchend', this.touchendHandler);
        this.selector.removeEventListener('touchmove', this.touchmoveHandler);
        this.selector.removeEventListener('mousedown', this.mousedownHandler);
        this.selector.removeEventListener('mouseup', this.mouseupHandler);
        this.selector.removeEventListener('mouseleave', this.mouseleaveHandler);
        this.selector.removeEventListener('mousemove', this.mousemoveHandler);
        this.selector.removeEventListener('click', this.clickHandler);
    }


    /**
     * Builds the markup and attaches listeners to required events.
     */
    init() {
        this.attachEvents();

        // hide everything out of selector's boundaries
        this.selector.style.overflow = 'hidden';

        // rtl or ltr
        this.selector.style.direction = this.config.rtl ? 'rtl' : 'ltr';

        if (this.config.loop) {
            for (let i = this.innerElements.length - this.perPage; i < this.innerElements.length; i++) {
                this.sliderFrame.insertAdjacentElement('afterbegin', this.buildSliderFrameItem(this.innerElements[i].cloneNode(true)));
            }
        }

        if (this.config.loop) {
            for (let i = 0; i < this.perPage; i++) {
                this.sliderFrame.insertAdjacentElement('beforeend', this.buildSliderFrameItem(this.innerElements[i].cloneNode(true)));
            }
        }

        // build a frame and slide to a currentSlide
        this.buildSliderFrame();

        this.runLazy();
        this.initDots();
        this.initNav();

        this.selector.classList.add('initialized');

        this.config.onInit.call(this);
    }

    runLazy() {
        if (!this.config.lazy) return;

        const el = this.innerElements[this.currentSlide];
        if (!el) return;

        const lazy = el.querySelector('.carousel-lazy');
        if (!lazy) return;

        const dataSrc = lazy.getAttribute('data-src');

        utils.n(`.carousel-lazy:not(.loaded)[data-src="${dataSrc}"]`, this.sliderFrame)
            .map(lazyEl => LazyLoad.load(lazyEl));
    }

    initDots() {
        if (!this.config.dots || this.innerElements.length <= 1) return;

        const wrapper = this.selector.querySelector(`${this.config.dots} ${this.config.dotsWrapperSelector}`);
        if (!wrapper) return;

        let tpl = '';
        for (let i = 0; i < this.innerElements.length; i++)
            tpl += `<span class="${this.config.dotClass}"></span>`;

        wrapper.innerHTML = tpl;

        this.calcDots();
    }

    calcDots() {
        const length = this.innerElements.length;
        if (!this.config.dots && length > 1) return;

        const index = this.currentSlide;
        const container = this.selector.querySelector(this.config.dots);
        if (!container) return;

        const wrapper = container.querySelector(this.config.dotsWrapperSelector);
        const dots = utils.n(`.${this.config.dotClass}`, this.selector);

        dots.map((item, i) => {
            item.classList.toggle('active', i === index);
            item.classList.toggle('prev', i === index - 1);
            item.classList.toggle('prev-prev', i === index - 2);
            item.classList.toggle('next', i === index + 1);
            item.classList.toggle('next-next', i === index + 2);
        });

        let offset = 0;
        const width = utils.outerWidth(dots[0]);

        if (length > 5) {
            const onLeft = index < 3;
            const onRight = index > length - 4;

            if (index > 2) offset = (width * (index - 2))

            if (onRight) offset = (width * (length - 5))
            if (onLeft) offset = 0;

            container.classList.toggle('onLeft', onLeft);
            container.classList.toggle('onRight', onRight);
        } else {
            container.classList.remove('onLeft');
            container.classList.remove('onRight');
        }

        container.style.width = `${width * 5}px`;
        wrapper.style.transform = `translate3d(${offset * -1}px, 0, 0)`;
    }

    initNav() {
        if (!this.config.nav || this.innerElements.length <= 1) return;

        const next = typeof this.config.nextEl === 'string' ?
            this.selector.querySelector(this.config.nextEl) :
            this.config.nextEl;

        const prev = typeof this.config.prevEl === 'string' ?
            this.selector.querySelector(this.config.prevEl) :
            this.config.prevEl;

        if (prev) prev.addEventListener('click', () => this.prev());
        if (next) next.addEventListener('click', () => this.next());
    }

    startGrabbing() {
        this.selector.style.cursor = '-webkit-grabbing';
        this.selector.classList.add('grabbing');
    }

    endGrabbing() {
        this.selector.style.cursor = '-webkit-grab';
        this.selector.classList.remove('grabbing');
    }

    /**
     * Build a sliderFrame and slide to a current item.
     */
    buildSliderFrame() {
        const widthItem = this.selectorWidth / this.perPage;
        const itemsToBuild = this.config.loop ? this.innerElements.length + (2 * this.perPage) : this.innerElements.length;

        // Create frame and apply styling
        this.sliderFrame.style.width = `${widthItem * itemsToBuild}px`;
        this.disableTransition();

        if (this.config.draggable) {
            this.endGrabbing();
        }

        // Loop through the slides, add styling and add them to document fragment
        for (let i = 0; i < this.innerElements.length; i++) {
            this.buildSliderFrameItem(this.innerElements[i]);
        }

        // Go to currently active slide after initial build
        this.slideToCurrent();
    }

    buildSliderFrameItem(elm) {
        elm.style.cssFloat = this.config.rtl ? 'right' : 'left';
        elm.style.float = this.config.rtl ? 'right' : 'left';
        elm.style.width = `${this.config.loop ? 100 / (this.innerElements.length + (this.perPage * 2)) : 100 / (this.innerElements.length)}%`;
        return elm;
    }

    /**
     * Determinates slides number accordingly to clients viewport.
     */
    resolveSlidesNumber() {
        if (typeof this.config.perPage === 'number') {
            this.perPage = this.config.perPage;
        } else if (typeof this.config.perPage === 'object') {
            this.perPage = 1;
            for (const viewport in this.config.perPage) {
                if (window.innerWidth >= viewport) {
                    this.perPage = this.config.perPage[viewport];
                }
            }
        }
    }

    change(callback) {
        this.runLazy();
        this.calcDots();

        this.config.onChange.call(this);

        if (callback) {
            callback.call(this);
        }
    }

    /**
     * Go to previous slide.
     * @param {number} [howManySlides=1] - How many items to slide backward.
     * @param {function} callback - Optional callback function.
     */
    prev(howManySlides = 1, callback) {
        // early return when there is nothing to slide
        if (this.innerElements.length <= this.perPage) {
            return;
        }

        const beforeChange = this.currentSlide;

        if (this.config.loop) {
            const isNewIndexClone = this.currentSlide - howManySlides < 0;
            if (isNewIndexClone) {
                this.disableTransition();

                const mirrorSlideIndex = this.currentSlide + this.innerElements.length;
                const mirrorSlideIndexOffset = this.perPage;
                const moveTo = mirrorSlideIndex + mirrorSlideIndexOffset;
                const offset = (this.config.rtl ? 1 : -1) * moveTo * (this.selectorWidth / this.perPage);
                const dragDistance = this.config.draggable ? this.drag.endX - this.drag.startX : 0;

                this.sliderFrame.style[this.transformProperty] = `translate3d(${offset + dragDistance}px, 0, 0)`;
                this.currentSlide = mirrorSlideIndex - howManySlides;
            } else {
                this.currentSlide = this.currentSlide - howManySlides;
            }
        } else {
            this.currentSlide = Math.max(this.currentSlide - howManySlides, 0);
        }

        if (beforeChange !== this.currentSlide) {
            this.slideToCurrent(this.config.loop);
            this.change(callback);
        }
    }

    /**
     * Go to next slide.
     * @param {number} [howManySlides=1] - How many items to slide forward.
     * @param {function} callback - Optional callback function.
     */
    next(howManySlides = 1, callback) {
        // early return when there is nothing to slide
        if (this.innerElements.length <= this.perPage) {
            return;
        }

        const beforeChange = this.currentSlide;

        if (this.config.loop) {
            const isNewIndexClone = this.currentSlide + howManySlides > this.innerElements.length - this.perPage;
            if (isNewIndexClone) {
                this.disableTransition();

                const mirrorSlideIndex = this.currentSlide - this.innerElements.length;
                const mirrorSlideIndexOffset = this.perPage;
                const moveTo = mirrorSlideIndex + mirrorSlideIndexOffset;
                const offset = (this.config.rtl ? 1 : -1) * moveTo * (this.selectorWidth / this.perPage);
                const dragDistance = this.config.draggable ? this.drag.endX - this.drag.startX : 0;

                this.sliderFrame.style[this.transformProperty] = `translate3d(${offset + dragDistance}px, 0, 0)`;
                this.currentSlide = mirrorSlideIndex + howManySlides;
            } else {
                this.currentSlide = this.currentSlide + howManySlides;
            }
        } else {
            this.currentSlide = Math.min(this.currentSlide + howManySlides, this.innerElements.length - this.perPage);
        }
        if (beforeChange !== this.currentSlide) {
            this.slideToCurrent(this.config.loop);
            this.change(callback);
        }
    }


    /**
     * Disable transition on sliderFrame.
     */
    disableTransition() {
        this.sliderFrame.style.webkitTransition = `all 0ms ${this.config.easing}`;
        this.sliderFrame.style.transition = `all 0ms ${this.config.easing}`;
    }


    /**
     * Enable transition on sliderFrame.
     */
    enableTransition() {
        this.sliderFrame.style.webkitTransition = `all ${this.config.duration}ms ${this.config.easing}`;
        this.sliderFrame.style.transition = `all ${this.config.duration}ms ${this.config.easing}`;
    }


    /**
     * Go to slide with particular index
     * @param {number} index - Item index to slide to.
     * @param {function} callback - Optional callback function.
     */
    goTo(index, callback) {
        if (this.innerElements.length <= this.perPage) {
            return;
        }
        const beforeChange = this.currentSlide;
        this.currentSlide = this.config.loop ?
            index % this.innerElements.length :
            Math.min(Math.max(index, 0), this.innerElements.length - this.perPage);
        if (beforeChange !== this.currentSlide) {
            this.slideToCurrent();
            this.change(callback);
        }
    }


    /**
     * Moves sliders frame to position of currently active slide
     */
    slideToCurrent(enableTransition) {
        const currentSlide = this.config.loop ? this.currentSlide + this.perPage : this.currentSlide;
        const offset = (this.config.rtl ? 1 : -1) * currentSlide * (this.selectorWidth / this.perPage);

        if (enableTransition) {
            // This one is tricky, I know but this is a perfect explanation:
            // https://youtu.be/cCOL7MC4Pl0
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.enableTransition();
                    this.sliderFrame.style[this.transformProperty] = `translate3d(${offset}px, 0, 0)`;
                    this.setActiveSlide(currentSlide - 1);
                });
            });
        } else {
            this.sliderFrame.style[this.transformProperty] = `translate3d(${offset}px, 0, 0)`;
            this.setActiveSlide(currentSlide - 1);
        }
    }

    setActiveSlide(index) {
        this.innerElements.map((item, i) => {
            item.classList.toggle('active', i === index);
            // item.classList.toggle('prev', i === index - 1);
            // item.classList.toggle('prev-prev', i === index - 2);
            // item.classList.toggle('next', i === index + 1);
            // item.classList.toggle('next-next', i === index + 2);
        });
    }


    /**
     * Recalculate drag /swipe event and reposition the frame of a slider
     */
    updateAfterDrag() {
        const movement = (this.config.rtl ? -1 : 1) * (this.drag.endX - this.drag.startX);
        const movementDistance = Math.abs(movement);
        const howManySliderToSlide = this.config.multipleDrag ? Math.ceil(movementDistance / (this.selectorWidth / this.perPage)) : 1;

        const slideToNegativeClone = movement > 0 && this.currentSlide - howManySliderToSlide < 0;
        const slideToPositiveClone = movement < 0 && this.currentSlide + howManySliderToSlide > this.innerElements.length - this.perPage;

        if (movement > 0 && movementDistance > this.config.threshold && this.innerElements.length > this.perPage) {
            this.prev(howManySliderToSlide);
        } else if (movement < 0 && movementDistance > this.config.threshold && this.innerElements.length > this.perPage) {
            this.next(howManySliderToSlide);
        }
        this.slideToCurrent(slideToNegativeClone || slideToPositiveClone);
    }


    /**
     * When window resizes, resize slider components as well
     */
    resizeHandler() {
        // update perPage number dependable of user value
        this.resolveSlidesNumber();

        // relcalculate currentSlide
        // prevent hiding items when browser width increases
        if (this.currentSlide + this.perPage > this.innerElements.length) {
            this.currentSlide = this.innerElements.length <= this.perPage ? 0 : this.innerElements.length - this.perPage;
        }

        this.selectorWidth = this.selector.clientWidth;

        this.buildSliderFrame();
    }


    /**
     * Clear drag after touchend and mouseup event
     */
    clearDrag() {
        this.drag = {
            startX: 0,
            endX: 0,
            startY: 0,
            letItGo: null,
            preventClick: this.drag.preventClick
        };
    }


    /**
     * touchstart event handler
     */
    touchstartHandler(e) {
        // Prevent dragging / swiping on inputs, selects and textareas
        const ignoreSiema = ['TEXTAREA', 'OPTION', 'INPUT', 'SELECT'].indexOf(e.target.nodeName) !== -1;
        if (ignoreSiema) {
            return;
        }

        e.stopPropagation();
        this.pointerDown = true;
        this.drag.startX = e.touches[0].pageX;
        this.drag.startY = e.touches[0].pageY;
    }


    /**
     * touchend event handler
     */
    touchendHandler(e) {
        e.stopPropagation();
        this.pointerDown = false;
        this.enableTransition();
        if (this.drag.endX) {
            this.updateAfterDrag();
        }
        this.clearDrag();
    }


    /**
     * touchmove event handler
     */
    touchmoveHandler(e) {
        e.stopPropagation();

        if (this.drag.letItGo === null) {
            this.drag.letItGo = Math.abs(this.drag.startY - e.touches[0].pageY) < Math.abs(this.drag.startX - e.touches[0].pageX);
        }

        if (this.pointerDown && this.drag.letItGo) {
            e.preventDefault();
            this.drag.endX = e.touches[0].pageX;
            this.sliderFrame.style.webkitTransition = `all 0ms ${this.config.easing}`;
            this.sliderFrame.style.transition = `all 0ms ${this.config.easing}`;

            const currentSlide = this.config.loop ? this.currentSlide + this.perPage : this.currentSlide;
            const currentOffset = currentSlide * (this.selectorWidth / this.perPage);
            const dragOffset = (this.drag.endX - this.drag.startX);
            const offset = this.config.rtl ? currentOffset + dragOffset : currentOffset - dragOffset;
            this.sliderFrame.style[this.transformProperty] = `translate3d(${(this.config.rtl ? 1 : -1) * offset}px, 0, 0)`;
        }
    }


    /**
     * mousedown event handler
     */
    mousedownHandler(e) {
        // Prevent dragging / swiping on inputs, selects and textareas
        const ignoreSiema = ['TEXTAREA', 'OPTION', 'INPUT', 'SELECT'].indexOf(e.target.nodeName) !== -1;
        if (ignoreSiema) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        this.pointerDown = true;
        this.drag.startX = e.pageX;
    }


    /**
     * mouseup event handler
     */
    mouseupHandler(e) {
        e.stopPropagation();
        this.pointerDown = false;
        this.endGrabbing();
        this.enableTransition();
        if (this.drag.endX) {
            this.updateAfterDrag();
        }
        this.clearDrag();
    }


    /**
     * mousemove event handler
     */
    mousemoveHandler(e) {
        e.preventDefault();
        if (this.pointerDown) {
            // if dragged element is a link
            // mark preventClick prop as a true
            // to detemine about browser redirection later on
            if (e.target.nodeName === 'A' || utils.getEl(e.target, 'a')) {
                this.drag.preventClick = true;
            }

            this.drag.endX = e.pageX;
            this.startGrabbing();
            this.sliderFrame.style.webkitTransition = `all 0ms ${this.config.easing}`;
            this.sliderFrame.style.transition = `all 0ms ${this.config.easing}`;

            const currentSlide = this.config.loop ? this.currentSlide + this.perPage : this.currentSlide;
            const currentOffset = currentSlide * (this.selectorWidth / this.perPage);
            const dragOffset = (this.drag.endX - this.drag.startX);
            const offset = this.config.rtl ? currentOffset + dragOffset : currentOffset - dragOffset;
            this.sliderFrame.style[this.transformProperty] = `translate3d(${(this.config.rtl ? 1 : -1) * offset}px, 0, 0)`;
        }
    }


    /**
     * mouseleave event handler
     */
    mouseleaveHandler(e) {
        if (this.pointerDown) {
            this.pointerDown = false;
            this.endGrabbing();
            this.drag.endX = e.pageX;
            this.drag.preventClick = false;
            this.enableTransition();
            this.updateAfterDrag();
            this.clearDrag();
        }
    }


    /**
     * click event handler
     */
    clickHandler(e) {
        // if the dragged element is a link
        // prevent browsers from folowing the link
        if (this.drag.preventClick) {
            e.preventDefault();
        }
        this.drag.preventClick = false;
    }



    /**
     * Removes listeners and optionally restores to initial markup
     * @param {boolean} restoreMarkup - Determinants about restoring an initial markup.
     * @param {function} callback - Optional callback function.
     */
    destroy(restoreMarkup = false, callback) {
        this.detachEvents();

        this.selector.style.cursor = 'auto';

        if (restoreMarkup) {
            this.sliderFrame.innerHTML = '';
            for (let i = 0; i < this.innerElements.length; i++) {
                sliderFrame.appendChild(this.innerElements[i]);
            }

            this.selector.removeAttribute('style');
        }

        if (callback) {
            callback.call(this);
        }
    }
}
