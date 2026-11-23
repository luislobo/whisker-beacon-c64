; Swap between two equally bright poses while the raster is below the garden.
; The map and the pickup hitboxes keep the same tile codes.
CHARSET = $3000
FIREFLY_ALT = 105
BLUE_FLY_ALT = 106
LIT_BEACON_ALT = 107
LIT_LANTERN_ALT = 108

animate_objectives:
    lda game_ticks
    and #8
    cmp objective_ink
    beq ink_done
    sta objective_ink
    ldx #7
swap_ink_row:
    #swap_glyph FIREFLY_TILE, FIREFLY_ALT
    #swap_glyph BLUE_FLY_TILE, BLUE_FLY_ALT
    #swap_glyph LIT_BEACON_TILE, LIT_BEACON_ALT
    #swap_glyph LIT_LANTERN_TILE, LIT_LANTERN_ALT
    dex
    bpl swap_ink_row
objective_ink_changed:
ink_done:
    rts

swap_glyph .macro active, alternate
    lda CHARSET+8*\active,x
    ldy CHARSET+8*\alternate,x
    sta CHARSET+8*\alternate,x
    tya
    sta CHARSET+8*\active,x
.endmacro
