init_title_music:
    jsr init_music
    lda #3
    sta $d403
    lda #$08
    sta $d405
    lda #$56
    sta $d406
    lda #$15
    sta $d40c
    lda #$65
    sta $d40d
    lda #$28
    sta $d413
    lda #$35
    sta $d414
    rts

stop_title_music:
    lda #0
    sta $d404
    sta $d40b
    sta $d412
    sta music_beat
    rts

; Reuse the gameplay pitch tables and the PAL/NTSC 50 Hz clock.
title_voice .macro notes, base, wave
    lda \notes,x
    beq voice_done
    clc
    adc music_bank
    tay
    lda pitch_low,y
    sta \base
    lda pitch_high,y
    sta \base+1
    lda #\wave
    sta \base+4
voice_done:
    .endmacro

title_music_tick:
    ldx music_beat
    cpx #TITLE_CUE_BEATS
    bcs title_cue_done
    dec music_period
    beq title_cue_note
    lda music_period
    cmp #3
    bne title_cue_done
    jmp release_voices
title_cue_note:
    lda title_note_length,x
    sta music_period
    #title_voice title_lead,$d400,$41
    #title_voice title_bass,$d407,$11
    #title_voice title_echo,$d40e,$11
    inc music_beat
title_cue_done:
    rts

; D minor lantern motif. The two rests give the last chord time to decay.
title_note_length:
    .byte 8,8,12,8,12,8,10,8,20,12,10
TITLE_CUE_BEATS = *-title_note_length
title_lead:
    .byte 74,77,81,84,82,81,77,76,74,0,0
title_bass:
    .byte 38,0,45,0,34,0,41,45,38,0,0
title_echo:
    .byte 65,0,72,0,65,0,69,67,65,0,0
