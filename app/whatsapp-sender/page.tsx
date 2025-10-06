'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Upload, Send } from 'lucide-react';

interface Contact {
  name: string;
  number: string;
}

interface SendStatus {
  name: string;
  number: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  messageSid?: string;
  error?: string;
}

export default function WhatsAppSenderPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messageTemplate, setMessageTemplate] = useState(
    `Hey {name}! This is Ember sending a message on behalf of Rami regarding Tech Start :)

Thanks for your interest in joining Exo. Over the past few weeks I've been deeply thinking about what project we should pursue. I had way too many ideas but I managed to narrow it down to 2 projects:

Questiontration:
- questiontration.vercel.app
- https://github.com/psycho-baller/questiontration
- It aims to make it easier to connect with your friends through games

LinkMaxxing
- linkmaxxing.vercel.app
- devpost.com/software/linkmaxxing
- https://github.com/psycho-baller/linkmaxxing
- discover what connects you with others while mastering the art of communication

I demo the 2 apps in https://youtu.be/YM9n5OxhGO8
I am leaving it up to you guys to decide what project to work on

If either project sounds exciting for you, you can schedule a 20-minute call so we can get to know each other past the google forms: https://cal.com/rami-maalouf/tsc
Feel free to message me personally if you have any Qs 18257358670`
  );
  const [sendStatuses, setSendStatuses] = useState<SendStatus[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [csvError, setCsvError] = useState<string>('');

  const parseCSV = (text: string): Contact[] => {
    const lines = text.trim().split('\n');
    const contacts: Contact[] = [];

    // Skip header row if it exists
    const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle both comma and semicolon separators
      const parts = line.split(/[,;]/).map(p => p.trim());

      if (parts.length >= 2) {
        const name = parts[0].replace(/^["']|["']$/g, ''); // Remove quotes
        const number = parts[1].replace(/^["']|["']$/g, ''); // Remove quotes

        if (name && number) {
          contacts.push({ name, number });
        }
      }
    }

    return contacts;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError('');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedContacts = parseCSV(text);

        if (parsedContacts.length === 0) {
          setCsvError('No valid contacts found in CSV file. Ensure format is: Name, Number');
          return;
        }

        setContacts(parsedContacts);
        setSendStatuses(parsedContacts.map(c => ({
          ...c,
          status: 'pending'
        })));
      } catch (error) {
        setCsvError('Error parsing CSV file. Please check the format.');
        console.error('CSV parse error:', error);
      }
    };

    reader.onerror = () => {
      setCsvError('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  const sendMessage = async (contact: Contact): Promise<{ success: boolean; messageSid?: string; error?: string }> => {
    try {
      const message = messageTemplate.replace(/{name}/g, contact.name);

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: contact.number,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, messageSid: data.messageSid };
      } else {
        return { success: false, error: data.error || 'Unknown error' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  };

  const handleSendAll = async () => {
    if (contacts.length === 0) return;

    setIsSending(true);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      // Update status to sending
      setSendStatuses(prev => prev.map((status, idx) =>
        idx === i ? { ...status, status: 'sending' } : status
      ));

      // Send message
      const result = await sendMessage(contact);

      // Update status to sent or failed
      setSendStatuses(prev => prev.map((status, idx) =>
        idx === i
          ? {
              ...status,
              status: result.success ? 'sent' : 'failed',
              messageSid: result.messageSid,
              error: result.error,
            }
          : status
      ));

      // Wait 1 second between messages to avoid rate limiting
      if (i < contacts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsSending(false);
  };

  const sentCount = sendStatuses.filter(s => s.status === 'sent').length;
  const failedCount = sendStatuses.filter(s => s.status === 'failed').length;
  const progress = contacts.length > 0 ? ((sentCount + failedCount) / contacts.length) * 100 : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">WhatsApp Bulk Sender</h1>
        <p className="text-muted-foreground">
          Upload a CSV file with contacts and send personalized WhatsApp messages
        </p>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>1. Upload CSV File</CardTitle>
            <CardDescription>
              CSV format: Name, Number (e.g., John Doe, +1234567890)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label
                  htmlFor="csv-upload"
                  className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose CSV File
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isSending}
                />
                {contacts.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {contacts.length} contacts loaded
                  </span>
                )}
              </div>

              {csvError && (
                <Alert variant="destructive">
                  <AlertDescription>{csvError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Template */}
        {contacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>2. Customize Message Template</CardTitle>
              <CardDescription>
                Use {'{name}'} to personalize with contact&apos;s name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Enter your message template here..."
                className="min-h-[200px] font-mono text-sm"
                disabled={isSending}
              />
            </CardContent>
          </Card>
        )}

        {/* Send Section */}
        {contacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>3. Send Messages</CardTitle>
              <CardDescription>
                Review contacts and start sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSendAll}
                  disabled={isSending || contacts.length === 0}
                  size="lg"
                  className="gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to All {contacts.length} Contacts
                    </>
                  )}
                </Button>
              </div>

              {/* Progress Bar */}
              {(isSending || sentCount > 0 || failedCount > 0) && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Sent: {sentCount}
                    </span>
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Failed: {failedCount}
                    </span>
                    <span className="text-muted-foreground">
                      Total: {contacts.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Status List */}
              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                {sendStatuses.map((status, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{status.name}</p>
                      <p className="text-sm text-muted-foreground">{status.number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.status === 'pending' && (
                        <span className="text-sm text-muted-foreground">Pending</span>
                      )}
                      {status.status === 'sending' && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      )}
                      {status.status === 'sent' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {status.status === 'failed' && (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          {status.error && (
                            <span className="text-xs text-red-600 max-w-[200px] truncate">
                              {status.error}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
