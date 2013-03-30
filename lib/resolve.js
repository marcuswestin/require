var path = require('path')
var fs = require('fs')
var existsSync = fs.existsSync || path.existsSync

module.exports = {
	path: resolvePath,
	requireStatement: resolveRequireStatement,
	addPath: addPath,
	addFile: addFile,
	hasAddedPath: hasAddedPath
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

function resolvePath(searchPath, pathBase) {
	if (searchPath[0] == '.') {
		// relative path, e.g. require("./foo")
		return _findModuleMain(path.resolve(pathBase, searchPath))
	}
	
	var searchParts = searchPath.split('/')
	var componentName = searchParts[searchParts.length - 1]
	var name = searchParts.shift()
	var rest = searchParts.join('/')
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
		return resolvePath(searchPath, path.resolve(pathBase, '..'))
	}
	
	return ''
}

var _nodePaths = process.env.NODE_PATH.split(':')
var _pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/
function resolveRequireStatement(requireStmnt, currentPath) {
	var rawPath = requireStmnt.match(_pathnameGroupingRegex)[1]
	var resolvedPath = resolvePath(rawPath, path.dirname(currentPath))
	
	if (!resolvedPath && rawPath[0] != '.' && rawPath[0] != '/') {
		for (var i=0; i<_nodePaths.length; i++) {
			resolvedPath = _findModuleMain(path.resolve(_nodePaths[i], rawPath))
			if (resolvedPath) { break }
		}
	}
	
	if (!resolvedPath) { throw 'Could not resolve "'+rawPath+'" in "'+currentPath+'"' }
	return resolvedPath
}

function _findModuleMain(absModulePath, tryFileName) {
	var foundPath = ''
	function attempt(aPath) {
		if (foundPath) { return }
		if (existsSync(aPath)) { foundPath = aPath }
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


