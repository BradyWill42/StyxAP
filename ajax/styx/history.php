<?php
/** The last day, a minute at a time. */
require __DIR__ . '/_json.php';
styx_answer(styx_read_json('history.json') ?? new stdClass());
