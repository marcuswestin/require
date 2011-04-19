require
=======

Bring `require` to the browser
-------------------------------

Node implements the type of simple, straight forward module import system that you would expect
from any decent programming language. Together with npm, it's a perfect module management system:

 - Synchronous require statements
 - Runtime-modifiable search paths
 - Intelligent path resolution
 - An open, accesible package repository
 - Versioned packages

That's great for server-side node code, but on the browser we're still stuck with script tags or
asynchronous AMD-style module loading. Why can't we simply have `require` in the browser? And more
importantly, why can't we easily import NPM packages in the browser environment? Well, now we can.

*require* lets you import javascript modules and npm packages from the browser. It works by running
a small node server in dev that resolves all the browser's required dependencies, and by providing
a compiler that will compile and compress all the required dependencies into a static file for prod.

Example usage
-------------
Install some packages, run dev server

	sudo npm install raphael
	sudo npm install std
	require

Use require client side

	var raphael = require('raphael'),
		bind = require('std/bind')
	
	var el = document.body.appendChild(document.createElement('div')),
		paper = raphael(el)
	
	var button = document.body.appendChild(document.createElement('button'))
	button.innerHTML = 'A circle'
	button.onclick = bind(paper, 'cicle', 50, 50, 40)

Get started
-----------
Installation
	
	# From npm repo ...
	sudo npm install require

	# ... or from source
	git clone git://github.com/marcuswestin/require.git
	sudo npm install ./require

	# Make sure the npm bin is in your path
	echo "PATH=`npm bin`:$PATH" >> ~/.bash_profile
	source ~/.bash_profile

Develop

	# Create a simple file server for testing
	mkdir require_test
	echo "require('http').createServer(function(req, res) { res.end(require('fs').readFileSync('require_test'+req.url)) }).listen(9090)" > require_test/server.js
	node require_test/server.js &

	# Run require server
	require --port 1234 --host localhost ./require_test &

	# Hello world app
	echo "<script src='//localhost:1234/hello_world'></script>" > require_test/hello_world.html
	echo "alert('hello world')" > require_test/hello_world.js

	# Open http://localhost:9090/hello_world.html in your browser

Use npm modules in the browser (do the Develop steps above first)

	# Install raphael
	sudo npm install raphael

	# App using raphael
	echo "<script src='//localhost:1234/raphael'></script>" > require_test/raphael.html
	echo "var raphael = require('raphael'); console.log(raphael)" > require_test/raphael.js

	# Now open a browser to http://localhost:9090/raphael.html

Compile for Production
----------------------
The require server serves all dependencies synchronously. You don't want that for production.

You can easily compile all the required modules into a single file. You can also further compress the compiled
code with the google closure compiler.

	var compiler = require('require/compiler'),
		compiledJS = compiled.compileFile('./module.js')
	
	fs.writeFileSync('compiled.js', compiledJS)

	compiler.compressFile('./module.js', function(compressedJS) {
		fs.writeFileSync('compressed.js', compressedJS)
	})

