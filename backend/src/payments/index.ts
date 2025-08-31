import { PaymentsProvider, PaymentProviderType } from './PaymentsProvider.js';
import { StripeConnectProvider } from './StripeConnectProvider.js';
import { CryptoProvider } from './CryptoProvider.js';

// Payment provider factory
export function createPaymentProvider(type: PaymentProviderType): PaymentsProvider {
  switch (type) {
    case 'STRIPE':
      return new StripeConnectProvider();
    case 'CRYPTO':
      return new CryptoProvider();
    case 'MANGOPAY':
      throw new Error('MangoPay provider not yet implemented - future feature');
    default:
      throw new Error(`Unsupported payment provider type: ${type}`);
  }
}

// Default provider based on environment
export function getDefaultPaymentProvider(): PaymentsProvider {
  const defaultType = (process.env.DEFAULT_PAYMENT_PROVIDER as PaymentProviderType) || 'STRIPE';
  return createPaymentProvider(defaultType);
}

// Export all types and providers
export * from './PaymentsProvider.js';
export { StripeConnectProvider } from './StripeConnectProvider.js';
export { CryptoProvider } from './CryptoProvider.js';