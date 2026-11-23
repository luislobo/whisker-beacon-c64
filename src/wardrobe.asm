TUXEDO_LOOK = 1
TUXEDO_UNLOCK = 4
CAT_NAME_LENGTH = 13

choose_look:
    lda input_bits
    and #(CHANGE_CAT | CHANGE_CHARM | SLIDE)
    tax
    eor wardrobe_keys
    and input_bits
    stx wardrobe_keys
    beq wardrobe_done
    and #CHANGE_CAT
    beq choose_charm
    ldx cat_look
next_cat_look:
    inx
    cpx #CAT_LOOKS
    bcc check_tuxedo
    ldx #0
check_tuxedo:
    cpx #TUXEDO_LOOK
    bne swap_cat_look
    lda cat_unlocks
    and #TUXEDO_UNLOCK
    beq next_cat_look
swap_cat_look:
    stx cat_look
    jsr load_cat_look
    jmp show_wardrobe
wardrobe_done:
    rts

choose_charm:
    ldx cat_charm
next_charm:
    inx
    cpx #3
    bcc check_charm
    ldx #0
    beq equip_charm
check_charm:
    lda cat_unlocks
    and charm_bits,x
    beq next_charm
equip_charm:
    stx cat_charm
    rts

show_wardrobe:
    ldx #wardrobe_help_end-wardrobe_help-1
wardrobe_help_copy:
    lda wardrobe_help,x
    sta SCREEN_A+42+CAT_NAME_LENGTH,x
    sta SCREEN_B+42+CAT_NAME_LENGTH,x
    dex
    bpl wardrobe_help_copy
    lda cat_look
    asl
    asl
    sta cat_copy_count
    asl
    clc
    adc cat_copy_count
    adc cat_look
    tax
    ldy #0
wardrobe_name_copy:
    lda cat_names,x
    sta SCREEN_A+42,y
    sta SCREEN_B+42,y
    inx
    iny
    cpy #CAT_NAME_LENGTH
    bne wardrobe_name_copy
    rts

wardrobe_help:
    .text " C/UP CAT V/DN CHARM"
    .fill HINT_WIDTH-CAT_NAME_LENGTH-(*-wardrobe_help),32
wardrobe_help_end:

load_cat_look:
    ldx cat_look
    lda cat_colors,x
    sta $d027
    lda cat_look_lo,x
    sta map_source
    lda cat_look_hi,x
    sta map_source+1
    lda #<CAT_CACHE
    sta map_dst
    lda #>CAT_CACHE
    sta map_dst+1
    lda #CAT_POSES
    sta cat_copy_count
copy_cat_pose:
    lda map_dst
    ora #64
    sta cat_copy_right
    lda map_dst+1
    sta cat_copy_right+1
    ldy #0
copy_cat_row:
    lda (map_source),y
    sta (map_dst),y
    tax
    lda mirrored_pixels,x
    iny
    iny
    sta (cat_copy_right),y
    dey
    lda (map_source),y
    sta (map_dst),y
    tax
    lda mirrored_pixels,x
    sta (cat_copy_right),y
    iny
    lda (map_source),y
    sta (map_dst),y
    tax
    lda mirrored_pixels,x
    dey
    dey
    sta (cat_copy_right),y
    iny
    iny
    iny
    cpy #CAT_POSE_BYTES
    bne copy_cat_row
    lda #0
clear_cat_padding:
    sta (map_dst),y
    sta (cat_copy_right),y
    iny
    cpy #64
    bne clear_cat_padding
    lda map_source
    clc
    adc #CAT_POSE_BYTES
    sta map_source
    bcc advance_cat_cache
    inc map_source+1
advance_cat_cache:
    lda map_dst
    clc
    adc #128
    sta map_dst
    bcc next_cat_pose
    inc map_dst+1
next_cat_pose:
    dec cat_copy_count
    bne copy_cat_pose
    rts

mirrored_pixels:
    .for value := 0, value < 256, value += 1
        .byte ((value & 3) << 6) | ((value & 12) << 2) | ((value & 48) >> 2) | ((value & 192) >> 6)
    .endfor

.include "../build/cat-looks.inc"
