var path = require('path'),
	fs = require('fs')

module.exports = {
	getDependencyList: getDependencyList,
	getRequireStatements: getRequireStatements,
	getRequireStatementPath: getRequireStatementPath
}


function getDependencyList(path) {
	return _findRequiredModules(path)
}

var _globalRequireRegex = /require\s*\(['"][\w\/\.-]*['"]\)/g
function getRequireStatements(code) {
	return code.match(_globalRequireRegex) || []
}

var _pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/
function getRequireStatementPath(requireStmnt) {
	return requireStmnt.match(_pathnameGroupingRegex)[1]
}

var _findRequiredModules = function(absolutePath, _requiredModules) {
	if (!_requiredModules) { _requiredModules = [] }
	_requiredModules[absolutePath] = true
	var code = _readFile(absolutePath),
		requireStatements = getRequireStatements(code)
	
	var cwd = path.dirname(absolutePath) + '/'
	for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
		var rawPath = getRequireStatementPath(requireStmnt)
			isRelative = (rawPath[0] == '.'),
			searchPath = (isRelative ? path.resolve(cwd + rawPath) : rawPath)
		// TODO A1 Remove var statement and add , at end of previous line
		var absPath = require.resolve(searchPath)
		if (_requiredModules[absPath]) { continue }
		_findRequiredModules(absPath, _requiredModules)
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
