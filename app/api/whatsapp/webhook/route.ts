import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { validateRequest, twiml as Twiml } from 'twilio';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());

    // Initialize Twilio client
    const twilioSignature = request.headers.get('x-twilio-signature');
    // 2) Reconstruct the EXACT public URL Twilio hit (don’t use req.url if behind proxy)
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const betterUrl = `${proto}://${host}/api/whatsapp/webhook`;
    console.log("betterUrl", betterUrl);
    const url = new URL(request.url);
    console.log("url", url);
    const fullUrl = `${process.env.APP_URL}${url.pathname}`;

    console.log("fullUrl", fullUrl);
    console.log("twilioSignature", twilioSignature);
    console.log("body", body);

    // Validate the request is from Twilio
    const validator = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      twilioSignature || '',
      betterUrl,
      body
    );

    console.log("validator", validator);

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
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

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
    // }

    return new NextResponse('<Response><Message>✅</Message></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}
