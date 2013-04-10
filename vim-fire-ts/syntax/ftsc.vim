" Vim syntax file
" Language: Fire TS
" Maintainer: celer
" Latest Version: April 2013

if exists("b:current_syntax")
	finish
endif

if version < 600
  source <sfile>:p:h/c.vim
else
  runtime! syntax/c.vim
endif
unlet b:current_syntax

runtime syntax/fts_common.vim

let b:current_syntax = "ftsc"
