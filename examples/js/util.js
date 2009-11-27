
function bind(context, method/*, args... */) {
	var args = Array.prototype.slice.call(arguments, 2);
	return function(){
		method = (typeof method == 'string' ? context[method] : method);
		return method.apply(context, args.concat(Array.prototype.slice.call(arguments, 0)))
	}
}

function logToDom() {
	if (!logToDom.loggerDiv) { logToDom.loggerDiv = document.body.appendChild(document.createElement('div')); }
	var logRow = logToDom.loggerDiv.appendChild(document.createElement('div'));
	for (var i=0, arg; arg = arguments[i]; i++) {
		logRow.innerHTML += arg.toString();
	}
}

function assert(cond, test) {
	var message = (cond ? 'passed: ' : 'failed: ') + test;
	exports.log(message);
}

exports.bind = bind;
exports.log = (window.console ? bind(window.console, 'log') : log);
exports.assert = assert;