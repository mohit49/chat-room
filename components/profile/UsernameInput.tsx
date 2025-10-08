"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function UsernameInput({ value, onChange, onValidationChange }: UsernameInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Reset validation
    setIsAvailable(null);
    setValidationMessage('');

    // Don't check if empty or less than 3 characters
    if (!value || value.length < 3) {
      if (value && value.length < 3) {
        setValidationMessage('Username must be at least 3 characters');
        onValidationChange?.(false);
      }
      return;
    }

    // Check for spaces
    if (/\s/.test(value)) {
      setValidationMessage('Username cannot contain spaces');
      setIsAvailable(false);
      onValidationChange?.(false);
      return;
    }

    // Check format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_\-\.!@#$%^&*()+=]*$/.test(value)) {
      setValidationMessage('Username must start with letter/number, no spaces allowed');
      setIsAvailable(false);
      onValidationChange?.(false);
      return;
    }

    // Check length
    if (value.length > 20) {
      setValidationMessage('Username must be at most 20 characters');
      setIsAvailable(false);
      onValidationChange?.(false);
      return;
    }

    // Debounce check availability
    const timeout = setTimeout(() => {
      checkAvailability(value);
    }, 500);

    setTypingTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [value]);

  const checkAvailability = async (username: string) => {
    setIsChecking(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await api.checkUsername(token, username);
      
      if (response.success) {
        setIsAvailable(response.available);
        setValidationMessage(response.message || '');
        onValidationChange?.(response.available);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setValidationMessage('Error checking username');
      onValidationChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  const getValidationIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    if (isAvailable === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (isAvailable === false) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getValidationColor = () => {
    if (isAvailable === true) return 'text-green-600';
    if (isAvailable === false) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="username">
        Username (unique, no spaces allowed)
      </Label>
      <div className="relative">
        <Input
          id="username"
          type="text"
          placeholder="e.g., john_doe123 or cool@user!"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pr-10 ${
            isAvailable === true ? 'border-green-500' : 
            isAvailable === false ? 'border-red-500' : ''
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      {validationMessage && (
        <p className={`text-xs ${getValidationColor()}`}>
          {validationMessage}
        </p>
      )}
      <p className="text-xs text-gray-500">
        3-20 characters. Letters, numbers, and special characters allowed. No spaces.
      </p>
    </div>
  );
}


