var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	util = require('./util')

module.exports = {
	listen: listen,
	addPath: util.addPath
}

var modules = {},
	closureStart = '(function() {',
	moduleDef = 'var module = {exports:{}}; var exports = module.exports;',
	closureEnd = '})()'

function listen(port, host) {
	port = port || 1234
	host = host || 'localhost'
	var server = http.createServer(function(req, res) {
		var reqPath = req.url.substr(1) 
		if (reqPath.match(/\.js$/)) {
			fs.readFile(reqPath, function(err, content) {
				if (err) { return res.end('alert("' + err + '")') }
				var code = content.toString()
				res.write(closureStart + moduleDef)
				var requireStatements = util.getRequireStatements(code)
				for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
					var depPath = util.resolveRequireStatement(requireStmnt, reqPath)
					code = code.replace(requireStmnt, 'require._["'+depPath+'"]')
				}
				res.write(code)
				res.write('\nrequire._["'+reqPath+'"]=module.exports')
				res.end(closureEnd)
			})
		} else {
			// main module
			var modulePath = util.resolve(reqPath),
				deps = util.getDependencyList(modulePath),
				base = '//' + host + ':' + port + '/'
	
			res.write('function require(path){return require._[path]}; require._={}\n')
			for (var i=0; i<deps.length; i++) {
				var depPath = base + deps[i]
				res.write('document.write(\'<script src="'+depPath+'"></script>\')\n')
			}
			res.end()
		}
	})
	server.listen(port, host)
}

