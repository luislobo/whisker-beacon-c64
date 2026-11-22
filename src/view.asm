SCREEN_A = $0400
SCREEN_B = $2800
WORLD_WIDTH = 128
CAMERA_LIMIT = (WORLD_WIDTH - 40) * 8

init_view:
    lda #$ff
    sta drawn_column
    jsr render_world
    jmp present_view

present_view:
    ldx screen_index
    lda screen_select,x
    sta $d018
    lda camera_x
    eor #7
    and #7
    ora #$10                 ; Multicolor among the inner 38 columns.
    sta $d016
    rts

screen_select:
    .byte $1c,$ac            ; Screen $0400/$2800, charset $3000 in bank 0.

render_world:
    ; Convert the 16-bit pixel offset to a tile column.
    lda camera_x+1
    lsr
    lda camera_x
    ror
    lsr
    lsr
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
        lda level_map+row*WORLD_WIDTH,x
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
