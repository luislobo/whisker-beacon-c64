; Only the local encounter needs active sprites. The first and last patrols in
; adjoining sections are beyond the visible playfield when the roster changes.
update_encounter:
    lda player_x+1
    lsr
    lsr
    cmp encounter_section
    beq encounter_ready
    sta encounter_section
    jsr init_patrols
    lda encounter_section
    beq encounter_ready
load_encounter:
    lda encounter_section
    asl
    asl
    sta encounter_page
    sec
    sbc #4
    ldy level_index
    beq garden_encounter
    adc #(5*4-1)
garden_encounter:
    tay
    ldx #0
set_encounter_actor:
    lda encounter_low,y
    sta patrol_x,x
    sta actor_min,x
    lda encounter_high,y
    ora encounter_page
    sta actor_page,x
    lda encounter_max,y
    sta actor_max,x
    iny
    inx
    cpx #4
    bne set_encounter_actor
    lda level_index
    beq add_garden_moth
    lda encounter_section
    and #1
    bne encounter_ready
    ldx #0
    beq set_moth
add_garden_moth:
    ; Preserve the extended Garden routes' leftmost pixel with inclusive bounds.
    dec actor_min
    dec actor_min+1
    dec actor_min+2
    lda #15
    sta actor_live
    lda #$1f
    sta $d01c
    ldx #3
set_moth:
    lda #CAT_SHAPE+11
    sta SCREEN_A+$3f9,x
    sta SCREEN_B+$3f9,x
    lda #4
    sta $d028,x
    lda #152
    sta actor_y,x
encounter_ready:
    rts

step_moth:
    jsr bounded_patrol
    lda game_ticks
    lsr
    and #31
    tay
    lda moth_heights,y
    sta actor_y,x
    clc
    adc #13
    sta patrol_offset
    lda player_y
    ldy low_profile
    beq moth_head
    clc
    adc #6
moth_head:
    cmp patrol_offset
    bcs encounter_ready
    lda player_y
    clc
    adc #13
    cmp actor_y,x
    bcc encounter_ready
    jsr actor_same_column
    bcc encounter_ready
    jmp recover_player

; Each listed patrol span is contained in a single page. The owl and its
; shadow share a fixed world X. Moths occupy slot 3 in the garden and slot 0
; in the even-numbered extensions of the greenhouse.
encounter_starts = (336,455,600,812, 203,490,640,827, 193,357,615,827, 195,450,560,808, 193,340,684,834, 193,350,620,620, 193,382,625,625, 196,356,615,615, 195,345,623,623, 193,414,631,631)
encounter_spans = (25,20,26,25, 24,15,25,20, 23,25,24,25, 25,25,24,22, 21,30,23,23, 24,25,0,0, 35,22,0,0, 27,23,0,0, 30,26,0,0, 24,28,0,0)
encounter_low:
    .byte <encounter_starts
encounter_high:
    .byte >encounter_starts
encounter_max:
    .byte <(encounter_starts+encounter_spans)
    .for index := 0, index < len(encounter_starts), index += 1
        .if index < 20 && index % 4 != 3
            .cerror (<encounter_starts[index]) == 0, "Garden rival turns across a page"
        .endif
        .cerror (>encounter_starts[index]) != (>(encounter_starts[index]+encounter_spans[index])), "Patrol spans a page"
    .endfor
moth_heights:
    .byte 146,145,144,145,146,147,148,150,152,154,156,158,160,162,163,164
    .byte 164,163,162,160,158,156,154,152,150,148,147,146,145,144,145,146
