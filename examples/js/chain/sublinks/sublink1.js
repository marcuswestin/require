var logger = require('examples/js/logger');

logger.log('linked sublink1', 'require sublink2');
require('./sublink2');

