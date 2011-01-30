#!/usr/local/bin/node

var sys = require('sys'),
	compiler = require('./compiler')

var file = process.argv[2]

sys.puts(compiler.compileJSFile(file))
