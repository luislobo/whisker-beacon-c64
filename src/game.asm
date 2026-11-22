.cpu "6502"
.include "state.asm"

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
    lda $dd02
    ora #3
    sta $dd02
    lda $dd00
    ora #3
    sta $dd00
    lda #$1b
    sta $d011
    lda #6
    sta $d022
    lda #9
    sta $d023
    ldx #$3f
    lda #0
clear_state:
    sta $00,x
    dex
    cpx #1
    bne clear_state
    ldx #0
clear_screen:
    lda #0
    .for page := 0, page < 4, page += 1
        sta $0400 + page * 256,x
        sta $2800 + page * 256,x
    .endfor
    lda #13
    .for page := 0, page < 4, page += 1
        sta $d800 + page * 256,x
    .endfor
    inx
    bne clear_screen
    ldx #39
hud_colors:
    lda #1
    sta $d800,x
    dex
    bpl hud_colors
    ldx #title_end-title-1
show_title:
    lda title,x
    sta $0404,x
    sta $2804,x
    dex
    bpl show_title
    ldx #39
moon_colors:
    lda #15
    sta $d800+5*40,x
    dex
    bpl moon_colors
    jsr reset_player
    jsr init_cat_sprite
    jsr init_patrols
    jsr init_view
    jsr detect_video
idle:
    lda $d012
    cmp #250
    bne idle
frame_present:
    jsr present_view
    jsr present_cat
    jsr present_patrols
    inc video_ticks
    lda logic_clock
    clc
    adc #50
    cmp refresh_rate
    bcc wait_next_video
    sbc refresh_rate
    sta logic_clock
    inc game_ticks
    jsr read_controls
controls_ready:
    jsr step_player
    jsr step_patrols
    jsr track_cat
    jmp leave_raster
wait_next_video:
    sta logic_clock
leave_raster:
    lda $d012
    cmp #250
    beq leave_raster
    jmp idle

.include "sprites.asm"
.include "view.asm"
.include "clock.asm"
.include "controls.asm"
.include "player.asm"
.include "patrols.asm"

title:
    .text "WHISKER BEACON"
title_end:

* = $3000
    .binary "../build/tiles.bin"

* = $3800
    .binary "../build/cats.bin"


* = $4000
level_map:
    .binary "../build/garden.bin"
