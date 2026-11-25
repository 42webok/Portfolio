<?php
/**
 * Portfolio contact form handler.
 * Upload this single file to your PHP web host (e.g. public_html/contact.php).
 * The frontend (GitHub Pages) POSTs JSON here and the message is emailed to $TO.
 */

// ---------- CONFIG: edit these ----------
$TO = 'devahmad42@gmail.com';                 // where messages arrive
$ALLOWED_ORIGINS = [
    'https://42webok.github.io',              // your GitHub Pages site (no path, no trailing slash)
    // 'https://your-custom-domain.com',
];
// "From" must be an address on YOUR hosting domain, otherwise mail() is often rejected/spammed.
// Example: no-reply@yourdomain.com. If the host gives you only a subdomain, use that domain.
$FROM = 'no-reply@' . preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$RATE_LIMIT_SECONDS = 30;                     // min gap between messages from the same IP
// ----------------------------------------

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Max-Age: 86400');
}

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { respond(204, []); }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST')    { respond(405, ['ok' => false, 'error' => 'Method not allowed.']); }
if ($origin !== '' && !in_array($origin, $ALLOWED_ORIGINS, true)) { respond(403, ['ok' => false, 'error' => 'Origin not allowed.']); }

// Read JSON (falls back to normal form post)
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) { $data = $_POST; }

// Strip control characters / header-injection characters
function clean(string $v, int $max): string {
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $v));
    return mb_substr($v, 0, $max);
}
function oneLine(string $v): string { return trim(preg_replace('/[\r\n]+/', ' ', $v)); }

$name    = oneLine(clean((string)($data['name'] ?? ''), 80));
$email   = oneLine(clean((string)($data['email'] ?? ''), 120));
$subject = oneLine(clean((string)($data['subject'] ?? ''), 120));
$message = clean((string)($data['message'] ?? ''), 2000);

if (mb_strlen($name) < 2)                          { respond(422, ['ok' => false, 'error' => 'Please enter your name.']); }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    { respond(422, ['ok' => false, 'error' => 'Please enter a valid email.']); }
if (mb_strlen($subject) < 3)                       { respond(422, ['ok' => false, 'error' => 'Please add a subject.']); }
if (mb_strlen($message) < 10)                      { respond(422, ['ok' => false, 'error' => 'Message is too short.']); }

// Simple per-IP rate limit (file based)
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$lock = sys_get_temp_dir() . '/contact_' . md5($ip) . '.txt';
if (is_file($lock) && (time() - (int)@filemtime($lock)) < $RATE_LIMIT_SECONDS) {
    respond(429, ['ok' => false, 'error' => 'Please wait a moment before sending another message.']);
}

$body  = "New message from your portfolio\n";
$body .= "-------------------------------\n";
$body .= "Name:    $name\n";
$body .= "Email:   $email\n";
$body .= "Subject: $subject\n\n";
$body .= $message . "\n\n";
$body .= "-------------------------------\n";
$body .= "IP: $ip\nTime: " . date('Y-m-d H:i:s T') . "\n";

$headers = [
    'From: Portfolio <' . $FROM . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',   // so "Reply" goes to the visitor
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];
$encodedSubject = '=?UTF-8?B?' . base64_encode('Portfolio enquiry: ' . $subject) . '?=';

$sent = @mail($TO, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) { respond(500, ['ok' => false, 'error' => 'Mail server could not send the message.']); }

@touch($lock);
respond(200, ['ok' => true]);
