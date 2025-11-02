<?php
require_once 'config/config.php';

session_start();
session_destroy();
redirect(SITE_URL . '/login.php');
