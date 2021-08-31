import './plugins/dom-change';

import {
    disableBodyScroll,
    enableBodyScroll,
    clearAllBodyScrollLocks
} from 'body-scroll-lock';

import Toastify from 'toastify-js'
import scroll from 'scroll';
import scrollDoc from 'scroll-doc';

import loadcss from 'loadcss';
import NProgress from './plugins/nprogress';

const scrollElement = scrollDoc();

// shim layer with setTimeout fallback
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

export const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
};

export const between = (value, a, b, inclusive = true) => {
    let min = Math.min(a, b),
        max = Math.max(a, b);

    return inclusive ?
        value >= min && value <= max :
        value > min && value < max;
}

NProgress.check = () => {
    return between(NProgress.status, 0, 100, false);
}

export {
    NProgress as progress
};

export const ready = (fn) => {
    if (document.readyState != 'loading') {
        fn();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        document.attachEvent('onreadystatechange', function () {
            if (document.readyState != 'loading')
                fn();
        });
    }
}

export const togglePasswordVisible = (field) => {
    const input = field.querySelector('input');
    const btn = field.querySelector('.btn');

    if (input.type == 'password') {
        input.type = 'text';
        btn.classList.add('active');
    } else {
        input.type = 'password';
        btn.classList.remove('active');
    }
}

export const disableScroll = (target = null, options = null) => disableBodyScroll(target, options);
export const enableScroll = (target = null) => enableBodyScroll(target);
export const clearAllScrollLocks = () => clearAllBodyScrollLocks();

export const domChange = onDomChange;

export const isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);
export const n = (selector, parent = document) => [].slice.call(parent.querySelectorAll(selector));

export const objectMap = (object, fn) => {
    let i = 0,
        newObject = {};

    Object.keys(object).map(key => {
        i++;
        newObject[key] = fn(object[key], key, i - 1);
    });

    return newObject;
}

export const objectFilter = (object, fn) => {
    let result = {},
        key;

    for (key in object) {
        if (object.hasOwnProperty(key) && !fn(object[key], key)) {
            result[key] = object[key];
        }
    }

    return result;
}

export const createCustomEvent = (type, params) => {
    const eventParams = {
        bubbles: false,
        cancelable: false,
        detail: undefined,
        ...params,
    }

    if (typeof window.CustomEvent === 'function') {
        return new CustomEvent(type, eventParams)
    }

    const customEvent = document.createEvent('CustomEvent')
    customEvent.initCustomEvent(
        type,
        eventParams.bubbles,
        eventParams.cancelable,
        eventParams.detail
    )

    return customEvent
}

export const updateQueryStringParameter = (uri, key, value) => {
    let re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    let separator = uri.indexOf('?') !== -1 ? "&" : "?";

    return uri.match(re) ?
        uri.replace(re, '$1' + key + "=" + value + '$2') :
        uri + separator + key + "=" + value;
}

export const smoothScroll = (y, smoothDistance = 100, duration = 200) => {
    const offset = window.pageYOffset;
    if (y === offset) return;

    window.scrollTo({
        top: offset < y - smoothDistance ?
            y - smoothDistance : y + smoothDistance,
    });

    scroll.top(scrollElement, y, {
        duration: duration
    });
}

