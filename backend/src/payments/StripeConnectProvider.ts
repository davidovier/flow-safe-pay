import Stripe from 'stripe';
import { PaymentsProvider, EscrowMetadata } from './PaymentsProvider.js';

export class StripeConnectProvider implements PaymentsProvider {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createEscrow(dealId: string, currency: string): Promise<{ escrowId: string }> {
    try {
      // For Stripe Connect, we'll create a PaymentIntent and store metadata
      // The actual escrow is represented by the PaymentIntent in "requires_payment_method" state
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 1, // Placeholder amount - will be updated when funding
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        capture_method: 'manual', // Don't capture immediately
        metadata: {
          type: 'escrow',
          dealId,
          state: 'unfunded',
          createdAt: new Date().toISOString(),
        } as EscrowMetadata,
      });

      return { escrowId: paymentIntent.id };
    } catch (error) {
      throw new Error(`Failed to create escrow: ${error.message}`);
    }
  }

  async fundEscrow(
    escrowId: string, 
    amountCents: number, 
    brandUserId: string
  ): Promise<{ paymentRef: string }> {
    try {
      // Get brand's Stripe Connect account
      const brandAccount = await this.getBrandStripeAccount(brandUserId);
      
      // Update the PaymentIntent with the actual amount
      const paymentIntent = await this.stripe.paymentIntents.update(escrowId, {
        amount: amountCents,
        metadata: {
          state: 'funded',
          fundedAt: new Date().toISOString(),
          brandUserId,
        },
        application_fee_amount: Math.floor(amountCents * 0.05), // 5% platform fee
        on_behalf_of: brandAccount,
        transfer_data: {
          destination: brandAccount,
        },
      });

      return { paymentRef: paymentIntent.id };
    } catch (error) {
      throw new Error(`Failed to fund escrow: ${error.message}`);
    }
  }

  async releaseToCreator(
    escrowId: string, 
    amountCents: number, 
    creatorUserId: string, 
    metadata?: any
  ): Promise<{ payoutRef: string }> {
    try {
      // Get creator's Stripe Connect account
      const creatorAccount = await this.getCreatorStripeAccount(creatorUserId);
      
      // Create a transfer to the creator's account
      const transfer = await this.stripe.transfers.create({
        amount: amountCents,
        currency: 'usd', // Should be dynamic based on deal currency
        destination: creatorAccount,
        metadata: {
          escrowId,
          creatorUserId,
          type: 'milestone_release',
          releasedAt: new Date().toISOString(),
          ...metadata,
        },
      });

      // Update PaymentIntent metadata
      await this.stripe.paymentIntents.update(escrowId, {
        metadata: {
          state: 'released',
          releasedAt: new Date().toISOString(),
          transferId: transfer.id,
        },
      });

      return { payoutRef: transfer.id };
    } catch (error) {
      throw new Error(`Failed to release to creator: ${error.message}`);
    }
  }

  async refundToBrand(escrowId: string, amountCents?: number): Promise<{ refundRef: string }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(escrowId);
      
      const refundAmount = amountCents || paymentIntent.amount;
      
      // Create refund
      const refund = await this.stripe.refunds.create({
        payment_intent: escrowId,
        amount: refundAmount,
        metadata: {
          type: 'escrow_refund',
          refundedAt: new Date().toISOString(),
        },
      });

      // Update PaymentIntent metadata
      await this.stripe.paymentIntents.update(escrowId, {
        metadata: {
          state: 'refunded',
          refundedAt: new Date().toISOString(),
          refundId: refund.id,
        },
      });

      return { refundRef: refund.id };
    } catch (error) {
      throw new Error(`Failed to refund to brand: ${error.message}`);
    }
  }

  async getStatus(escrowId: string): Promise<{ state: 'unfunded' | 'funded' | 'released' | 'refunded' }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(escrowId);
      
      const state = paymentIntent.metadata?.state as 'unfunded' | 'funded' | 'released' | 'refunded';
      
      if (!state) {
        // Determine state from PaymentIntent status
        switch (paymentIntent.status) {
          case 'requires_payment_method':
          case 'requires_confirmation':
            return { state: 'unfunded' };
          case 'succeeded':
            return { state: 'funded' };
          case 'canceled':
            return { state: 'refunded' };
          default:
            return { state: 'unfunded' };
        }
      }
      
      return { state };
    } catch (error) {
      throw new Error(`Failed to get escrow status: ${error.message}`);
    }
  }

  // Helper methods for Stripe Connect accounts
  private async getBrandStripeAccount(brandUserId: string): Promise<string> {
    // In a real implementation, this would fetch from your User table
    // For now, return a placeholder - this should be the brand's connected account ID
    return process.env.STRIPE_TEST_BRAND_ACCOUNT || 'acct_test_brand';
  }

  private async getCreatorStripeAccount(creatorUserId: string): Promise<string> {
    // In a real implementation, this would fetch from your User table
    // For now, return a placeholder - this should be the creator's connected account ID
    return process.env.STRIPE_TEST_CREATOR_ACCOUNT || 'acct_test_creator';
  }

  // Stripe Connect onboarding helpers
  async createConnectAccount(userType: 'brand' | 'creator', email: string, country: string): Promise<string> {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          userType,
          flowpayUser: 'true',
        },
      });

      return account.id;
    } catch (error) {
      throw new Error(`Failed to create Connect account: ${error.message}`);
    }
  }

  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<string> {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        return_url: returnUrl,
        refresh_url: refreshUrl,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error) {
      throw new Error(`Failed to create account link: ${error.message}`);
    }
  }

  async getAccountStatus(accountId: string): Promise<{
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  }> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      
      return {
        detailsSubmitted: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
      };
    } catch (error) {
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  }
}