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
    ; Blank the screen while the active map and its row colors are replaced.
    lda #$0b
    sta $d011
    ldy #0
read_packet:
    jsr read_map_byte
    beq map_loaded
    bmi fill_packet
    tax
copy_literal:
    jsr read_map_byte
    jsr write_map_byte
    dex
    bne copy_literal
    beq read_packet
fill_packet:
    and #$7f
    tax
    jsr read_map_byte
fill_run:
    jsr write_map_byte
    dex
    bne fill_run
    beq read_packet
map_loaded:
    ldx level_index
    lda level_ink,x
    sta $d023
    jsr init_colors
    lda #$1b
    sta $d011
    rts

read_map_byte:
    lda (map_source),y
    inc map_source
    bne map_byte
    inc map_source+1
map_byte:
    ora #0
    rts

write_map_byte:
    sta (map_dst),y
    inc map_dst
    bne map_write_done
    inc map_dst+1
map_write_done:
    rts

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
