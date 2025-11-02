<?php
/*
 * Injecte les assets uniquement sur la page Docker
 * La page Docker utilise /Docker (route), on vérifie l’URI pour limiter l’injection
 */
$uri = $_SERVER['REQUEST_URI'] ?? '';
if (strpos($uri, '/Docker') !== false) {
  $base = $docroot ?? '/usr/local/emhttp';
  $pluginBase = '/plugins/unraid-docker-modern-cards';
  echo "\n<link rel=\"stylesheet\" type=\"text/css\" href=\"{$pluginBase}/css/docker.cards.css?v=2\">\n";
  echo "<script src=\"{$pluginBase}/javascript/docker.cards.js?v=2\" defer></script>\n";
}
?>