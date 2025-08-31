import { PaymentsProvider } from './PaymentsProvider';
import { supabase } from '@/integrations/supabase/client';

export class StripeConnectProvider implements PaymentsProvider {
  async createEscrow(dealId: string, currency: string): Promise<{ escrowId: string }> {
    // In Stripe Connect, we don't pre-create an escrow
    // The escrow is created when the payment is made
    return { escrowId: `deal_${dealId}` };
  }

  async fundEscrow(escrowId: string, amountCents: number, brandUserId: string): Promise<{ paymentRef: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          escrowId,
          amountCents,
          brandUserId,
        },
      });

      if (error) throw error;
      return { paymentRef: data.paymentIntentId };
    } catch (error) {
      console.error('Error funding escrow:', error);
      throw new Error('Failed to fund escrow');
    }
  }

  async releaseToCreator(escrowId: string, amountCents: number, creatorUserId: string, metadata?: any): Promise<{ payoutRef: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('release-payment', {
        body: {
          escrowId,
          amountCents,
          creatorUserId,
          metadata,
        },
      });

      if (error) throw error;
      return { payoutRef: data.payoutId };
    } catch (error) {
      console.error('Error releasing payment to creator:', error);
      throw new Error('Failed to release payment to creator');
    }
  }

  async refundToBrand(escrowId: string, amountCents?: number): Promise<{ refundRef: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: {
          escrowId,
          amountCents,
        },
      });

      if (error) throw error;
      return { refundRef: data.refundId };
    } catch (error) {
      console.error('Error refunding to brand:', error);
      throw new Error('Failed to refund to brand');
    }
  }

  async getStatus(escrowId: string): Promise<{ state: 'unfunded' | 'funded' | 'released' | 'refunded' }> {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-status', {
        body: { escrowId },
      });

      if (error) throw error;
      return { state: data.state };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return { state: 'unfunded' };
    }
  }
}