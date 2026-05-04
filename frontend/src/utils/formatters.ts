/**
 * Utility functions for formatting data display
 * Used throughout the application for consistent formatting
 */

/**
 * Format currency amount in centavos to Brazilian Real display format
 * @param amount Amount in centavos (e.g., 10000 = R$ 100.00)
 * @returns Formatted currency string (e.g., "R$ 100,00")
 */
export const formatCurrency = (amount: number): string => {
  const reais = amount / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
};

/**
 * Format multiplier value with 2 decimal places and 'x' suffix
 * @param multiplier Multiplier value (e.g., 1.23)
 * @returns Formatted multiplier string (e.g., "1.23x")
 */
export const formatMultiplier = (multiplier: number): string => {
  return `${multiplier.toFixed(2)}x`;
};

/**
 * Format date to localized string with date and time
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "15/03/2024 14:30")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format date to short localized string (date only)
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "15/03/2024")
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Format time to localized string (time only)
 * @param dateString ISO date string
 * @returns Formatted time string (e.g., "14:30")
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format number with thousand separators
 * @param num Number to format
 * @returns Formatted number string (e.g., "1.234.567")
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

/**
 * Format percentage with 1 decimal place
 * @param value Decimal value (e.g., 0.75 for 75%)
 * @returns Formatted percentage string (e.g., "75,0%")
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Format duration in milliseconds to human readable format
 * @param ms Duration in milliseconds
 * @returns Formatted duration string (e.g., "2m 30s")
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Truncate text to specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Format file size in bytes to human readable format
 * @param bytes Size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Format UUID to short display format (first 8 characters)
 * @param uuid Full UUID string
 * @returns Shortened UUID (e.g., "a1b2c3d4")
 */
export const formatUuidShort = (uuid: string): string => {
  return uuid.slice(0, 8);
};

/**
 * Format round state to display text
 * @param state Round state enum value
 * @returns Formatted state text
 */
export const formatRoundState = (state: string): string => {
  switch (state) {
    case 'BETTING':
      return 'Betting';
    case 'RUNNING':
      return 'Running';
    case 'CRASHED':
      return 'Crashed';
    default:
      return state;
  }
};

/**
 * Format bet state to display text
 * @param state Bet state enum value
 * @returns Formatted state text
 */
export const formatBetState = (state: string): string => {
  switch (state) {
    case 'ACTIVE':
      return 'Active';
    case 'WON':
      return 'Won';
    case 'LOST':
      return 'Lost';
    default:
      return state;
  }
};