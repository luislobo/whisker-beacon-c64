init_checkpoints:
    lda #<SPAWN_X
    sta checkpoint_x
    lda #>SPAWN_X
    sta checkpoint_x+1
    lda #0
    sta checkpoint
    sta recoveries
    rts

activate_checkpoint:
    lda grounded
    beq checkpoint_done
    ldx checkpoint
    cpx #2
    beq checkpoint_done
    lda level_index
    beq check_position
    inx
    inx
check_position:
    lda player_x
    cmp checkpoint_low,x
    lda player_x+1
    sbc checkpoint_high,x
    bcc checkpoint_done
    lda checkpoint_low,x
    sta checkpoint_x
    lda checkpoint_high,x
    sta checkpoint_x+1
    inc checkpoint
checkpoint_done:
    rts

checkpoint_low:
    .byte <432,<768,<464,<768
checkpoint_high:
    .byte >432,>768,>464,>768
