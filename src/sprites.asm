CAT_SHAPE = $3800 / 64
CAT_CACHE = $3b00
CAT_POINTER = CAT_CACHE / 64
.cerror CAT_CACHE + CAT_POSES * 128 > $4000, "Cat sprite frames exceed the VIC bank"

init_cat_sprite:
    jsr load_cat_look
    lda #CAT_POINTER
    sta cat_frame
    sta $07f8
    sta $2bf8
    lda #11
    sta $d025
    lda #1
    sta $d026
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
    lda cat_frame
    sta $07f8
    sta $2bf8
    rts

record_cat_transition:
    lda facing_left
    sta facing_before
    lda grounded
    sta ground_before
    lda cat_pose_ticks
    beq cat_transition_done
    dec cat_pose_ticks
cat_transition_done:
    rts

animate_cat:
    lda beacon_lit
    bne cat_sitting
    lda low_profile
    bne cat_sliding
    lda cat_pose_ticks
    beq cat_check_air
    lda cat_reaction
    cmp #POSE_SPARK
    beq cat_pose
cat_check_air:
    lda grounded
    beq cat_airborne
    lda ground_before
    beq cat_landing
    lda facing_left
    cmp facing_before
    bne cat_turning
    lda cat_pose_ticks
    bne cat_keep_reaction
    lda input_bits
    and #(MOVE_LEFT | MOVE_RIGHT)
    beq cat_still
    lda game_ticks
    and #4
    bne cat_striding
cat_still:
    lda #POSE_STAND
    beq cat_pose
cat_striding:
    lda #POSE_STRIDE
    bne cat_pose
cat_turning:
    lda #POSE_TURN
    bne cat_start_reaction
cat_landing:
    lda #POSE_LANDING
cat_start_reaction:
    sta cat_reaction
    ldx #4
    stx cat_pose_ticks
    bne cat_pose
cat_keep_reaction:
    lda cat_reaction
    jmp cat_pose
cat_airborne:
    lda y_speed
    bmi cat_launching
    lda #POSE_AIR
    bne cat_pose
cat_launching:
    lda #POSE_LAUNCH
    bne cat_pose
cat_sliding:
    lda #POSE_SLIDE
    bne cat_pose
cat_sitting:
    lda #POSE_SIT
cat_pose:
    clc
    adc facing_left
    adc #CAT_POINTER
    sta cat_frame
    rts
