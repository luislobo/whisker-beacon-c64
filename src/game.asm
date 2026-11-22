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
    inx
    bne clear_screen
    jsr init_colors
    jsr init_cat_sprite
    jsr start_game
    jsr init_view
    jsr detect_video
    jsr init_music
    cli
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
    jsr sid_tick
    jsr read_controls
controls_ready:
    jsr step_game
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
.include "checkpoints.asm"
.include "objective.asm"
.include "music.asm"

* = $3000
    .binary "../build/tiles.bin"

* = $3800
    .binary "../build/cats.bin"


* = $4000
garden_source:
    .binary "../build/garden.bin"
garden_colors:
    .binary "../build/garden-colors.bin"
