"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import FloatingBlobs from "@/components/landing/FloatingBlobs";
import { ExternalLink, QrCode } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";

const ScanPage = () => {
  const searchParams = useSearchParams();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const url = searchParams.get("url");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(qrUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };

    generateQRCode();
  }, [url]);

  if (!url) {
    // redirect to home
    redirect("/");
  }


  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <FloatingBlobs />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <Card className="glass-card border border-border/50 bg-background/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              {/* Header Icon */}
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-foreground">
                  Scan QR Code
                </h1>
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your phone to open the link
                </p>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border border-border/20">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Separator */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border/50"></div>
                <span className="text-xs text-muted-foreground font-medium">OR</span>
                <div className="flex-1 h-px bg-border/50"></div>
              </div>

              {/* Open Link Button */}
              <Link
                href={url}
                target="_blank"
                className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </Link>

              {/* URL Display */}
              <p className="text-xs text-muted-foreground break-all px-2">
                {url}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScanPage;