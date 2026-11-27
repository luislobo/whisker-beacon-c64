CHARM_SPRITES = $2c00
CHARM_POINTER = CHARM_SPRITES / 64
RIBBON_UNLOCK = 1
BRASS_UNLOCK = 2
BRASS_POINTER = CHARM_POINTER+2
BRASS_BACK = 0
BRASS_UPRIGHT = 2
BRASS_FORWARD = 4
BRASS_TUCK_SPRITES = $2600
BRASS_TUCK_POINTER = BRASS_TUCK_SPRITES/64
BRASS_GLINT = BRASS_TUCK_POINTER+4

present_cat_charm:
    lda recovery_ticks
    bne charm_done
    lda cat_charm
    beq charm_done
    cmp #2
    beq present_brass
    ldx low_profile
    bne charm_done
    lda #3
    sta $d02c
    lda facing_left
    clc
    adc #CHARM_POINTER
    sta SCREEN_A+$3fd
    sta SCREEN_B+$3fd
    lda $d000
    sta $d00a
    lda $d001
    sec
    sbc #8
    sta $d00b
    ldy #$20
enable_charm_sprites:
    ; The charm layers share the cat's X origin. Keep the patrol bits.
    lda sprite_msb
    and #1
    beq charm_enable
    tya
    ora sprite_msb
    sta $d010
charm_enable:
    tya
    ora sprite_enable
    sta $d015
charm_done:
    rts

present_brass:
    ; Each swing has a right-facing pair followed by a left-facing pair.
    ldx low_profile
    bne use_tucked_brass
    jsr brass_swing
    txa
    ora facing_left
    asl
    clc
    adc #BRASS_POINTER
    bne place_brass_frames
use_tucked_brass:
    lda facing_left
    asl
    clc
    adc #BRASS_TUCK_POINTER
place_brass_frames:
    sta SCREEN_A+$3fd
    sta SCREEN_B+$3fd
    clc
    adc #1
    sta SCREEN_A+$3fe
    sta SCREEN_B+$3fe
    lda #7
    sta $d02c
    lda #9
    sta $d02d
    lda $d000
    sta $d00a
    sta $d00c
    ldx #0
    ldy low_profile
    beq place_brass_y
    ldx #1
    lda slide_ticks
    cmp #SLIDE_DURATION-4
    bcc place_brass_y
    sbc #SLIDE_DURATION-5
    tax
place_brass_y:
    lda $d001
    clc
    adc brass_y_offsets,x
    sta $d00b
    sta $d00d
    ldy #$60
    ldx brass_flash_ticks
    beq enable_charm_sprites
    sec
    sbc #3
    sta $d00f
    lda $d000
    sta $d00e
    lda facing_left
    clc
    adc #BRASS_GLINT
    sta SCREEN_A+$3ff
    sta SCREEN_B+$3ff
    lda #1
    sta $d02e
    ldy #$e0
    jmp enable_charm_sprites

brass_swing:
    ldx #BRASS_UPRIGHT
    lda beacon_lit
    bne brass_swing_done
    lda grounded
    beq brass_in_air
    lda cat_frame
    and #$fe
    cmp #(CAT_POINTER+POSE_LANDING)
    beq brass_tilt_forward
    lda player_x
    cmp prior_player_x
    beq brass_swing_done
    lda game_ticks
    lsr
    and #7
    tay
    ldx brass_run_swing,y
brass_swing_done:
    rts
brass_in_air:
    lda y_speed
    bmi brass_tilt_back
brass_tilt_forward:
    ldx #BRASS_FORWARD
    rts
brass_tilt_back:
    ldx #BRASS_BACK
    rts

brass_run_swing:
    .byte BRASS_UPRIGHT,BRASS_BACK,BRASS_BACK,BRASS_UPRIGHT
    .byte BRASS_FORWARD,BRASS_FORWARD,BRASS_UPRIGHT,BRASS_UPRIGHT
brass_y_offsets:
    .char -9,0,-2,-4,-7

award_ribbon:
    lda level_index
    bne charm_award_done
    lda cat_unlocks
    and #RIBBON_UNLOCK
    bne charm_award_done
    lda cat_unlocks
    ora #RIBBON_UNLOCK
    sta cat_unlocks
    lda #1
    sta cat_charm
    rts

award_brass_charm:
    lda level_index
    beq charm_award_done
    lda cat_unlocks
    and #BRASS_UNLOCK
    bne charm_award_done
    ldx #CACHE_FLIES-1
find_cache_fly:
    tya
    cmp cache_fly_lo,x
    bne next_cache_fly
    lda cell_ptr+1
    cmp cache_fly_hi,x
    beq equip_brass_charm
next_cache_fly:
    dex
    bpl find_cache_fly
charm_award_done:
    rts
equip_brass_charm:
    lda cat_unlocks
    ora #BRASS_UNLOCK
    sta cat_unlocks
    lda #2
    sta cat_charm
    lda #6                  ; 120 ms at the shared 50 Hz game clock.
    sta brass_flash_ticks
    ldx #HINT_BRASS
    jmp show_objective_hint

nearby_cat_clue:
    ldx level_index
    lda clue_end,x
    sta cat_copy_count
    lda clue_start,x
    tax
find_clue:
    cpx cat_copy_count
    beq no_clue
    lda player_x
    sec
    sbc clue_x_lo,x
    sta sprite_x
    lda player_x+1
    sbc clue_x_hi,x
    beq clue_on_left
    cmp #$ff
    bne next_clue
    lda sprite_x
    cmp #192
    bcc next_clue
    bcs check_clue_tile
clue_on_left:
    lda sprite_x
    cmp #64
    bcs next_clue
check_clue_tile:
    lda clue_tile_lo,x
    sta cell_ptr
    lda clue_tile_hi,x
    sta cell_ptr+1
    ldy #0
    lda (cell_ptr),y
    cmp #BLUE_FLY_TILE
    beq clue_found
next_clue:
    inx
    bne find_clue
no_clue:
    clc
    rts
clue_found:
    sec
    rts

charm_bits:
    .byte 0,RIBBON_UNLOCK,BRASS_UNLOCK

.include "../build/cat-routes.inc"
