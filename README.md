Fire TS
=======

## Introduction

Fire TS is a template engine for generating code. 

 * Designed to generate C, C++, Java, JavaScript, Ruby, Perl, HTML
 * Tries to generate well formated code
 * Can update existing generated files with out overwriting everything
 * Designed to be compatible with the cumbustion template system  

If you want to generate HTML templates you should consider other template engines

## Guide

The syntax for Fire TS looks alot like JSP:

```jsp
char *models=[
<% 
	var models=["Gold","Silver","Bronze","Rusty"];
	for(var i in models) { 
	var model = models[i];
%>
	"<%#model%>",
<% } <%>
];

``jsp




 
