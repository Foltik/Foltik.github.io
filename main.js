const canvas = document.getElementById('canvas');
const wrap = document.getElementById('canvas-wrap');
const c = canvas.getContext('2d');

const timestep = 4;
const capstep = 1;
const dt = (1 / 60) * timestep;
let start = window.performance.now();
let t = 0;
let running = false;

let envs = [];
const log = new Map();

let [w, h] = [c.width, c.height];

function resize() {
    [w, h] = [wrap.clientWidth, wrap.clientHeight];
    [canvas.width, canvas.height] = [w, h];
    [c.width, c.height] = [w, h];
    init();
}

function init() {
    start = Date.now();
    t = 0;
    running = false;

    log.clear();

    envs = [];

    let cfg = {
        p_infection: 0.1,
        t_recovery: 5,
        p_death: 0.01,
        p_immune: 0.2,
        r_infection: 5,
    };

    envs.push({env: new SIR(log, {
        name: 'mask',
        //p_mask: 0,
        //p_gloves: 0,
        count: 50,
        n_infected: 8,
        ...cfg,
    }), pos: [10, 10], dim: [(w / 2) - 15, h - 20]});

    envs.push({env: new SIR(log, {
        name: 'no_mask',
        count: 25,
        n_infected: 4,
        //p_mask: 0.5,
        //p_gloves: 0.5,
        ...cfg,
    }), pos: [(w / 2) + 5, 10], dim: [(w / 2) - 15, h - 20]});
}

function draw() {
    requestAnimationFrame(draw);

    c.strokeStyle = 'black';
    c.strokeRect(0, 0, w, h);

    for (let {env, pos, dim} of envs) {
        if (running && env.running())
            env.tick(t, dt, log.get(env.name), ...dim);

        c.save();
        c.translate(...pos);
        env.draw(c, ...dim);
        c.translate(...pos.map(c => -c));
        c.restore();
    }

    if (running)
        t += dt;
}

window.addEventListener('resize', resize, false);
window.addEventListener('DOMContentLoaded', () => {
    const controls = document.getElementById('controls');

    const start = document.createElement('button');
    start.innerHTML = 'Start Simulation';
    start.addEventListener('click', () => running = true);
    controls.append(start);

    const stop = document.createElement('button');
    stop.innerHTML = 'Stop Simulation';
    stop.addEventListener('click', () => running = false);
    controls.append(stop);

    const reset = document.createElement('button');
    reset.innerHTML = 'Reset Simulation';
    reset.addEventListener('click', () => init());
    controls.append(reset);

    resize();
    draw();
}, false);
