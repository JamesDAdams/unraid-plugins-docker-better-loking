<?php
// UDMC global injection via Dynamix DefaultPage hook
$pluginBase = '/plugins/unraid-docker-modern-cards';
$ver = '13';
echo "\n<!-- UDMC DefaultPage hook v{$ver} -->\n";
echo "<link rel=\"stylesheet\" type=\"text/css\" href=\"{$pluginBase}/css/docker.cards.css?v={$ver}\">\n";
echo "<script src=\"{$pluginBase}/javascript/docker.cards.js?v={$ver}\" defer></script>\n";
?>
