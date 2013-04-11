var fs = require('fs');
var Fire = require('./lib/fire-ts');

var comments = Fire.readCommentsSync("lib/fire-ts.js");

var api =  (comments.map(function(i){ return "/**\n"+i+"\n*/\n\n";}).join("\n"));

var readme = fs.readFileSync("README.md").toString().split("\n# API\n");

fs.writeFileSync("README.md",readme[0]+"\n# API\n\n\n```js\n"+api+"\n```");
