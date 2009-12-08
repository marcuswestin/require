;(function(){
	var XHR = window.XMLHttpRequest || function() { return new ActiveXObject("Msxml2.XMLHTTP"); }
	
	window.require = function(packagePath) {
		var path = resolvePath(packagePath);
		
		if (require.__pkgs[path.absolute]) { return require.__pkgs[path.absolute]; }
		require.__pkgs[path.absolute] = {};
		
		var xhr = new XHR()
		xhr.open('GET', path.absolute, false);
		xhr.send(null);
		
		if (xhr.status == 404 || xhr.status == -1100) { // -1100 for safari file://
			throw new Error("File not found: " + path.absolute);
		}
		
		// store current execution state
		var currentPackage = require.__currentPkg;
		var currentCwd = require.__cwd;
		// prepare execution state and eval code
		require.__currentPkg = require.__pkgs[path.absolute];
		require.__cwd = path.cwd;
		var code = '(function(){ var exports = require.__currentPkg; ' + xhr.responseText + ' })()';
		eval(code, path.absolute);
		// restore execution state
		require.__currentPkg = currentPackage;
		require.__cwd = currentCwd;
		
		return require.__pkgs[path.absolute];
	}
	
	function resolvePath(requiredPath) {
		var targetPath = (requiredPath[0] == '.' ? require.__cwd : require.__path).split('/');
		var requiredPath = requiredPath.split('/');

		// Problem with require.__path being '/'
		if (targetPath.length == 2 && (!targetPath[0] && !targetPath[1])) {
			targetPath.shift()
		}
		
		while(requiredPath.length > 1) {
			var step = requiredPath.shift();
			if (step == '.') { continue; }
			else if (step == '..') { targetPath.pop(); }
			else { targetPath.push(step); }
		}
		
		var pathString = targetPath.join('/');
		return { cwd: pathString, absolute: pathString + '/' + requiredPath + '.js' }
	}
	
	var pathRegex = /(https?:\/\/[^\/]*)?(.*\/)?require\.js$/;
	var scripts = document.getElementsByTagName('script');
	for (var i=0, script; script = scripts[i]; i++) {
		var match = script.src.match(pathRegex);
		if (!match) { continue; }
		require.__path = match[2];
	}

	require.__pkgs = {};
	if (!require.__path) { require.__path = './' }
	require.__cwd = './';
})()
