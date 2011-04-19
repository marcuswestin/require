#!/usr/bin/env node

var path = require('path'),
	server = require('../server')

var paths = [],
	port = 1234,
	host = 'localhost'

for (var i=2, arg; arg = process.argv[i]; i++) {
	if (arg == '--port') {
		i++
		port = process.argv[i]
	} else if (arg == '--host') {
		i++
		host = process.argv[i]
	} else {
		paths.push(path.resolve(process.cwd(), arg))
	}
}

paths.forEach(function(p) { server.addPath(p) })

server.listen(port, host)

console.log('Require dev server listening on', 'http://'+host + ':' + port, '\nPaths:\n', paths.concat(require.paths))
