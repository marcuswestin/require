require
=======

Bring `require` to the browser
-------------------------------

Node implements a simple module management system with the `require` statement and the `npm` command
line module manager. This library brings those functionalities to the browser, as well as advanced
compilation functionality for production deployment.

Installation
------------
From npm

	sudo npm install require

From source

	git clone git://github.com/marcuswestin/require.git


Usage
----
In your HTML, import a javascript module and all its dependencies. In this case we'll import the client/main module.

	<script src="//localhost:1234/client/main"></script>

Start the dev server. You can pass in the port and host to listen on, as well as the directories in which your
javascript modules live. Eg if client/main.js lives in ./js/client/main.js, you'll want:

	require --port 1234 --host localhost ./modules

(make sure that the npm bin is in your path)

	echo "PATH=`npm bin`:$PATH" >> ~/.bash_profile && source ~/.bash_profile

You can also start the require server programmatically alongside your other server

	var devServer = require('require/server')
	devServer.addPath(__dirname + '/modules')
	devServer.listen(1234, 'localhost')

Compilation for production
--------------------------
For production you want to bundle all your dependencies into a single file and compress them.

	require compile ./example/shared/dependency --level 2

There are 4 different compilation levels - they correspond to google closure's compilation levels.
Levels 2 and 3 are pretty aggressive and may break certain programming patterns, such as dynamic
dispatch  (`var eventName = 'click', document.body['on' + eventName = function() { ... }`)

	Compilation levels:
	0 - none
	1 - whitespace
	2 - simple optimizations
	3 - advanced optimizations

You can also use the compiler programmatically. Pass it a snipper of code, or a file path.

	var compiler = require('require/compiler'),
		code = 'console.log(require("./example/shared/dependency"))',
		file = './example/client'

	compiler.compile(code, 1, function(err, compiledCode) {
		if (err) { throw err }
		console.log(compiledCode)
	})

	compiler.compile(file, 2, function(err, compiledCode) {
		if (err) { throw err }
		console.log(compiledCode)
	})

npm packages
------------
With require you can import npm packages on the client! Try installing e.g. raphael, the SVG library

	sudo npm install raphael

And then require it client-side!

	var raphael = require('raphael'),
		canvas = document.body.appendChild(document.createElement('div')),
		paper = raphael(canvas)
	
	paper.circle(50, 50, 40)

Examples
--------
For working examples, give this a try:

	node require/examples/server.js
	# open browser to localhost:8080
	
	node require/examples/compile.js
