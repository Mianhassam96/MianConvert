import { Button } from "@/components/ui/button";
import { Copy, Download, CheckCheck } from "lucide-react";
import { useState } from "react";

interface DownloadCardProps {
  url: string;
  filename: string;
  label: string;
  size?: string;
}

const DownloadCard = ({ url, filename, label, size }: DownloadCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{label}</p>
        {size && <p className="text-xs text-gray-500 mt-0.5">{size}</p>}
        <p className="text-xs text-gray-400 truncate">{filename}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
        <Button size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-1" /> Download
        </Button>
      </div>
    </div>
  );
};

export default DownloadCard;