export const getParamByName = (name, url = window.location.href, def = null) => {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return def;
    if (!results[2]) return def;
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export const dispatchEvent = (element, name) => {
    if ('createEvent' in document) {
        let evt = document.createEvent('HTMLEvents');
        evt.initEvent(name, false, true);
        element.dispatchEvent(evt);
    } else
        element.fireEvent(`on${name}`);
}

export const extend = function () {
    for (let i = 1; i < arguments.length; i++)
        for (let key in arguments[i])
            if (arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];

    return arguments[0];
}

export const extendReverse = function () {
    for (let i = 1; i < arguments.length; i++)
        for (let key in arguments[i])
            if (!arguments[0].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];

    return arguments[0];
}

export const findFirst = (array, n) => {
    if (array == null) return void 0;
    if (n == null) return array[0];
    if (n < 0) return [];
    return array.slice(0, n);
}

export const money = (amount, digits = 2) => new Intl.NumberFormat(settings.localeRegional, {
    style: 'currency',
    currency: settings.currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
}).format(amount);

export const popupCenter = ({
    url,
    title,
    w,
    h
}) => {
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft
    const top = (height - h) / 2 / systemZoom + dualScreenTop

    const newWindow = window.open(url, title, `toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,width=${w / systemZoom},height=${h / systemZoom},top=${top},left=${left}`);

    if (window.focus) newWindow.focus();

    return newWindow;
}

export const parseServerErrors = (errors) => {
    let res = {};

    objectMap(errors, (val, key) => {
        const ex = key.split('.', 4);

        const withoutFirst = ex.slice(1).join('][');
        let newKey = ex[0] + (withoutFirst ? `[${withoutFirst}]` : '');

        res[newKey] = val;
    });

    return res;
}

export const getSiblings = (elem, filter) => {
    if (!elem) return [];
    // Setup siblings array and get the first sibling
    let siblings = [];
    let el = elem.parentNode.firstChild;

    do {
        if (el.nodeType === 1 && el !== elem && (!filter || filter(el)))
            siblings.push(el);
    } while (el = el.nextSibling);

    return siblings;
}

export const outerWidth = (el) => {
    let width = el.offsetWidth;
    const style = window.getComputedStyle ? getComputedStyle(el, null) : el.currentStyle;

    width += parseInt(style.marginLeft) + parseInt(style.marginRight);

    return width;
}

export const outerHeight = (el) => {
    let height = el.offsetHeight;
    const style = window.getComputedStyle ? getComputedStyle(el, null) : el.currentStyle;

    height += parseInt(style.marginTop) + parseInt(style.marginBottom);

    return height;
}

export const generateUrl = (objectType, urlParams) => {
    let params = urlParams ? urlParams : [];
    params.unshift(objectType);
    params = params.filter(param => param && (isNumeric(param) || param.length > 0));

    return '/' + params.join('/');
}

export const firstChild = (el) => {
    let firstChild = el.firstChild;
    while (firstChild != null && firstChild.nodeType === 3) {
        firstChild = firstChild.nextSibling;
    }
    return firstChild;
}

export const isVisible = (element) => {
    let el = typeof element === 'string' ?
        document.querySelector(element) :
        element;

    let t1 = el.currentStyle ? el.currentStyle.visibility : getComputedStyle(el, null).visibility;
    let t2 = el.currentStyle ? el.currentStyle.display : getComputedStyle(el, null).display;
    //if either of these are true, then the element is not visible
    if (t1 === 'hidden' || t2 === 'none') {
        return false;
    }
    //This regex is used to scan the parent nodes all the way up to the body element
    while (!(/body/i).test(el)) {
        //get the next parent node
        el = el.parentNode;
        //grab the values, if available,
        t1 = el.currentStyle ? el.currentStyle.visibility : getComputedStyle(el, null).visibility;
        t2 = el.currentStyle ? el.currentStyle.display : getComputedStyle(el, null).display;
        if (t1 === 'hidden' || t2 === 'none') {
            return false;
        }
    }
    //if all scans are not successful, then the element is visible
    return true;
}

export const inViewport = (elem, callback, options = {}) => {
    return new IntersectionObserver(entries => {
        entries.forEach(entry => callback(entry));
    }, options).observe(typeof elem === 'string' ? document.querySelector(elem) : elem);
}

// inViewport('.target', element => {
//     //element.isIntersecting (bool) true/false
// }, {
//     root: document.querySelector('.scroll')
// })

export const inViewportOffset = (el) => {
    var H = window.outerHeight,
        r = el.getBoundingClientRect(),
        t = r.top,
        b = r.bottom;

    if (t > 0) t = 0;

    return Math.max(0, t > 0 ? H - t : (b < H ? b : H));
}

export const getEl = (el, selector) => el.matches(selector) ? el : el.closest(selector);

export const loadAsync = (src, callback) => {
    let script = document.createElement('script');
    script.src = src;

    if (callback !== null) {
        if (script.readyState) { // IE, incl. IE9
            script.onreadystatechange = () => {
                if (script.readyState === 'loaded' || script.readyState === 'complete') {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {
            script.onload = () => { // Other browsers
                callback();
            };
        }
    }

    document.getElementsByTagName('head')[0].appendChild(script);
}

export const notify = (message = 'Error', options = {}) => {
    options = extend({
        text: message,
        duration: 5000,
        close: true,
        gravity: 'top',
        position: 'right',
        style: {
            background: 'var(--color-danger-500)',
        },
        stopOnFocus: true,
        offset: {
            y: 55,
        },
    }, options);

    Toastify(options).showToast();
}

export const loadCss = (link) => {
    loadcss(link);
};

export const loadJs = (src, callback = () => { }) => {
    let e = document.createElement('script');
    e.src = src;
    e.type = 'text/javascript';
    e.addEventListener('load', callback);

    document.getElementsByTagName('head')[0].appendChild(e);
};

export const meta = (name) => {
    const metas = document.getElementsByTagName('meta');

    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute('name') === name) {
            return metas[i].getAttribute('content');
        }
    }

    return '';
}

export const csrf = () => meta('csrf-token');

export const runOnKeys = (func, ...codes) => {
    let pressed = new Set();

    document.addEventListener('keydown', function (event) {
        pressed.add(event.code);

        for (let code of codes) {
            let founded = false;

            if (typeof code === 'string' && pressed.has(code)) {
                founded = true;
            }

            if (typeof code === 'object' && Array.isArray(code)) {
                for (let code1 of code) {
                    if (pressed.has(code1)) {
                        founded = true;
                    }
                }
            }

            if (!founded) return;
        }

        pressed.clear();

        func();
    });

    document.addEventListener('keyup', function (event) {
        pressed.delete(event.code);
    });
}

export const isChild = (obj, parentObj) => {
    while (obj != undefined && obj != null && obj.tagName.toUpperCase() != 'BODY') {
        if (obj == parentObj) {
            return true;
        }
        obj = obj.parentNode;
    }

    return false;
}

export const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export const getMap = (json, data) => {
    let tpl = '';

    json.map(n => {
        let opactiy = data[n.key] || 0;
        if (opactiy <= 0.1) opactiy = 0.1;

        tpl += `<path d="${n.path}" data-id="${n.key}" style="fill:rgba(37, 112, 255, ${opactiy})"></path>`;
    });

    return `<svg viewBox="0 0 2000 1001" class="map-svg">${tpl}</svg>`;
}

export const serialize = function (obj, prefix) {
    let str = [],
        p;

    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            let k = prefix ? prefix + "[" + p + "]" : p,
                v = obj[p];

            str.push((v !== null && typeof v === "object") ?
                serialize(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    return str.join("&");
}

export const renameField = (el, attr, count, forName = false, regex = /([^\[]+?\[)\d(\].*)/) => {
    const _attr = el.getAttribute(attr);

    if (_attr) {
        if (attr == 'name' || forName === true) {
            const a = _attr.replace(regex, '$1' + count + '$2');
            el.setAttribute(attr, a);
        } else {
            const a = _attr.split(/_[0-9]*$/i)[0];
            el.setAttribute(attr, a + '_' + count);
        }
    }
}

export const objectToDotCase = (obj, target, prefix) => {
    target = target || {},
        prefix = prefix || '';

    Object.keys(obj).forEach(function (key) {
        if (typeof (obj[key]) === 'object' && !Array.isArray(obj[key])) {
            objectToDotCase(obj[key], target, prefix + key + '.');
        } else {
            return target[prefix + key] = obj[key];
        }
    });

    return target;
}

export const dotCaseToObjects = (obj) => {
    const result = {};

    // For each object path (property key) in the object
    for (const objectPath in obj) {
        // Split path into component parts
        const parts = objectPath.split('.');

        // Create sub-objects along path as needed
        let target = result;
        while (parts.length > 1) {
            const part = parts.shift();
            target = target[part] = target[part] || {};
        }

        // Set value at end of path
        target[parts[0]] = obj[objectPath]
    }

    return result;
}

export function auditTime(func, time = null) {
    let timer;
    return (...args) => {
        if (timer) return;
        func && func(...args);
        timer = setTimeout(_ => {
            timer = null;
        }, time > 0 ? time : 300)
    }
}

export function debounceTime(func, time = null) {
    let timer;
    return (...args) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            func && func(...args);
            timer = null;
        }, time > 0 ? time : 300);
    }
}


export function throttleTime(time) {
    let now, before;
    return _ => {
        now = (new Date).getTime();
        if (!before || now - before > time) {
            before = now;
            return true;
        }
        before = now;
        return false;
    }
}


export const stopVideos = (element = document) => {
    const videos = utils.n('iframe, video', element);

    videos.map(video => {
        if (video.tagName.toLowerCase() === 'video') {
            video.pause();
        } else {
            const src = video.src;

            if (src.indexOf('youtube') !== -1 && video.contentWindow) {
                video.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'pauseVideo',
                }), '*');
            } else {
                video.src = src;
            }
        }
    });
}

