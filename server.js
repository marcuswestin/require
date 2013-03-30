var http = require('http')
var fs = require('fs')
var path = require('path')
var extend = require('std/extend')
var isObject = require('std/isObject')
var getDependencyList = require('./lib/getDependencyList')
var getRequireStatements = require('./lib/getRequireStatements')
var getCode = require('./lib/getCode')
var resolve = require('./lib/resolve')

module.exports = {
	listen: listen,
	mount: mount,
	connect: connect,
	isRequireRequest: isRequireRequest,
	handleRequest: handleRequest
}

function listen(portOrOpts) {
	var _opts = (isObject(portOrOpts) ? portOrOpts : { port:portOrOpts || 1234 })
	opts.handleAllRequests = true
	mount(http.createServer(), _opts).listen(opts.port, opts.host)
}

function mount(server, _opts) {
	setOpts(_opts)
	return server.on('request', _checkRequest)
}

function connect(opts) {
	setOpts(opts)
	return _checkRequest
}

function _checkRequest(req, res, next) {
	if (isRequireRequest(req) || opts.handleAllRequests) {
		handleRequest(req, res)
	} else {
		next && next()
	}
}

function isRequireRequest(req) {
	return req.url.substr(1, opts.root.length) == opts.root
}

/* options
 *********/
var opts = {
	path: process.cwd(),
	root: 'require',
	port: null,
	host: null
}

function setOpts(_opts) {
	opts = extend(_opts, opts)
}

/* request handlers
 ******************/
function handleRequest(req, res) {
	var reqPath = _normalizeURL(req.url).substr(opts.root.length + 2)
	if (reqPath.match(/\.js$/)) {
		_handleModuleRequest(reqPath, res)
	} else {
		_handleMainModuleRequest(reqPath, req, res)
	}

	function _normalizeURL(url) {
		return url.replace(/\?.*/g, '').replace(/\/js$/, '.js')
	}
}

function _handleMainModuleRequest(reqPath, req, res) {
	var modulePath = resolve.path('./' + reqPath, opts.path)
	if (!modulePath) { return _sendError(res, 'Could not find module "'+reqPath+'" from "'+opts.path+'"') }

	try { var deps = getDependencyList(modulePath) }
	catch(err) { return _sendError(res, 'in getDependencyList: ' + err) }

	var response = ['__require__ = {}', 'require=function(){}']
  
	var userAgent = req.headers['user-agent']
	var isMobile = userAgent.match('iPad') || userAgent.match('iPod') || userAgent.match('iPhone') || userAgent.match('Android')
	var isPhantom = userAgent.match(/PhantomJS/)
		
	
	if (isMobile) {
		// mobile clients take too long per js file request. Inline all the JS into a single request
		each(deps, function(dependency) {
			response.push(_getModuleCode(res, dependency) + "\n")
		})
	} else {
		response.push(
			'__require__.__scripts = []',
			'__require__.__loadNext = function() {',
			'	var src = __require__.__scripts.shift()',
			'	var url = location.protocol+"//"+location.host + src',
			'	if (!src) { return }',
			isPhantom ? '	setTimeout(function() {' : '',
			'		document.getElementsByTagName("head")[0].appendChild(document.createElement("script")).src = url',
			isPhantom ? '	}, 20)' : '',
		'}')

		each(deps, function(dependency) {
			var src = _getBase() + '/' + dependency
			response.push('__require__.__scripts.push("'+src+'")')
		})

		response.push('__require__.__loadNext()')
	}

	var buf = new Buffer(response.join('\n'), encoding='utf8')
	res.writeHead(200, { 'Cache-Control':'no-cache', 'Expires':'Fri, 31 Dec 1998 12:00:00 GMT', 'Content-Length':buf.length, 'Content-Type':'text/javascript' })
	res.end(buf)
}

function _handleModuleRequest(reqPath, res) {
	try { var code = _getModuleCode(res, reqPath) }
	catch(err) { return _sendError(res, err.stack || err) }

	code += '\n__require__.__loadNext()'
	
	var buf = new Buffer(code, encoding='utf8')
	res.writeHead(200, { 'Cache-Control':'no-cache', 'Expires':'Fri, 31 Dec 1998 12:00:00 GMT', 'Content-Length':buf.length, 'Content-Type':'text/javascript' })
	res.end(buf)
}

function _getModuleCode(res, reqPath) {
	var _closureStart = ';(function() {'
	var _moduleDef = 'var module = {exports:{}}; var exports = module.exports;'
	var _closureEnd = '})()'

	var code = getCode(reqPath)
	var requireStatements = getRequireStatements(code)

	try {
		each(requireStatements, function(requireStmnt) {
			var depPath = resolve.requireStatement(requireStmnt, reqPath)
			if (!depPath) { throw 'Could not resolve module' }
			code = code.replace(requireStmnt, '__require__["'+depPath+'"]')
		})
	} catch(e) {
		_sendError(res, e.message || e)
	}

	return _closureStart
		+ _moduleDef
		+ code // all on the first line
		+ '\n__require__["'+reqPath+'"]=module.exports '+ _closureEnd
}

/* util
 ******/
function _sendError(res, msg) {
	if (msg) { msg = msg.replace(/\n/g, '\\n').replace(/"/g, '\\"') }
	res.writeHead(200)
	res.end('alert("error: ' + msg + '")')
}

function _getBase() {
	var host = opts.host
	var port = (!opts.usePagePort && opts.port)
	
	if (host && port) {
		return '//' + host + ':' + port + '/' + opts.root
	} else {
		return '/' + opts.root
	}
}
