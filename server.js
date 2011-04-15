var fs = require('fs')

module.exports = {
	setBase: setBase,
	addPath: addPath,
	handleRequest: handleRequest
}

var _base,
	_baseRegex
function setBase(base) {
	_base = base
	_baseRegex = new RegExp('^' + _base.replace(/\//g, '\\/'))
}

var _paths = []
function addPath(newPath) {
	_paths.push(path.normalize(newPath))
}

function handleRequest(req, res) {
	var path = req.url.substr(_base.length)

	_buildPaths()
	var onError = function() {
		_cleanPaths()
		res.writeHead(404)
		res.end('Could not find ' + path)
	}

	if (!req.url.match(_baseRegex)) { return onError() }

	try { path = require.resolve(path) }
	catch(e) { return onError() }

	fs.readFile(path, function(err, code) {
		if (err) { return onError() }
		_cleanPaths()
		res.writeHead(200, { 'Content-Type': 'application/javascript' })
		res.end(code)
	})
}

var _buildPaths = function() {
	for (var i=0; i<_paths.length; i++) {
		require.paths.unshift(_paths[i])
	}
}

var _cleanPaths = function() {
	require.paths.splice(0, _paths.length)
}
