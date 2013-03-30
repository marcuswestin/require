var getCode = require('./getCode')
var getRequireStatements = require('./getRequireStatements')
var resolve = require('./resolve')

module.exports = getDependencyList

function getDependencyList(path) {
	return _findRequiredModules(path, []).concat(path)
}

var _findRequiredModules = function(absolutePath, _requiredModules) {
	_requiredModules[absolutePath] = true
	var code = getCode(absolutePath)
	var requireStatements = getRequireStatements(code)
	
	for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
		var absPath = resolve.requireStatement(requireStmnt, absolutePath)
		if (_requiredModules[absPath]) { continue }
		_findRequiredModules(absPath, _requiredModules)
		_requiredModules.push(absPath)
	}
	return _requiredModules
}
