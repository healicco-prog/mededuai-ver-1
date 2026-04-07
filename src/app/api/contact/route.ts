import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, mobile, email, subject, message } = await request.json();

    // Validate required fields
    if (!mobile || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Mobile number, email, subject, and message are required.' },
        { status: 400 }
      );
    }

    // 1. Store in Supabase (guaranteed persistence)
    const { error: dbError } = await supabaseAdmin
      .from('contact_submissions')
      .insert({
        name: name || null,
        mobile,
        email,
        subject,
        message,
      });

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json(
        { error: 'Failed to submit your message. Please try again.' },
        { status: 500 }
      );
    }

    // 2. Send email notification via Resend
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 24px; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 24px;">📩 New Contact Form Submission</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">MedEduAI Platform</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 140px;">Name:</td>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${name || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Mobile:</td>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${mobile}</td>
            </tr>
            <tr>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Email:</td>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;"><a href="mailto:${email}" style="color: #0284c7;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Subject:</td>
              <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <h3 style="color: #475569; font-size: 14px; margin-bottom: 8px;">Message:</h3>
            <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; color: #1e293b; line-height: 1.6;">
              ${message.replace(/\n/g, '<br/>')}
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'MedEduAI Contact <noreply@mededuai.com>',
        to: 'support@healic.co',
        replyTo: email,
        subject: `[Contact Form] ${subject}`,
        html: htmlBody,
      });

      if (emailError) {
        console.error('Resend email error:', emailError);
        // Don't fail the request - data is safely stored in Supabase
      } else {
        console.log('Email sent successfully:', emailData);
      }
    } catch (emailErr) {
      console.error('Email send exception:', emailErr);
      // Don't fail - data is still safely in Supabase
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
