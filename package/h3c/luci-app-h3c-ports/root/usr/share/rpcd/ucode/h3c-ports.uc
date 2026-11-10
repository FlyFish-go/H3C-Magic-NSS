#!/usr/bin/env ucode
// SPDX-License-Identifier: Apache-2.0
//
// Byte counters of the LAN/WAN ports, read from the hardware.
//
// Once the NSS firmware owns a GMAC, packets go between the firmware and
// the GMAC (and the switch behind it) without passing the Linux driver, so
// /sys/class/net/*/statistics stop counting. The switch MIB and the GMAC
// MMC counters still count every frame; ethtool -S reads both.
//
// Based on the idea of the 21.02 port-status view by IHY231
// (FlyFish-go/H3C-Magic-NSS#2).

'use strict';

import { readfile, popen } from 'fs';

// ethtool -S names of the rx/tx byte counters, per driver
const COUNTERS = [
	[ 'mmc_rx_octetcount_gb', 'mmc_tx_octetcount_gb' ],	// stmmac GMAC (MMC)
	[ 'RxGoodByte', 'TxByte' ],				// qca8k (QCA8337)
	[ 'ifInOctets', 'ifOutOctets' ]				// rtl8365mb (RTL8367S)
];

function valid_name(name) {
	return type(name) == 'string' && match(name, /^[A-Za-z0-9_.-]{1,15}$/) != null;
}

function sysfs(dev, file) {
	const v = readfile(`/sys/class/net/${dev}/${file}`);

	return (v != null) ? trim(v) : null;
}

function sysfs_int(dev, file) {
	const v = sysfs(dev, file);

	return (v != null && match(v, /^[0-9]+$/)) ? +v : null;
}

function hw_counters(dev) {
	const p = popen(`/usr/sbin/ethtool -S ${dev} 2>/dev/null`, 'r');

	if (!p)
		return null;

	const st = {};

	for (let line = p.read('line'); length(line); line = p.read('line')) {
		const m = match(line, /^[ \t]*([A-Za-z0-9_]+): ([0-9]+)[ \t]*\n?$/);

		if (m)
			st[m[1]] = +m[2];
	}

	p.close();

	for (let c in COUNTERS)
		if (st[c[0]] != null && st[c[1]] != null)
			return { rx: st[c[0]], tx: st[c[1]], source: 'hw' };

	return null;
}

function board_ports() {
	let board;

	try {
		board = json(readfile('/etc/board.json') || '{}');
	}
	catch (e) {
		return [];
	}

	const res = [];

	for (let role in [ 'lan', 'wan' ]) {
		const net = board?.network?.[role];
		const names = (type(net?.ports) == 'array') ? net.ports
			: (net?.device ? [ net.device ] : []);

		for (let name in names)
			if (valid_name(name))
				push(res, { name, role });
	}

	return res;
}

function port_state(p) {
	const up = (sysfs(p.name, 'carrier') == '1');
	const res = {
		name: p.name,
		role: p.role,
		up,
		speed: up ? sysfs_int(p.name, 'speed') : null,
		duplex: up ? sysfs(p.name, 'duplex') : null
	};

	let c = hw_counters(p.name);

	// no known hardware counter: fall back to the interface statistics
	if (!c) {
		const rx = sysfs_int(p.name, 'statistics/rx_bytes');
		const tx = sysfs_int(p.name, 'statistics/tx_bytes');

		if (rx != null && tx != null)
			c = { rx, tx, source: 'netdev' };
	}

	if (c) {
		res.rx_bytes = c.rx;
		res.tx_bytes = c.tx;
		res.source = c.source;
	}

	return res;
}

const methods = {
	stats: {
		call: function() {
			const t = clock(true);

			return {
				time_ms: t[0] * 1000 + t[1] / 1000000,
				ports: map(board_ports(), port_state)
			};
		}
	}
};

return { 'h3c.ports': methods };
