MITE_X = 213
ACORN_X = 350
OWL_X = 620
OWL_SHADOW_Y = 178

init_greenhouse_actors:
    ldx #3
greenhouse_actor:
    lda greenhouse_actor_low,x
    sta patrol_x,x
    lda greenhouse_actor_high,x
    sta actor_page,x
    lda greenhouse_actor_y,x
    sta actor_y,x
    lda greenhouse_shapes,x
    sta SCREEN_A+$3f9,x
    sta SCREEN_B+$3f9,x
    lda greenhouse_sprite_color,x
    sta $d028,x
    dex
    bpl greenhouse_actor
    lda #3
    sta actor_live
    lda #$1f
    sta $d01c
    rts

step_greenhouse_actors:
    lda actor_live
    and #1
    beq update_acorn
    ldx #0
    lda game_ticks
    and #1
    bne mite_contact
    jsr greenhouse_patrol
mite_contact:
    jsr ground_actor_contact
    bcc update_acorn
    lda slide_strike
    bne scatter_mite
    jmp hit_greenhouse_actor
scatter_mite:
    lda actor_live
    and #$fe
    sta actor_live
    lda #SFX_MITE
    sta sfx_event
update_acorn:
    ldx #1
    jsr greenhouse_patrol
    lda acorn_grace
    beq acorn_contact
    dec acorn_grace
    bne update_owl
acorn_contact:
    jsr ground_actor_contact
    bcc update_owl
    lda slide_strike
    beq hit_greenhouse_actor
    lda patrol_dir+1
    eor #1
    sta patrol_dir+1
    lda #14
    sta acorn_grace
    lda #SFX_ACORN
    sta sfx_event
update_owl:
    lda actor_live
    and #3
    sta actor_live
    ldx owl_phase
    bne step_owl
    lda player_x+1
    cmp #>OWL_X
    bne greenhouse_actor_done
    lda player_x
    cmp #<(OWL_X-60)
    bcc greenhouse_actor_done
    cmp #<(OWL_X+52)
    bcs greenhouse_actor_done
    lda #SFX_OWL
    sta sfx_event
step_owl:
    inc owl_phase
    cpx #96
    bcc show_owl
    lda #0
    sta owl_phase
    rts
show_owl:
    cpx #61
    bcs greenhouse_actor_done
    lda owl_heights,x
    sta actor_y+2
    lda actor_live
    ora #4
    cpx #28
    bcs owl_visible
    ora #8
owl_visible:
    sta actor_live
    lda actor_y+2
    clc
    adc #13
    sta patrol_offset
    lda player_y
    ldy low_profile
    beq standing_under_owl
    clc
    adc #6
standing_under_owl:
    cmp patrol_offset
    bcs greenhouse_actor_done
    lda player_y
    clc
    adc #13
    cmp actor_y+2
    bcc greenhouse_actor_done
    ldx #2
    jsr actor_same_column
    bcc greenhouse_actor_done
hit_greenhouse_actor:
    jmp recover_player
greenhouse_actor_done:
    rts

; Both floor patrol spans lie within one page each.
greenhouse_patrol:
    lda patrol_dir,x
    bne greenhouse_patrol_left
    lda patrol_x,x
    cmp greenhouse_max,x
    bcs turn_greenhouse_left
    inc patrol_x,x
    rts
turn_greenhouse_left:
    inc patrol_dir,x
greenhouse_patrol_left:
    lda patrol_x,x
    cmp greenhouse_min,x
    bcc turn_greenhouse_right
    beq turn_greenhouse_right
    dec patrol_x,x
    rts
turn_greenhouse_right:
    lda #0
    sta patrol_dir,x
    inc patrol_x,x
    rts

greenhouse_actor_low:
    .byte <MITE_X,<ACORN_X,<OWL_X,<OWL_X
greenhouse_actor_high:
    .byte >MITE_X,>ACORN_X,>OWL_X,>OWL_X
greenhouse_actor_y:
    .byte 172,172,96,OWL_SHADOW_Y
greenhouse_shapes:
    .byte CAT_SHAPE+7,CAT_SHAPE+8,CAT_SHAPE+9,CAT_SHAPE+10
greenhouse_sprite_color:
    .byte 3,7,1,11
greenhouse_min:
    .byte <211,<331
greenhouse_max:
    .byte <232,<383
owl_heights:
    .fill 20,96
    .for phase := 0, phase < 17, phase += 1
        .byte 100+4*phase
    .endfor
    .fill 7,164
    .for phase := 0, phase < 17, phase += 1
        .byte 160-4*phase
    .endfor
