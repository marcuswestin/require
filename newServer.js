var http = require('http'),
	fs = require('fs')

require.paths.unshift('.')

var server = http.createServer(function(req, res) {
	var searchPath = req.url.substr(1)
	try { var path = require.resolve(searchPath) }
	catch(e) { return res.end(e.toString()) }
	fs.readFile(path, function(err, content) {
		if (err) { return res.end(err.toString) }
		res.end(content)
	})
})
server.listen(1234)
