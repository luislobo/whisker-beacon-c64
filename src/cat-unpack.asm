; Unpack only the chosen look. Gameplay and title use direct sprite pointers.
CAT_UNPACK = $f000

unpack_cat_look:
    lda #<CAT_UNPACK
    sta map_dst
    lda #>CAT_UNPACK
    sta map_dst+1
    ldy #0
cat_packet:
    jsr read_map_byte
    beq cat_unpacked
    bmi cat_backreference
    tax
cat_literal:
    jsr read_map_byte
    jsr write_map_byte
    dex
    bne cat_literal
    beq cat_packet
cat_backreference:
    and #$7f
    clc
    adc #4
    tax
    jsr read_map_byte
    eor #$ff
    sec
    adc map_dst
    sta cat_copy_right
    lda map_dst+1
    sbc #0
    sta cat_copy_right+1
cat_copy_match:
    lda (cat_copy_right),y
    inc cat_copy_right
    bne cat_write_match
    inc cat_copy_right+1
cat_write_match:
    jsr write_map_byte
    dex
    bne cat_copy_match
    beq cat_packet
cat_unpacked:
    lda #<CAT_UNPACK
    sta map_source
    lda #>CAT_UNPACK
    sta map_source+1
    rts
