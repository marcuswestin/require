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

Get started
-----------

Installation
	
	# From npm repo
	sudo npm install require

	# From source
	git clone git://github.com/marcuswestin/require.git
	sudo npm install ./require

	# Make sure the npm bin is in your path
	echo "PATH=`npm bin`:$PATH" >> ~/.bash_profile
	source ~/.bash_profile

	# Run require server!
	require --port 1234 --host localhost ./

Develop

	# Create a simple file server for testing
	mkdir require_test
	echo "alert('hello world')" > require_test/hello_world.js
	echo "<script src='//localhost:1234/hello_world'></script>" > require_test/index.html
	node -e "require('http').createServer(function(req, res) { res.end(require('fs').readFileSync('require_test/index.html')) }).listen(9090)" &

	# Start up require dev server
	require-dev --port 1234 --host localhost ./require_test
	# Now open a browser to http://localhost:9090!

Use npm modules in the browser

	sudo npm install raphael
	mkdir require_test
	echo "var raphael = require('raphael')" > require_test/raphael_npm.js
	echo "<script src='//localhost:1234/raphael_npm'></script>" > require_test/index.html
	node -e "require('http').createServer(function(req, res) { res.end(require('fs').readFileSync('require_test/index.html')) }).listen(9090)" &

	# Start up require dev server
	require-dev --port 1234 --host localhost ./require_test
	# Now open a browser to http://localhost:9090!

Compile for Production
----------------------
You can easily compile all the required modules into a single file. You can also further compress the compiled
code with the google closure compiler.

	var compiler = require('require/compiler'),
		compiledJS = compiled.compileFile('./module.js')
	
	fs.writeFileSync('compiled.js', compiledJS)

	compiler.compressFile('./module.js', function(compressedJS) {
		fs.writeFileSync('compressed.js', compressedJS)
	})

