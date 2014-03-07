Fire TS
=======

Build Status: [![Build Status](https://travis-ci.org/celer/fire-ts.png)](https://travis-ci.org/celer/fire-ts)

# Introduction

Fire TS is a template engine for generating code. 

 * Designed to generate C, C++, Java, JavaScript, Ruby, Perl, and HTML
 * Tries to generate well formatted code, you can properly indent your templates and fire-ts will remove your extra indention
 * Can update existing generated files with out overwriting everything
 * Designed to be compatible with the combustion template system  

If you want to generate HTML templates you should consider other template engines

## The basics

The syntax for Fire TS looks a lot like JSP, except the base language is JavaScript

```c
<%
	var colors=[ "red","blue","green"];
	var numbers=[1,2,3,5];
%>

#include<stdio.h>

/*%{header}
	
	The text in this 'header' block can be overridden by what is found in the file that wil be overwritten when this file is generated. Allowing the user to edit this bit of comment or code safely without having to worry about loosing his/her changes.

}%*/

//%{prefix}  

//This code will be preserved, even when the template is re-generated!!!
const char *prefix=">";

//}%

char *colors[]={
	<% for(var i in colors){ 
			var color = colors[i];
	%>
		<%# color %>,
	<% } %>
	NULL 
};

int *numbers[]={ 
	<% numbers.map(function(number){ %>
		<%= number %>,
	<% }); %>
	NULL 
};

void main(){
	int i,j;
	for(i=0;colors[i];i++){
		for(j=0;numbers[j];j++){
			printf("%s %s %d\n",prefix,colors[i],numbers[j]);
		}
	}
}

```

And will generate this:

```c
#include<stdio.h>

/*%{header}
	This text was pulled from the file that was gonna be over written.	
}%*/

//%{prefix}
const char *prefix="<";
//}%

char *colors[]={
	"red",
	"blue",
	"green",
	NULL 
};

int *numbers[]={ 
	1,
	2,
	3,
	5,
	NULL 
};

void main(){
	int i,j;
	for(i=0;colors[i];i++){
		for(j=0;numbers[j];j++){
			printf("%s %s %d\n",prefix,colors[i],numbers[j]);
		}
	}
}


```
# Writing templates!

## Well formated templates! 

One of the neat things that Fire TS does is it tries to allow you to both have well formated templates and well formatted output. 
This means that Fire-TS will count the number of opening and closing braces and then remove the appropriates spacing. By default Fire-TS
will look for tabs, although you can set the 'indent' property in the options to change it to spaces, etc. 

Here are some examples:

```c
<% for(var i in items){ %> //tabDepth++
	// This will automatically remove 1 tab from the generated output since we're one set of of braces deep
	int <%= items[i].name %>;
<% } %> //tabDepth--;
// Would generate
int foo;
```

```c
<% for(var i in items){ %>  
		// This will automatically remove 1 tab from the generated output since we're one set of of braces deep,
		int <%= items[i].name %>;
<% } %>
//Would generate
	int foo;
```

```javascript
	//Tell Fire-TS to remove two spaces for each level of indention found
	Fire.parseSync("input.fts",{ indent:"  " });
``

## Evaluating code

Anything in: 

```jsp
<% CODE %> 
```
will be evaluated as JavaScript, and it can even be multi-line

```jsp
Let's do some looping
<%
	for(var i=0;i<3;i++){
		if(i==2){
%>
			i is 2
<%	
		}
	}
%>
```
Which would even track the number of opening and closing braces to properly add and remove tab characters from the output - So your templates and your generated code will look good!

```
Let's do some looping
i is 2
```

If you want to actually indent "i is 2" simply add more tabs to it. 

## Expressions

There are multiple types of expressions

**Raw**


This will just output the value of the variable or expression with no formatting
```jsp
	<!-- Output the raw variable or expression -->
	<%=variable%>
```

**JSON Encoded**

This will output the JSON encoded variable or expression
```jsp
	<!-- Output a JSON encoded value - which works well for 'c' escaped strings  -->
	<%#variable%>
```

**URL Encoded**

This will output a URL escaped string
```jsp
	<!-- Output a URL encoded value  -->
	<%%variable%>
```

## Capturing and modifying the template itself

```jsp

//Will replace Their with There
<%(%>Hello Their <%=name%><%).replace(/Their/,"There")%> 

//Will convert this to lower case 
<%(%>MiXeDcAsE<%).toLowerCase()%>


``` 

Using '<%(%>' and '<%)%>' allows you to capture and modify result of that part of the template as a String and modify it. Here are a few examples:



## Including sub-templates

If you want to nest templates you an do this:

```jsp
	<%@ header.fts %>
```

All the inputs and options pasted to the top template will be passed to the nested templates. If you need to capture variables from one template to the nested templates:

```jsp
	<%@ header.fts (variableA,variableB) %>
```

will capture local variableA and variableB and pass them into the nested template. Fire-TS will call opts.render to resolve the template, so you can back it with something that returns a file or a named snippet

## Blocks

One of the more advanced features of Fire-TS is that it can preserve the contents of the file it is going to over-write. Let's say for example you want to have a SQL file:

```sql
<%
	var colors=[ "red","blue","green"];
	var numbers=[1,2,3,5];
%>


-- %{schema} 

create table colors (
	id bigint auto_increment,
	color varchar(20) not null,
	number bigint not null,
);

-- }%

<% colors.map(function(color){ %>
	<% numbers.map(function(number){ %>
		insert into colors (name) values(<%#color%>,<%=number%>);
	<% }); %>
<% }); %>

```

Fire-TS will see if the file it is about to over-write exists, and look for blocks ( starting with '%{[A-Za-z0-9]+}' and ending with '}%' ) and read them from the old file, and then insert them into the newly written output. Allowing you to preserve certain parts of older files. In the example above it would let you safely modify the schema and have the inserts regenerated each time!


# Embedding

Take a look at bin/fire-ts to get an idea how to use the templating engine, you can install it globally using

```shell
	npm install fire-ts -g
```

You can see embedding examples here: https://github.com/celer/fire-ts/tree/master/examples/embed

# Command line

```shell
./fire-ts
Options:
  --output    File to write (will reload blocks)            
  --template  The template to use                           
  --compile   The template to compile                       
  --input     The input to use to run the template (as JSON)
  --blocks    The blocks to use (as a JSON hash)            
  --compare   Compare the output file to the specified file 
  --uglify    Uglify the compiled template                  
  --debug     Debug   
```

Let's run a template

```shell
./bin/fire-ts --template test/1.fts
```

Let's compile a template

```shell
./bin/fire-ts --compile test/1.fts
```
Results in 

```javascript
function template(_$_i,_$_o,_$_oc){_$_o=_$_o||{},_$_o.b=_$_o.blocks||{};var _$_s="",_$_e=_$_o.e||function(_){_$_s+=_};with(_$_o.j||JSON.stringify,_$_o.render,_$_i)_$_e("Hello\n  1\n  2 \n  3\n  4\n  5\n6\n   6\n 7 8\n   A\n     B\n");return _$_s}
```

## License

  MIT

# API


```js
/**
	Fire Template System

	@module FireTS
	@class Fire
*/


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


/**

	Read blocks from a file asynchronously

	@param {String} file The file to read blocks from
	@param {Function} onComplete
		@param {String} onComplete.err The error string
		@param {Object} onComplete.blocks The hash of blocks from file

	@method Fire.readFileBlocks
	@see Fire.readBlocks

*/


/**

	Read blocks from a file synchronously

	@param {String} file The file to read blocks from
	@return {Object} The hash of blocks from file

	@method Fire.readFileBlocksSync
	@see Fire.readBlocks

*/


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


/**

	Parse a template file synchronously and return a compiled template

	@param {String} file the template file
	@param {Object} opts the options for the compiler

	@return {Function} The compiled template
	
	@method Fire.parseSync

*/


/**

	Parse a template file and return a compiled template

	@param {String} file the template file
	@param {Object} opts the options for the compiler
	@param {Function} onComplete The lambda to be called upon completion
		@param {String} onComplete.err The error	
		@param {Function} onComplete.template  compiled template
	
	@method Fire.parse

*/


```
