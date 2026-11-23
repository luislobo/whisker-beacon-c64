CAT_SHAPE = $3800 / 64

init_cat_sprite:
    lda #CAT_SHAPE
    sta $07f8
    sta $2bf8
    lda #8
    sta $d025
    lda #9
    sta $d026
    lda #1
    sta $d027
    sta $d01c
    sta $d015
    lda #0
    sta $d010
    sta $d017
    sta $d01b
    sta $d01d
    lda #148
    sta $d000
    lda #161
    sta $d001
    rts

present_cat:
    lda draw_player_x
    sec
    sbc camera_x
    sta sprite_x
    lda draw_player_x+1
    sbc camera_x+1
    tax
    lda sprite_x
    clc
    adc #31
    sta $d000
    txa
    adc #0
    sta $d010
    lda draw_player_y
    clc
    adc #51
    sta $d001
    lda low_profile
    beq cat_walk_pose
    lda #5
    bne cat_pose
cat_walk_pose:
    lda input_bits
    and #(MOVE_LEFT | MOVE_RIGHT)
    beq cat_still
    lda game_ticks
    and #4
    lsr
    bne cat_pose
cat_still:
    lda #0
cat_pose:
    clc
    adc facing_left
    adc #CAT_SHAPE
    sta $07f8
    sta $2bf8
    rts
