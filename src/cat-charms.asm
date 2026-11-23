CHARM_SPRITES = $2c00
CHARM_POINTER = CHARM_SPRITES / 64
RIBBON_UNLOCK = 1
BRASS_UNLOCK = 2

present_cat_charm:
    ldx cat_charm
    beq charm_done
    lda low_profile
    bne charm_done
    lda charm_color,x
    sta $d02c
    txa
    asl
    clc
    adc facing_left
    adc #(CHARM_POINTER-2)
    sta SCREEN_A+$3fd
    sta SCREEN_B+$3fd
    lda $d000
    sta $d00a
    lda $d001
    sta $d00b
    lda $d010
    and #1
    beq charm_enable
    lda $d010
    ora #$20
    sta $d010
charm_enable:
    lda $d015
    ora #$20
    sta $d015
charm_done:
    rts

award_ribbon:
    lda level_index
    bne charm_done
    lda cat_unlocks
    and #RIBBON_UNLOCK
    bne charm_done
    lda cat_unlocks
    ora #RIBBON_UNLOCK
    sta cat_unlocks
    lda #1
    sta cat_charm
    rts

award_brass_charm:
    lda level_index
    beq charm_done
    lda cat_unlocks
    and #BRASS_UNLOCK
    bne charm_done
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
    rts
equip_brass_charm:
    lda cat_unlocks
    ora #BRASS_UNLOCK
    sta cat_unlocks
    lda #2
    sta cat_charm
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
charm_color:
    .byte 0,3,7

.include "../build/cat-routes.inc"
