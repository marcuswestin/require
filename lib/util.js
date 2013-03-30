var path = require('path')
var fs = require('fs')
var resolve = require('./resolve')

module.exports = {
	extend: extend,
	getDependencyList: require('./getDependencyList'),
	getRequireStatements: require('./getRequireStatements'),
	getCode: require('./getCode'),
	resolvePath: resolve.path,
	resolveRequireStatement: resolve.requireStatement,
	addPath: resolve.addPath,
	addFile: resolve.addFile,
	hasAddedPath: resolve.hasAddedPath
}

function extend(target, extendWith) {
	target = target || {}
	for (var key in extendWith) {
		if (target[key] === undefined) {
			target[key] = extendWith[key]
		}
	}
	return target
}
