/**
	Fire Template System

	@module FireTS
	@class Fire

*/
var PEG = require('pegjs');
var fs = require('fs');
var path = require('path');
var UglifyJS = require("uglify-js");


var Fire={};

Fire.loadParser=function(){
	var data = fs.readFileSync(path.join(__dirname,"../static","fire.pegjs"));
	Fire.parser=PEG.buildParser(data.toString(),{trackLineAndColumn:true});
}

Fire.prefix="_$_";

Fire.loadParser();

Fire.loadWrapper=function(){
	var wrapper=fs.readFileSync(path.join(__dirname,"../static/","wrapper.js.fts"));
	wrapper=wrapper.toString();
	wrapper=wrapper.replace(/\<FTSP\>/gm,Fire.prefix);
	var res = Fire.parser.parse(wrapper);
	res = Fire.process(res);
	res = Fire.optimize(res);
	var w = Fire.toString(res);
	var prefix="Fire.wrapper=function wrapper(input,o){ <FTSP>o=o||{}; var <FTSP>s='', <FTSP>j=JSON.stringify, <FTSP>e=function(i){ <FTSP>s+=i }; with(input){";
	var postfix=" } return <FTSP>s;}";
	eval(prefix.replace(/\<FTSP\>/gm,Fire.prefix)+w+postfix.replace(/\<FTSP\>/gm,Fire.prefix,"g")); 
}

Fire.ts=function(tabDepth){
	var ts="";
	for(var i=0;i<tabDepth;i++){
		ts+="\t";
	}
	return ts;
}

Fire.removeIndent=function(input,tabDepth){
	var tc=Fire.ts(tabDepth);
	if(input.indexOf(tc)==0){
		return input.substr(tc.length);
	}
}


Fire.converters={
	'#':{ type:"JSON", code:"j(<INPUT>)" },
	'%':{ type:"URL", code:"encodeURIComponent(<ONPUT>)"},
	'=':{ type:"raw", code:"<INPUT>" }
};

Fire.processCode=function(opts,input){
	//process code just tracks tabdepth
	if(input.code){
		for(var i in input.code){
			var t = input.code[i];
			if(t=='{')
				opts.tabDepth++;
			else if(t=='}')
				opts.tabDepth--;
		}	
	}
	if(input.fsp && Fire.converters[input.e]){
		input.fsp=Fire.removeIndent(input.fsp,opts.tabDepth);
	}
	
	input.code=input.code.trim();
	input.td=opts.tabDepth;

	return input;
}	

Fire.processString=function(opts,input){
	//process string will remove our current tab depth from strings
	var tc=Fire.ts(opts.tabDepth);

	input.string=input.string.split("\n").map(function(t){
		if(t.indexOf(tc)==0){
			t=t.substr(tc.length);
		}
		return t;
	}).join("\n");
	input.td=opts.tabDepth;

	return input;
}

Fire.processNL=function(opts,input){
	input.td=opts.tabDepth;
	return input;
}

Fire.process=function(res){
	var opts={ tabDepth: 0 };
	var ret=[];
	var last=null;
	for(var i in res){
		var input=res[i];
		if(input.string && input.string!=''){
			ret.push(Fire.processString(opts,input));
		} else if(input.code){
			ret.push(Fire.processCode(opts,input));
		} else if(input.nl){
			ret.push(Fire.processNL(opts,input));
		}
	}
	return ret;
}


