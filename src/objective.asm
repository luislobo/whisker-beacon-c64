GOAL = 24
BEACON_X = (WORLD_WIDTH-3)*8-16
BEACON_TILE = 20*MAP_STRIDE+WORLD_WIDTH-3
FIREFLY_TILE = 9
BLUE_FLY_TILE = 8
LIT_BEACON_TILE = 12
BLUE_BADGE_COLUMN = 37
HINT_WIDTH = 36
HINT_GOAL = 0
HINT_BELL = 1
HINT_LANTERN = 2
HINT_RARE = 3
HINT_BRASS = 4

start_game:
    jsr load_level
    lda #0
    sta encounter_section
    sta fireflies
    sta beacon_lit
    sta restart_armed
    sta blue_found
    sta cat_pose_ticks
    sta wardrobe_keys
    sta SCREEN_A+3
    sta SCREEN_B+3
    sta SCREEN_A+36
    sta SCREEN_B+36
    sta SCREEN_A+BLUE_BADGE_COLUMN
    sta SCREEN_B+BLUE_BADGE_COLUMN
    sta SCREEN_A+BELL_COLUMN
    sta SCREEN_B+BELL_COLUMN
    jsr init_greenhouse_props
    jsr reset_run
    jsr load_level_best
    jsr init_checkpoints
    jsr reset_player
    jsr init_patrols
    lda #$ff
    sta drawn_page
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
    jmp show_wardrobe

step_game:
    lda recovery_ticks
    bne step_recovery
    lda beacon_lit
    bne wait_for_replay
    lda run_started
    bne running_level
    lda input_bits
    and #(MOVE_LEFT | MOVE_RIGHT | JUMP)
    bne show_run_goal
    jsr choose_look
    jmp running_level
show_run_goal:
    ldx #HINT_GOAL
    jsr show_objective_hint
running_level:
    jsr update_run_time
    jsr record_cat_transition
    jsr step_player
    lda recovery_ticks
    bne objective_done
    jsr step_greenhouse_props
    jsr step_patrols
    lda recovery_ticks
    bne objective_done
    jsr activate_checkpoint
    jsr check_objective
    rts
step_recovery:
    jsr update_run_time
    dec recovery_ticks
    bne objective_done
    jmp reset_player
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
    lda recoveries
    bne light_beacon_tile
    lda cat_unlocks
    ora #TUXEDO_UNLOCK
    sta cat_unlocks
light_beacon_tile:
    lda #LIT_BEACON_TILE
    sta LEVEL_MAP+BEACON_TILE
    lda #$ff
    sta drawn_page
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
    cmp #FIREFLY_TILE
    bne no_firefly
    jsr restore_pickup_background
    jsr award_brass_charm
    inc fireflies
    ldx #48
    lda fireflies
score_tens:
    cmp #10
    bcc write_score
    inx
    sbc #10
    bcs score_tens
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
    jsr restore_pickup_background
    jsr award_ribbon
    lda #POSE_SPARK
    sta cat_reaction
    lda #16
    sta cat_pose_ticks
    lda #1
    sta blue_found
    lda #42
    sta SCREEN_A+BLUE_BADGE_COLUMN
    sta SCREEN_B+BLUE_BADGE_COLUMN
    ldx #HINT_RARE
    jmp show_objective_hint

show_objective_hint:
    lda objective_hint_low,x
    sta hud_source
    lda objective_hint_high,x
    sta hud_source+1
    ldy #HINT_WIDTH-1
write_objective_hint:
    lda (hud_source),y
    sta SCREEN_A+42,y
    sta SCREEN_B+42,y
    dey
    bpl write_objective_hint
    rts

objective_hint_low:
    .byte <goal_hint,<bell_hint,<lantern_hint,<rare_hint,<brass_hint
objective_hint_high:
    .byte >goal_hint,>bell_hint,>lantern_hint,>rare_hint,>brass_hint
goal_hint:
    .text "COLLECT 24   THEN LIGHT THE BEACON"
    .fill HINT_WIDTH-(*-goal_hint),32
bell_hint:
    .text "BELL FOUND   SHORTCUT OPEN"
    .fill HINT_WIDTH-(*-bell_hint),32
lantern_hint:
    .text "LANTERN LIT   BONUS FIREFLIES"
    .fill HINT_WIDTH-(*-lantern_hint),32
rare_hint:
    .text "RARE FIREFLY FOUND   STAR EARNED"
    .fill HINT_WIDTH-(*-rare_hint),32
brass_hint:
    .text "LANTERN LIT   BRASS CHARM EARNED"
    .fill HINT_WIDTH-(*-brass_hint),32

header:
    .text "WHISKER BEACON   FIREFLIES "
header_count:
    .text "00/24"
header_end:
greenhouse_header:
    .text "OLD GREENHOUSE   FIREFLIES 00/24"
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
