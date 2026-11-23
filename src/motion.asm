remember_player:
    lda player_x
    sta prior_player_x
    lda player_x+1
    sta prior_player_x+1
    lda player_y
    sta prior_player_y
    rts

prepare_view:
    lda player_x
    sta draw_player_x
    lda player_x+1
    sta draw_player_x+1
    lda player_y
    sta draw_player_y

    ; PAL already draws one picture per simulation step. NTSC divides each
    ; 50 Hz step across its 60 Hz refreshes by blending the last two positions.
    lda refresh_rate
    cmp #60
    bne track_cat
    ldx logic_clock
    lda blend_phases,x
    sta blend_index

    lda player_x
    sec
    sbc prior_player_x
    tax
    lda player_x+1
    sbc prior_player_x+1
    beq x_blend_positive
    cmp #$ff
    bne blend_height
    cpx #241
    bcc blend_height
    bcs blend_x
x_blend_positive:
    cpx #16
    bcs blend_height
blend_x:
    txa
    jsr scale_displacement
    ldx #0
    cmp #$80
    bcc write_projected_x
    dex
write_projected_x:
    clc
    adc prior_player_x
    sta draw_player_x
    txa
    adc prior_player_x+1
    sta draw_player_x+1

blend_height:
    lda player_y
    sec
    sbc prior_player_y
    cmp #16
    bcc blend_y
    cmp #241
    bcc view_done
blend_y:
    jsr scale_displacement
    clc
    adc prior_player_y
    sta draw_player_y
view_done:
    jmp track_cat

scale_displacement:
    cmp #$80
    bcc scale_magnitude
    eor #$ff
    clc
    adc #1
    jsr scale_magnitude
    eor #$ff
    clc
    adc #1
    rts
scale_magnitude:
    ora blend_index
    tax
    lda blend_distances,x
    rts

blend_phases:
    .for phase := 0, phase < 6, phase += 1
        .fill 10,phase*16
    .endfor
blend_distances:
    .for part := 0, part < 6, part += 1
        .for pixels := 0, pixels < 16, pixels += 1
            .byte (part*pixels+3)/6
        .endfor
    .endfor
