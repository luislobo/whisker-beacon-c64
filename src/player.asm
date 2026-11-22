SPAWN_X = 52
SPAWN_Y = 171
CAT_LEFT = 4
CAT_RIGHT = 16
CAT_FOOT = 13

recover_player:
    inc recoveries
reset_player:
    lda checkpoint_x
    sta player_x
    lda checkpoint_x+1
    sta player_x+1
    lda #SPAWN_Y
    sta player_y
    lda #0
    sta y_speed
    sta y_fraction
    sta facing_left
    sta jump_held
    lda #1
    sta grounded
    rts

step_player:
    jsr step_horizontal
    lda input_bits
    and #JUMP
    bne try_jump
    sta jump_held
    beq apply_gravity
try_jump:
    lda jump_held
    bne apply_gravity
    inc jump_held
    lda grounded
    beq apply_gravity
    lda #0
    sta grounded
    lda #256-91
    sta y_speed
apply_gravity:
    lda y_speed
    bmi accelerate_y
    cmp #88
    bcs vertical_integrate
accelerate_y:
    clc
    adc #6
    sta y_speed
vertical_integrate:
    clc
    adc y_fraction
    pha
    and #15
    sta y_fraction
    pla
    lsr
    lsr
    lsr
    lsr
    beq landed
    cmp #8
    bcc down_step
    eor #15
    clc
    adc #1
    ldx #$ff
    bne step_vertical
down_step:
    ldx #1
step_vertical:
    stx vertical_step
    sta steps
vertical_loop:
    lda player_y
    clc
    adc vertical_step
    sta player_y
    cpx #1
    bne probe_head
    clc
    adc #CAT_FOOT
probe_head:
    sta probe_y
    lda #CAT_LEFT
    jsr player_probe_x
    jsr read_tile
    cmp #16
    bcs hit_vertical
    lda #CAT_RIGHT
    jsr player_probe_x
    jsr read_tile
    cmp #16
    bcs hit_vertical
    lda #0
    sta grounded
    lda player_y
    cmp #195
    bcs fell
    ldx vertical_step
    dec steps
    bne vertical_loop
landed:
    rts
hit_vertical:
    lda player_y
    sec
    sbc vertical_step
    sta player_y
    lda #0
    sta y_speed
    sta y_fraction
    lda vertical_step
    and #$80
    bne landed
    lda #1
    sta grounded
    rts
fell:
    jmp recover_player

step_horizontal:
    lda input_bits
    and #(MOVE_LEFT | MOVE_RIGHT)
    cmp #MOVE_LEFT
    beq walking_left
    cmp #MOVE_RIGHT
    bne moved
    ldx #0
    beq start_walking
walking_left:
    ldx #1
start_walking:
    stx facing_left
    lda #2
    sta steps
walk_loop:
    lda facing_left
    bne walk_left
    jsr increment_x
    lda #CAT_RIGHT
    bne check_side
walk_left:
    lda player_x
    ora player_x+1
    beq moved
    jsr decrement_x
    lda #CAT_LEFT
check_side:
    jsr player_probe_x
    lda player_y
    clc
    adc #2
    sta probe_y
    jsr read_tile
    cmp #16
    bcs blocked
    lda player_y
    clc
    adc #11
    sta probe_y
    jsr read_tile
    cmp #16
    bcs blocked
    dec steps
    bne walk_loop
moved:
    rts
blocked:
    lda facing_left
    bne increment_x
decrement_x:
    lda player_x
    bne near_left
    dec player_x+1
near_left:
    dec player_x
    rts
increment_x:
    inc player_x
    bne near_right
    inc player_x+1
near_right:
    rts

player_probe_x:
    clc
    adc player_x
    sta probe_x
    lda player_x+1
    adc #0
    sta probe_x+1
    rts

read_tile:
    lda probe_x+1
    cmp #4
    bcs world_wall
    asl
    asl
    asl
    asl
    asl
    sta tile_column
    lda probe_x
    lsr
    lsr
    lsr
    ora tile_column
    tay
    lda probe_y
    cmp #200
    bcs under_world
    lsr
    lsr
    lsr
    tax
    lda row_low,x
    sta cell_ptr
    lda row_high,x
    sta cell_ptr+1
    lda (cell_ptr),y
    rts
world_wall:
    lda #16
    rts
under_world:
    lda #0
    rts

row_low:
    .for row := 0, row < 25, row += 1
        .byte <(LEVEL_MAP + row * WORLD_WIDTH)
    .endfor
row_high:
    .for row := 0, row < 25, row += 1
        .byte >(LEVEL_MAP + row * WORLD_WIDTH)
    .endfor
