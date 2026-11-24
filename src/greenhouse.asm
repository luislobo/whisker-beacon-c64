CRACKED_BOARD_TILE = 21
SHAKING_BOARD_TILE = 22
BELL_TILE = 84
LANTERN_TILE = 85
LIT_LANTERN_TILE = 86
LANTERN_GLOW_TILE = 87
BELL_COLUMN = 38
BOARD_FIRST = 20*MAP_STRIDE+40
BOARD_LENGTH = 6
GATE_COLUMN = 30

init_greenhouse_props:
    lda #0
    sta gallery_window_active
    sta gallery_header_a
    sta gallery_header_b
    lda #0
    sta bell_found
    sta lantern_lit
    sta board_ticks
    lda #GALLERY_LIGHT_OFFSCREEN
    sta gallery_light_x
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
    sta drawn_page
boards_idle:
    rts

collect_bell:
    lda #SFX_BELL
    sta sfx_event
    jsr restore_pickup_background
    lda #0
    sta LEVEL_MAP+21*MAP_STRIDE+GATE_COLUMN
    sta LEVEL_MAP+22*MAP_STRIDE+GATE_COLUMN
    lda #1
    sta bell_found
    lda #$c2
    sta SCREEN_A+BELL_COLUMN
    sta SCREEN_B+BELL_COLUMN
    ldx #HINT_BELL
    jmp show_objective_hint

light_greenhouse_lantern:
    lda #SFX_LANTERN
    sta sfx_event
    lda #1
    sta lantern_lit
    lda #LIT_LANTERN_TILE
    sta (cell_ptr),y
    ; read_tile has already selected this lantern's row and 256-tile page.
    ; Lanterns are at least two columns from an edge and eight from a page end.
    sty lantern_center
    dey
    jsr glow_in_empty_space
    dey
    jsr glow_in_empty_space
    iny
    iny
    iny
    jsr glow_in_empty_space
    iny
    jsr glow_in_empty_space
    lda cell_ptr+1
    sec
    sbc #>MAP_STRIDE
    sta cell_ptr+1
    ldy lantern_center
    dey
    jsr glow_in_empty_space
    iny
    iny
    jsr glow_in_empty_space
    lda cell_ptr+1
    clc
    adc #>MAP_STRIDE
    sta cell_ptr+1
    lda lantern_center
    clc
    adc #4
    tay
    lda #FIREFLY_TILE
    sta (cell_ptr),y
    iny
    iny
    sta (cell_ptr),y
    iny
    iny
    sta (cell_ptr),y
    lda #$ff
    sta drawn_page
    ldx #HINT_LANTERN
    jmp show_objective_hint

glow_in_empty_space:
    lda (cell_ptr),y
    bne glow_done
    lda #LANTERN_GLOW_TILE
    sta (cell_ptr),y
glow_done:
    rts
