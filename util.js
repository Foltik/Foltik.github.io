const rand = (min = 0, max = 1) => Math.random() * (max - min) + min;
const chance = p => Math.random() < p;
const irand = (min = 0, max = 1) => Math.floor(Math.random() * (max - min) + min);
const dist = (x0, y0, x1, y1) => Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
