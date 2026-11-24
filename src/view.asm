SCREEN_A = $0400
SCREEN_B = $2800
LEVEL_MAP = $8000
WORLD_WIDTH = MAP_STRIDE
CAMERA_LIMIT = (WORLD_WIDTH - 40) * 8
HUD_ROWS = 2
FIRST_MAP_ROW = 4            ; Two blank rows separate the HUD from the world.

init_colors:
    lda #0
    sta color_dst
    lda #$d8
    sta color_dst+1
    ldx #0
color_row:
    txa
    tay
    lda (palette_source),y
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
    sta drawn_page
    jsr prepare_view
    jsr present_view
    lda #<scroll_irq
    sta $fffe
    lda #>scroll_irq
    sta $ffff
    lda #<scroll_irq_return
    sta $fffa
    lda #>scroll_irq_return
    sta $fffb
    lda #(53 + HUD_ROWS*8)   ; Switch inside the blank row below the HUD.
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
    lda gallery_window_active
    beq scroll_done
    jmp schedule_gallery_sunset
scroll_done:
    pla
scroll_irq_return:
    rti

screen_select:
    .byte $1c,$ac            ; Screen $0400/$2800, charset $3000 in bank 0.

render_world:
    ; Convert the 16-bit pixel offset to a tile column.
    lda camera_x+1
    lsr
    lsr
    lsr
    sta camera_page
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
    sta camera_column
    cmp drawn_column
    bne redraw_world
    lda camera_page
    cmp drawn_page
    bne redraw_world
    rts
redraw_world:
    lda camera_column
    sta drawn_column
    lda camera_page
    sta drawn_page
    lda screen_index
    eor #1
    sta screen_index
    beq render_a
    jmp render_b

draw_columns .macro screen, header_ready
    ; Patch the hidden buffer's row sources once, then copy up to 40 tiles
    ; from each row. Indexed loads carry across the map's tile pages.
    lda camera_column
    .for row := FIRST_MAP_ROW, row < 25, row += 1
        .if row < GALLERY_WINDOW_ROW
            sta map_header+6*(row-FIRST_MAP_ROW)+1
        .else
            sta normal_window+6*(row-GALLERY_WINDOW_ROW)+1
        .endif
    .endfor
    lda camera_page
    clc
    adc #>(LEVEL_MAP + FIRST_MAP_ROW*MAP_STRIDE)
    .for row := FIRST_MAP_ROW, row < 25, row += 1
        .if row < GALLERY_WINDOW_ROW
            sta map_header+6*(row-FIRST_MAP_ROW)+2
        .else
            sta normal_window+6*(row-GALLERY_WINDOW_ROW)+2
        .endif
        .if row < 24
            adc #>MAP_STRIDE
        .endif
    .endfor

    ; The first four map rows are uniform across the gallery. After each
    ; screen buffer has them, leave them in place and hand the panes to
    ; the parallax renderer.
    ldx #<normal_window
    ldy #>normal_window
    jsr gallery_camera_inside
    bcc invalidate_header
    ldx #<after_window
    ldy #>after_window
    lda \header_ready
    bne set_window_jump
    inc \header_ready
    bne draw_map_header
invalidate_header:
    lda #0
    sta \header_ready
    lda gallery_window_active
    beq draw_map_header
    ; The previous frame still drew the sunset. Repaint the plain panes
    ; at the start of the next frame, when that work no longer overlaps.
    ldx #<after_window
    ldy #>after_window
draw_map_header:
    lda #<map_header
    sta header_jump+1
    lda #>map_header
    sta header_jump+2
    bne begin_map_copy
set_window_jump:
    stx header_jump+1
    sty header_jump+2
begin_map_copy:
    stx window_jump+1
    sty window_jump+2

    ldy #0
next_column:
header_jump:
    jmp map_header
map_header:
    .for row := FIRST_MAP_ROW, row < GALLERY_WINDOW_ROW, row += 1
        lda LEVEL_MAP+row*MAP_STRIDE,y
        sta \screen+row*40,y
    .endfor
window_jump:
    jmp normal_window
normal_window:
    .for row := GALLERY_WINDOW_ROW, row < 25, row += 1
        .if row == GALLERY_WINDOW_ROW+GALLERY_WINDOW_HEIGHT
after_window:
        .endif
        lda LEVEL_MAP+row*MAP_STRIDE,y
        sta \screen+row*40,y
    .endfor
    iny
    cpy #40
    beq finished
    jmp next_column
finished:
    rts
.endmacro

render_a:
    #draw_columns SCREEN_A, gallery_header_a
render_b:
    #draw_columns SCREEN_B, gallery_header_b

track_cat:
    lda draw_player_x
    sec
    sbc #144
    tay
    lda draw_player_x+1
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
