import { PaymentsProvider } from './PaymentsProvider';

// Scaffold for future crypto implementation
export class CryptoProvider implements PaymentsProvider {
  async createEscrow(dealId: string, currency: string): Promise<{ escrowId: string }> {
    // TODO: Implement USDC escrow creation on Base/Polygon
    throw new Error('Crypto payments not yet implemented');
  }

  async fundEscrow(escrowId: string, amountCents: number, brandUserId: string): Promise<{ paymentRef: string }> {
    // TODO: Implement USDC funding with KYC gate
    throw new Error('Crypto payments not yet implemented');
  }

  async releaseToCreator(escrowId: string, amountCents: number, creatorUserId: string, metadata?: any): Promise<{ payoutRef: string }> {
    // TODO: Implement USDC release with Travel Rule compliance  
    throw new Error('Crypto payments not yet implemented');
  }

  async refundToBrand(escrowId: string, amountCents?: number): Promise<{ refundRef: string }> {
    // TODO: Implement USDC refund
    throw new Error('Crypto payments not yet implemented');
  }

  async getStatus(escrowId: string): Promise<{ state: 'unfunded' | 'funded' | 'released' | 'refunded' }> {
    // TODO: Check on-chain escrow status
    throw new Error('Crypto payments not yet implemented');
  }
}