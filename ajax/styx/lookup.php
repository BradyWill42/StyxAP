<?php
/** Look a name up the way this Pi does: through the fleet's resolvers. */
require __DIR__ . '/_json.php';
$name = strtolower(trim((string)($_GET['name'] ?? '')));
if (!preg_match('/^(?=.{1,253}$)([a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9])?)(\.[a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9])?)*\.?$/', $name)) {
    styx_answer(['records' => [], 'message' => 'That is not a name.']);
}
$records = [];
foreach ([DNS_A => 'A', DNS_AAAA => 'AAAA', DNS_CNAME => 'CNAME'] as $type => $label) {
    foreach (@dns_get_record($name, $type) ?: [] as $record) {
        $value = $record['ip'] ?? $record['ipv6'] ?? $record['target'] ?? null;
        if ($value !== null) {
            $records[] = ['type' => $label, 'value' => $value, 'ttl' => (int)($record['ttl'] ?? 0)];
        }
    }
}
styx_answer(['records' => $records, 'message' => $records ? null : 'Nobody answers for ' . $name . '.']);
