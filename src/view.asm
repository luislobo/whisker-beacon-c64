SCREEN_A = $0400
SCREEN_B = $2800
WORLD_WIDTH = 128
CAMERA_LIMIT = (WORLD_WIDTH - 40) * 8

init_colors:
    lda #0
    sta color_dst
    lda #$d8
    sta color_dst+1
    ldx #0
color_row:
    lda garden_colors,x
    ldy #39
color_cell:
    sta (color_dst),y
    dey
    bpl color_cell
    lda color_dst
    clc
    adc #40
    sta color_dst
    bcc next_color_row
    inc color_dst+1
next_color_row:
    inx
    cpx #25
    bne color_row
    rts

init_view:
    lda #$ff
    sta drawn_column
    jsr render_world
    jsr present_view
    lda #<scroll_irq
    sta $fffe
    lda #>scroll_irq
    sta $ffff
    lda #<scroll_irq_return
    sta $fffa
    lda #>scroll_irq_return
    sta $fffb
    lda #61                  ; Switch inside the blank row below the HUD.
    sta $d012
    lda #1
    sta $d019
    sta $d01a
    rts

present_view:
    ldx screen_index
    lda screen_select,x
    sta $d018
    lda camera_x
    eor #7
    and #7
    ora #$10                 ; Multicolor among the inner 38 columns.
    sta world_scroll
    lda #$08                 ; Fixed 40-column HUD at the start of every frame.
    sta $d016
    rts

scroll_irq:
    pha
    lda world_scroll         ; Match the screen bank already latched this frame.
    sta $d016
    lda #1
    sta $d019
scroll_applied:
    pla
scroll_irq_return:
    rti

screen_select:
    .byte $1c,$ac            ; Screen $0400/$2800, charset $3000 in bank 0.

render_world:
    ; Convert the 16-bit pixel offset to a tile column.
    lda camera_x+1
    asl
    asl
    asl
    asl
    asl
    sta camera_column
    lda camera_x
    lsr
    lsr
    lsr
    ora camera_column
    cmp drawn_column
    bne redraw_world
    rts
redraw_world:
    sta drawn_column
    sta camera_column
    lda screen_index
    eor #1
    sta screen_index
    beq render_a
    jmp render_b

draw_columns .macro screen
    ldx camera_column
    ldy #0
next_column:
    .for row := 1, row < 25, row += 1
        lda LEVEL_MAP+row*WORLD_WIDTH,x
        sta \screen+row*40,y
    .endfor
    inx
    iny
    cpy #40
    beq finished
    jmp next_column
finished:
    rts
.endmacro

render_a:
    #draw_columns SCREEN_A
render_b:
    #draw_columns SCREEN_B

track_cat:
    lda player_x
    sec
    sbc #144
    tay
    lda player_x+1
    sbc #0
    bcc camera_left_edge
    cmp #>CAMERA_LIMIT
    bcc set_camera
    bne camera_right_edge
    cpy #<CAMERA_LIMIT
    bcc set_camera
camera_right_edge:
    lda #>CAMERA_LIMIT
    ldy #<CAMERA_LIMIT
    bne set_camera
camera_left_edge:
    lda #0
    tay
set_camera:
    sty camera_x
    sta camera_x+1
    jmp render_world
