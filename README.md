browser-require.js
==================

Brings `require` to the browser
-------------------------------

Browser-require lets you write javascript using "require", "exports" and "module" in the browser, just as you would in node. It helps you with your dependency management, and provides a compiler to condense all your required modules into a single file for production.

Example
-------
Lets look at a somewhat contrived example that uses require in an html file to load a lib/math module, which in turn requires lib/util. 

    // in lib/util.js
    exports.each = function(arr, fn) {
        for (var i=0; i<arr.length; i++) {
            fn(arr[i], i)
        }
    }
    
    // in lib/math.js
    var each = require('./util').each
    exports.sum = function(numbers) {
        var result = 0
        each(numbers, function(n) {
            result += n
        }
        return result
    }
    
    // in index.html
    <script src="browser-require/require.js"></script>
    <script>
        var math = require('./lib/math')
        alert(math.sum([1, 4, 8, 23, 9]))
    </script>

How does it work?
-----------------
Martin Hunt built a synchronous module loading system for [js.io]. Browser-require adopts a similar technique and lots of particular details to mimic node's require functionality in the browser.

When a module is required, we fetch it's javascript as a string using a synchronous XHR. The module's javascript then gets evaluated inside of a function which takes the "module" object as an argument. This provides both the closure 

Compile for Production
----------------------
Browser-require fetches the requested modules with a synchronous XHR. Before you deploy to production you will want to compile all the required modules into a single file:

    $ cd browser-require
    $ node compile.js path/to/app.js > compiled-app.js

I intend to add the ability to compile an html page with browser-require on it into a single html page with all required javascript inline.
    
    $ node compile.js path/to/index.html > compiled-app.html


[js.io]: https://github.com/mcarter/js.io/