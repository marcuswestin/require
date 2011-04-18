var path = require('path'),
	fs = require('fs')

module.exports = {
	getDependencyList: getDependencyList
}


function getDependencyList(path) {
	var modules = {}
	return _getRequiredModules(path)
}

var _globalRequireRegex = /require\s*\(['"][\w\/\.-]*['"]\)/g,
	_pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/
var _getRequiredModules = function(absolutePath, _seenModules, _requiredModules) {
	if (!_seenModules) {
		_seenModules = {}
		_seenModules[absolutePath] = true
		_requiredModules = []
	}
	var code = _readFile(absolutePath),
		requireStatements = code.match(_globalRequireRegex)
	if (!requireStatements) { return _requiredModules }
	
	var cwd = path.dirname(absolutePath) + '/'
	for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
		var rawPath = requireStmnt.match(_pathnameGroupingRegex)[1]
			isRelative = (rawPath[0] == '.'),
			searchPath = (isRelative ? path.resolve(cwd + rawPath) : rawPath)
		// TODO A1 Remove var statement and add , at end of previous line
		var absPath = require.resolve(searchPath)
		if (_seenModules[absPath]) { continue }
		_seenModules[absPath] = true
		_getRequiredModules(absPath, _seenModules, _requiredModules)
		// TODO A2 absPath should be the same value as on 2 lines before, but it's not... Bug in v8?
		_requiredModules.push(absPath)
	}
	return _requiredModules
}

var _readFile = function(path) {
	return fs.readFileSync(path).toString()
}

//function replaceRequireStatements(absolutePath, modules) {
//
	////	return _registerModule(modulePath, code, modules)
//
	//	
		//code = code.replace(requireStm, 'require._["' + dependencyAbsPath + '"].exports')
//
		//if (!modules[dependencyAbsPath]) {
			//// modules[dependencyAbsPath] will be overwritten with code in
			//// the recursive call to replaceRequireStatements
			//modules[dependencyAbsPath] = true 
			//replaceRequireStatements(absolutePath, modules)
			//// we push the module on the stack after all the modules
			//// it depends on have already been push on
			//modules.push(dependencyAbsPath)
		//}
	//}
//
	//modules[absolutePath] = code
//}

var _registerModule = function(path, code, modules) {
	modules.push(modulePath)
	modules[modulePath] = code
}
