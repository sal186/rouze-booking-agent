import nodemailer from 'nodemailer';
import { getConfig, Booking, Service } from './db';

// Create transporter based on environment
function getTransporter() {
  // For production, use your SMTP service (SendGrid, Resend, etc.)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development, use Ethereal (fake SMTP)
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || '',
      pass: process.env.ETHEREAL_PASS || '',
    },
  });
}

function formatTime(timeStr: string): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function sendBookingConfirmation(booking: Booking, service: Service): Promise<void> {
  const config = getConfig();
  const transporter = getTransporter();

  if (!config.business_email && !process.env.SMTP_FROM) {
    console.log('No email configured, skipping confirmation email');
    return;
  }

  const fromEmail = process.env.SMTP_FROM || config.business_email || 'noreply@example.com';

  // Email to customer
  const customerEmail = {
    from: `${config.business_name} <${fromEmail}>`,
    to: booking.customer_email,
    subject: `Booking Confirmed: ${service.name} on ${formatDate(booking.booking_date)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${config.brand_color}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { color: #6b7280; }
          .detail-value { font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Booking Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your appointment has been scheduled</p>
          </div>
          <div class="content">
            <p>Hi ${booking.customer_name},</p>
            <p>Your booking with <strong>${config.business_name}</strong> has been confirmed. Here are the details:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div class="detail-row">
                <span class="detail-label">Service</span>
                <span class="detail-value">${service.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${formatDate(booking.booking_date)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${formatTime(booking.booking_time)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration</span>
                <span class="detail-value">${booking.duration} minutes</span>
              </div>
              ${service.price > 0 ? `
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Price</span>
                <span class="detail-value">$${service.price}</span>
              </div>` : ''}
            </div>
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            <p>If you need to reschedule or cancel, please contact us at ${config.business_email || config.business_phone || 'the contact information provided'}.</p>
            <p>We look forward to seeing you!</p>
          </div>
          <div class="footer">
            <p>Powered by Rouze.ai</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // Email to business
  const businessEmail = {
    from: fromEmail,
    to: config.business_email,
    subject: `New Booking: ${booking.customer_name} - ${service.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">New Booking Received</h2>
          </div>
          <div class="content">
            <p><strong>Customer:</strong> ${booking.customer_name}</p>
            <p><strong>Email:</strong> ${booking.customer_email}</p>
            ${booking.customer_phone ? `<p><strong>Phone:</strong> ${booking.customer_phone}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p><strong>Service:</strong> ${service.name}</p>
            <p><strong>Date:</strong> ${formatDate(booking.booking_date)}</p>
            <p><strong>Time:</strong> ${formatTime(booking.booking_time)}</p>
            <p><strong>Duration:</strong> ${booking.duration} minutes</p>
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(customerEmail);
    console.log('Confirmation email sent to', booking.customer_email);

    if (config.business_email) {
      await transporter.sendMail(businessEmail);
      console.log('Notification email sent to', config.business_email);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

export async function sendCancellationEmail(booking: Booking, service: Service): Promise<void> {
  const config = getConfig();
  const transporter = getTransporter();

  if (!booking.customer_email) return;

  const fromEmail = process.env.SMTP_FROM || config.business_email || 'noreply@example.com';

  const email = {
    from: `${config.business_name} <${fromEmail}>`,
    to: booking.customer_email,
    subject: `Booking Cancelled: ${service.name} on ${formatDate(booking.booking_date)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Booking Cancelled</h2>
        <p>Hi ${booking.customer_name},</p>
        <p>Your appointment for <strong>${service.name}</strong> on <strong>${formatDate(booking.booking_date)}</strong> at <strong>${formatTime(booking.booking_time)}</strong> has been cancelled.</p>
        <p>If you'd like to book a new appointment, please visit our booking page.</p>
        <p>Thank you,<br/>${config.business_name}</p>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(email);
    console.log('Cancellation email sent to', booking.customer_email);
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
  }
}
