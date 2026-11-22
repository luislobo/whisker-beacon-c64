GOAL = 6
LEVEL_MAP = $5000
BEACON_X = 984
BEACON_TILE = 20*WORLD_WIDTH+126
BLUE_FLY_TILE = 8
BLUE_BADGE_COLUMN = 37

start_game:
    ldx #0
copy_garden:
    .for page := 0, page < 12, page += 1
        lda garden_source+256*page,x
        sta LEVEL_MAP+256*page,x
    .endfor
    inx
    bne copy_garden
copy_last_row:
    lda garden_source+$c00,x
    sta LEVEL_MAP+$c00,x
    inx
    bpl copy_last_row
    lda #0
    sta fireflies
    sta beacon_lit
    sta restart_armed
    sta blue_found
    sta SCREEN_A+BLUE_BADGE_COLUMN
    sta SCREEN_B+BLUE_BADGE_COLUMN
    jsr reset_run
    jsr init_checkpoints
    jsr reset_player
    jsr init_patrols
    lda #$ff
    sta drawn_column
    ldx #header_end-header-1
write_header:
    lda header,x
    sta SCREEN_A+4,x
    sta SCREEN_B+4,x
    dex
    bpl write_header
    rts

step_game:
    lda beacon_lit
    bne wait_for_replay
    jsr update_run_time
    jsr step_player
    jsr step_patrols
    jsr activate_checkpoint
    jsr check_objective
    jmp track_cat
wait_for_replay:
    lda input_bits
    and #JUMP
    beq arm_replay
    lda restart_armed
    beq objective_done
    jsr start_game
    jmp track_cat
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
    ldx #win_end-win_message-1
write_win:
    lda win_message,x
    sta SCREEN_A+4,x
    sta SCREEN_B+4,x
    dex
    bpl write_win
    jmp show_results

catch_firefly:
    jsr read_tile
    cmp #BLUE_FLY_TILE
    beq catch_blue_firefly
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
win_message:
    .text "BEACON LIT     FIRE TO REPLAY    "
win_end:
.cerror win_end-win_message != header_end-header, "HUD messages must have the same width"
