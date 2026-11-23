restore_pickup_background:
    lda cell_ptr+1
    sec
    sbc #>LEVEL_MAP
    tax
    lda level_index
    bne greenhouse_background
    lda garden_pickup_start,x
    jmp find_pickup_background
greenhouse_background:
    lda greenhouse_pickup_start,x
find_pickup_background:
    tax
scan_pickup_background:
    lda pickup_scenery,x
    beq write_pickup_background
    tya
    cmp pickup_column,x
    beq found_pickup_background
    inx
    bne scan_pickup_background
found_pickup_background:
    lda pickup_scenery,x
write_pickup_background:
    sta (cell_ptr),y
    lda #$ff
    sta drawn_page
    rts

.include "../build/pickup-backgrounds.inc"
