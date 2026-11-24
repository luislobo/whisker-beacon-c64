GALLERY_WINDOW_ROW = 8
GALLERY_WINDOW_HEIGHT = 5
GALLERY_FIRST_COLUMN = 256
GALLERY_CAMERA_COLUMNS = 89

gallery_camera_inside:
    lda level_index
    beq gallery_outside
    lda camera_page
    cmp #1
    bne gallery_outside
    lda camera_column
    cmp #GALLERY_CAMERA_COLUMNS
    bcs gallery_outside
    sec
    rts
gallery_outside:
    clc
    rts

present_gallery_parallax:
    jsr gallery_camera_inside
    bcc gallery_leave_window
    lda gallery_window_active
    bne gallery_render_window
    inc gallery_window_active
    lda #$0f
    jsr gallery_sun_color
gallery_render_window:
    ; Subtract the coarse column from the screen base so Y can index
    ; both the map stencil and the screen. Copy foreground tiles verbatim.
    ldx screen_index
    lda #0
    sec
    sbc camera_column
    sta gallery_screen
    lda gallery_screen_hi,x
    sbc #0
    sta gallery_screen+1
    ; The VIC moves the whole screen at foreground speed. Offset atlas
    ; samples by that fine scroll, then sample the sky at x/4 and the
    ; trees at x/2 on the multicolor two-dot grid.
    lda camera_x
    and #7
    lsr
    sta gallery_texture_fine
    lda camera_column
    sec
    sbc gallery_texture_fine
    tax
    jsr gallery_sky
    lda camera_x
    lsr
    lsr
    sec
    sbc gallery_texture_fine
    and #63
    tax
    jmp gallery_trees
gallery_leave_window:
    lda gallery_window_active
    beq gallery_window_done
    lda #0
    sta gallery_window_active
    lda greenhouse_colors+GALLERY_WINDOW_ROW+1
    jsr gallery_sun_color
    jmp gallery_copy_panes
gallery_window_done:
    rts
gallery_sun_color:
    .for cell := 0, cell < 40, cell += 1
        sta $d800+(GALLERY_WINDOW_ROW+1)*40+cell
    .endfor
    rts

gallery_screen_hi:
    .byte >SCREEN_A,>SCREEN_B

draw_gallery_band .macro first_row, rows, atlas, period
    .for row := 0, row < \rows, row += 1
        lda gallery_screen
        clc
        adc #<((\first_row+row)*40)
        sta window_row+11*row+9
        lda gallery_screen+1
        adc #>((\first_row+row)*40)
        sta window_row+11*row+10
    .endfor
    ldy camera_column
    lda camera_column
    clc
    adc #40
    sta window_end+1
window_row:
    .for row := 0, row < \rows, row += 1
        lda LEVEL_MAP+(\first_row+row)*MAP_STRIDE+GALLERY_FIRST_COLUMN,y
        bne +
        lda gallery_parallax_tiles+\atlas+row*\period,x
+       sta SCREEN_A,y
    .endfor
    txa
    clc
    adc #4
    .if \period < 256
        and #(\period-1)
    .endif
    tax
    iny
window_end:
    cpy #0
    bne window_row
    rts
.endmacro

gallery_sky:
    #draw_gallery_band GALLERY_WINDOW_ROW, 3, 0, 256
gallery_trees:
    #draw_gallery_band GALLERY_WINDOW_ROW+3, 2, 768, 64

gallery_copy_panes:
    ldx screen_index
    lda camera_page
    clc
    adc #>(LEVEL_MAP+GALLERY_WINDOW_ROW*MAP_STRIDE)
    .for row := 0, row < GALLERY_WINDOW_HEIGHT, row += 1
        sta copy_pane_row+6*row+2
        adc #>MAP_STRIDE
    .endfor
    lda camera_column
    .for row := 0, row < GALLERY_WINDOW_HEIGHT, row += 1
        sta copy_pane_row+6*row+1
    .endfor
    .for row := GALLERY_WINDOW_ROW, row < GALLERY_WINDOW_ROW+GALLERY_WINDOW_HEIGHT, row += 1
        lda gallery_screen_hi,x
        clc
        adc #>(row*40)
        sta copy_pane_row+6*(row-GALLERY_WINDOW_ROW)+5
    .endfor
    ldy #0
copy_pane_row:
    .for row := GALLERY_WINDOW_ROW, row < GALLERY_WINDOW_ROW+GALLERY_WINDOW_HEIGHT, row += 1
        lda LEVEL_MAP+row*MAP_STRIDE,y
        sta SCREEN_A+row*40,y
    .endfor
    iny
    cpy #40
    bne copy_pane_row
    rts

; Set the outdoor inks between the eave and the first window rail.
schedule_gallery_sunset:
    lda #<gallery_sunset_irq
    sta $fffe
    lda #>gallery_sunset_irq
    sta $ffff
    lda #113
    sta $d012
    jmp scroll_done

gallery_sunset_irq:
    pha
    lda #2
    sta $d021
    lda #0
    sta $d022
    lda #8
    sta $d023
gallery_sunset_applied:
    lda #<gallery_restore_palette_irq
    sta $fffe
    lda #>gallery_restore_palette_irq
    sta $ffff
    lda #154
    sta $d012
    jmp gallery_palette_ack

gallery_restore_palette_irq:
    pha
    lda #0
    sta $d021
    lda #6
    sta $d022
    lda #12
    sta $d023
gallery_palette_restored:
    lda #<scroll_irq
    sta $fffe
    lda #>scroll_irq
    sta $ffff
    lda #(53 + HUD_ROWS*8)
    sta $d012
gallery_palette_ack:
    lda #1
    sta $d019
    jmp scroll_done
