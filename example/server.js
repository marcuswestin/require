var http = require('http'),
	fs = require('fs'),
	dependency = require('./shared/dependency'),
	requireServer = require('require/server')

requireServer.listen(1234)
requireServer.addPath('.')

console.log('starting simple file server on localhost:8080')
http.createServer(function(req, res) {
	fs.readFile('index.html', function(err, content) {
		if (err) { throw err }
		res.end(content)
	})
}).listen(8080)

console.log('shared dependency:', dependency)
