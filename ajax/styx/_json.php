<?php
/** Shared by the portal's JSON endpoints: answers are never cached, never framed. */
declare(strict_types=1);
require __DIR__ . '/../../includes/styx/app.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function styx_answer($value, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($value, JSON_UNESCAPED_SLASHES);
    exit;
}
