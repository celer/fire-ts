compiler=require('../../lib/fire-ts').combustion();

var template = compiler("<%=x%>");

//Run the template
console.log(template({x:5}));


//Get the source code for the template
console.log(template.source);

