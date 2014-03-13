
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

var tests=[
  { template:"1.fts", input:{}, out:"1.out"},
  { template:"2.fts", input:{}, out:"2.out"},
  { template:"inline.fts", input:{}, out:"inline.out"},
  { template:"3.fts", input:{}, out:"3.out"},
  { template:"cpp_params.fts", input:{ params: { a:{type:"int"}, b:{type:"float"} }, params2:["a","b"] }, out:"cpp_params.out"},
  { template:"cpp_params_sp.fts", input:{ params: { a:{type:"int"}, b:{type:"float"} }, params2:["a","b"] }, out:"cpp_params_sp.out", indent:"  "},
  { template:"nested.fts", input:{ name: 4 }, out:"nested.out"},
  { template:"tabbing.fts", input:{ name: 4 }, out:"tabbing.out"},
  { template:"block.fts", input:{ pid:33 }, blocks: { header:"\nFOOFOO\n//"}, out:"block.out" },
  { template:"block_modified.fts", input:{ pid:44 }, out:"block_modified.out", delete:false},
  { template:"sql.fts",input:{}, out:"sql.out"},
  { template:"c.fts", input:{ pid:33 }, blocks: { header:"\nFOOFOO\n//",prefix:"\nconst char *prefix=\"<\";\n" }, out:"c.out" }
];

describe("Fire",function(){

  describe("templates",function(){
    tests.map(function(input){
      it("should parse "+input.template+" and generate an output matching "+input.out,function(done){
        opts.blocks=input.blocks;
        opts.indent=input.indent; 
        Fire.generateSync(input.template,input.template+".gen",input.input,opts);  
        fs.readFile(input.template+".gen",function(err,genData){
          fs.readFile(input.out,function(err,outData){
            genData=genData.toString();
            outData=outData.toString();
            if(genData==outData && input.delete!==false)
              fs.unlink(input.template+".gen");
            assert.equal(genData,outData);
            done();
          });
        });
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

  describe("snippet based templets",function(){
    it("Should allow template snippets to be utilized",function(done){
      var t = Fire.parseSync("snippet.js.fts");

      var res = t({},{ render: function(template,input,opts){
        return Fire.compile("<%=xi%>")(input)  
      }});

      assert.equal("01234",res);
      
      done();

    });
  });

  describe("Error handling",function(){
    it("Should report line numbers when there are syntax errors in the template",function(done){
      try {
        var t = Fire.parseSync("tplerror.fts");
      } catch(e){
        assert.equal(e.line,4);
        assert.equal(e.column,1);
        assert.equal(/\(line:4:1\)/.test(e.message),true)
      }
      done();
    });
  });
    
  describe("Eval Error handling",function(){
    it("Should report line numbers when there are errors in the template",function(done){
      var t = Fire.parseSync("evalerror.fts");
      try { 
        t({});
      } catch(e){
        assert.equal(e.line,5);
        assert.equal(/\(line:5\)/.test(e.message),true);
      }
      done();
    });
  });
  
  describe("Eval Error handling",function(){
    it("Should report line numbers when there are errors in the template",function(done){
      try { 
        var t = Fire.parseSync("funcevalerror.fts");
        t({});
      } catch(e){
        assert.equal(e.line,11);
        assert.equal(/\(line:11\)/.test(e.message),true);
      }
      done();
    });
  });
  
  describe("Eval Error handling",function(){
    it("Should report line numbers when there are errors in the template",function(done){
      try { 
        var t = Fire.parseSync("funcevalerror2.fts");
        t({});
      } catch(e){
        assert.equal(e.line,3);
        assert.equal(/\(line:3\)/.test(e.message),true);
      }
      done();
    });
  });
  
});







