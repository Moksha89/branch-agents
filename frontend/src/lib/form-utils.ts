import { KeyboardEvent, RefObject } from 'react';

/**
 * Handle Enter key press to move focus to the next form field.
 * Moves right (next sibling input) or down (next row) in form layout.
 */
export function handleEnterKeyNavigation(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== 'Enter') return;

  const target = e.target as HTMLElement;
  const tagName = target.tagName.toLowerCase();

  // Don't interfere with textarea (allow newline) or button/submit (allow click)
  if (tagName === 'textarea' || tagName === 'button') return;

  // Don't interfere with submit buttons
  if (tagName === 'input' && (target as HTMLInputElement).type === 'submit') return;

  e.preventDefault();

  // Find the closest form or container
  const form = target.closest('form') || target.closest('[data-form-container]') || target.closest('.space-y-4') || target.closest('[role="dialog"]');
  if (!form) return;

  // Get all focusable form elements within the form/container
  const focusableSelectors = 'input:not([type="hidden"]):not([type="file"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';
  const elements = Array.from(form.querySelectorAll<HTMLElement>(focusableSelectors));

  const currentIndex = elements.indexOf(target);
  if (currentIndex === -1) return;

  // Move to next element
  const nextIndex = currentIndex + 1;
  if (nextIndex < elements.length) {
    elements[nextIndex].focus();
    // Select text in input fields for easy overwrite
    if (elements[nextIndex] instanceof HTMLInputElement) {
      (elements[nextIndex] as HTMLInputElement).select();
    }
  }
}

/**
 * Smart validation for common field types.
 * Returns error message or null if valid.
 */
export function validateField(name: string, value: string, required = false): string | null {
  if (required && !value.trim()) {
    return `${formatFieldName(name)} is required`;
  }

  if (!value.trim()) return null;

  switch (name) {
    case 'mobileNumber':
    case 'aadharLinkedNumber':
      if (!/^\d{10}$/.test(value.replace(/\s/g, ''))) {
        return 'Enter a valid 10-digit mobile number';
      }
      break;

    case 'aadharNumber':
      if (!/^\d{12}$/.test(value.replace(/\s/g, ''))) {
        return 'Enter a valid 12-digit Aadhar number';
      }
      break;

    case 'panCardNumber':
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(value.replace(/\s/g, ''))) {
        return 'Enter a valid PAN number (e.g. ABCDE1234F)';
      }
      break;

    case 'ifscCode':
      if (!/^[A-Z]{4}0\w{6}$/.test(value.replace(/\s/g, ''))) {
        return 'Enter a valid IFSC code (e.g. SBIN0001234)';
      }
      break;

    case 'debitCardNumber':
      if (!/^\d{13,19}$/.test(value.replace(/\s/g, ''))) {
        return 'Enter a valid card number (13-19 digits)';
      }
      break;

    case 'debitCardExpiry':
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
        return 'Enter expiry as MM/YY';
      }
      break;

    case 'debitCardCvv':
      if (!/^\d{3,4}$/.test(value)) {
        return 'Enter a valid 3 or 4 digit CVV';
      }
      break;

    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Enter a valid email address';
      }
      break;

    case 'bankBalance':
    case 'balance':
      if (value && isNaN(Number(value))) {
        return 'Enter a valid number';
      }
      if (Number(value) < 0) {
        return 'Balance cannot be negative';
      }
      break;
  }

  return null;
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Parse API error responses into user-friendly messages.
 */
export function parseApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Response) {
    if (error.status === 401) return 'Session expired. Please log in again.';
    if (error.status === 403) return 'You do not have permission for this action.';
    if (error.status === 404) return 'The requested resource was not found.';
    if (error.status === 409) return 'A conflict occurred. The data may have been modified.';
    if (error.status >= 500) return 'Server error. Please try again later.';
  }

  if (typeof error === 'string') return error;

  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: string }).message;
    if (Array.isArray(msg)) return msg.join('. ');
    return msg;
  }

  return fallback;
}
