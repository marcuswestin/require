module.exports = {
	compile: compile,
	compileFile: compileFile,
	compress: compress,
	compressFile: compressFile,
	indent: indent
}

var fs = require('fs'),
	sys = require('sys'),
	path = require('path'),
	util = require('util'),
	child_process = require('child_process')

/* Compile a javascript file
 ***************************/
function compileFile(filePath) {
	return compile(_readFile(filePath), path.dirname(filePath))
}

function compile(code, basePath) {
	return indent('var require = {}\n' + compileModule(code, basePath))
}

/* Compress/minify with google closure
 *************************************/
function compressFile(filePath, callback) {
	compress(_readFile(filePath), callback)
}
// TODO: Look into
// provide a closure to make all variables local: code = '(function(){'+code+'})()'
// --compilation_level [WHITESPACE_ONLY | SIMPLE_OPTIMIZATIONS | ADVANCED_OPTIMIZATIONS]
// --compute_phase_ordering: Runs the compile job many times, then prints out the best phase ordering from this run
// --define (--D, -D) VAL Override the value of a variable annotated @define. The format is <name>[=<val>], where <name> is the name of a @define variable and <val> is a boolean, number, or a single-quot ed string that contains no single quotes. If [=<val>] is omitted, the variable is marked true
// --print_ast, --print_pass_graph, --print_tree
function compress(code, callback) {
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

/* Compile require statements
 ****************************/
function compileModule(code, pathBase) {
	var mainModule = '__main__',
		modules = [mainModule]

	_replaceRequireStatements(mainModule, code, modules, pathBase)
	code = _concatModules(modules)
	code = _minifyRequireStatements(code, modules)
	return code
}

var _minifyRequireStatements = function(code, modules) {
	for (var i=0, modulePath; modulePath = modules[i]; i++) {
		var escapedPath = modulePath.replace(/\//g, '\\/'),
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
			searchPath = isRelative ? path.join(pathBase, rawModulePath) : (require.resolve(rawModulePath) || '').replace(/\.js$/, ''),
			subModulePath = _findTruePath(searchPath, modules)

		code = code.replace(requireStatement, 'require["' + subModulePath + '"].exports')

		if (!modules[subModulePath]) {
			modules[subModulePath] = true
			var newPathBase = path.dirname(subModulePath),
				newModuleCode = _readFile(subModulePath + '.js')
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
			'	var module = require["'+modulePath+'"] = {exports:{}}, exports = module.exports',
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
	throw 'require compiler: could not resolve "' + modulePath + '"'
}


/* Code indentation
 ******************/
function indent(code) {
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