Fire.optimize=function(res){
	var ret=[];
	var ss=[];
	var td=null;
	var MAX=9007199254740992;
	var lmin=MAX, lmax=0;
	for(var i in res){
		var r = res[i];
		//If it is code
		if(r.code){
			//If there is some stuff in the string buffer let's clear it
			if(ss.length>0){
				ret.push({ string: ss.join(""), td:td, lmin: lmin, lmax:lmax});
				lmin=MAX;lmax=0;
				ss=[];
			}
			ret.push(r);
			//If the code whas an expression then we need to emit a new line
			if(r.e && r.anl){
				//If the new line is on the same tab depth then we can just push it on to the string stack
				if(td==r.td){
					ss.push('\n');
					lmin=Math.min(r.line,lmin);
					lmax=Math.max(r.line,lmax);
				} else {
					//Otherwise if the new line is on a different tab depth let's push out the current string stack
					if(ss.length>0){
						ret.push({ string: ss.join(""), td: td, lmin:lmin, lmax:lmax });
						ss=[];
					}
					//reset the min/max lines
					lmin=Math.min(r.line,MAX);
					lmax=Math.max(r.line,0);
					td=r.td;
					//FIXME this should be moved to process! as it changes the output
					ss.push('\n');
				}	
			}
		} else {
			if(r.block){
				if(ss.length>0){
					ret.push({ string: ss.join(""), td: td, lmin: lmin, lmax:lmax });
				}
				lmin=Math.min(r.line,MAX);
				lmax=Math.max(r.line,0);
				ss=[];
				ret.push({ string: r.string, td: r.td, lmin: lmin, lmax: lmax, block: r.block, ec: r.ec, sc:r.sc });	
			} else {
				//If it is a string and on different tab depths
				if(td!=r.td){
					//Let's clear the string stack
					if(ss.length>0){
						ret.push({ string: ss.join(""), td: td, lmin: lmin, lmax:lmax });
					}
					lmin=Math.min(r.line,MAX);
					lmax=Math.max(r.line,0);
					ss=[];
					td=r.td;
				}
				//Otherwise let's capture the string
				lmin=Math.min(r.line,lmin);
				lmax=Math.max(r.line,lmax);
				if(r.string && r.string.length>0){
					ss.push(r.string);
				} else {
					ss.push(r.nl);
				}
			}
		}
	}
	if(ss.length>0){
		ret.push({ string: ss.join(""), td: td, lmin: lmin, lmax:lmax });
	}
	return ret;
}

/**
	Read blocks from a given string

	Blocks are primarly used as a way to keep modifications from various files. So typically FireTS will read the blocks from the file that is
	about to be overwritten and make sure they aren't modified when the template is rewritten.

	@param {String} input template or generated file containing one or more named blocks
	@returns {Object} hash of blocks

	Example of a block
	
	@example
		//%{header}
			This is a block
		//}%

	Reading the above example would return:

	@example
		{ header:"\n  This is a block\n//"}
	
	@method Fire.readBlocks
*/
Fire.readBlocks=function(input){
	var res = Fire.parser.parse(input);
	res=Fire.process(res);
	var blocks={};
	res.map(function(i){
		if(i.block){
			blocks[i.block]=i.string;
		}
	});
	return blocks;
}

Fire.readCommentsSync=function(file){
	var commentPeg = fs.readFileSync(path.join(__dirname,"../static/comments.pegjs"));
	var parser=PEG.buildParser(commentPeg.toString(),{trackLineAndColumn:true});
	var input = fs.readFileSync(file).toString();
	var comments= parser.parse(input);
	return comments.filter(function(i){
		return (i!='');
	});
}



/**
	Read blocks from a file asynchronously

	@param {String} file The file to read blocks from
	@param {Function} onComplete
		@param {String} onComplete.err The error string
		@param {Object} onComplete.blocks The hash of blocks from file

	@method Fire.readFileBlocks
	@see Fire.readBlocks
*/
Fire.readFileBlocks=function(file,onComplete){
	var infile = fs.readFile(file,function(err,infile){
		if(err) return onComplete(err);
		return onComplete(null,Fire.readFile(infile.toString()));
	});
}

/**
	Read blocks from a file synchronously

	@param {String} file The file to read blocks from
	@return {Object} The hash of blocks from file

	@method Fire.readFileBlocksSync
	@see Fire.readBlocks
*/
Fire.readFileBlocksSync=function(file){
	var infile = fs.readFileSync(file);
	return Fire.readBlocks(infile.toString());
}

/**
	Compile a string into a template

	@param {String} input The template to compile
	@param {Object} opts
		@param {Boolean} opts.source Return the source for the template, not the compiled function
		@param {Boolean} opts.uglify Uglify the source (true by default)
		@param {Boolean} opts.async Generate a template which can load files/snippets asynchronously
	@returns {Function or String} String or compiled template 

	@method Fire.compile
*/
Fire.compile=function(input,opts){
		opts=opts||{};
		var res = Fire.parser.parse(input);
		res = Fire.process(res);
		res = Fire.optimize(res);
		res = Fire.toString(res,{async:opts.async});
		if(opts.source || opts.code){
			if(opts.uglify!==false)
				res=UglifyJS.minify(res,{fromString:true}).code;
			return res;
		}
		eval("var t="+res);
		return t;
}

