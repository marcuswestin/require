module('from util import assert');

exports.runTests = function() {
	assert(1 + '23' == '123', "1 + '23' == '123'");
	assert(1 + 2 + '3' == '33', "1 + 2 + '3' == '33'");
}
