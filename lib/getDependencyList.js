var each = require('std/each')
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
	
	each(requireStatements, function(requireStmnt) {
		var absPath = resolve.requireStatement(requireStmnt, absolutePath)
		if (_requiredModules[absPath]) { return }
		_findRequiredModules(absPath, _requiredModules)
		_requiredModules.push(absPath)
	})
	return _requiredModules
}
