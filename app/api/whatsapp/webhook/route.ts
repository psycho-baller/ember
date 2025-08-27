import { NextResponse } from 'next/server';
import { validateRequest } from 'twilio';
import { twilioClient } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    // Parse the request body and preserve empty values
    const formData = await request.formData();
    const body = Object.fromEntries(
      formData.entries()
    );


    // Initialize Twilio client
    const twilioSignature = request.headers.get('x-twilio-signature');
    // 2) Reconstruct the EXACT public URL Twilio hit (don’t use req.url if behind proxy)
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const url = `${proto}://${host}/api/whatsapp/webhook`;

    // Validate the request is from Twilio
    const validator = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      twilioSignature || '',
      url,
      body
    );

    if (!validator) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const message = body.Body.toString();
    const from = body.From.toString();
    const profileName = body.ProfileName.toString();

    // Here you can process the incoming message
    console.log(`Received message from ${from}: ${message}`);

    // Auto-respond (optional)
    // if (message.toLowerCase().includes('hello')) {

    await twilioClient.messages.create({
      body: `Hey${profileName ? ` ${profileName}` : ''}, I'm a lil busy rn, but I'll get back to you asap!`,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: from
    });

    await twilioClient.messages.create({
      body: "In the meantime, make sure you confirm your ucalgary email with the link I sent you",
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: from
    });

    return new NextResponse('<Response><Message>✅</Message></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}
