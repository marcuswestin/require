#!/usr/bin/env node

var path = require('path'),
	server = require('../server'),
	sys = require('sys'),
	compiler = require('../compiler')

var opts = {
	paths:   [],
	port:    1234,
	host:    'localhost',
	level:   null,
	command: 'server'
}

var args = [].slice.call(process.argv, 2),
	commands = ['server', 'compile']

if (commands.indexOf(args[0]) != -1) {
	opts.command = args.shift()
}

while (args.length) {
	var arg = args.shift()
	switch(arg) {
		case '--port':
			opts.port = args.shift()
			break
		case '--host':
			opts.host = args.shift()
			break
		case '--level':
			opts.level = parseInt(args.shift())
			break
		default:
			opts.paths.push(path.resolve(process.cwd(), arg))
			break
	}
}

switch (opts.command) {
	case 'server':
		server.listen(opts.port, opts.host)
		console.log('dev server listening on', 'http://'+opts.host + ':' + opts.port, 'with paths:\n', opts.paths.concat(require.paths))
		break
	case 'compile':
		var example = 'require compile ./path/to/file.js --level 2'
		if (opts.level === null) {
			console.log('Please specify a compilation level, e.g.')
			console.log(example)
			process.exit()
		}
		if (opts.paths.length != 1) {
			console.log('Please specify a single file to compile, e.g.')
			console.log(example)
			process.exit()
		}
		compiler.compile(opts.paths[0], opts.level, function(err, compiledCode) {
			if (err) {
				console.log('Compilation error', err)
				process.exit()
			}
			sys.print(compiledCode)
		})
		break
	default:
		console.log('Unknown command', opts.command)
		process.exit()
}

