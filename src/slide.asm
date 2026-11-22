SLIDE_DURATION = 14
SLIDE_RECOVERY = 8

prepare_slide:
    lda #0
    sta slide_strike
    lda slide_cooldown
    beq check_slide_input
    dec slide_cooldown
check_slide_input:
    lda input_bits
    and #SLIDE
    bne try_slide
    sta down_held
    beq maintain_slide
try_slide:
    lda down_held
    bne maintain_slide
    inc down_held
    lda grounded
    beq maintain_slide
    lda slide_cooldown
    bne maintain_slide
    lda input_bits
    and #(MOVE_LEFT | MOVE_RIGHT)
    cmp #MOVE_LEFT
    beq slide_left
    cmp #MOVE_RIGHT
    bne maintain_slide
    lda #0
    beq launch_slide
slide_left:
    lda #1
launch_slide:
    sta facing_left
    lda #1
    sta low_profile
    lda #SLIDE_DURATION
    sta slide_ticks
    lda #SLIDE_DURATION+SLIDE_RECOVERY
    sta slide_cooldown
maintain_slide:
    lda low_profile
    beq slide_ready
    lda slide_ticks
    beq check_headroom
    lda grounded
    beq check_headroom
    lda input_bits
    and #JUMP
    beq slide_ready
check_headroom:
    lda player_y
    clc
    adc #2
    sta probe_y
    lda #CAT_LEFT
    jsr player_probe_x
    jsr read_solid
    bcs slide_ready
    lda #CAT_RIGHT
    jsr player_probe_x
    jsr read_solid
    bcs slide_ready
    lda #0
    sta low_profile
    sta slide_ticks
slide_ready:
    rts

; Counted down from the end. The burst loses speed before Pip can slide again.
slide_stride:
    .byte 1,1,2,2,2,3,3,3,3,3,4,4,4,4
