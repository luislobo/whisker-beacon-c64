TITLE_SCREEN = $8c00
TITLE_NAMES = $8000
TITLE_NAME_BYTES = 20*8
TITLE_NAME_BITMAP = TITLE_BITMAP+(22*40+10)*8
TITLE_SPRITES = $8640
TITLE_COLORS = $9400
TITLE_BITMAP = $a000
TITLE_CAT = (TITLE_SPRITES & $3fff)/64
TITLE_LAMP = TITLE_CAT+CAT_LOOKS*2
TITLE_PROMPT = $d800 + 24*40

show_title:
    lda #$0b
    sta $d011
    lda $dd00
    and #$fc
    ora #1
    sta $dd00
    lda #$38
    sta $d018
    lda #$18
    sta $d016
    ldx #0
title_color_pages:
    .for page := 0, page < 3, page += 1
        lda TITLE_COLORS+page*256,x
        sta $d800+page*256,x
    .endfor
    inx
    bne title_color_pages
title_color_tail:
    lda TITLE_COLORS+$300,x
    sta $db00,x
    inx
    cpx #232
    bne title_color_tail

title_init_sprites:
    lda #177
    sta $d000
    lda #142
    sta $d001
    lda #146
    sta $d002
    lda #152
    sta $d003
    lda #$10
    sta $d010
    lda #0
    sta $d01b
    lda #1
    sta $d01c
    sta $d01d
    sta $d017
    lda #11
    sta $d025
    lda #1
    sta $d026
    lda #TITLE_LAMP
    sta TITLE_SCREEN+$3f9
    jsr show_title_cat
    lda #$3b
    sta $d011
    jsr init_title_music
title_wait:
    lda $d012
    cmp #250
    bne title_wait
title_frame:
    jsr animate_title
    lda logic_clock
    clc
    adc #50
    cmp refresh_rate
    bcc title_keep_phase
    sbc refresh_rate
    sta logic_clock
    inc title_ticks
    jsr title_music_tick
    jmp title_read_input
title_keep_phase:
    sta logic_clock
title_read_input:
    jsr read_controls
title_controls_ready:
    lda input_bits
    and #JUMP
    bne title_start
    lda input_bits
    and #CHANGE_CAT
    tax
    eor wardrobe_keys
    and input_bits
    stx wardrobe_keys
    beq title_leave_raster
    jsr select_next_cat
    jsr show_title_cat
title_leave_raster:
    lda $d012
    cmp #250
    beq title_leave_raster
    bne title_wait

title_start:
    jsr stop_title_music
    lda #0
    sta $d015
    sta logic_clock
    lda #$0b
    sta $d011
    lda $dd00
    ora #3
    sta $dd00
    lda #1
    sta start_fire_held
    rts

animate_title:
    lda title_ticks
    lsr
    lsr
    and #31
    tax
    lda title_drift,x
    asl
    clc
    adc #47
    sta $d004
    lda title_drift+8,x
    clc
    adc #126
    sta $d005
    lda title_drift+16,x
    asl
    clc
    adc #106
    sta $d006
    lda title_drift,x
    clc
    adc #211
    sta $d007
    lda title_drift,x
    asl
    clc
    adc #5
    sta $d008
    lda title_drift+16,x
    clc
    adc #149
    sta $d009
    txa
    lsr
    lsr
    tax
    lda title_lamp_ink,x
    sta $d028
    lda title_prompt_ink,x
    ldy #39
title_prompt_pulse:
    sta TITLE_PROMPT,y
    dey
    bpl title_prompt_pulse
    lda title_fly_frame,x
    sta TITLE_SCREEN+$3fa
    lda title_fly_frame+2,x
    sta TITLE_SCREEN+$3fb
    lda title_fly_frame+4,x
    sta TITLE_SCREEN+$3fc
    lda #7
    sta $d029
    lda #3
    sta $d02a
    lda #13
    sta $d02b
    jsr title_cat_frame
    lda #$1f
    sta $d015
    rts

show_title_cat:
    ldx cat_look
    lda cat_colors,x
    sta $d027
    lda title_name_lo,x
    sta map_source
    lda title_name_hi,x
    sta map_source+1
    ldy #0
copy_title_name:
    lda (map_source),y
    sta TITLE_NAME_BITMAP,y
    iny
    cpy #TITLE_NAME_BYTES
    bne copy_title_name
title_cat_frame:
    lda cat_look
    asl
    clc
    adc #TITLE_CAT
    tax
    lda title_ticks
    and #$7c
    cmp #$54
    bne title_show_cat_frame
    inx
title_show_cat_frame:
    stx TITLE_SCREEN+$3f8
    rts

title_name_lo:
    .for look := 0, look < CAT_LOOKS, look += 1
        .byte <(TITLE_NAMES+look*TITLE_NAME_BYTES)
    .endfor
title_name_hi:
    .for look := 0, look < CAT_LOOKS, look += 1
        .byte >(TITLE_NAMES+look*TITLE_NAME_BYTES)
    .endfor

title_drift:
    .byte 0,0,1,2,3,4,6,7,9,11,12,14,15,16,17,17
    .byte 18,17,17,16,15,14,12,11,9,7,6,4,3,2,1,0
    .byte 0,0,1,2,3,4,6,7,9,11,12,14,15,16,17,17
title_lamp_ink:
    .byte 9,8,8,7,1,7,8,9
title_prompt_ink:
    .byte 15,15,7,7,1,7,7,15
title_fly_frame:
    .byte TITLE_LAMP+1,TITLE_LAMP+2,TITLE_LAMP+2,TITLE_LAMP+1
    .byte TITLE_LAMP+1,TITLE_LAMP+2,TITLE_LAMP+2,TITLE_LAMP+1
    .byte TITLE_LAMP+1,TITLE_LAMP+2,TITLE_LAMP+2,TITLE_LAMP+1
