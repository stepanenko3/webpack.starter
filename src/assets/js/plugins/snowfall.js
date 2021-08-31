'use strict';

class SnowFall {
    constructor(cfg) {
        this.defaults = {
            wrapper: null,
            count: 100,
            speed: 3,
            size: 2,
            color: '#fff',
            opacity: 0.5,
        };

        this.cfg = utils.extend(Object.assign({}, this.defaults), cfg);

        this.wrapper = this.cfg.wrapper;
        if (!this.wrapper) return;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.wrapper.clientWidth;
        this.height = this.wrapper.clientHeight;
        this.active = false;

        this.canvas.classList.add('snowfall');
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = this.canvas.style.top = '0';

        this.snowflakes = [];

        for (let i = 0; i < this.cfg.count; i++) {
            let snowflake = new SnowFlake(this.width, this.height, {
                vy: this.cfg.speed,
                r: this.cfg.size,
                o: this.cfg.opacity,
            });

            snowflake.reset(this.width, this.height, {
                vy: this.cfg.speed,
                r: this.cfg.size,
                o: this.cfg.opacity,
            });
            this.snowflakes.push(snowflake);
        }

        this.onResize();
        window.addEventListener('resize', () => this.onResize(), false);

        this.wrapper.appendChild(this.canvas);
    }

    onResize() {
        this.width = this.wrapper.clientWidth;
        this.height = this.wrapper.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.fillStyle = this.cfg.color

        let wasActive = this.active;
        this.active = true;
        // this.active = this.width > 600;

        if (!wasActive && this.active)
            window.requestAnimFrame(() => this.update());
    }

    update() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (!this.active) return;

        for (let i = 0; i < this.cfg.count; i++) {
            let snowflake = this.snowflakes[i];
            snowflake.y += snowflake.vy;
            snowflake.x += snowflake.vx;

            this.ctx.globalAlpha = snowflake.o;
            this.ctx.beginPath();
            this.ctx.arc(snowflake.x, snowflake.y, snowflake.r, 0, Math.PI * 2, false);
            this.ctx.closePath();
            this.ctx.fill();

            if (snowflake.y > this.height || snowflake.x < 0 || snowflake.x > this.width)
                snowflake.reset(this.width, this.height, {
                    vy: this.cfg.speed,
                    r: this.cfg.size,
                    o: this.cfg.opacity,
                });
        }

        window.requestAnimFrame(() => this.update());
    }
}

class SnowFlake {
    constructor(width, height, data) {
        this.x = 0;
        this.y = 0;
        this.vy = 0;
        this.vx = 0;
        this.r = 0;

        this.reset(width, height, data);
    }

    reset(width, height, data) {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.vy = (1 + Math.random()) * data.vy;
        this.vx = 0.5 - Math.random();
        this.r = (1 + Math.random()) * data.r;
        this.o = (0.5 + Math.random()) * data.o;
    }
}

export default SnowFall;
