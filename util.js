var path = require('path'),
	fs = require('fs')

module.exports = {
	getDependencyList: getDependencyList,
	getRequireStatements: getRequireStatements,
	getRequireStatementPath: getRequireStatementPath,
	resolveRequireStatement: resolveRequireStatement
}

function getDependencyList(path) {
	return _findRequiredModules(path).concat(path)
}

var _globalRequireRegex = /require\s*\(['"][\w\/\.-]*['"]\)/g
function getRequireStatements(code) {
	return code.match(_globalRequireRegex) || []
}

var _pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/
function getRequireStatementPath(requireStmnt) {
	return requireStmnt.match(_pathnameGroupingRegex)[1]
}

function resolveRequireStatement(requireStmnt, currentPath) {
	var rawPath = getRequireStatementPath(requireStmnt),
		cwd = path.dirname(currentPath) + '/',
		isRelative = (rawPath[0] == '.'),
		searchPath = (isRelative ? path.resolve(cwd + rawPath) : rawPath)
	return require.resolve(searchPath)
}

var _findRequiredModules = function(absolutePath, _requiredModules) {
	if (!_requiredModules) { _requiredModules = [] }
	_requiredModules[absolutePath] = true
	var code = _readFile(absolutePath),
		requireStatements = getRequireStatements(code)
	
	for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
		var absPath = resolveRequireStatement(requireStmnt, absolutePath)
		if (_requiredModules[absPath]) { continue }
		_findRequiredModules(absPath, _requiredModules)
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
