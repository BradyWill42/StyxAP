<?php
/**
 * Ask the feed to change the radio. Same-origin only: the custom header cannot be sent
 * cross-site without a preflight this endpoint never answers, and the origin, when sent,
 * must be this host.
 */
require __DIR__ . '/_json.php';
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || ($_SERVER['HTTP_X_STYXAP'] ?? '') !== '1') {
    styx_answer(['ok' => false, 'message' => 'Ask with the portal.'], 400);
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== strtok($_SERVER['HTTP_HOST'] ?? '', ':')) {
    styx_answer(['ok' => false, 'message' => 'Ask from this portal.'], 403);
}
$request = json_decode((string)file_get_contents('php://input', false, null, 0, 4096), true);
if (!is_array($request)) {
    styx_answer(['ok' => false, 'message' => 'That was not a request.'], 400);
}
[$ok, $detail] = styx_queue($request);
styx_answer($ok
    ? ['ok' => true, 'id' => $detail, 'message' => ($request['action'] ?? '') === 'restart-radio'
        ? 'Asked the radio to restart.' : 'Asked for the change; watch "What was asked".']
    : ['ok' => false, 'message' => $detail], $ok ? 200 : 503);
