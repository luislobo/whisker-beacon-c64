detect_video:
    ldx #60
wait_low:
    bit $d011
    bmi wait_low
wait_high:
    bit $d011
    bpl wait_high
measure_high:
    bit $d011
    bpl store_refresh
    lda $d012
    cmp #32
    bcc measure_high
    ldx #50
store_refresh:
    stx refresh_rate
    rts
