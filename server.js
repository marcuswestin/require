var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	util = require('./lib/util')

module.exports = {
	listen: listen,
	mount: mount,
	connect: connect,
	isRequireRequest: isRequireRequest,
	addPath: addPath,
	addFile: addFile,
	addReplacement: addReplacement,
	setOpts: setOpts,
	handleRequest: handleRequest
}

function addReplacement(searchFor, replaceWith) {
	util.addReplacement(searchFor, replaceWith)
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

function listen(port, _opts) {
	if (!_opts) { _opts = { port:port }}
	else if(port) { _opts.port= port }
	setOpts(_opts)
	opts.handleAllRequests = true
	var server = http.createServer()
	mount(server)
	server.listen(opts.port, opts.host)
}

function mount(server, _opts, handleAllRequests) {
	setOpts(_opts)
	server.on('request', function(req, res) {
		if (isRequireRequest(req) || opts.handleAllRequests) {
			handleRequest(req, res)
		}
	})
	return server
}

function connect(opts) {
	setOpts(opts)
	return function require(req, res, next) {
		if (!isRequireRequest(req)) { return next() }
		handleRequest(req, res)
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
	opts = util.extend(_opts, opts)
}

function _normalizeURL(url) {
	return url.replace(/\?.*/g, '').replace(/\/js$/, '.js')
}

/* request handlers
 ******************/
function handleRequest(req, res) {
	var reqPath = _normalizeURL(req.url).substr(opts.root.length + 2)
	if (!reqPath.match(/\.js$/)) {
		_handleMainModuleRequest(reqPath, req, res)
	} else {
		_handleModuleRequest(reqPath, res)
	}
}

function _handleMainModuleRequest(reqPath, req, res) {
	var prefix = util.hasAddedPath(reqPath.split('/')[0]) ? '' : './',
		modulePath = util.resolve(prefix + reqPath, opts.path)
	if (!modulePath) { return _sendError(res, 'Could not find module "'+reqPath+'" from "'+opts.path+'"') }

	try { var deps = util.getDependencyList(modulePath) }
	catch(err) { return _sendError(res, 'in util.getDependencyList: ' + err) }

	var response = ['__require__ = {}']
  
	var userAgent = req.headers['user-agent'],
		isMobile = userAgent.match('iPad') || userAgent.match('iPod') || userAgent.match('iPhone') || userAgent.match('Android')
  
	if (isMobile) {
		// mobile clients take too long per js file request. Inline all the JS into a single request
		for (var i=0, dependency; dependency = deps[i]; i++) {
			response.push(_getModuleCode(res, dependency) + "\n")
		}
	} else {
		response.push(
			'__require__.__scripts = []',
			'__require__.__loadNext = function() {',
			'	var src = __require__.__scripts.shift()',
			'	var url = location.protocol + src',
			'	if (!src) { return }',
			'	document.getElementsByTagName("head")[0].appendChild(document.createElement("script")).src = url',
		'}')

		for (var i=0, dependency; dependency = deps[i]; i++) {
			var src = _getBase() + '/' + dependency
			response.push('__require__.__scripts.push("'+src+'")')
		}

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
	var _closureStart = ';(function() {',
		_moduleDef = 'var module = {exports:{}}; var exports = module.exports;',
		_closureEnd = '})()'

	var code = util.getCode(reqPath),
		requireStatements = util.getRequireStatements(code)

	for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
		try { var depPath = util.resolveRequireStatement(requireStmnt, reqPath) }
		catch (e) { _sendError(res, e.message || e) }
		if (!depPath) { return _sendError(res, 'Could not resolve module') }

		code = code.replace(requireStmnt, '__require__["'+depPath+'"]')
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
	var host = opts.host,
		port = (!opts.usePagePort && opts.port)
	
	if (host && port) {
		return '//' + host + ':' + port + '/' + opts.root
	} else {
		return '/' + opts.root
	}
}
