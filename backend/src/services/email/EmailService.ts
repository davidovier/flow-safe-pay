import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger.js';

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    // Verify SMTP connection
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (error: any) {
      logger.error('SMTP connection failed:', error);
    }
  }

  /**
   * Send email using template
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      // Load and compile template
      const html = await this.renderTemplate(emailData.template, emailData.data);
      
      // Prepare email options
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'FlowPay',
          address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER!,
        },
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        html,
        text: this.htmlToText(html),
        attachments: emailData.attachments,
        priority: emailData.priority || 'normal',
        headers: {
          'X-Mailer': 'FlowPay',
          'X-Priority': this.getPriorityLevel(emailData.priority),
        },
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully: ${info.messageId}`, {
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
      });
    } catch (error: any) {
      logger.error('Failed to send email:', error, {
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
      });
      throw error;
    }
  }

  /**
   * Load and compile Handlebars template
   */
  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      // Check cache first
      if (this.templateCache.has(templateName)) {
        const template = this.templateCache.get(templateName)!;
        return template(data);
      }

      // Load template from file
      const templatePath = path.join(process.cwd(), 'src', 'templates', 'email', `${templateName}.hbs`);
      const templateSource = await fs.readFile(templatePath, 'utf-8');
      
      // Compile template
      const template = handlebars.compile(templateSource);
      
      // Cache template
      this.templateCache.set(templateName, template);
      
      // Render with data
      return template(data);
    } catch (error: any) {
      logger.error(`Failed to render email template: ${templateName}`, error);
      
      // Fallback to basic template
      return this.renderFallbackTemplate(data);
    }
  }

  /**
   * Fallback template when main template fails
   */
  private renderFallbackTemplate(data: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FlowPay</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007AFF; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FlowPay</h1>
          </div>
          <div class="content">
            <h2>${data.title || 'Notification'}</h2>
            <p>${data.message || 'You have a new notification from FlowPay.'}</p>
            ${data.actionUrl ? `<p><a href="${data.actionUrl}" class="button">View Details</a></p>` : ''}
          </div>
          <div class="footer">
            <p>© 2024 FlowPay. All rights reserved.</p>
            <p>You're receiving this email because you have an account with FlowPay.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get priority level for email headers
   */
  private getPriorityLevel(priority?: string): string {
    switch (priority) {
      case 'high': return '1';
      case 'low': return '5';
      default: return '3';
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(emails: EmailData[], options: {
    batchSize?: number;
    delayMs?: number;
  } = {}): Promise<void> {
    const { batchSize = 50, delayMs = 1000 } = options;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Send batch in parallel
      const promises = batch.map(email => 
        this.sendEmail(email).catch(error => {
          logger.error(`Failed to send bulk email to ${email.to}:`, error);
          return null; // Don't let one failure stop the batch
        })
      );
      
      await Promise.all(promises);
      
      // Delay between batches
      if (i + batchSize < emails.length && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    logger.info(`Sent bulk emails: ${emails.length} total`);
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<boolean> {
    try {
      await this.sendEmail({
        to: process.env.SMTP_USER!,
        subject: 'FlowPay Email Test',
        template: 'test',
        data: {
          title: 'Email Configuration Test',
          message: 'If you receive this email, your email configuration is working correctly.',
        },
      });
      
      return true;
    } catch (error: any) {
      logger.error('Email configuration test failed:', error);
      return false;
    }
  }

  /**
   * Get email statistics
   */
  getStats(): any {
    // This would typically connect to email service provider APIs
    // For now, return basic transporter info
    return {
      host: this.transporter.options.host,
      port: this.transporter.options.port,
      secure: this.transporter.options.secure,
      poolSize: this.transporter.options.maxConnections,
      templatesCached: this.templateCache.size,
    };
  }

  /**
   * Close transporter connection
   */
  async close(): Promise<void> {
    this.transporter.close();
    logger.info('Email service closed');
  }
}