export const copyText = (textToCopy, notify = true) => {
    const tmpEl = document.createElement('input');
    tmpEl.type = 'text';
    tmpEl.value = textToCopy;

    document.body.appendChild(tmpEl);

    tmpEl.select();
    document.execCommand('Copy');

    document.body.removeChild(tmpEl);

    if (notify) {
        utils.notify('Success copied', {
            style: {
                background: 'var(--color-success-500)',
            },
        });
    }
}

export const togglePopup = (selector, className, status = null) => {
    if (status === null)
        status = !document.body.classList.contains('popup-open');

    document.body.classList.toggle('popup-open', status);
    const el = document.querySelector(selector);

    if (el) el.classList.toggle(className, status);

    if (status) {
        if (el) utils.disableScroll(el);
    } else {
        utils.clearAllScrollLocks();
    }

    return el;
}

export const getCoords = (el) => {
    var box = el.getBoundingClientRect();

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
}

export const trans = (key, params = {}, def = '') => {
    const data = utils.objectToDotCase(window.i18n || {});

    let trans = data[key] || def;

    Object.keys(params).map(k => trans.replace(`{${k}}`, params[k]));

    return trans;
}


export const event = (selector, eventName, fn, options = {}) => {
    if (!options.parent) options.parent = document;

    const nodes = (typeof selector === 'string')
        ? utils.n(selector, options.parent)
        : selector;

    let listener = fn;
    if (options.debounceTime) {
        listener = utils.debounceTime(function () {
            return fn(...arguments);
        }, options.debounceTime);
    } else if (options.auditTime) {
        listener = utils.auditTime(function () {
            return fn(...arguments);
        }, options.auditTime);
    }

    nodes.map(n => n.addEventListener(eventName, listener, options));

    return {
        unsubscribe: () => nodes.map(n => n.removeEventListener(eventName, listener, options)),
    }
}

