SFX_CAT = 1
SFX_MITE = 2
SFX_ACORN = 3
SFX_OWL = 4
SFX_BELL = 5
SFX_LANTERN = 6
SFX_SLIDE = 7
SFX_BOARDS = 8

; Borrow voice 3 for a short cue. The melody and bass keep playing.
update_sfx:
    ldx sfx_event
    beq continue_sfx
    lda #0
    sta sfx_event
    sta $d412
    lda sfx_duration-1,x
    sta sfx_ticks
    lda sfx_note-1,x
    clc
    adc music_bank
    tay
    lda pitch_low,y
    sta $d40e
    lda pitch_high,y
    sta $d40f
    lda sfx_wave-1,x
    sta $d412
    rts
continue_sfx:
    lda sfx_ticks
    beq sfx_done
    dec sfx_ticks
    bne sfx_done
    lda #0
    sta $d412
sfx_done:
    rts

sfx_note:
    .byte 81,54,67,71,88,76,45,38
sfx_duration:
    .byte 6,5,7,8,11,10,4,7
sfx_wave:
    .byte $11,$81,$41,$21,$11,$21,$81,$81
