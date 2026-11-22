JUMP_GRACE_TICKS = 4
JUMP_BUFFER_TICKS = 5
SHORT_JUMP_SPEED = 256-34

update_jump:
    lda grounded
    beq grace_airborne
    lda #JUMP_GRACE_TICKS
    sta jump_grace
    bne jump_input
grace_airborne:
    lda jump_grace
    beq jump_input
    dec jump_grace
jump_input:
    lda input_bits
    and #JUMP
    bne jump_pressed
    lda jump_held
    beq consume_jump
    lda #0
    sta jump_held
    lda jump_cuttable
    beq consume_jump
    lda y_speed
    cmp #$80
    bcc consume_jump
    cmp #SHORT_JUMP_SPEED
    bcs consume_jump
    lda #SHORT_JUMP_SPEED
    sta y_speed
    bne consume_jump
jump_pressed:
    lda jump_held
    bne consume_jump
    inc jump_held
    lda #JUMP_BUFFER_TICKS
    sta jump_buffer
consume_jump:
    lda jump_buffer
    beq jump_done
    lda low_profile
    bne decay_buffer
    lda jump_grace
    bne buffered_jump
decay_buffer:
    dec jump_buffer
jump_done:
    rts
buffered_jump:
    lda #0
    sta jump_buffer
    sta jump_grace
    sta grounded
    lda jump_held
    sta jump_cuttable
    beq buffered_hop
    lda #256-91
    bne set_jump_speed
buffered_hop:
    lda #SHORT_JUMP_SPEED
set_jump_speed:
    sta y_speed
    rts
