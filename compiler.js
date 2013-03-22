var fs = require('fs'),
	path = require('path'),
	util = require('./lib/util')

module.exports = {
	compile: compileFile,
	compileHTML: compileHTMLFile,
	compileCode: compileCode,
	dontAddClosureForModule: dontAddClosureForModule,
	dontIncludeModule: dontIncludeModule,
	addPath: addPath,
	addFile: addFile,
	addReplacement: addReplacement
}

var _ignoreClosuresFor = []
function dontAddClosureForModule(searchFor) {
	_ignoreClosuresFor.push(searchFor)
	return module.exports
}

var _ignoreModules = []
function dontIncludeModule(module) {
	_ignoreModules.push(module)
	return module.exports
}

function addReplacement(searchFor, replaceWith) {
	util.addReplacement.apply(util, arguments)
	return module.exports
}

function addPath() {
	util.addPath.apply(util, arguments)
	return module.exports
}

function addFile() {
	util.addFile.apply(util, arguments)
	return module.exports
}

/* api
 *****/
function compileFile(filePath, opts) {
	filePath = path.resolve(filePath)
	opts = util.extend(opts, { basePath:path.dirname(filePath), toplevel:true })
	var code = util.getCode(filePath)
	return _compile(code, opts, filePath)
}

function compileCode(code, opts) {
	opts = util.extend(opts, { basePath:process.cwd(), toplevel:true })
	return _compile(code, opts, '<code passed into compiler.compile()>')
}

function compileHTMLFile(filePath, opts) {
	var html = fs.readFileSync(filePath).toString()
	while (match = html.match(/<script src="\/require\/([\/\w\.]+)"><\/script>/)) {
		var js = compileFile(match[1].toString(), opts)
		
		var BACKREFERENCE_WORKAROUND = '____________backreference_workaround________'
		var BACKREFERENCE_WORKAROUND_REGEX = new RegExp(BACKREFERENCE_WORKAROUND, 'g')
		js = js.replace(\$\&/g, BACKREFERENCE_WORKAROUND)
		html = html.replace(match[0], '<script>'+js+'</script>')
		html = html.replace(BACKREFERENCE_WORKAROUND_REGEX, '\$\&')
	}
	return html
}


var _compile = function(code, opts, mainModule) {
	var code = 'var __require__ = {}, require=function(){}\n' + _compileModule(code, opts.basePath, mainModule)
	if (opts.minify === false) { return code } // TODO use uglifyjs' beautifier?

	if (opts.max_line_length == null) {
		opts.max_line_length = 120
	}
	
	var uglifyJS = require('uglify-js')

	var ast = uglifyJS.parser.parse(code, opts.strict_semicolons),
	ast = uglifyJS.uglify.ast_mangle(ast, opts)
	ast = uglifyJS.uglify.ast_squeeze(ast, opts)
	
	var result = uglifyJS.uglify.gen_code(ast, opts)
	if (opts.max_line_length) {
		result = uglifyJS.uglify.split_lines(result, opts.max_line_length)
	}
	return result
}

/* util
 ******/
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
			regex = new RegExp('__require__\\["'+ escapedPath +'"\\]', 'g')
		
		code = code.replace(regex, '__require__["_'+ i +'"]')
	}
	return code
}

var _nodePaths = process.env.NODE_PATH.split(':')
var _pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/
var _replaceRequireStatements = function(modulePath, code, modules, pathBase) {
	var requireStatements = util.getRequireStatements(code)

	if (!requireStatements.length) {
		modules[modulePath] = code
		return
	}

	for (var i=0, requireStatement; requireStatement = requireStatements[i]; i++) {
		var subModulePath = util.resolveRequireStatement(requireStatement, modulePath)

		if (!subModulePath) {
			throw new Error("Require Compiler Error: Cannot find module '"+ rawModulePath +"' (in '"+ modulePath +"')")
		}

		code = code.replace(requireStatement, '__require__["' + subModulePath + '"].exports')
		
		if (!modules[subModulePath]) {
			modules[subModulePath] = true
			var newPathBase = path.dirname(subModulePath),
				newModuleCode = util.getCode(subModulePath)
			_replaceRequireStatements(subModulePath, newModuleCode, modules, newPathBase)
			modules.push(subModulePath)
		}
	}

	modules[modulePath] = code
}

var _concatModules = function(modules) {
	var code = function(modulePath) {
		for (var i=0; i<_ignoreModules.length; i++) {
			if (modulePath.match(_ignoreModules[i])) {
				return ''
			}
		}
		
		var ignoreClosure = false
		for (var i=0; i<_ignoreClosuresFor.length; i++) {
			if (modulePath.match(_ignoreClosuresFor[i])) {
				ignoreClosure = true
				break
			}
		}
		
		return [
			ignoreClosure ? '' : ';(function() {',
			'	// ' + modulePath,
			'	var module = __require__["'+modulePath+'"] = {exports:{}}, exports = module.exports;',
			modules[modulePath],
			ignoreClosure ? '' : '})()'
		].join('\n')
	}

	var moduleDefinitions = []
	for (var i=1, modulePath; modulePath = modules[i]; i++) {
		moduleDefinitions.push(code(modulePath))
	}
	moduleDefinitions.push(code(modules[0])) // __main__

	return moduleDefinitions.join('\n\n')
}

var _repeat = function(str, times) {
	if (times < 0) { return '' }
	return new Array(times + 1).join(str)
}
