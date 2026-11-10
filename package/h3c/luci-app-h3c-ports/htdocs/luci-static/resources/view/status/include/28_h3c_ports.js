'use strict';
'require baseclass';
'require rpc';

/*
 * Status -> Overview: traffic of every LAN/WAN port from the hardware
 * counters (switch MIB, GMAC MMC). With NSS offload the interface
 * statistics stop counting, so the built-in port view and "ip -s link"
 * show only the few packets that still pass the Linux driver.
 *
 * Based on the idea of the 21.02 port-status view by IHY231
 * (FlyFish-go/H3C-Magic-NSS#2).
 */

const callPortStats = rpc.declare({
	object: 'h3c.ports',
	method: 'stats',
	expect: { '': {} }
});

/* previous sample per port, for the rate; survives the overview's re-render */
let previous = {};

function label(name) {
	const m = name.match(/^(lan|wan)(\d*)$/);

	if (!m)
		return name;

	return m[1].toUpperCase() + (m[2] ? ' ' + m[2] : '');
}

function linkText(p) {
	if (!p.up)
		return _('No link');

	const speed = (p.speed > 0) ? '%d Mbit/s'.format(p.speed) : _('Link up');

	if (p.duplex === 'full')
		return speed + ', ' + _('full duplex');
	if (p.duplex === 'half')
		return speed + ', ' + _('half duplex');

	return speed;
}

function rate(bytes) {
	return (bytes == null) ? '-' : '%1000.2mbit/s'.format(bytes * 8);
}

function total(bytes) {
	return (bytes == null) ? '-' : '%1024.2mB'.format(bytes);
}

return baseclass.extend({
	title: _('Port traffic'),

	load() {
		return L.resolveDefault(callPortStats(), {});
	},

	render(data) {
		const ports = Array.isArray(data?.ports) ? data.ports : [];
		const now = +data?.time_ms || Date.now();

		if (!ports.length)
			return null;

		const rows = [];
		const seen = {};

		ports.forEach((p) => {
			const prev = previous[p.name];
			const hasBytes = (p.rx_bytes != null && p.tx_bytes != null);
			let rxRate = null, txRate = null;

			if (hasBytes && prev && now > prev.time &&
			    p.rx_bytes >= prev.rx && p.tx_bytes >= prev.tx) {
				const dt = (now - prev.time) / 1000;

				rxRate = (p.rx_bytes - prev.rx) / dt;
				txRate = (p.tx_bytes - prev.tx) / dt;
			}

			if (hasBytes)
				seen[p.name] = { rx: p.rx_bytes, tx: p.tx_bytes, time: now };

			/*
			 * Directions as the user sees them: on a LAN port the switch
			 * transmits what the attached device downloads; on WAN the
			 * router receives what it downloads from upstream.
			 */
			const lan = (p.role !== 'wan');
			const down = lan ? [ txRate, p.tx_bytes ] : [ rxRate, p.rx_bytes ];
			const up = lan ? [ rxRate, p.rx_bytes ] : [ txRate, p.tx_bytes ];

			rows.push(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'data-title': _('Port') },
					E('strong', {}, label(p.name))),
				E('td', { 'class': 'td left', 'data-title': _('Link') }, linkText(p)),
				E('td', { 'class': 'td right', 'data-title': _('Download rate') }, rate(down[0])),
				E('td', { 'class': 'td right', 'data-title': _('Upload rate') }, rate(up[0])),
				E('td', { 'class': 'td right', 'data-title': _('Downloaded') }, total(down[1])),
				E('td', { 'class': 'td right', 'data-title': _('Uploaded') }, total(up[1]))
			]));
		});

		previous = seen;

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th left' }, _('Port')),
				E('th', { 'class': 'th left' }, _('Link')),
				E('th', { 'class': 'th right' }, _('Download rate')),
				E('th', { 'class': 'th right' }, _('Upload rate')),
				E('th', { 'class': 'th right' }, _('Downloaded')),
				E('th', { 'class': 'th right' }, _('Uploaded'))
			])
		].concat(rows));
	}
});
