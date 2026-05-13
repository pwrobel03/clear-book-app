"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getVerificationDocumentAction } from "@/lib/actions/admin";

export function ViewDocumentButton({ fileName }: { fileName: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleView = async () => {
    const newWindow = window.open("", "_blank");

    if (!newWindow) {
      toast.error(
        "Browser has blocked the opening of a new tab. Please change your settings.",
      );
      return;
    }

    // Display a loading message while fetching the document
    newWindow.document.write(
      "<p style='font-family: sans-serif; padding: 20px;'>Fetching document...</p>",
    );

    setIsLoading(true);
    try {
      const result = await getVerificationDocumentAction(fileName);

      if (result.error || !result.data) {
        newWindow.close();
        toast.error(
          result.error || "There was an error fetching the document.",
        );
        return;
      }

      const byteCharacters = atob(result.data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], { type: result.data.mimeType });
      const fileUrl = window.URL.createObjectURL(blob);

      newWindow.location.href = fileUrl;

      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 10000);
    } catch (error) {
      console.error("Error rendering file:", error);
      newWindow.close(); // Close the empty tab in case of network error
      toast.error("There was a network error or the file is corrupted.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleView}
      disabled={isLoading}
      className="flex items-center gap-1.5 text-xs text-accent mt-3 hover:underline w-fit font-bold bg-accent/10 px-2 py-1 rounded-md disabled:opacity-50 transition-all"
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileText size={14} />
      )}
      {isLoading ? "Fetching document..." : "View License Document"}
    </button>
  );
}
