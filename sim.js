class Environment {
    constructor(log, cfg) {
        this.cfg = cfg;
        this.name = cfg.name;

        this.state = {};

        this.last_cap = -1;

        log.set(this.name, {
            events: [],
            states: [],
        });
    }

    draw(c, w, h) {
        c.fillStyle = 'none';
        c.strokeStyle = 'black';
        c.rect(0, 0, w, h);
    }

    tick(t, dt, log, w, h) {
        const step = Math.floor(t / capstep);
        if (step > this.last_cap) {
            this.last_cap = step;

            // TODO: Update the data instead of recreating charts
            add_charts(this.name);

            log.states.push({
                t: step * (capstep / timestep),
                ...this.state
            });
        }
    }

    running() {
        return true;
    }
}

class Basic extends Environment {
    constructor(log, cfg) {
        super(log, cfg);

        this.mx = 100;
        this.my = 100;
        this.ofs = 5;
        this.speed = 30;

        this.stuff = [...Array(cfg.count)].map(i => {
            let angle = rand() * Math.PI * 2;
            let [vx, vy] = [Math.cos(angle), Math.sin(angle)];
            let [x, y] = [rand(this.ofs, this.mx - this.ofs), rand(this.ofs, this.my - this.ofs)];
            return {
                x,
                y,
                vx,
                vy,
            };
        });

        this.state = {
            count: cfg.count,
        };
    }

    draw(c, w, h) {
        c.fillStyle = 'white';
        c.strokeStyle = 'black';
        c.fillRect(0, 0, w, h);
        c.strokeRect(0, 0, w, h);
    }

    tick(t, dt, log, w, h) {
        for (let s of this.stuff) {
            if (s.removed) continue;

            s.x += s.vx * this.speed * dt;
            s.y += s.vy * this.speed * dt;

            if (s.x < this.ofs || s.x > this.mx - this.ofs)
                s.vx = -s.vx;

            if (s.y < this.ofs || s.y > this.my - this.ofs)
                s.vy = -s.vy;
        }

        super.tick(t, dt, log, w, h);
    }
}

class SIR extends Basic {
    constructor(log, cfg) {
        super(log, cfg);

        this.stuff.map(s => {
            s.infected = false;
            s.removed = false;
            s.t_infected = null;
        });

        for (let i = 0; i < cfg.n_infected; i++) {
            this.stuff[i].infected = true;
            this.stuff[i].t_infected = 0;
            if (chance(cfg.p_immune)) {
                this.stuff[i].immune = true;
            }
        }

        this.state.infected = cfg.n_infected;
        this.state.healthy = cfg.count - cfg.n_infected;
        this.state.removed = 0;
    }

    draw(c, w, h) {
        super.draw(c, w, h);

        c.strokeStyle = 'black';
        for (let t of this.stuff) {
            if (t.dead)
                c.fillStyle = 'dimgray';
            else if (t.removed)
                c.fillStyle = 'gainsboro';
            else if (t.infected)
                c.fillStyle = 'red';
            else
                c.fillStyle = 'cornflowerblue';

            c.beginPath();
            c.arc(t.x / this.mx * w, t.y / this.my * h, 3, 0, 2 * Math.PI);
            c.fill();

            if (t.immune) {
                c.fillStyle = 'ivory';
                c.beginPath();
                c.arc(t.x / this.mx * w, t.y / this.my * h, 2, 0, 2 * Math.PI);
                c.fill();
            }
        }
    }

    process_deaths(t, dt, log) {
        let infected = this.stuff.filter(s => !s.removed && s.infected);

        for (let i of infected) {
            if (chance(this.cfg.p_death) && !i.immune) {
                i.removed = true;
                i.dead = true;
                log.events.push({type: 'death', i});
                this.state.infected -= 1;
                this.state.removed += 1;
                continue;
            }
        }
    }

    process_recoveries(t, dt, log) {
        let infected = this.stuff.filter(s => !s.removed && s.infected);

        for (let i of infected) {
            if (t - i.t_infected > this.cfg.t_recovery) {
                i.removed = true;
                log.events.push({type: 'recovery', t});
                this.state.infected -= 1;
                this.state.removed += 1;
                continue;
            }
        }
    }

    process_infections(t, dt, log) {
        let susceptible = this.stuff.filter(s => !s.removed && !s.infected);
        let infected = this.stuff.filter(s => !s.removed && s.infected);

        for (let i of infected) {
            for (let j of susceptible) {
                if (dist(i.x, i.y, j.x, j.y) < this.cfg.r_infection) {
                    if (chance(this.cfg.p_infection)) {
                        j.infected = true;
                        j.t_infected = t;
                        log.events.push({type: 'infection', t});
                        this.state.healthy -= 1;
                        this.state.infected += 1;
                    }
                }
            }
        }
    }

    tick(t, dt, log, w, h) {
        super.tick(t, dt, log, w, h);

        this.process_deaths(t, dt, log);
        this.process_recoveries(t, dt, log);
        this.process_infections(t, dt, log);
    }

    running() {
        return this.state.infected != 0;
    }
}

class SIR_PPE extends SIR {
    constructor(log, cfg) {
        super(log, cfg);

        for (let s of this.stuff) {
            s.mask = chance(this.cfg.p_mask);
            s.gloves = chance(this.cfg.p_gloves);
        }
    }

    // Call the parent draw method, then also add on circles to indicate masks
    draw(c, w, h) {
        super.draw(c, w, h);

        let masks = this.stuff.filter(s => !s.removed && s.mask);

        c.strokeStyle = 'green';
        for (let m of masks) {
            c.beginPath();
            c.arc(m.x / this.mx * w, m.y / this.my * h, 8, 0, 2 * Math.PI);
            c.stroke();
        }

        let gloves = this.stuff.filter(s => !s.removed && s.gloves);
        c.strokeStyle = 'purple';
        for (let m of gloves) {
            c.beginPath();
            c.arc(m.x / this.mx * w, m.y / this.my * h, 10, 0, 2 * Math.PI);
            c.stroke();
        }
    }

    // Override the infection processing code and modify the radius based
    // on whether or not the infected person is wearing a mask
    process_infections(t, dt, log) {
        let susceptible = this.stuff.filter(s => !s.removed && !s.infected);
        let infected = this.stuff.filter(s => !s.removed && s.infected);

        for (let i of infected) {
            let radius = this.cfg.r_infection;

            // Lower infection radius for mask wearers
            if (i.mask)
                radius /= 4;

            for (let j of susceptible) {
                if (dist(i.x, i.y, j.x, j.y) < radius) {
                    let p = this.cfg.p_infection;

                    // Lower infection probability for glove wearers
                    if (j.gloves)
                        p /= 2;

                    if (chance(p)) {
                        j.infected = true;
                        j.t_infected = t;
                        log.events.push({type: 'infection', t});
                        this.state.healthy -= 1;
                        this.state.infected += 1;
                    }
                }
            }
        }
    }
}
