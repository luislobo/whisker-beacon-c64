CRACKED_BOARD_TILE = 21
SHAKING_BOARD_TILE = 22
BELL_TILE = 84
LANTERN_TILE = 85
LIT_LANTERN_TILE = 86
LANTERN_GLOW_TILE = 87
BELL_COLUMN = 36
BOARD_FIRST = 20*WORLD_WIDTH+40
BOARD_LENGTH = 6
GATE_COLUMN = 30
LANTERN_OFFSET = 21*WORLD_WIDTH+67

init_greenhouse_props:
    lda #0
    sta bell_found
    sta lantern_lit
    sta board_ticks
    rts

start_crumble:
    lda #SFX_BOARDS
    sta sfx_event
    lda #18
    sta board_ticks
    lda #SHAKING_BOARD_TILE
    bne write_boards

step_greenhouse_props:
    lda board_ticks
    beq boards_idle
    dec board_ticks
    bne boards_idle
    lda #0
write_boards:
    ldx #BOARD_LENGTH-1
board_cell:
    sta LEVEL_MAP+BOARD_FIRST,x
    dex
    bpl board_cell
    lda #$ff
    sta drawn_column
boards_idle:
    rts

collect_bell:
    lda #SFX_BELL
    sta sfx_event
    lda #0
    sta (cell_ptr),y
    sta LEVEL_MAP+21*WORLD_WIDTH+GATE_COLUMN
    sta LEVEL_MAP+22*WORLD_WIDTH+GATE_COLUMN
    lda #1
    sta bell_found
    lda #$c2
    sta SCREEN_A+BELL_COLUMN
    sta SCREEN_B+BELL_COLUMN
    lda #$ff
    sta drawn_column
    rts

light_greenhouse_lantern:
    lda #SFX_LANTERN
    sta sfx_event
    lda #1
    sta lantern_lit
    lda #LIT_LANTERN_TILE
    sta (cell_ptr),y
    lda #LANTERN_GLOW_TILE
    sta LEVEL_MAP+LANTERN_OFFSET-1
    sta LEVEL_MAP+LANTERN_OFFSET+1
    sta LEVEL_MAP+LANTERN_OFFSET-2
    sta LEVEL_MAP+LANTERN_OFFSET+2
    sta LEVEL_MAP+LANTERN_OFFSET-WORLD_WIDTH
    sta LEVEL_MAP+LANTERN_OFFSET-WORLD_WIDTH-1
    sta LEVEL_MAP+LANTERN_OFFSET-WORLD_WIDTH+1
    lda #9
    sta LEVEL_MAP+21*WORLD_WIDTH+71
    sta LEVEL_MAP+21*WORLD_WIDTH+73
    sta LEVEL_MAP+21*WORLD_WIDTH+75
    lda #$ff
    sta drawn_column
    rts
