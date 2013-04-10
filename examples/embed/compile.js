Fire=require('../../lib/fire-ts');

var template = Fire.compile("<%=x%>");

console.log(template({x:5}));