export const handleError = (error = null, stopProgress = true) => {
    console.error(error);

    if (stopProgress) utils.progress.done();

    const messages = {
        default: utils.trans('errors.code.default'),
        403: utils.trans('errors.code.403'),
        404: utils.trans('errors.code.404'),
    };

    let message = null;
    let onclick = () => { };

    if (error && error.response) {
        const data = error.response.data;
        const status = error.response.status;
        const headers = error.response.headers;

        let formattedTime = '';
        if (status == 429) {
            const date = new Date(headers['x-ratelimit-reset'] * 1000);
            const hours = date.getHours();
            const seconds = parseInt("0" + date.getSeconds());

            let minutes = parseInt(date.getMinutes());
            if (seconds > 5) minutes += 1;
            minutes = "0" + minutes;

            formattedTime = hours + ':' + minutes.substr(-2);

            messages[429] = utils.trans('errors.code.429', {
                time: formattedTime,
            });
        }

        const errorsKeys = Object.keys(data && data.errors ? data.errors : []);

        if (!message && errorsKeys.length === 1) {
            message = data.errors[errorsKeys[0]];
        }

        if (!message && messages.hasOwnProperty(status)) {
            message = messages[status];
        }

        if (!message && data.message) {
            message = data.message;
        }

        onclick = () => {
            if (data && data.redirect)
                window.location = data.redirect;
        }

    } else if (error && error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
    } else if (error) {
        message = error.message;
    }

    if (!message) {
        message = messages.default;
    }

    utils.notify(message, {
        onClick: onclick,
    });
}

export const handleFormError = (form, data, callbackError = null) => {
    utils.n('.invalid', form).map(el => el.classList.remove('invalid'));
    utils.n('.form-field__error', form).map(el => el.remove());

    if (callbackError) {
        eval(`${callbackError}(${JSON.stringify(data)})`);
    } else {
        utils.progress.done();
    }

    if (!data || !data.errors) return;

    if (data.errors['_']) {
        utils.notify(data.errors['_']);
    }

    const errors = utils.parseServerErrors(data.errors);

    Object.keys(errors).map(key => {
        utils.n(`[name="${key}"],[name="${key}[]"]`, form).map(el => {
            const ratingField = utils.getEl(el, '.form-field__rating');
            if (ratingField) {
                ratingField.classList.add('invalid');
            } else {
                const field = utils.getEl(el, '.form-field');
                if (field) {
                    field.classList.add('invalid');
                    field.insertAdjacentHTML('beforeEnd', `<div class="form-field__error">${errors[key]}</div>`);
                }
            }
        });
    });
}
