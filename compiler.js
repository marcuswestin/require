var fs = require('fs'),
	path = require('path'),
	child_process = require('child_process'),
	util = require('./lib/util'),
	extend = require('std/extend'),
	uglifyJS = require('uglify-js')

module.exports = {
	compile: compileFile,
	compileCode: compileCode,
	addPath: util.addPath
}

/* compilation
 *************/
function compileFile(filePath, opts) {
	opts = extend(opts, { basePath:path.dirname(filePath), toplevel:true })
	var code = fs.readFileSync(filePath).toString()
	return _compile(code, opts, filePath)
}

function compileCode(code, opts) {
	opts = extend(opts, { basePath:process.cwd(), toplevel:true })
	return _compile(code, opts, '<code passed into compiler.compile()>')
}

var _compile = function(code, opts, mainModule) {
	var code = 'var require = {}\n' + _compileModule(code, opts.basePath, mainModule)
	if (opts.compile === false) { return code } // TODO use uglifyjs' beautifier?
	else { return _compress(code, opts) }
}

function _compress(code, opts) {
	var parser = uglifyJS.parser,
		uglify = uglifyJS.uglify,
		ast = parser.parse(code, opts.strict_semicolons)
	
	ast = uglify.ast_mangle(ast, opts)
	ast = uglify.ast_squeeze(ast, opts)

	return uglify.gen_code(ast, opts)
}

/* util
 ******/
var _indent = function(code) {
	var lines = code.replace(/\t/g, '').split('\n'),
		result = [],
		indentation = 0
	
	for (var i=0, line; i < lines.length; i++) {
		line = lines[i]
		
		if (line.match(/^\s*\}/)) { indentation-- }
		result.push(_repeat('\t', indentation) + line)
		if (!line.match(/^\s*\/\//) && line.match(/\{\s*$/)) { indentation++ }
	}
	return result.join('\n')
}

var _compileModule = function(code, pathBase, mainModule) {
	var modules = [mainModule]
	_replaceRequireStatements(mainModule, code, modules, pathBase)
	code = _concatModules(modules)
	code = _minifyRequireStatements(code, modules)
	return code
}

var _minifyRequireStatements = function(code, modules) {
	for (var i=0, modulePath; modulePath = modules[i]; i++) {
		var escapedPath = modulePath.replace(/\//g, '\\/').replace('(','\\(').replace(')','\\)'),
			regex = new RegExp('require\\["'+ escapedPath +'"\\]', 'g')
		code = code.replace(regex, 'require["_'+ i +'"]')
	}
	return code
}

var _globalRequireRegex = /require\s*\(['"][\w\/\.-]*['"]\)/g,
	_pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/

var _replaceRequireStatements = function(modulePath, code, modules, pathBase) {
	var requireStatements = code.match(_globalRequireRegex)

	if (!requireStatements) {
		modules[modulePath] = code
		return
	}

	for (var i=0, requireStatement; requireStatement = requireStatements[i]; i++) {
		var rawModulePath = requireStatement.match(_pathnameGroupingRegex)[1],
			isRelative = (rawModulePath[0] == '.'),
			// use node's resolution system is it's an installed package, e.g. require('socket.io/support/clients/socket.io')
			searchPath = isRelative ? path.join(pathBase, rawModulePath) : (util.resolve(rawModulePath) || '').replace(/\.js$/, ''),
			subModulePath = _findTruePath(searchPath, modules)

		if (!subModulePath) {
			throw new Error("Require Compiler Error: Cannot find module '"+ rawModulePath +"' (in '"+ modulePath +"')")
		}

		code = code.replace(requireStatement, 'require["' + subModulePath + '"].exports')

		if (!modules[subModulePath]) {
			modules[subModulePath] = true
			var newPathBase = path.dirname(subModulePath),
				newModuleCode = fs.readFileSync(subModulePath + '.js').toString()
			_replaceRequireStatements(subModulePath, newModuleCode, modules, newPathBase)
			modules.push(subModulePath)
		}
	}

	modules[modulePath] = code
}

var _concatModules = function(modules) {
	var code = function(modulePath) {
		return [
			';(function() {',
			'	// ' + modulePath,
			'	var module = require["'+modulePath+'"] = {exports:{}}, exports = module.exports;',
				modules[modulePath],
			'})()'
		].join('\n')
	}

	var moduleDefinitions = []
	for (var i=1, modulePath; modulePath = modules[i]; i++) {
		moduleDefinitions.push(code(modulePath))
	}
	moduleDefinitions.push(code(modules[0])) // __main__

	return moduleDefinitions.join('\n\n')
}

var _findTruePath = function(modulePath, modules) {
	function tryPath(p) {
		return (!!modules[p] || path.existsSync(p+'.js'))
	}
	if (tryPath(modulePath)) { return modulePath }
	if (tryPath(modulePath + '/index')) { return modulePath + '/index' }
	if (tryPath(modulePath + 'index')) { return modulePath + 'index' }
	if (path.existsSync(modulePath + '/package.json')) {
		var main = JSON.parse(fs.readFileSync(modulePath + '/package.json').toString()).main.split('.')[0]
		if (main && tryPath(modulePath + '/' + main)) { return modulePath + '/' + main }
	}
}

var _repeat = function(str, times) {
	if (times < 0) { return '' }
	return new Array(times + 1).join(str)
}
