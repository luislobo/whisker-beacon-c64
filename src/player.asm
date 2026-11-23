SPAWN_X = 52
SPAWN_Y = 171
CAT_LEFT = 4
CAT_RIGHT = 16
CAT_FOOT = 13
MUSHROOM_TILE = 19
SPRING_DURATION = 20

recover_player:
    lda recoveries
    cmp #99
    beq reset_player
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
    sta jump_grace
    sta jump_buffer
    sta jump_cuttable
    sta spring_ticks
    sta slide_ticks
    sta slide_cooldown
    sta down_held
    sta low_profile
    sta slide_strike
    lda #1
    sta grounded
    jmp remember_player

step_player:
    jsr prepare_slide
    jsr step_horizontal
    jsr update_jump
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
    jsr read_solid
    bcs hit_vertical
    lda #CAT_RIGHT
    jsr player_probe_x
    jsr read_solid
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
    lda spring_ticks
    beq no_spring_tick
    dec spring_ticks
no_spring_tick:
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
    lda #10
    jsr player_probe_x
    lda player_y
    clc
    adc #CAT_FOOT+1
    sta probe_y
    jsr read_tile
    cmp #MUSHROOM_TILE
    beq spring_launch
    cmp #CRACKED_BOARD_TILE
    bne ground_player
    jsr start_crumble
ground_player:
    lda #1
    sta grounded
    rts
fell:
    jmp recover_player
spring_launch:
    lda #0
    sta grounded
    sta jump_grace
    sta jump_cuttable
    lda #256-126
    sta y_speed
    lda #SPRING_DURATION
    sta spring_ticks
    rts

step_horizontal:
    ldx slide_ticks
    beq walk_input
    lda slide_stride-1,x
    sta steps
    cmp #2
    bcc slide_step
    inc slide_strike
slide_step:
    dec slide_ticks
    jmp walk_loop
walk_input:
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
    lda #1
    ldx low_profile
    bne regular_stride
    lda #2
    ldx spring_ticks
    beq regular_stride
    lda #3
regular_stride:
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
    ldx low_profile
    beq check_upper_side
    adc #6
check_upper_side:
    sta probe_y
    jsr read_solid
    bcs blocked
    lda player_y
    clc
    adc #11
    sta probe_y
    jsr read_solid
    bcs blocked
    dec steps
    bne walk_loop
moved:
    rts
blocked:
    lda #0
    sta slide_ticks
    sta slide_strike
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

read_solid:
    jsr read_tile
    cmp #32
    bcs non_solid
    cmp #16
    rts
non_solid:
    clc
    rts

read_tile:
    lda probe_x+1
    cmp #>(WORLD_WIDTH*8)
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
    lda #0
    sta cell_ptr
    lda probe_x+1
    lsr
    lsr
    lsr
    clc
    adc row_high,x
    sta cell_ptr+1
    lda (cell_ptr),y
    rts
world_wall:
    lda #16
    rts
under_world:
    lda #0
    rts

row_high:
    .for row := 0, row < 25, row += 1
        .byte >(LEVEL_MAP + row * MAP_STRIDE)
    .endfor
