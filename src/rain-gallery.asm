GALLERY_LIGHT_OFFSCREEN = $80
GALLERY_LIGHT_WIDTH = 9
GALLERY_LIGHT_LEFT = RAIN_GALLERY_LAMP - 4
GALLERY_FLOOR_COLOR = $d800 + 23*40

present_rain_gallery:
    lda level_index
    cmp #GREENHOUSE
    bne gallery_done
    jsr present_gallery_light
    lda draw_player_x+1
    and #$fc
    cmp #RAIN_GALLERY_PAGE
    bne gallery_done
    lda grounded
    beq gallery_done
    lda slide_ticks
    beq gallery_done
    ldy $d015
    bmi gallery_done       ; The brass pickup glint has priority over spray.
    ldx facing_left
    cmp #9
    bcs show_gallery_spray
    inx
    inx
show_gallery_spray:
    txa
    clc
    adc #CAT_SHAPE
    sta SCREEN_A+$3ff
    sta SCREEN_B+$3ff
    ldy facing_left
    ; The camera follows the cat at X=175 throughout the gallery.
    lda $d000
    clc
    adc gallery_spray_x,y
    sta $d00e
    lda $d001
    sta $d00f
    lda #3
    sta $d02e
    lda $d015
    ora #$80
    sta $d015
gallery_done:
    rts

gallery_spray_x:
    .char -18,18

present_gallery_light:
    lda LEVEL_MAP+21*MAP_STRIDE+RAIN_GALLERY_LAMP
    cmp #LIT_LANTERN_TILE
    bne clear_gallery_light
    lda #<GALLERY_LIGHT_LEFT
    sec
    sbc camera_column
    tay
    lda #>GALLERY_LIGHT_LEFT
    sbc camera_page
    beq gallery_light_right
    cmp #$ff
    bne clear_gallery_light
    cpy #(256-GALLERY_LIGHT_WIDTH+1)
    bcs update_gallery_light
    bcc clear_gallery_light
gallery_light_right:
    cpy #40
    bcc update_gallery_light
clear_gallery_light:
    ldy #GALLERY_LIGHT_OFFSCREEN
update_gallery_light:
    cpy gallery_light_x
    beq gallery_done
    tya
    pha
    ldx gallery_light_x
    lda #13                ; Normal multicolor floor ink is green.
    jsr draw_gallery_light
    pla
    tax
    stx gallery_light_x
    lda #15                ; Gold for the wet paver highlight.
draw_gallery_light:
    cpx #GALLERY_LIGHT_OFFSCREEN
    beq gallery_done
    ldy #GALLERY_LIGHT_WIDTH
gallery_light_cell:
    cpx #40
    bcs next_gallery_light_cell
    sta GALLERY_FLOOR_COLOR,x
next_gallery_light_cell:
    inx
    dey
    bne gallery_light_cell
    rts
