RIVAL_TURN = CAT_SHAPE+4
RIVAL_WALK_LEFT = $25c0/64
RIVAL_WALK_RIGHT = $2fc0/64

present_rival_walk:
    ldx #PATROLS-1
rival_sprite:
    lda sprite_enable
    and patrol_mask,x
    beq next_rival_sprite
    ; The front-facing pose spans the last pixel before and after reversal.
    lda patrol_x,x
    sec
    sbc actor_min,x
    cmp #2
    bcc rival_pivot
    lda actor_max,x
    sec
    sbc patrol_x,x
    cmp #2
    bcc rival_pivot
    lda patrol_x,x
    and #4
    lsr
    ora patrol_dir,x
    tay
    lda rival_walk_frames,y
    bne write_rival_sprite
rival_pivot:
    lda #RIVAL_TURN
write_rival_sprite:
    sta SCREEN_A+$3f9,x
    sta SCREEN_B+$3f9,x
next_rival_sprite:
    dex
    bpl rival_sprite
    rts

rival_walk_frames:
    .byte CAT_SHAPE+5,CAT_SHAPE+6,RIVAL_WALK_RIGHT,RIVAL_WALK_LEFT
