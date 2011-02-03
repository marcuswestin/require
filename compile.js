#!/usr/local/bin/node

var sys = require('sys'),
	compiler = require('./compiler')

var file = process.argv[2]

compiler.compressJS(compiler.compileJSFile(file), function(compressedCode) {
	sys.puts(compressedCode)
})
