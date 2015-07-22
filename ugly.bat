rem use uglifyjs to minify JavaScript files 

call uglifyjs -o polymer-ts.min.js --in-source-map polymer-ts.js.map --source-map polymer-ts.min.js.map --screw-ie8 --mangle --compress --keep-names polymer-ts.js

copy polymer-ts.min.* Sample\bower_components\polymer-ts
copy polymer-ts.min.* Test\bower_components\polymer-ts

		  