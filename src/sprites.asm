CAT_SHAPE = $3800 / 64
CAT_CACHE = $3b00
CAT_POINTER = CAT_CACHE / 64
BLANK_CAT_SPRITE = $2f80
CAT_RUN_CACHE = $0200       ; KERNAL workspace, reclaimed after banking out ROM.
CAT_RUN_LAST = $2780
CAT_RUN_HOLD = 3            ; Shared 50 Hz simulation ticks per pose.
.cerror CAT_RUN_CACHE+(CAT_RUN_EXTRA-1)*128 > SCREEN_A, "Run frames overlap screen A"
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
    ldy recovery_ticks
    beq place_cat_y
    jsr recovery_draw_y
place_cat_y:
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
    lda brass_flash_ticks
    beq record_pose_ticks
    dec brass_flash_ticks
record_pose_ticks:
    lda cat_pose_ticks
    beq cat_transition_done
    dec cat_pose_ticks
cat_transition_done:
    rts

animate_cat:
    ldy recovery_ticks
    beq animate_live_cat
    jmp animate_recovery
animate_live_cat:
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
    lda player_x
    cmp prior_player_x
    bne cat_running
cat_idle:
    lda game_ticks
    and #$18
    cmp #$18
    bne cat_still
    jsr nearby_cat_clue
    bcc cat_still
    lda #POSE_CLUE
    bne cat_pose
cat_still:
    lda #POSE_STAND
    beq cat_pose
cat_running:
    ldx cat_run_tick
    lda cat_run_frames,x
    inx
    cpx #cat_run_frames_end-cat_run_frames
    bcc next_run_tick
    ldx #0
next_run_tick:
    stx cat_run_tick
    clc
    adc facing_left
    sta cat_frame
    rts
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
    lda #0
    sta cat_run_tick
    rts

cat_run_frames:
    .fill CAT_RUN_HOLD,CAT_POINTER+POSE_STRIDE
    .for frame := 0, frame < CAT_RUN_EXTRA-1, frame += 1
        .fill CAT_RUN_HOLD,CAT_RUN_CACHE/64+frame*2
    .endfor
    .fill CAT_RUN_HOLD,CAT_RUN_LAST/64
cat_run_frames_end:
