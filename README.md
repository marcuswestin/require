require brings `require` to the browser
=======================================

Node implements a simple module management system with the `require` statement and the `npm` command
line module manager. This library brings those functionalities to the browser, as well as advanced
compilation functionality for production deployment.

Installation
============
From npm repo

	sudo npm install require

or from source

	git clone git://github.com/marcuswestin/require.git
	sudo npm install ./require

Usage
=====
In your HTML, import a javascript module and all its dependencies with a simple script include.
In this case we'll import the example/client module.

	<script src="//localhost:1234/example/client"></script>

Start the dev server. You can also pass in the directories in which your javascript modules live.
Those directories will be added to the javascript module search path.

	require --port 1234 --host localhost
	# or
	require --port 1234 --host localhost --paths ./path/to/my/js/ ./path/to/node_modules/

(make sure that the npm bin is in your path)

	echo "PATH=`npm bin`:$PATH" >> ~/.bash_profile && source ~/.bash_profile

Use programmatically
====================
You can also start the require server programmatically alongside another node server.

	var devServer = require('require/server')
	devServer.addPath(__dirname + '/modules')
	devServer.listen(1234, 'localhost')

Compilation
===========
For production you want to bundle all your dependencies into a single file and compress them.

	require compile ./example/client.js

Add to the search path by passing in paths.

	require compile ./example/client.js --paths path/to/node_modules

You can also use the compiler programmatically. Pass it a file path, or a snippet of code.

	var compiler = require('require/compiler')

	compiler.compile('./example/client.js')

	compiler.compileCode('console.log(require("./example/client"))', { basePath:__dirname })

The compiler supports all the options of https://github.com/mishoo/UglifyJS, e.g.

	compiler.compile('./example/client.js', { beautify:true, ascii_only:true })

npm packages
============
require can import npm packages in the browser. Try installing e.g. raphael, the SVG library.

	sudo npm install raphael

And then require it client-side

	var raphael = require('raphael'),
		canvas = document.body.appendChild(document.createElement('div')),
		paper = raphael(canvas)
	
	paper.circle(50, 50, 40)

You can see the result if you have the source checked out:

	git clone git://github.com/marcuswestin/require.git
	cd require/example/
	node server.js
	# Open browser to http://localhost:8080/raphael_circle.html

Examples
========
For working examples, give this a try:

	node require/examples/server.js
	# open browser to localhost:8080
	
	node require/examples/compile.js

TODO
====
- Thoughts from @guille:
	- Instead of running a standalone server, it would be nice to have require as e.g. connect middleware
		- `connect.createServer( require.connect() )`
	- Or just attach to an http server
		- `var server = http.createServer(function(req, res) { ... })`
		- `require.mount(server)`
	- Then just require files off of a pre-defined url
		- `<script src="/require/main_module.js"></script>`
