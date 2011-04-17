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
var _getRequiredModules = function(absolutePath, _seenModules) {
	if (!_seenModules) { _seenModules = [absolutePath] }
	var code = _readFile(absolutePath),
		requireStatements = code.match(_globalRequireRegex),
		requiredModules = []
	if (!requireStatements) { return requiredModules }
	
	var cwd = path.dirname(absolutePath) + '/'
	for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
		var rawPath = requireStmnt.match(_pathnameGroupingRegex)[1]
			isRelative = (rawPath[0] == '.'),
			searchPath = (isRelative ? path.resolve(cwd + rawPath) : rawPath),
			absPath = require.resolve(searchPath)
		if (_seenModules[absPath]) { continue }
		_seenModules[absPath] = true
		requiredModules = requiredModules.concat(_getRequiredModules(absPath), _seenModules)
		requiredModules.push(absPath)
	}
	return requiredModules
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
