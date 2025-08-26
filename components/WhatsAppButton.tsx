'use client';

import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton({ phoneNumber = '1234567890', message = 'Hello! I have a question.' }) {
  // Format the phone number by removing any non-digit characters
  const formattedPhone = phoneNumber.replace(/\D/g, '');

  // Create the WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan?url=${encodeURIComponent(whatsappUrl)}`;

  return (
    <Button
      asChild
      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-full flex items-center gap-2 shadow-lg transition-all hover:scale-105"
    >
      <a href={scanUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="w-5 h-5" />
        Chat with me on WhatsApp!
      </a>
    </Button>
  );
}
