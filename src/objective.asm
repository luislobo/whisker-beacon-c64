GOAL = 6
LEVEL_MAP = $5000
BEACON_X = 984
BEACON_TILE = 20*WORLD_WIDTH+126
BLUE_FLY_TILE = 8
BLUE_BADGE_COLUMN = 37

start_game:
    jsr load_level
    lda #0
    sta fireflies
    sta beacon_lit
    sta restart_armed
    sta blue_found
    sta SCREEN_A+3
    sta SCREEN_B+3
    sta SCREEN_A+36
    sta SCREEN_B+36
    sta SCREEN_A+BLUE_BADGE_COLUMN
    sta SCREEN_B+BLUE_BADGE_COLUMN
    jsr init_greenhouse_props
    jsr reset_run
    jsr load_level_best
    jsr init_checkpoints
    jsr reset_player
    jsr init_patrols
    lda #$ff
    sta drawn_column
    ldx level_index
    lda header_low,x
    sta hud_source
    lda header_high,x
    sta hud_source+1
    ldy #header_end-header-1
write_header:
    lda (hud_source),y
    sta SCREEN_A+4,y
    sta SCREEN_B+4,y
    dey
    bpl write_header
    rts

step_game:
    lda beacon_lit
    bne wait_for_replay
    jsr update_run_time
    jsr step_player
    jsr step_greenhouse_props
    jsr step_patrols
    jsr activate_checkpoint
    jsr check_objective
    rts
wait_for_replay:
    lda input_bits
    and #JUMP
    beq arm_replay
    lda restart_armed
    beq objective_done
    jsr select_level
    jsr start_game
    rts
arm_replay:
    lda #1
    sta restart_armed
objective_done:
    rts

check_objective:
    lda #10
    jsr player_probe_x
    lda player_y
    clc
    adc #3
    sta probe_y
    jsr catch_firefly
    lda player_y
    clc
    adc #11
    sta probe_y
    jsr catch_firefly
    lda fireflies
    cmp #GOAL
    bcc objective_done
    lda player_x
    cmp #<BEACON_X
    lda player_x+1
    sbc #>BEACON_X
    bcc objective_done
    lda #1
    sta beacon_lit
    lda #12
    sta LEVEL_MAP+BEACON_TILE
    lda #$ff
    sta drawn_column
    ldx level_index
    lda win_low,x
    sta hud_source
    lda win_high,x
    sta hud_source+1
    ldy #win_end-win_message-1
write_win:
    lda (hud_source),y
    sta SCREEN_A+3,y
    sta SCREEN_B+3,y
    dey
    bpl write_win
    jmp show_results

catch_firefly:
    jsr read_tile
    cmp #BLUE_FLY_TILE
    beq catch_blue_firefly
    cmp #BELL_TILE
    beq take_greenhouse_bell
    cmp #LANTERN_TILE
    beq light_lantern
    cmp #9
    bne no_firefly
    lda #0
    sta (cell_ptr),y
    lda #$ff
    sta drawn_column
    inc fireflies
    ldx #48
    lda fireflies
    cmp #10
    bcc write_score
    inx
    sbc #10
write_score:
    stx SCREEN_A+4+header_count-header
    stx SCREEN_B+4+header_count-header
    ora #48
    sta SCREEN_A+5+header_count-header
    sta SCREEN_B+5+header_count-header
no_firefly:
    rts
take_greenhouse_bell:
    jmp collect_bell
light_lantern:
    jmp light_greenhouse_lantern
catch_blue_firefly:
    lda #0
    sta (cell_ptr),y
    lda #$ff
    sta drawn_column
    lda #1
    sta blue_found
    lda #42
    sta SCREEN_A+BLUE_BADGE_COLUMN
    sta SCREEN_B+BLUE_BADGE_COLUMN
    rts

header:
    .text "WHISKER BEACON    FIREFLIES "
header_count:
    .text "00/06"
header_end:
greenhouse_header:
    .text "OLD GREENHOUSE    FIREFLIES 00/06"
greenhouse_header_end:
win_message:
    .text "BEACON LIT   FIRE RETRY RIGHT+FIRE"
win_end:
greenhouse_win:
    .text "BEACON LIT   FIRE RETRY  LEFT+FIRE"
greenhouse_win_end:
header_low:
    .byte <header,<greenhouse_header
header_high:
    .byte >header,>greenhouse_header
win_low:
    .byte <win_message,<greenhouse_win
win_high:
    .byte >win_message,>greenhouse_win
.cerror greenhouse_header_end-greenhouse_header != header_end-header, "HUD headings differ in width"
.cerror greenhouse_win_end-greenhouse_win != win_end-win_message, "Finish messages differ in width"
