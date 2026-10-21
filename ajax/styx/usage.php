<?php
/** Daily totals, five weeks of them. */
require __DIR__ . '/_json.php';
styx_answer(styx_read_json('usage.json') ?? ['days' => new stdClass()]);
