" Vim syntax file
" Language: Fire TS
" Maintainer: celer
" Latest Version: April 2013

if exists("b:current_syntax")
	finish
endif

if version < 600
  source <sfile>:p:h/objc.vim
else
  runtime! syntax/objc.vim
endif
unlet b:current_syntax

source fts_common.vim

let b:current_syntax = "ftsm"
