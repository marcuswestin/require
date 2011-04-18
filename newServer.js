var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	util = require('./util')

// require.paths.unshift('.')

var modules = {},
	port = 1234,
	host = 'localhost'

var closureStart = '(function() {',
	moduleDef = 'var module = {exports:{}}; var exports = module.exports;',
	closureEnd = '})()'

var server = http.createServer(function(req, res) {
	if (req.url.match(/\.js$/)) {
		fs.readFile(req.url, function(err, content) {
			if (err) { return res.end('alert("' + err + '")') }
			var code = content.toString()
			res.write(closureStart + moduleDef)
			var requireStatements = util.getRequireStatements(code)
			for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
				var depPath = util.resolveRequireStatement(requireStmnt, req.url)
				code = code.replace(requireStmnt, 'require._["'+depPath+'"]')
			}
			res.write(code)
			res.write('\nrequire._["'+req.url+'"]=module.exports')
			res.end(closureEnd)
		})
	} else {
		// main module
		var modulePath = __dirname + req.url + '.js'
		var deps = util.getDependencyList(modulePath),
			base = '//' + host + ':' + port

		res.write('function require(path){return require._[path]}; require._={}\n')
		for (var i=0; i<deps.length; i++) {
			var depPath = base + deps[i]
			res.write('document.write(\'<script src="'+depPath+'"></script>\')\n')
		}
		res.end()
	}
})
server.listen(port, host)