/**
	Synchronous template function

	@param {Object} input Input for the template
	@param {Object} opts Options for the template
		@param {Object} opts.blocks The blocks to insert into the file
		@param {Function} opts.render The function to call to render the template (When run synchronously)
			@param {String} opts.render.template The name of the template or snippet to render
			@param {String} opts.render.input The inputs to use for the template
			@param {String} opts.render.opts The options for the template

	@returns {String} The result of running the template
	
	@example
		var result = template({ name:"George" },{ 
			render: function(template,input,opts){
				return Fire.compile("<%=xi%>")(input)	
			}	
		});

	@method template (synchronous)
*/

/**
	Asynchronous template function

	@param {Object} input Input for the template
	@param {Object} opts Options for the template
		@param {Object} opts.blocks The blocks to insert into the file
		@param {Function} opts.fetch The function to call to fetch a snippet or template asynchrounsly
			@param {String} opts.fetch.template The name of the template or snippet to render
			@param {Function} opts.fetch.onComplete	The lambda to call when the snippet/template has been loaded
			@param {String} opts.fetch.onComplete.err The returned as a result of loading the template
			@param {Function} opts.fetch.onComplete.template The template function
	@param {Function} onComplete The callback for when the template has been rendered
			@param {String} opts.onComplete.err The returned as a result of loading the template
			@param {String} opts.onComplete.result The result of running the template
			
	@example
		template({name:"hello"},{ 
			fetch: function(template,onComplete){
				Fire.parse(template,{async:true},onComplete);
			}
		},function(err,template){
			console.log("Result",template);
		});

	@method template (asynchronous)
*/

/**
	Simulate the combustion template interface

	The returned functions has the following parameters

	@param {Object} input The input template
	@param {Object} opts The options for the template 
	
	@returns {Function} Function to use for compiling templates

	@example
		var template = Fire.combustion().compile("<%=x%>");
		template({x:5});

	@method Fire.combustion	
*/	
Fire.combustion=function(){
	return function(input,opts){
		opts=opts||{};
		var debug=opts.debug;
		var res = Fire.parser.parse(input);
		res = Fire.process(res);
		res = Fire.optimize(res);
		res = Fire.toString(res,{async:false});
		res=UglifyJS.minify(res,{fromString:true}).code;
		eval("var t="+res);
		t.source=res;
		return t;
	}
}

/**
	Generate a file from a template

	This function will:
	
	* Read the blocks from outFile if it exists
	* Generate a new output file, reusing the blocks from the prior outFile

	@param {String} template the template file
	@param {String} outFile the output file
	@param {Object} input the inputs to the template
	@param {Object} options options for the template (see template)
	
	@returns {String} The result of running the template
	
	@method Fire.generateSync
*/
Fire.generateSync=function(template,outFile,input,opts){
	opts=opts||{};
	if(fs.existsSync(outFile)){
		opts.blocks=opts.blocks||{};
		var blocks=Fire.readFileBlocksSync(outFile);
		for(var i in blocks){
			if(!opts.blocks[i]){
				opts.blocks[i]=blocks[i];
			}
		}
	}
	var templ = Fire.parseSync(template);
	var out = templ(input,opts);
	fs.writeFileSync(outFile,out);
	return out;
}

/**
	Parse a template file synchronously and return a compiled template

	@param {String} file the template file
	@param {Object} opts the options for the compiler

	@return {Function} The compiled template
	
	@method Fire.parseSync
*/
Fire.parseSync=function(file,opts){
	var template = fs.readFileSync(file);
	return Fire.compile(template.toString(),opts);
}

