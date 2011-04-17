var http = require('http'),
	fs = require('fs')

var server = http.createServer(function(req, res) {
	var file = req.url
	if (file[file.length - 1] == '/') { file += 'index.html' }
	fs.readFile(__dirname + '/' + file, function(err, content) {
		if (err) { return res.end(err.toString()) }
		res.end(content)
	})
})
server.listen(8080, 'localhost')
