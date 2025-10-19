# Vendor Directory - mPDF Library

This directory should contain the mPDF library for PDF generation.

## Installation

### Option 1: Using Composer (Recommended)
```bash
cd /var/www/hisaab
composer require mpdf/mpdf
```

### Option 2: Manual Installation
1. Download mPDF from: https://github.com/mpdf/mpdf/releases
2. Extract to vendor/mpdf/
3. Ensure autoload.php is present

## Required PHP Extensions
- gd or imagick
- mbstring
- openssl (for backup encryption)

## File Structure
```
vendor/
├── autoload.php (custom autoloader)
├── mpdf/
│   ├── src/
│   └── ...
└── README.md (this file)
```
