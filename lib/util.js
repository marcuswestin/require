var path = require('path'),
	fs = require('fs')

module.exports = {
	extend: extend,
	getDependencyList: getDependencyList,
	getRequireStatements: getRequireStatements,
	resolve: resolve,
	resolveRequireStatement: resolveRequireStatement,
	addPath: addPath,
	addFile: addFile,
	hasAddedPath: hasAddedPath,
	addReplacement: addReplacement,
	getCode: getCode
}

function extend(target, extendWith) {
	target = target || {}
	for (var key in extendWith) {
		if (typeof target[key] != 'undefined') { continue }
		target[key] = extendWith[key]
	}
	return target
}

var _replacements = []
function addReplacement(searchFor, replaceWith) {
	_replacements.push({ searchFor:searchFor, replaceWith:replaceWith })
}

function getCode(filePath) {
	if (!filePath.match(/\.js$/)) { filePath += '.js' }
	var code = fs.readFileSync(filePath).toString()
	for (var i=0, replacement; replacement = _replacements[i]; i++) {
		code = code.replace(replacement.searchFor, replacement.replaceWith)
	}
	return code
}

var _paths = []
function addPath(name, namedPath) {
	_paths.push({ name:name, path:path.resolve(namedPath) })
}

var _files = []
function addFile(name, namedPath) {
	_files.push({ name:name, path:path.resolve(namedPath) })
}

function hasAddedPath(name) {
	for (var i=0, addedPath; addedPath=_paths[i]; i++) {
		if (addedPath.name == name) { return true }
	}
	for (var i=0, addedPath; addedPath=_files[i]; i++) {
		if (addedPath.name == name) { return true }
	}
	return false
}

var _globalRequireRegex = /require\s*\(['"][\w\/\.-]*['"]\)/g
function getRequireStatements(code) {
	return code.match(_globalRequireRegex) || []
}

function resolve(searchPath, pathBase) {
	if (searchPath[0] == '.') {
		// relative path, e.g. require("./foo")
		return _findModuleMain(path.resolve(pathBase, searchPath))
	}
	
	var searchParts = searchPath.split('/'),
		componentName = searchParts[searchParts.length - 1],
		name = searchParts.shift(),
		rest = searchParts.join('/')
	for (var i=0, addedPath; addedPath=_paths[i]; i++) {
		if (addedPath.name != name) { continue }
		var modulePath = _findModuleMain(path.resolve(addedPath.path, rest), componentName)
		if (modulePath) { return modulePath }
	}
	
	for (var i=0, addedFile; addedFile = _files[i]; i++) {
		if (addedFile.name != searchPath) { continue }
		return addedFile.path
	}
	
	// npm-style path, e.g. require("npm").
	// Climb parent directories in search for "node_modules"
	var modulePath = _findModuleMain(path.resolve(pathBase, 'node_modules', searchPath))
	if (modulePath) { return modulePath }

	if (pathBase != '/') {
		// not yet at the root - keep climbing!
		return resolve(searchPath, path.resolve(pathBase, '..'))
	}
	return ''
}

function _findModuleMain(absModulePath, tryFileName) {
	var foundPath = ''
	function attempt(aPath) {
		if (foundPath) { return }
		if (path.existsSync(aPath)) { foundPath = aPath }
	}
	attempt(absModulePath + '.js')
	try {
		var package = JSON.parse(fs.readFileSync(absModulePath + '/package.json').toString())
		attempt(path.resolve(absModulePath, package.main+'.js'))
		attempt(path.resolve(absModulePath, package.main))
	} catch(e) {}
	attempt(absModulePath + '/index.js')

	if (tryFileName) { attempt(absModulePath + '/' + tryFileName + '.js') }
	return foundPath
}

var _pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/
function resolveRequireStatement(requireStmnt, currentPath) {
	var rawPath = requireStmnt.match(_pathnameGroupingRegex)[1],
		resolvedPath = resolve(rawPath, path.dirname(currentPath))
	if (!resolvedPath) { throw 'Could not resolve "'+rawPath+'" in "'+currentPath+'"' }
	return resolvedPath
}

function getDependencyList(path) {
	return _findRequiredModules(path).concat(path)
}

var _findRequiredModules = function(absolutePath, _requiredModules) {
	if (!_requiredModules) { _requiredModules = [] }
	_requiredModules[absolutePath] = true
	var code = getCode(absolutePath),
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

