GARDEN = 0
GREENHOUSE = 1

load_level:
    ldx level_index
    lda source_low,x
    sta map_source
    lda source_high,x
    sta map_source+1
    lda palette_low,x
    sta palette_source
    lda palette_high,x
    sta palette_source+1
    lda #<LEVEL_MAP
    sta map_dst
    lda #>LEVEL_MAP
    sta map_dst+1
    ldy #0
    ldx #12
copy_level_page:
    lda (map_source),y
    sta (map_dst),y
    iny
    bne copy_level_page
    inc map_source+1
    inc map_dst+1
    dex
    bne copy_level_page
copy_level_tail:
    lda (map_source),y
    sta (map_dst),y
    iny
    bpl copy_level_tail

    ldx level_index
    lda level_ink,x
    sta $d023
    jmp init_colors

source_low:
    .byte <garden_source,<greenhouse_source
source_high:
    .byte >garden_source,>greenhouse_source
palette_low:
    .byte <garden_colors,<greenhouse_colors
palette_high:
    .byte >garden_colors,>greenhouse_colors
level_ink:
    .byte 9,12

select_level:
    lda level_index
    bne from_greenhouse
    lda input_bits
    and #MOVE_RIGHT
    beq keep_level
    inc level_index
    rts
from_greenhouse:
    lda input_bits
    and #MOVE_LEFT
    beq keep_level
    dec level_index
keep_level:
    rts
