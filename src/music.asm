init_music:
    lda #11
    sta $d418
    lda #$18
    sta $d405
    lda #$a5
    sta $d406
    lda #$16
    sta $d40c
    lda #$98
    sta $d40d
    lda #$24
    sta $d413
    lda #$67
    sta $d414
    lda #0
    sta $d402
    sta $d417
    sta $d410
    lda #6
    sta $d403
    sta $d411
    lda refresh_rate
    cmp #60
    bne music_first_note
    lda #96
    sta music_bank
music_first_note:
    lda #1
    sta music_period
    rts

; One call per 50 Hz game step. Both video standards use the same tempo.
sid_tick:
    inc sid_tick_count
    jsr update_sfx
    dec music_period
    beq music_note
    lda music_period
    cmp #2
    beq release_voices
    rts
release_voices:
    lda #$40
    sta $d404
    lda #$10
    sta $d40b
    lda sfx_ticks
    bne release_done
    lda #$20
    sta $d412
release_done:
    rts
music_note:
    lda #7
    sta music_period
    ldx music_beat
    lda melody,x
    beq music_bass
    clc
    adc music_bank
    tay
    lda pitch_low,y
    sta $d400
    lda pitch_high,y
    sta $d401
    lda #$41
    sta $d404
music_bass:
    lda bass,x
    beq music_harmony
    clc
    adc music_bank
    tay
    lda pitch_low,y
    sta $d407
    lda pitch_high,y
    sta $d408
    lda #$11
    sta $d40b
music_harmony:
    lda sfx_ticks
    bne music_advance
    lda harmony,x
    beq music_advance
    clc
    adc music_bank
    tay
    lda pitch_low,y
    sta $d40e
    lda pitch_high,y
    sta $d40f
    lda #$21
    sta $d412
music_advance:
    inx
    txa
    and #31
    sta music_beat
    rts

.include "../build/score.inc"
