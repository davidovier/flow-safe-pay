// Payments Abstraction Layer (PAL) Interface
export interface PaymentsProvider {
  createEscrow(dealId: string, currency: string): Promise<{ escrowId: string }>;
  fundEscrow(escrowId: string, amountCents: number, brandUserId: string): Promise<{ paymentRef: string }>;
  releaseToCreator(escrowId: string, amountCents: number, creatorUserId: string, metadata?: any): Promise<{ payoutRef: string }>;
  refundToBrand(escrowId: string, amountCents?: number): Promise<{ refundRef: string }>;
  getStatus(escrowId: string): Promise<{ state: 'unfunded' | 'funded' | 'released' | 'refunded' }>;
}

export type PaymentProviderType = 'STRIPE' | 'MANGOPAY' | 'CRYPTO';

export interface EscrowMetadata {
  dealId: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  [key: string]: any;
}