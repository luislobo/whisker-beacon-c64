CAT_SHAPE = $3800 / 64

init_cat_sprite:
    lda #CAT_SHAPE
    sta $07f8
    lda #8
    sta $d025
    lda #9
    sta $d026
    lda #1
    sta $d027
    sta $d01c
    sta $d015
    lda #0
    sta $d010
    sta $d017
    sta $d01b
    sta $d01d
    lda #148
    sta $d000
    lda #161
    sta $d001
    rts
