.cpu "6502"
.include "state.asm"
.include "../build/map.inc"

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
    ldx #state_end
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
    jsr detect_video
    jsr show_title
    jsr init_cat_sprite
    jsr start_game
    ; A held C or Up belongs to the title until it is released.
    lda input_bits
    and #CHANGE_CAT
    sta wardrobe_keys
    jsr init_view
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
    jsr present_cat_charm
    jsr animate_objectives
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
    jsr remember_player
    jsr step_game
    jsr animate_cat
    jmp update_view
wait_next_video:
    sta logic_clock
update_view:
    jsr prepare_view
leave_raster:
    lda $d012
    cmp #250
    beq leave_raster
    jmp idle

.include "sprites.asm"
.include "wardrobe.asm"
.include "cat-charms.asm"
.include "view.asm"
.include "motion.asm"
.include "clock.asm"
.include "controls.asm"
.include "player.asm"
.include "jump.asm"
.include "slide.asm"
.include "patrols.asm"
.include "encounters.asm"
.include "greenhouse-actors.asm"
.include "checkpoints.asm"
.include "objective.asm"
.include "pickup-background.asm"
.include "objective-ink.asm"
.include "levels.asm"
.include "greenhouse.asm"
.include "music.asm"
.include "sfx.asm"
.include "results.asm"

.cerror * > BRASS_TUCK_SPRITES, "Game code overlaps the tucked bell sprites"

* = BRASS_TUCK_SPRITES
    .binary "../build/charms.bin", 14*64, 6*64
.cerror * > SCREEN_B, "Tucked bell and glint sprites overlap the second screen buffer"

* = CHARM_SPRITES
    .binary "../build/charms.bin", 0, 14*64
.cerror * > $3000, "Charms overlap the VIC charset"

* = $3000
    .binary "../build/tiles.bin"

* = $3800
    .binary "../build/actors.bin"
.cerror * > CAT_CACHE, "Actors overlap the current cat sprite frames"


* = $4000
garden_source:
    .binary "../build/garden.bin"
garden_colors:
    .binary "../build/garden-colors.bin"


greenhouse_source:
    .binary "../build/greenhouse.bin"
greenhouse_colors:
    .binary "../build/greenhouse-colors.bin"

cat_look_bits:
    .binary "../build/cat-looks.bin"

.cerror * > LEVEL_MAP, "Packed levels overlap working map"
.cerror LEVEL_MAP + MAP_STRIDE*25 > $d000, "Working map overlaps I/O"

; Load the intro into the future level map. It is only needed before start_game.
; Keep VIC data below the character ROM window at $9000.
* = TITLE_NAMES
    .binary "../build/title-names.bin"
.cerror * != TITLE_NAMES+CAT_LOOKS*TITLE_NAME_BYTES, "Title name art must match the cat roster"
.cerror * > TITLE_SPRITES, "Title name art overlaps its sprites"
* = TITLE_SPRITES
    .binary "../build/title-sprites.bin"
.cerror * != TITLE_SPRITES+(CAT_LOOKS*2+3)*64, "Title sprites must match the cat roster"
.cerror * > TITLE_SCREEN, "Title sprites overlap the screen"
* = TITLE_SCREEN
    .binary "../build/title-screen.bin"
.cerror * > TITLE_COLORS, "Title screen overlaps the palette"
* = TITLE_COLORS
    .binary "../build/title-color.bin"
.cerror * > TITLE_COLORS+$400, "Title palette overlaps title code"
* = TITLE_COLORS+$400
    .include "title.asm"
    .include "title-music.asm"
    .include "../build/wet-glass.inc"
.cerror * > TITLE_BITMAP, "Title code overlaps the bitmap"
* = TITLE_BITMAP
    .binary "../build/title-bitmap.bin"
.cerror * > $c000, "Title bitmap exceeds its VIC bank"

WET_GLASS_FRAMES = $c000
* = WET_GLASS_FRAMES
    .binary "../build/wet-glass.bin"
.cerror * > $d000, "Wet glass frames overlap I/O"
