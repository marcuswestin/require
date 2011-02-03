module.exports = {
	compileJS: compileJS,
	compileJSFile: compileJSFile,
	indentJS: indentJS
}

var fs = require('fs'),
	sys = require('sys'),
	path = require('path')

/* Compile a javascript file
 ***************************/
function compileJSFile(filePath) {
	return compileJS(_readFile(filePath), path.dirname(filePath))
}

function compileJS(code, basePath) {
	return indentJS('var require = {}\n' + compileJSModule(code, {}, basePath))
}

/* Compile a javascript module
 *****************************/
var globalRequireRegex = /require\s*\(['"][\w\/\.-]*['"]\)/g,
	pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/
function compileJSModule(code, modules, pathBase) {
	var requireStatements = code.match(globalRequireRegex)
	
	if (!requireStatements) { return code }
	
	for (var i=0, requireStatement; requireStatement = requireStatements[i]; i++) {
		
		var rawModulePath = requireStatement.match(pathnameGroupingRegex)[1],
			modulePath = path.join(pathBase, rawModulePath)
		
		if (modules[modulePath]) {
			code = code.replace(requireStatement, 'require["'+modulePath+'"].exports')
		} else {
			modules[modulePath] = true
			var newPathBase = path.dirname(modulePath)
			code = code.replace(requireStatement, [
					// we could replace require('path') with (function(){})(). However, if
					// you have require('path1') require('path2'), then we end up with
					// (function a(){})() (function b(){}()). This causes a runtime error,
					// since it gets interpreted as an invocation of the return value of
					// function a. Instead, insert a throwaway variable assignment, such that
					// we get require._=(function a(){})() require._=(function b(){})(). This
					// gets interpreted as two separate statements, which solves the problem.
					// (an alternative faulty approach is to put a semi-colon at the end of
					// the function invocation, but that would fail in the case of
					// var a = require('a'), b = require('b'))
					'require._=(function() {',
					'	var module = require["'+modulePath+'"] = {exports:{}}, exports = module.exports',
					'	// start module code',
						compileJSModule(_readFile(modulePath + '.js'), modules, newPathBase),
					'	// end module code',
					'	return module.exports',
					'})()'
				].join('\n'))
		}
	}
	return code
}

function indentJS(code) {
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

/* Util
 ******/

function _repeat(str, times) {
	if (times < 0) { return '' }
	return new Array(times + 1).join(str)
}

function _readFile(path) {
	return fs.readFileSync(path).toString()
}
