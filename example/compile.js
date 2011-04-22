var sys = require('sys'),
	fs = require('fs'),
	compiler = require('../compiler')

var file = __dirname + '/client.js',
	code = fs.readFileSync(file).toString()

compileAndPrint(0, function() {
	compileAndPrint(1, function() {
		compileAndPrint(2, function() {
			compileAndPrint(3, function() {
			})
		})
	})
})

function compileAndPrint(level, callback) {
	console.log('Compile code at level', level)
	compiler.compile(code, level, function(err, compiledCode) {
		if (err) { throw err }
		console.log(compiledCode)
		callback()
	})
}
