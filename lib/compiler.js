module.exports = {
	compileJS: compileJS,
	compileJSFile: compileJSFile,
	compressJS: compressJS,
	indentJS: indentJS
}

var fs = require('fs'),
	sys = require('sys'),
	path = require('path'),
	util = require('util'),
	child_process = require('child_process')

/* Compile a javascript file
 ***************************/
function compileJSFile(filePath) {
	return compileJS(_readFile(filePath), path.dirname(filePath))
}

function compileJS(code, basePath) {
	return indentJS('var require = {}\n' + compileJSModule(code, {}, basePath))
}

/* Compress/minify with google closure
 *************************************/
// TODO: Look into
// provide a closure to make all variables local: code = '(function(){'+code+'})()'
// --compilation_level [WHITESPACE_ONLY | SIMPLE_OPTIMIZATIONS | ADVANCED_OPTIMIZATIONS]
// --compute_phase_ordering: Runs the compile job many times, then prints out the best phase ordering from this run
// --define (--D, -D) VAL Override the value of a variable annotated @define. The format is <name>[=<val>], where <name> is the name of a @define variable and <val> is a boolean, number, or a single-quot ed string that contains no single quotes. If [=<val>] is omitted, the variable is marked true
// --print_ast, --print_pass_graph, --print_tree
function compressJS(code, callback) {
	
	var closureArgs = ['-jar', __dirname + '/google-closure.jar']
	
	var closure = child_process.spawn('java', closureArgs)
		stdout = [],
		stderr = []
	closure.stdout.on('data', function(data) { stdout.push(data); });
	closure.stderr.on('data', function(data) { stderr.push(data); });
	closure.on('exit', function(code) {
		if (code == 0) {
			callback(stdout.join(''))
		} else {
			util.debug(stderr.join(''))
			callback('')
		}
	})
	closure.stdin.write(code)
	closure.stdin.end()
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
			isRelative = (rawModulePath[0] == '.'),
			searchPath = isRelative ? path.join(pathBase, rawModulePath) : (require.resolve(rawModulePath) || '').replace(/\.js$/, ''), // use node's resolution system is it's an installed package, e.g. require('socket.io/support/clients/socket.io')
			modulePath = findTruePath(searchPath, modules)

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

function findTruePath(modulePath, modules) {
	function tryPath(p) {
		return (!!modules[p] || path.existsSync(p+'.js'))
	}
	if (tryPath(modulePath)) { return modulePath }
	if (tryPath(modulePath + '/index')) { return modulePath + '/index' }
	if (tryPath(modulePath + 'index')) { return modulePath + 'index' }
	throw 'require compiler: could not resolve "' + modulePath + '"'
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
