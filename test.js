var compiler = require('require/compiler'),
    code = 'console.log(require("./example/shared/dependency"))',
	    file = './example/client'

		compiler.compile(code, 1, function(err, compiledCode) {
		    if (err) { throw err }
			    console.log(compiledCode)
				})

				compiler.compile(file, 2, function(err, compiledCode) {
				    if (err) { throw err }
					    console.log(compiledCode)
						})

