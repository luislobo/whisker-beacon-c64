PATROLS = 3
PATROL_Y = 172

init_patrols:
    ldx #PATROLS-1
patrol_init_loop:
    lda patrol_start,x
    sta patrol_x,x
    lda #0
    sta patrol_dir,x
    lda #CAT_SHAPE+4
    sta $07f9,x
    sta $2bf9,x
    lda #15
    sta $d028,x
    dex
    bpl patrol_init_loop
    lda #15
    sta $d01c
    rts

step_patrols:
    ldx #PATROLS-1
next_patrol:
    lda game_ticks
    and #1
    bne check_patrol_contact
    lda patrol_dir,x
    bne patrol_left
    inc patrol_x,x
    lda patrol_x,x
    cmp patrol_end,x
    bcc check_patrol_contact
    inc patrol_dir,x
    bne check_patrol_contact
patrol_left:
    dec patrol_x,x
    lda patrol_x,x
    cmp patrol_start,x
    bcs check_patrol_contact
    dec patrol_dir,x
check_patrol_contact:
    lda player_y
    cmp #160
    bcc patrol_done
    cmp #184
    bcs patrol_done
    lda player_x
    sec
    sbc patrol_x,x
    tay
    lda player_x+1
    sbc patrol_page,x
    beq patrol_ahead
    cmp #$ff
    bne patrol_done
    cpy #243
    bcs touched_cat
    bcc patrol_done
patrol_ahead:
    cpy #14
    bcc touched_cat
patrol_done:
    dex
    bpl next_patrol
    rts
touched_cat:
    jmp reset_player

present_patrols:
    lda #1
    sta sprite_enable
    lda $d010
    and #1
    sta sprite_msb
    ldx #PATROLS-1
place_patrol:
    lda patrol_x,x
    sec
    sbc camera_x
    sta patrol_offset
    lda patrol_page,x
    sbc camera_x+1
    cmp #2
    bcs patrol_outside
    tay
    lda patrol_offset
    clc
    adc #31
    sta patrol_offset
    tya
    adc #0
    cmp #2
    bcs patrol_outside
    cmp #1
    bne patrol_low
    lda patrol_offset
    cmp #88
    bcs patrol_outside
patrol_high:
    lda sprite_msb
    ora patrol_mask,x
    sta sprite_msb
patrol_low:
    ldy patrol_reg,x
    lda patrol_offset
    sta $d002,y
    lda #PATROL_Y+51
    sta $d003,y
    lda sprite_enable
    ora patrol_mask,x
    sta sprite_enable
patrol_outside:
    dex
    bpl place_patrol
    lda sprite_msb
    sta $d010
    lda sprite_enable
    sta $d015
    rts

patrol_start:
    .byte <337,<450,<798
patrol_end:
    .byte <369,<493,<851
patrol_page:
    .byte >337,>450,>798
patrol_mask:
    .byte 2,4,8
patrol_reg:
    .byte 0,2,4
