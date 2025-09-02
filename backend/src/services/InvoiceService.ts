import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger.js';

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  fromCompany: {
    name: string;
    address: string;
    city: string;
    country: string;
    taxId?: string;
    email?: string;
  };
  toCompany: {
    name: string;
    address: string;
    city: string;
    country: string;
    taxId?: string;
    email?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface TaxCalculation {
  taxRate: number;
  taxAmount: number;
  isReverseCharge: boolean;
  taxType: 'VAT' | 'GST' | 'NONE';
}

export class InvoiceService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async generateInvoiceForMilestone(milestoneId: string): Promise<string> {
    try {
      // Get milestone with deal and user details
      const milestone = await this.prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          deal: {
            include: {
              project: {
                include: {
                  brand: {
                    select: {
                      id: true,
                      email: true,
                      country: true,
                    }
                  }
                }
              },
              creator: {
                select: {
                  id: true,
                  email: true,
                  country: true,
                }
              }
            }
          }
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.state !== 'RELEASED') {
        throw new Error('Invoice can only be generated for released milestones');
      }

      // Check if invoice already exists
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: { milestoneId }
      });

      if (existingInvoice) {
        return existingInvoice.pdfUrl;
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate tax
      const taxCalc = this.calculateTax(
        milestone.amount,
        milestone.deal.creator.country || 'US',
        milestone.deal.project.brand.country || 'US'
      );

      // Prepare invoice data
      const invoiceData: InvoiceData = {
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        fromCompany: {
          name: `Creator ${milestone.deal.creator.id}`, // In real app, would have creator company details
          address: 'Creator Address',
          city: 'Creator City',
          country: milestone.deal.creator.country || 'US',
          email: milestone.deal.creator.email,
        },
        toCompany: {
          name: `Brand ${milestone.deal.project.brand.id}`, // In real app, would have brand company details
          address: 'Brand Address',
          city: 'Brand City',
          country: milestone.deal.project.brand.country || 'US',
          email: milestone.deal.project.brand.email,
        },
        items: [{
          description: `${milestone.deal.project.title} - ${milestone.title}`,
          quantity: 1,
          unitPrice: milestone.amount / 100, // Convert from cents
          amount: milestone.amount / 100,
        }],
        subtotal: milestone.amount / 100,
        taxAmount: taxCalc.taxAmount / 100,
        totalAmount: (milestone.amount + taxCalc.taxAmount) / 100,
        currency: milestone.deal.currency.toUpperCase(),
        notes: taxCalc.isReverseCharge ? 
          'Reverse charge applies - VAT to be accounted for by the recipient.' : 
          undefined,
        paymentTerms: 'Payment processed via FlowPay escrow system',
      };

      // Generate PDF
      const pdfBuffer = await this.generatePDF(invoiceData);

      // Store invoice in database
      const invoice = await this.prisma.invoice.create({
        data: {
          milestoneId,
          dealId: milestone.dealId,
          invoiceNumber,
          amount: milestone.amount + taxCalc.taxAmount,
          currency: milestone.deal.currency,
          taxAmount: taxCalc.taxAmount,
          taxType: taxCalc.taxType,
          issueDate: invoiceData.issueDate,
          dueDate: invoiceData.dueDate,
          status: 'GENERATED',
          pdfUrl: '', // Will be updated after S3 upload
          metadata: {
            taxRate: taxCalc.taxRate,
            isReverseCharge: taxCalc.isReverseCharge,
            fromCountry: invoiceData.fromCompany.country,
            toCountry: invoiceData.toCompany.country,
          }
        }
      });

      // Upload PDF to S3 (simplified - in real implementation would use proper S3 service)
      const s3Key = `invoices/${invoice.id}/${invoiceNumber}.pdf`;
      const pdfUrl = await this.uploadToS3(pdfBuffer, s3Key);

      // Update invoice with PDF URL
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl }
      });

      logger.info(`Invoice generated for milestone ${milestoneId}: ${invoiceNumber}`);
      return pdfUrl;

    } catch (error) {
      logger.error('Failed to generate invoice:', error);
      throw error;
    }
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the count of invoices this month
    const count = await this.prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(year, new Date().getMonth(), 1),
          lt: new Date(year, new Date().getMonth() + 1, 1),
        }
      }
    });

    const sequenceNumber = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequenceNumber}`;
  }

  private calculateTax(amount: number, fromCountry: string, toCountry: string): TaxCalculation {
    // Simplified tax calculation - in real implementation would use proper tax service
    const vatCountries = [
      'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 
      'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
      'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
    ];

    const isFromEU = vatCountries.includes(fromCountry);
    const isToEU = vatCountries.includes(toCountry);

    if (isFromEU && isToEU && fromCountry !== toCountry) {
      // B2B EU cross-border - reverse charge
      return {
        taxRate: 0,
        taxAmount: 0,
        isReverseCharge: true,
        taxType: 'VAT'
      };
    }

    if (isFromEU && fromCountry === toCountry) {
      // Domestic EU transaction
      const vatRates: Record<string, number> = {
        'DE': 0.19, 'FR': 0.20, 'IT': 0.22, 'ES': 0.21,
        'NL': 0.21, 'BE': 0.21, 'AT': 0.20, 'SE': 0.25,
        // ... other EU VAT rates
      };
      
      const taxRate = vatRates[fromCountry] || 0.20; // Default 20% VAT
      return {
        taxRate,
        taxAmount: Math.round(amount * taxRate),
        isReverseCharge: false,
        taxType: 'VAT'
      };
    }

    // Non-EU or other combinations - no tax
    return {
      taxRate: 0,
      taxAmount: 0,
      isReverseCharge: false,
      taxType: 'NONE'
    };
  }

  private async generatePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20).text('INVOICE', 50, 50, { align: 'right' });
        doc.fontSize(10).text(`Invoice #: ${data.invoiceNumber}`, 50, 80, { align: 'right' });
        doc.text(`Issue Date: ${data.issueDate.toLocaleDateString()}`, 50, 95, { align: 'right' });
        if (data.dueDate) {
          doc.text(`Due Date: ${data.dueDate.toLocaleDateString()}`, 50, 110, { align: 'right' });
        }

        // Company details
        doc.fontSize(12).text('From:', 50, 150);
        doc.fontSize(10).text(data.fromCompany.name, 50, 170);
        doc.text(data.fromCompany.address, 50, 185);
        doc.text(`${data.fromCompany.city}, ${data.fromCompany.country}`, 50, 200);
        if (data.fromCompany.taxId) {
          doc.text(`Tax ID: ${data.fromCompany.taxId}`, 50, 215);
        }
        if (data.fromCompany.email) {
          doc.text(`Email: ${data.fromCompany.email}`, 50, 230);
        }

        doc.fontSize(12).text('To:', 300, 150);
        doc.fontSize(10).text(data.toCompany.name, 300, 170);
        doc.text(data.toCompany.address, 300, 185);
        doc.text(`${data.toCompany.city}, ${data.toCompany.country}`, 300, 200);
        if (data.toCompany.taxId) {
          doc.text(`Tax ID: ${data.toCompany.taxId}`, 300, 215);
        }
        if (data.toCompany.email) {
          doc.text(`Email: ${data.toCompany.email}`, 300, 230);
        }

        // Items table
        const tableTop = 280;
        doc.fontSize(10);
        
        // Table headers
        doc.text('Description', 50, tableTop);
        doc.text('Qty', 350, tableTop, { width: 50, align: 'right' });
        doc.text('Unit Price', 400, tableTop, { width: 80, align: 'right' });
        doc.text('Amount', 480, tableTop, { width: 80, align: 'right' });

        // Table line
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Items
        let yPosition = tableTop + 25;
        data.items.forEach((item) => {
          doc.text(item.description, 50, yPosition, { width: 280 });
          doc.text(item.quantity.toString(), 350, yPosition, { width: 50, align: 'right' });
          doc.text(`${data.currency} ${item.unitPrice.toFixed(2)}`, 400, yPosition, { width: 80, align: 'right' });
          doc.text(`${data.currency} ${item.amount.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });
          yPosition += 20;
        });

        // Totals
        yPosition += 20;
        doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;

        doc.text('Subtotal:', 400, yPosition, { width: 80, align: 'right' });
        doc.text(`${data.currency} ${data.subtotal.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });
        yPosition += 15;

        if (data.taxAmount > 0) {
          doc.text('Tax:', 400, yPosition, { width: 80, align: 'right' });
          doc.text(`${data.currency} ${data.taxAmount.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });
          yPosition += 15;
        }

        doc.fontSize(12).text('Total:', 400, yPosition, { width: 80, align: 'right' });
        doc.text(`${data.currency} ${data.totalAmount.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });

        // Notes
        if (data.notes) {
          yPosition += 40;
          doc.fontSize(10).text('Notes:', 50, yPosition);
          doc.text(data.notes, 50, yPosition + 15, { width: 500 });
        }

        // Payment terms
        if (data.paymentTerms) {
          yPosition += (data.notes ? 60 : 40);
          doc.fontSize(10).text('Payment Terms:', 50, yPosition);
          doc.text(data.paymentTerms, 50, yPosition + 15, { width: 500 });
        }

        // Footer
        doc.fontSize(8).text(
          'This invoice was generated automatically by FlowPay. For questions, contact support@flowpay.com',
          50,
          750,
          { align: 'center', width: 500 }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async uploadToS3(buffer: Buffer, key: string): Promise<string> {
    // Simplified S3 upload - in real implementation would use AWS SDK
    // For now, return a mock URL
    const mockUrl = `https://flowpay-invoices.s3.amazonaws.com/${key}`;
    logger.info(`Mock S3 upload: ${key} -> ${mockUrl}`);
    return mockUrl;
  }

  async getInvoiceById(invoiceId: string): Promise<any> {
    return await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        deal: {
          include: {
            project: {
              select: { title: true }
            },
            creator: {
              select: { id: true, email: true }
            }
          }
        },
        milestone: {
          select: { title: true }
        }
      }
    });
  }

  async getInvoicesForDeal(dealId: string): Promise<any[]> {
    return await this.prisma.invoice.findMany({
      where: { dealId },
      include: {
        milestone: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getInvoicesForUser(userId: string, role: 'CREATOR' | 'BRAND'): Promise<any[]> {
    const where = role === 'CREATOR' 
      ? { deal: { creatorId: userId } }
      : { deal: { project: { brandId: userId } } };

    return await this.prisma.invoice.findMany({
      where,
      include: {
        deal: {
          include: {
            project: {
              select: { title: true }
            }
          }
        },
        milestone: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markInvoiceAsSent(invoiceId: string): Promise<void> {
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });
  }

  async markInvoiceAsPaid(invoiceId: string): Promise<void> {
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });
  }
}