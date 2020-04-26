function add_charts(name) {
    const container = document.getElementById('charts');

    const l = log.get(name);
    const ndx = crossfilter(l.states);

    const tmax = ndx.all().reduce((max, d) => Math.max(max, d.t), 0);

    const dim = ndx.dimension(d => d.t);
    const group = dim.group().reduce((acc, d) => d, (acc, d) => d, () => ({}));

    const old = document.getElementById(name);
    old && (old.innerHTML = '');

    const parent = document.getElementById('charts');

    const line_el = old || document.createElement('div');
    line_el.id = name;
    !document.getElementById(name) && parent.append(line_el);
    const line = dc.lineChart(`#${name}`);

    line
        .width(1000)
        .height(300)
        .xAxisLabel('Weeks')
        .yAxisLabel(`${name}: Infected / Healthy / Removed`)
        .x(d3.scaleLinear().domain([0, tmax]))
        .ordinalColors(['red', 'green', 'gray'])
        .brushOn(false)
        .renderArea(true)
        .renderDataPoints(true)
        .dimension(dim);

    ['Infected', 'Healthy', 'Removed'].map((n, i) => {
        line[i == 0 ? 'group' : 'stack'](group, n, d => d.value[n.toLowerCase()]);
        line.title(n, d => `t: ${d.key}, ${n}: ${d.value[n.toLowerCase()]}`);
    });

    line.render();
}
