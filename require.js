if (typeof require == 'undefined') (function() {
	var XHR = window.XMLHttpRequest || function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
		log = window.console && console.log,
		importedModules = {}
	
	// IE6 won't return an anonymous function from eval, so use the function constructor instead
	var evaluate = typeof eval('(function(){})') == 'undefined'
		? function(src, path) { return (new Function('return ' + src))() }
		: function(src, path) { var src = src + '\n//@ sourceURL=' + path; return eval(src) }
	
	var fetchFile = function(path) {
		var xhr = new XHR()
		try {
			xhr.open('GET', path, false)
			xhr.send(null)
		} catch(e) {
			log(path, 'fetchFile open/send error:', e)
			return null // firefox file://
		}
		
		if (xhr.status == 404 || // all browsers, http://
			xhr.status == -1100) { // safari file://
			// XXX: We have no way to tell in opera if a file exists and is empty, or is 404
			log(path, 'fetchFile xhr.status error:', xhr.status)
			return null
		}
		
		return xhr.responseText;
	}
	
	window.require = function(module) {
		var path = module + '.js'
		if (importedModules[path]) { return importedModules[path] }
		var moduleCode = fetchFile(path),
			moduleFriendlyName = path.replace(/[\/.]/g, '_')
		
		if (!moduleCode) {
			log(path, 'failed to load module', module)
			return
		}
		
		try {
			var inContextCode = '(function(module){ var exports = module.exports;\n'+ moduleCode +'\n})',
				importerFunction = evaluate(inContextCode, path)
		} catch(e) {
			if(e instanceof SyntaxError) { log(path, 'a syntax error prevented execution') }
			throw e
		}

			// the "module" object in a node module
		var moduleObject = { exports: {} }
		try {
			importerFunction(moduleObject)
		} catch(e) {
			if(e.type == 'syntax_error') {
				log(path, 'Syntax error while importing module', e)
				throw e
			} else if (!e.requireLogged) {
				e.requireLogged = true
				if (e.type == 'stack_overflow') {
					log(path, 'Stack overflow while importing module', path, e)
				} else {
					log(path, 'enable "break on error" in your debugger to debug', e)
				}
				throw e
			}
		}
		
		importedModules[path] = moduleObject.exports
		return moduleObject.exports
	}
})()
