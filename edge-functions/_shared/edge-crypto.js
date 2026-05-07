export function bytesToHex(bytes) {
	return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function bytesToBase64Url(bytes) {
	let binary = ''
	for (const byte of bytes)
		binary += String.fromCharCode(byte)
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlToString(value) {
	const base64 = String(value).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(value).length / 4) * 4, '=')
	const binary = atob(base64)
	const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
	return new TextDecoder().decode(bytes)
}

async function digest(algorithm, value) {
	const data = new TextEncoder().encode(value)
	return new Uint8Array(await crypto.subtle.digest(algorithm, data))
}

export async function sha1Base64Url(value, length) {
	return bytesToBase64Url(await digest('SHA-1', value)).slice(0, length)
}

export async function sha1Hex(value) {
	return bytesToHex(await digest('SHA-1', value))
}

export async function sha256Base64Url(value, length) {
	return bytesToBase64Url(await digest('SHA-256', value)).slice(0, length)
}

export function randomHex(bytesLength) {
	const bytes = new Uint8Array(bytesLength)
	crypto.getRandomValues(bytes)
	return bytesToHex(bytes)
}

export async function hmacSign(secret, payload) {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	)
	return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))))
}

export function constantEqual(a, b) {
	if (a.length !== b.length)
		return false
	let diff = 0
	for (let i = 0; i < a.length; i++)
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
	return diff === 0
}

