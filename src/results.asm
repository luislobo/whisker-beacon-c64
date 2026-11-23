reset_run:
    lda #0
    sta run_started
    sta run_cents
    sta run_seconds
    sta run_minutes
    ldx #39
clear_result_row:
    sta SCREEN_A+40,x
    sta SCREEN_B+40,x
    dex
    bpl clear_result_row
    rts

; Two centiseconds per normalized 50 Hz game step, including recovery.
update_run_time:
    lda run_started
    bne tick_run
    lda input_bits
    and #(MOVE_LEFT | MOVE_RIGHT | JUMP)
    beq time_done
    inc run_started
tick_run:
    lda run_minutes
    cmp #$99
    bne advance_time
    lda run_seconds
    cmp #$59
    bne advance_time
    lda run_cents
    cmp #$98
    beq time_done
advance_time:
    sed
    clc
    lda run_cents
    adc #2
    sta run_cents
    bcc time_updated
    clc
    lda run_seconds
    adc #1
    cmp #$60
    bcc save_seconds
    lda #0
    sta run_seconds
    clc
    lda run_minutes
    adc #1
    sta run_minutes
    jmp time_updated
save_seconds:
    sta run_seconds
time_updated:
    cld
time_done:
    rts

show_results:
    jsr update_best_time
    ldy #0
    lda run_minutes
    jsr format_bcd
    iny
    lda run_seconds
    jsr format_bcd
    iny
    lda run_cents
    jsr format_bcd
    ldy #result_flies-result_row
    lda fireflies
    jsr format_binary
    ldx level_index
    lda level_fly_totals,x
    ldy #result_total-result_row
    jsr format_binary
    ldy #result_falls-result_row
    lda recoveries
    jsr format_binary
    ldy #result_record-result_row
    lda best_minutes
    jsr format_bcd
    iny
    lda best_seconds
    jsr format_bcd
    iny
    lda best_cents
    jsr format_bcd
    ldx #result_end-result_row-1
write_result:
    lda result_row,x
    sta SCREEN_A+42,x
    sta SCREEN_B+42,x
    dex
    bpl write_result
    lda recoveries
    bne result_done
    ldx #clean_end-clean_message-1
write_clean:
    lda clean_message,x
    sta SCREEN_A+3,x
    sta SCREEN_B+3,x
    dex
    bpl write_clean
result_done:
    rts

update_best_time:
    ldx #2
    lda have_best
    beq save_best
compare_time:
    lda run_cents,x
    cmp best_cents,x
    bcc save_best
    bne result_done
    dex
    bpl compare_time
    rts
save_best:
    ldx #2
copy_best:
    lda run_cents,x
    sta best_cents,x
    dex
    bpl copy_best
    lda #1
    sta have_best
    jmp store_level_best

level_record_offset:
    lda level_index
    asl
    asl
    tay
    rts

load_level_best:
    jsr level_record_offset
    ldx #0
load_record_byte:
    lda level_records,y
    sta have_best,x
    iny
    inx
    cpx #4
    bne load_record_byte
    rts

store_level_best:
    jsr level_record_offset
    ldx #0
save_record_byte:
    lda have_best,x
    sta level_records,y
    iny
    inx
    cpx #4
    bne save_record_byte
    rts

format_binary:
    ldx #0
    cmp #100
    bcc decimal_digit
    lda #99
decimal_digit:
    cmp #10
    bcc write_unit
    sbc #10
    inx
    bne decimal_digit
write_unit:
    pha
    txa
    jmp write_tens
format_bcd:
    pha
    lsr
    lsr
    lsr
    lsr
write_tens:
    ora #48
    sta result_row,y
    iny
    pla
    and #15
    ora #48
    sta result_row,y
    iny
    rts

run_started:
    .byte 0
run_cents:
    .byte 0
run_seconds:
    .byte 0
run_minutes:
    .byte 0
have_best:
    .byte 0
best_cents:
    .byte 0
best_seconds:
    .byte 0
best_minutes:
    .byte 0
level_records:
    .fill 8,0
result_row:
    .text "00:00.00 "
result_flies:
    .text "00/"
result_total:
    .text "00 FALLS "
result_falls:
    .text "00 BEST "
result_record:
    .text "00:00.00"
result_end:
clean_message:
    .text "CLEAN CLEAR"
clean_end:
.cerror result_end-result_row > 37, "Results row exceeds the HUD"

level_fly_totals:
    .byte GARDEN_FLIES,GREENHOUSE_FLIES