/**
	Parse a template file and return a compiled template

	@param {String} file the template file
	@param {Object} opts the options for the compiler
	@param {Function} onComplete The lambda to be called upon completion
		@param {String} onComplete.err The error	
		@param {Function} onComplete.template  compiled template
	
	@method Fire.parse
*/
Fire.parse=function(file,opts,onComplete){
	fs.readFile(file,function(err,data){
		if(err) return onComplete(err);
		try {
			return onComplete(null,Fire.compile(file,opts));
		} catch(e){
			return onComplete(e);
		}
	});
}

Fire.toString=function(res,opts){
	var s = "";
	opts=opts||{};
	var deps=[];
	var lastLine=-1;
	var last=null;
	res.map(function(input){
		var tc = Fire.ts(input.td);
		if(input.line && opts.lineNumbers){
			if(lastLine!=input.line){
				s+=tc+"<FTSP>o.ls="+"<FTSP>o.le="+input.line+";\n";
			} 
			lastLine=input.line;
		}	else if((input.lmin || input.lmax) && opts.lineNumbers){
			if(input.lmin==input.lmax){
				if(lastLine!=input.lmin){
					s+=tc+"<FTSP>o.ls=<FTSP>o.le="+input.lmin+";\n";
				} 
				lastLine=input.lmin;
			} else {
				s+=tc+"<FTSP>o.ls="+input.lmin+";<FTSP>o.le="+input.lmax+";\n";
			}
		}
		if(input.string){
			if(input.block){
				s+=tc+"<FTSP>e('"+input.sc+"%{"+input.block+"}'+(<FTSP>o.b["+JSON.stringify(input.block)+"]?<FTSP>o.b["+JSON.stringify(input.block)+"]:"+JSON.stringify(input.string)+")+'}%"+input.ec+"');\n";
			} else {
				s+=tc+"<FTSP>e("+JSON.stringify(input.string)+");\n";	
			}	
		} else if(input.code){
			if(input.e){
				if(input.e=="="){
					s+=tc+"<FTSP>e("+JSON.stringify(input.fsp)+"+"+input.code+");\n";
				} else if(input.e=='@'){			
					var code = input.code.trim();
					var cp=code.split(" ");
					var v=null;
					var t="";
					if(cp.length==2){
						if(/^\(.*\)$/.test(cp[1])){
							t=cp[0];
							v=cp[1].replace(/^\(/,"").replace(/\)$/,"").split(",");
							v=v.map(function(i){ return i.trim(); });
						} else {
							throw new Error("Invalid template parameters specified: "+cp[1]);
						}
					} else {
						t=code;
					}
					deps.push(t);	
					if(v){
						v.map(function(i){
							s+=tc+"<FTSP>i["+JSON.stringify(i)+"]="+i+";\n"
						});
					}	
					s+=tc+"<FTSP>e(<FTSP>r("+JSON.stringify(t)+",<FTSP>i,<FTSP>o));\n";
				} else if(input.e=='%'){			
					s+=tc+"<FTSP>e("+JSON.stringify(input.fsp)+"+encodeURIComponent("+input.code+"));\n";
				} else if(input.e=='?'){			
					s+=tc+"if(typeof "+input.code+"!='undefined')";
				}	else if(input.e=='#'){
					s+=tc+"<FTSP>e("+JSON.stringify(input.fsp)+"+<FTSP>j("+input.code+"));\n";
				} else if(input.e=='(') {
					s+=tc+"var <FTSP>t=<FTSP>s;\n";
					s+=tc+"<FTSP>s='';\n";
				} else if(input.e==")"){
					s+=tc+"<FTSP>s=<FTSP>t+<FTSP>s."+input.code+";\n";
				}	
				
			} else {
				s+=tc+input.code;	
			}		
		} 
		last=input;
	});

	s=s.replace(/\<FTSP\>/gm,Fire.prefix);

  //s="function(input,o){ \n\to=o||{};\n\tvar s='',e=(o.e||function(i){ s+=i; }), j=(o.j||JSON.stringify);\n\t\nvar n=function(){ e('\\n') };\nwith(input){\n"+s+"\n\t}\nreturn s;\n};";
	if(Fire.wrapper){
		s=Fire.wrapper({ code:s, async:opts.async, deps: deps});	
	}
	return s;
}

Fire.loadWrapper();

module.exports=Fire;