// Small MD5 implementation for Gravatar compatibility in the edge runtime.
export function md5(input) {
	function add32(a, b) {
		return (a + b) & 0xFFFFFFFF
	}
	function cmn(q, a, b, x, s, t) {
		a = add32(add32(a, q), add32(x, t))
		return add32((a << s) | (a >>> (32 - s)), b)
	}
	function ff(a, b, c, d, x, s, t) {
		return cmn((b & c) | (~b & d), a, b, x, s, t)
	}
	function gg(a, b, c, d, x, s, t) {
		return cmn((b & d) | (c & ~d), a, b, x, s, t)
	}
	function hh(a, b, c, d, x, s, t) {
		return cmn(b ^ c ^ d, a, b, x, s, t)
	}
	function ii(a, b, c, d, x, s, t) {
		return cmn(c ^ (b | ~d), a, b, x, s, t)
	}
	function md5cycle(state, block) {
		let [a, b, c, d] = state
		a = ff(a, b, c, d, block[0], 7, -680876936)
		d = ff(d, a, b, c, block[1], 12, -389564586)
		c = ff(c, d, a, b, block[2], 17, 606105819)
		b = ff(b, c, d, a, block[3], 22, -1044525330)
		a = ff(a, b, c, d, block[4], 7, -176418897)
		d = ff(d, a, b, c, block[5], 12, 1200080426)
		c = ff(c, d, a, b, block[6], 17, -1473231341)
		b = ff(b, c, d, a, block[7], 22, -45705983)
		a = ff(a, b, c, d, block[8], 7, 1770035416)
		d = ff(d, a, b, c, block[9], 12, -1958414417)
		c = ff(c, d, a, b, block[10], 17, -42063)
		b = ff(b, c, d, a, block[11], 22, -1990404162)
		a = ff(a, b, c, d, block[12], 7, 1804603682)
		d = ff(d, a, b, c, block[13], 12, -40341101)
		c = ff(c, d, a, b, block[14], 17, -1502002290)
		b = ff(b, c, d, a, block[15], 22, 1236535329)
		a = gg(a, b, c, d, block[1], 5, -165796510)
		d = gg(d, a, b, c, block[6], 9, -1069501632)
		c = gg(c, d, a, b, block[11], 14, 643717713)
		b = gg(b, c, d, a, block[0], 20, -373897302)
		a = gg(a, b, c, d, block[5], 5, -701558691)
		d = gg(d, a, b, c, block[10], 9, 38016083)
		c = gg(c, d, a, b, block[15], 14, -660478335)
		b = gg(b, c, d, a, block[4], 20, -405537848)
		a = gg(a, b, c, d, block[9], 5, 568446438)
		d = gg(d, a, b, c, block[14], 9, -1019803690)
		c = gg(c, d, a, b, block[3], 14, -187363961)
		b = gg(b, c, d, a, block[8], 20, 1163531501)
		a = gg(a, b, c, d, block[13], 5, -1444681467)
		d = gg(d, a, b, c, block[2], 9, -51403784)
		c = gg(c, d, a, b, block[7], 14, 1735328473)
		b = gg(b, c, d, a, block[12], 20, -1926607734)
		a = hh(a, b, c, d, block[5], 4, -378558)
		d = hh(d, a, b, c, block[8], 11, -2022574463)
		c = hh(c, d, a, b, block[11], 16, 1839030562)
		b = hh(b, c, d, a, block[14], 23, -35309556)
		a = hh(a, b, c, d, block[1], 4, -1530992060)
		d = hh(d, a, b, c, block[4], 11, 1272893353)
		c = hh(c, d, a, b, block[7], 16, -155497632)
		b = hh(b, c, d, a, block[10], 23, -1094730640)
		a = hh(a, b, c, d, block[13], 4, 681279174)
		d = hh(d, a, b, c, block[0], 11, -358537222)
		c = hh(c, d, a, b, block[3], 16, -722521979)
		b = hh(b, c, d, a, block[6], 23, 76029189)
		a = hh(a, b, c, d, block[9], 4, -640364487)
		d = hh(d, a, b, c, block[12], 11, -421815835)
		c = hh(c, d, a, b, block[15], 16, 530742520)
		b = hh(b, c, d, a, block[2], 23, -995338651)
		a = ii(a, b, c, d, block[0], 6, -198630844)
		d = ii(d, a, b, c, block[7], 10, 1126891415)
		c = ii(c, d, a, b, block[14], 15, -1416354905)
		b = ii(b, c, d, a, block[5], 21, -57434055)
		a = ii(a, b, c, d, block[12], 6, 1700485571)
		d = ii(d, a, b, c, block[3], 10, -1894986606)
		c = ii(c, d, a, b, block[10], 15, -1051523)
		b = ii(b, c, d, a, block[1], 21, -2054922799)
		a = ii(a, b, c, d, block[8], 6, 1873313359)
		d = ii(d, a, b, c, block[15], 10, -30611744)
		c = ii(c, d, a, b, block[6], 15, -1560198380)
		b = ii(b, c, d, a, block[13], 21, 1309151649)
		a = ii(a, b, c, d, block[4], 6, -145523070)
		d = ii(d, a, b, c, block[11], 10, -1120210379)
		c = ii(c, d, a, b, block[2], 15, 718787259)
		b = ii(b, c, d, a, block[9], 21, -343485551)
		state[0] = add32(a, state[0])
		state[1] = add32(b, state[1])
		state[2] = add32(c, state[2])
		state[3] = add32(d, state[3])
	}
	function md5blk(bytes) {
		const out = []
		for (let i = 0; i < 64; i += 4)
			out[i >> 2] = bytes[i] + (bytes[i + 1] << 8) + (bytes[i + 2] << 16) + (bytes[i + 3] << 24)
		return out
	}
	const bytes = new TextEncoder().encode(input)
	const state = [1732584193, -271733879, -1732584194, 271733878]
	let i = 0
	for (; i + 64 <= bytes.length; i += 64)
		md5cycle(state, md5blk(bytes.slice(i, i + 64)))
	const tail = new Uint8Array(64)
	tail.set(bytes.slice(i))
	tail[bytes.length - i] = 0x80
	if (bytes.length - i > 55) {
		md5cycle(state, md5blk(tail))
		tail.fill(0)
	}
	const bitLen = BigInt(bytes.length) * 8n
	for (let j = 0; j < 8; j++)
		tail[56 + j] = Number((bitLen >> BigInt(j * 8)) & 0xFFn)
	md5cycle(state, md5blk(tail))
	const out = []
	for (const word of state) {
		for (let j = 0; j < 4; j++)
			out.push((word >>> (j * 8)) & 0xFF)
	}
	return bytesToHex(out).toLowerCase()
}
