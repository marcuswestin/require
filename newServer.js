var http = require('http'),
	fs = require('fs'),
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
			// TODO rewrite require calls to require._["<MODULE PATH>"]
			res.write(closureStart + moduleDef)
			res.write(content)
			res.write('\nrequire._["'+req.url+'"]=module.exports')
			res.end(closureEnd)
		})
	} else {
		// main module
		var modulePath = __dirname + req.url + '.js'
		var deps = util.getDependencyList(modulePath),
			base = '//' + host + ':' + port

		res.write('function require(){return{}}; require._={}\n')
		for (var i=0; i<deps.length; i++) {
			var path = base + deps[i]
			res.write('document.write(\'<script src="'+path+'"></script>\')\n')
		}
		res.end()
	}
})
server.listen(port, host)
