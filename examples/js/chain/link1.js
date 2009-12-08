var logger = require('examples/js/logger');

logger.log('linked link1', 'require sublink1');
require('./sublinks/sublink1');

logger.log('link1', 'require link2');
require('./link2');