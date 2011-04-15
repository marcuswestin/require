void(function() {
	var initRequire = function(){
		var XHR = window.XMLHttpRequest || function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
			log = window.console && console.log || function(){}

	  	// Regex to split a filename into [*, dir, basename, ext], posix version, from https://github.com/ry/node/blob/master/lib/path.js
		var splitPathRegex = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/,
			getDir = function(path) { return splitPathRegex.exec(path)[1] || '' }

		var slashDotSlashRegex = /\/\.\//g,
			doubleSlashRegex = /\/\//g,
			endInSlashRegex = /\/$/g
		var resolvePath = function(currentBase, searchPath) {
			if (searchPath[0] != '.') { return [searchPath] }

			function normalize(path) {
				var parts = path
					.replace(slashDotSlashRegex, '/')
					.replace(endInSlashRegex, '')
					.split('/')
				var i = 0
				while (i < parts.length) {
					if (parts[i] == '') {
						parts.splice(i, 1)
					} else if (parts[i] == '..') {
						parts.splice(i - 2, 2)
					} else {
						i++
					}
				}
				return parts.join('/')
			}

			return [normalize(getDir(currentBase) + '/' + searchPath), normalize(currentBase + '/' + searchPath)]
		}

		var fetchFile = function(possiblePaths) {
			while (possiblePaths.length) {
				var possiblePath = require._root + possiblePaths[0],
					url = location.protocol + '//' + location.host + possiblePath,
					xhr = new XHR()
				if (!require._attempted[url]) {
					require._attempted[url] = true
					try {
						xhr.open('GET', url, false)
						xhr.send(null)
					} catch(e) {
						log(url, 'fetchFile open/send error:', e)
					}

					if (xhr.status == -1100) { // safari file://
						// XXX: We have no way to tell in opera if a file exists and is empty, or is 404
						log(url, 'fetchFile xhr.status error:', xhr.status)
					} else if (xhr.status < 400) {
						return xhr.responseText;
					}
				}
				possiblePaths.shift()
			}
			return null
		}

		window.require = function(modulePath) {
			var baseStack = require._base,
				currentBase = baseStack[baseStack.length - 1],
				possiblePaths = resolvePath(currentBase, modulePath)

			for (var i=0, path; path = possiblePaths[i]; i++) {
				if (require._modules[path]) { return require._modules[path].exports }
			}

			var moduleCode = fetchFile(possiblePaths),
				foundPath = possiblePaths[0] // fetchFile will remove bad paths from possiblePaths

			if (!foundPath) {
				log(path, 'failed to load module', modulePath)
				return
			}
			require._base.push(foundPath)
			var moduleFriendlyName = foundPath.replace(/[\/.]/g, '_')
			try {
				var inContextCode = '(function(module){ var exports = module.exports;\n'+ moduleCode +'\n})',
					importerFunction = require._evaluate(inContextCode, foundPath)
			} catch(e) {
				if(e instanceof SyntaxError) { log(foundPath, 'a syntax error prevented execution') }
				throw e
			}

			// the "module" object in a node module
			require._modules[foundPath] = { exports: {} }
			try {
				importerFunction(require._modules[foundPath])
			} catch(e) {
				if(e.type == 'syntax_error') {
					log(foundPath, 'Syntax error while importing module', e)
					throw e
				} else if (!e.requireLogged) {
					e.requireLogged = true
					if (e.type == 'stack_overflow') {
						log(foundPath, 'Stack overflow while importing module', e)
					} else {
						log(foundPath, 'enable "break on error" in your debugger to debug', e)
					}
					throw e
				}
			}

			require._base.pop()
			return require._modules[foundPath].exports
		}
	}

	if (typeof module != 'undefined' && module.exports) {
		var requireFn = arguments.callee
		module.exports = { toString: function(){ return 'void(' + requireFn + ')()'} }
	} else if (typeof window != 'undefined' && !window.require) {
		initRequire()
		require._modules = {}
		require._attempted = {}
		require._base = []
		require._root = location.pathname.replace(/\/[^\/]*$/, '/')
		
		// evaluate must not have access to the local scope of require, or else imported modules will
		// see require's local variables as well.
		// IE6 won't return an anonymous function from eval, so use the function constructor instead
		require._evaluate = typeof eval('(function(){})') == 'undefined'
			? function(src, path) { return (new Function('return ' + src))() }
			: function(src, path) { var src = src + '\n//@ sourceURL=' + path; return eval(src) }
	
		void(function(){
			var scripts = document.getElementsByTagName('script'),
				requireSrcRegex = /\/require\.js$/
			for (var i=0, script; script = scripts[i]; i++) {
				if (!script.src.match(requireSrcRegex)) { continue }
				var appURL = script.getAttribute('main'),
					requireRoot = script.getAttribute('root')

				if (requireRoot) { require._root = '/'+requireRoot }
				if (appURL) { require(appURL) }
				return
			}
		})()
	}
})()
