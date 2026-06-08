/**
 * Generates a unique 7-character account number matching the legacy Python implementation:
 * 3 random letters, 3 random digits, 1 random special character (!@#$), shuffled.
 */
export function generateAccountNo(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$';
  
  const pick = (str: string, k: number) => {
    let result = '';
    for (let i = 0; i < k; i++) {
      result += str.charAt(Math.floor(Math.random() * str.length));
    }
    return result.split('');
  };
  
  const pickedLetters = pick(letters, 3);
  const pickedDigits = pick(digits, 3);
  const pickedSymbol = symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  const acc = [...pickedLetters, ...pickedDigits, pickedSymbol];
  
  // Fisher-Yates Shuffle
  for (let i = acc.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [acc[i], acc[j]] = [acc[j], acc[i]];
  }
  
  return acc.join('');
}

/**
 * Generates a random 16-digit virtual card number (mock Visa/Mastercard format)
 */
export function generateCardNumber(): string {
  let cardNum = '';
  // Visa starts with 4, Mastercard with 5
  cardNum += Math.random() > 0.5 ? '4' : '5';
  
  for (let i = 0; i < 15; i++) {
    cardNum += Math.floor(Math.random() * 10).toString();
  }
  
  return cardNum;
}

/**
 * Generates a random 3-digit CVV
 */
export function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

/**
 * Generates a card expiry date (MM/YY) set 4 years in the future
 */
export function generateExpiry(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear() + 4).slice(-2);
  return `${month}/${year}`;
}

/**
 * Formats card numbers into blocks of 4 digits for rendering
 */
export function formatCardNumber(num: string): string {
  return num.replace(/(\d{4})/g, '$1 ').trim();
}
