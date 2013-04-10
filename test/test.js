
var async = require('async');
var fs = require('fs');
var assert = require('assert');

var Fire=require('../lib/fire-ts');

var opts={ 
	render: function(template, input,opts){
		var templ= Fire.parseSync(template,opts);	
		return templ(input,opts);	
	}
}


describe("Fire",function(){

	describe("templates",function(){
		it("should generate expected outputs",function(done){
			var tests=[
				{ template:"1.fts", input:{}, out:"1.out"},
				{ template:"2.fts", input:{}, out:"2.out"},
				{ template:"inline.fts", input:{}, out:"inline.out"},
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
					assert.equal(res.pass,true,res.template);
				});
				done();
			});
		});
	});
	describe("API",function(){
		it("should pass basic tests",function(done){
			assert.equal("5",(Fire.compile("<%=x%>")({x:5})));
			var t = Fire.combustion()("<%=x%>");

			assert.equal("5",t({x:5}));
			assert.equal(t.source!=null,true);

			var blocks = Fire.readBlocks("\n//%{header}Foo//}%");

			assert.equal(blocks.header,"Foo//");
			
			var t = Fire.parseSync("1.fts");
			assert.equal(typeof t,"function");
			
			assert.equal(t({}).indexOf("Hello"),0);

			var blocks = Fire.readFileBlocksSync("block.fts");
			

			assert.equal(blocks.header!=null,true);
		
			return done();
		});
	});

	describe("async templates",function(){
		it("should generate and run async templates",function(done){
			var t = Fire.parseSync("nested.fts",{async:true});

			t({name:"hello"},{ fetch: function(template,onComplete){
					Fire.parse(template,{async:true},onComplete);
				}},function(err,res){
				done();
			});
		});
	});

});







