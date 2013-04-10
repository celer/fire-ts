var async = require('async');
var fs = require('fs');

var Fire=require('../lib/fire-ts');

var opts={ 
	render: function(template, input,opts){
		var res = Fire.parseSync(template,opts);	
		eval("var templ="+res);
		return templ(input,opts);	
	}
}

var tests=[
	{ template:"1.fts", input:{}, out:"1.out"},
	{ template:"2.fts", input:{}, out:"2.out"},
	{ template:"3.fts", input:{}, out:"3.out"},
	{ template:"nested.fts", input:{ name: 4 }, out:"nested.out"},
	{ template:"tabbing.fts", input:{ name: 4 }, out:"tabbing.out"},
	{ template:"block.fts", input:{ pid:33 }, blocks: { header:"\nFOOFOO\n//"}, out:"block.out" },
	{ template:"block_modified.fts", input:{ pid:44 }, out:"block_modified.out", delete:false},
	{ template:"c.fts", input:{ pid:33 }, blocks: { header:"\nFOOFOO\n//",prefix:"\nconst char *prefix=\"<\";\n" }, out:"c.out" },
	{ template:"sql.fts",input:{}, out:"sql.out"}	
];

runTest=function(input,onComplete){
	opts.blocks=input.blocks;
	Fire.generateSync(input.template,input.template+".gen",input.input,opts);	
	fs.readFile(input.template+".gen",function(err,genData){
		fs.readFile(input.out,function(err,outData){
			genData=genData.toString();
			outData=outData.toString();
			if(genData==outData && input.delete!==false)
				fs.unlink(input.template+".gen");
			return onComplete(null,{ template: input.template, pass:(genData==outData)});
		});
	});
}

async.map(tests,runTest,function(err,results){
	results.map(function(res){
		console.log("Pass", res.pass, "-",res.template);
	});
	results.map(function(res){
		if(res.pass!==true)
			process.exit(-1);
	});
	process.exit(0);
});

