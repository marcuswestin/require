var moduleC = require('./moduleC'),
	moduleD = require('../moduleD')

exports.somethingFromModuleC = moduleC.something
exports.somethingFromModuleD = moduleD.something
exports.something = 'exports in moduleB'

exports.folderModule = require('./folder-module')