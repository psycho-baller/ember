"use client";

import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PhoneNumberFormProps {
  onSuccess?: () => void;
}

export function PhoneNumberForm({ onSuccess }: PhoneNumberFormProps) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();

  const validatePhoneNumber = (number: string) => {
    // US/Canada phone number regex (10 digits after +1)
    const phoneRegex = /^\+1\d{10}$/;
    return phoneRegex.test(number);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");

    // If empty, return empty string
    if (!numbers) return "";

    // If starts with 1, assume it's a US/Canada number with country code
    if (numbers.startsWith("1") && numbers.length > 1) {
      return `+1${numbers.slice(1, 11)}`;
    }

    // Otherwise, format as US/Canada number
    return `+1${numbers.slice(0, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service");
      return;
    }

    if (!validatePhoneNumber(phone)) {
      toast.error("Please enter a valid US or Canadian phone number");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/profile/phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error("Failed to save phone number");
      }

      toast.success("Phone number saved successfully!");
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error("Error saving phone number:", error);
      toast.error("Failed to save phone number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            +1
          </div>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone.replace("+1", "")}
            onChange={handlePhoneChange}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          US or Canadian number (10 digits after +1)
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
          disabled={isLoading}
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I agree to the <a href="/terms" className="underline hover:text-primary">Terms of Service</a>
        </label>
      </div>

      <Button
        type="submit"
        className="w-full disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        disabled={isLoading || !phone || !agreedToTerms}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Phone Number"
        )}
      </Button>
    </form>
  );
}

export default PhoneNumberForm;
