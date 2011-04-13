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

function addPath(path) {
	// TODO would be nice not to modify the global require path here
	require.paths.unshift(path)
}

function handleRequest(req, res) {
	var path = req.url.substr(_base.length),
		onError = function() { res.writeHead(404); res.end('Could not find ' + path) }

	if (!req.url.match(_baseRegex)) { return onError() }

	try { path = require.resolve(path) }
	catch(e) { return onError() }

	fs.readFile(path, function(err, code) {
		if (err) { return onError() }
		res.writeHead(200, { 'Content-Type': 'application/javascript' })
		res.end(code)
	})
}
