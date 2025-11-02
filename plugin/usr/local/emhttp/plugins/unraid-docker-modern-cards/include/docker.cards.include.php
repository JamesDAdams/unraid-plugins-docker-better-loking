<?php
/*
 * Injecte les assets sur la page Docker (insensible à la casse) et fallback global
 */
$uri = $_SERVER['REQUEST_URI'] ?? '';
$onDocker = stripos($uri, '/docker') !== false;
$pluginBase = '/plugins/unraid-docker-modern-cards';
$ver = '12';

error_log(sprintf('UDMC include: uri=%s onDocker=%s v%s', $uri, $onDocker ? '1' : '0', $ver));

// On injecte dans tous les cas: le JS s’auto-désactive si la page n’est pas la bonne
echo "\n<!-- UDMC assets injected v{$ver} -->\n";
echo "<link rel=\"stylesheet\" type=\"text/css\" href=\"{$pluginBase}/css/docker.cards.css?v={$ver}\">\n";
echo "<script src=\"{$pluginBase}/javascript/docker.cards.js?v={$ver}\" defer></script>\n";
?>