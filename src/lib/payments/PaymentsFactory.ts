import { PaymentsProvider, PaymentProviderType } from './PaymentsProvider';
import { StripeConnectProvider } from './StripeConnectProvider';
import { CryptoProvider } from './CryptoProvider';

export class PaymentsFactory {
  static createProvider(providerType: PaymentProviderType): PaymentsProvider {
    switch (providerType) {
      case 'STRIPE':
        return new StripeConnectProvider();
      case 'CRYPTO':
        return new CryptoProvider();
      case 'MANGOPAY':
        // TODO: Implement MangoPay provider
        throw new Error('MangoPay provider not yet implemented');
      default:
        throw new Error(`Unknown payment provider: ${providerType}`);
    }
  }
}