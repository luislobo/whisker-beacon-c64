.cpu "6502"

* = $0801
    .word basic_end
    .word 10
    .byte $9e
    .text "2064"
    .byte 0
basic_end:
    .word 0
* = $0810
entry:
    sei
    cld
    ldx #$ff
    txs
    lda #$7f
    sta $dc0d
    sta $dd0d
    lda $dc0d
    lda $dd0d
    lda #$35
    sta $01
    lda #0
    sta $d015
    sta $d020
    sta $d021
    sta $d01a
    lda #$1b
    sta $d011
    lda #$08
    sta $d016
    lda #$17
    sta $d018
    ldx #0
clear_screen:
    lda #32
    .for page := 0, page < 4, page += 1
        sta $0400 + page * 256,x
    .endfor
    lda #13
    .for page := 0, page < 4, page += 1
        sta $d800 + page * 256,x
    .endfor
    inx
    bne clear_screen
    ldx #title_end-title-1
show_title:
    lda title,x
    sta $059d,x
    dex
    bpl show_title
idle:
    jmp idle

title:
    .byte 2,18,1,13,2,12,5,32,2,5,1,3,15,14
title_end:
