PATROLS = 3
PATROL_Y = 172

init_patrols:
    lda #0
    ldx #3
clear_actor_delays:
    sta actor_delay,x
    dex
    bpl clear_actor_delays
    sta owl_phase
    sta acorn_grace
    sta sfx_event
    ldx #PATROLS-1
patrol_init_loop:
    lda patrol_start,x
    sta patrol_x,x
    lda #0
    sta patrol_dir,x
    lda patrol_page,x
    sta actor_page,x
    lda #PATROL_Y
    sta actor_y,x
    lda #CAT_SHAPE+4
    sta $07f9,x
    sta $2bf9,x
    lda #15
    sta $d028,x
    dex
    bpl patrol_init_loop
    lda level_index
    beq garden_patrols_ready
    jmp init_greenhouse_actors
garden_patrols_ready:
    lda #7
    sta actor_live
    lda #15
    sta $d01c
    rts

step_patrols:
    lda level_index
    beq step_garden_patrols
    jmp step_greenhouse_actors
step_garden_patrols:
    ldx #PATROLS-1
next_patrol:
    lda actor_delay,x
    beq walking_patrol
    dec actor_delay,x
    bne patrol_done
walking_patrol:
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
    jsr ground_actor_contact
    bcs touched_cat
patrol_done:
    dex
    bpl next_patrol
    rts
touched_cat:
    lda slide_strike
    beq patrol_hit_player
    lda #55
    sta actor_delay,x
    lda #SFX_CAT
    sta sfx_event
    jmp patrol_done
patrol_hit_player:
    jmp recover_player

ground_actor_contact:
    lda player_y
    cmp #160
    bcc actor_apart
    cmp #184
    bcs actor_apart
actor_same_column:
    lda player_x
    sec
    sbc patrol_x,x
    tay
    lda player_x+1
    sbc actor_page,x
    beq actor_to_left
    cmp #$ff
    bne actor_apart
    cpy #243
    rts
actor_to_left:
    cpy #14
    bcs actor_apart
    sec
    rts
actor_apart:
    clc
    rts

present_patrols:
    lda #1
    sta sprite_enable
    lda $d010
    and #1
    sta sprite_msb
    ldx #3
place_patrol:
    lda actor_live
    and actor_bit,x
    beq patrol_outside
    lda actor_delay,x
    bne patrol_outside
    lda patrol_x,x
    sec
    sbc camera_x
    sta patrol_offset
    lda actor_page,x
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
    lda actor_y,x
    clc
    adc #51
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
actor_bit:
    .byte 1,2,4,8
patrol_mask:
    .byte 2,4,8,16
patrol_reg:
    .byte 0,2,4,6
