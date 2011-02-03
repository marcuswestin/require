module.exports = {
	compileJSFile: compileJSFile
}

var fs = require('fs'),
	sys = require('sys')

/* Compile a javascript file
 ***************************/
function compileJSFile(filePath) {
	var modulePath = filePath.replace(/\.js$/, ''),
		modules = {}
	return _indent('var require = {}\n' + compileJSModule(modulePath, modules))
}

/* Compile a javascript module
 *****************************/
var globalRequireRegex = /require\s*\(['"][\w\/\.]*['"]\)/g,
	pathnameGroupingRegex = /require\s*\(['"]([\w\/\.]*)['"]\)/
function compileJSModule(path, modules) {
	var code = fs.readFileSync(path + '.js').toString(),
		requireStatements = code.match(globalRequireRegex)
	
	if (!requireStatements) { return code }
	
	for (var i=0, requireStatement; requireStatement = requireStatements[i]; i++) {
		var modulePath = requireStatement.match(pathnameGroupingRegex)[1]
		if (modules[modulePath]) {
			code = code.replace(requireStatement, 'require["'+modulePath+'"].exports')
		} else {
			modules[modulePath] = true
			code = code.replace(requireStatement, [
					'(function() {',
					'	var module = require["'+modulePath+'"] = {exports:{}}, exports = module.exports',
					'		',
					'		// start module code',
							compileJSModule(modulePath, modules),
					'		// end module code',
					'		',
					'		return module.exports',
					'})();'
				].join('\n'))
		}
	}
	return code
}

/* Util
 ******/
function _indent(code) {
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

function _repeat(str, times) {
	if (times < 0) { return '' }
	return new Array(times + 1).join(str)
}
