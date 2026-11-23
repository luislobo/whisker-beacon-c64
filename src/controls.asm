CHANGE_CAT = 1
SLIDE = 2
MOVE_LEFT = 4
MOVE_RIGHT = 8
JUMP = 16
CHANGE_CHARM = 32

; Joystick 2 is active low. A, S, D and Space are read from three keyboard rows.
read_controls:
    lda #0
    sta $dc02
    sta $dc03
    lda $dc00
    eor #$ff
    and #(CHANGE_CAT | SLIDE | MOVE_LEFT | MOVE_RIGHT | JUMP)
    sta input_bits
    lda #$ff
    sta $dc02

    lda #$fd
    sta $dc00
    lda $dc01
    and #32
    bne scan_left_key
    lda input_bits
    ora #SLIDE
    sta input_bits
scan_left_key:
    lda $dc01
    and #4
    bne check_right_key
    lda input_bits
    ora #MOVE_LEFT
    sta input_bits
check_right_key:
    lda #$fb
    sta $dc00
    lda $dc01
    and #16
    bne check_right_key_bit
    lda input_bits
    ora #CHANGE_CAT
    sta input_bits
check_right_key_bit:
    lda $dc01
    and #4
    bne check_jump_key
    lda input_bits
    ora #MOVE_RIGHT
    sta input_bits
check_jump_key:
    lda #$f7
    sta $dc00
    lda $dc01
    and #128
    bne check_space
    lda input_bits
    ora #CHANGE_CHARM
    sta input_bits
check_space:
    lda #$7f
    sta $dc00
    lda $dc01
    and #16
    bne controls_done
    lda input_bits
    ora #JUMP
    sta input_bits
controls_done:
    lda #$ff
    sta $dc00
    lda start_fire_held
    beq controls_return
    lda input_bits
    and #JUMP
    beq clear_start_button
    lda input_bits
    and #($ff-JUMP)
    sta input_bits
controls_return:
    rts
clear_start_button:
    sta start_fire_held
    rts
