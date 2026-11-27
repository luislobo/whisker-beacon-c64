RECOVERY_DURATION = 24             ; 480 ms on the shared 50 Hz clock.
FALL_Y = 200 - CAT_FOOT - 1        ; The last screen pixel beneath the feet.

recover_player:
    lda #RECOVERY_DURATION
    sta recovery_ticks
    lda #0
    sta slide_ticks
    lda recoveries
    cmp #99
    beq recovery_started
    inc recoveries
recovery_started:
    rts

recovery_draw_y:
    lda player_y
    cmp #FALL_Y
    bcc recoil_draw_y
    lda #RECOVERY_DURATION
    sec
    sbc recovery_ticks
    cmp #8
    bcc place_recovery_sprite
    lda #8
    bne place_recovery_sprite
recoil_draw_y:
    lda recoil_offsets-1,y
place_recovery_sprite:
    clc
    adc player_y
    rts

animate_recovery:
    cpy #7
    bcc hide_recovery_cat
    lda #POSE_AIR
    cpy #13
    bcs recovery_pose
    ldx player_y
    cpx #FALL_Y
    bcs recovery_pose
    lda #POSE_SLIDE
recovery_pose:
    jmp cat_pose
hide_recovery_cat:
    lda #BLANK_CAT_SPRITE/64
    sta cat_frame
    rts

; Lift the cat on impact, then let it settle into the curled pose.
recoil_offsets:
    .char 0,0,0,0,0,0,0,0,0,-1,-2,-3,-5,-7,-9,-10,-11,-11,-10,-9,-7,-5,-3,0
.cerror * - recoil_offsets != RECOVERY_DURATION, "Recovery offsets must match the timer"
