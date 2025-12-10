import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tournament } from "@shared/types";
import { Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

interface PresentationTabProps {
  tournament: Tournament;
}

export default function PresentationTab({ tournament }: PresentationTabProps) {
  const publicUrl = `${window.location.origin}/public/${tournament.id}`;
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPublic = () => {
    window.open(publicUrl, "_blank");
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    // Convert SVG to canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.download = `qr-code-${tournament.slug || tournament.id}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success("QR Code téléchargé !");
      });

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site public</CardTitle>
          <CardDescription>
            Partagez le lien avec les participants pour qu'ils consultent le calendrier et les classements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL publique</Label>
            <div className="flex gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenPublic}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-600">Lien copié dans le presse-papier !</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleOpenPublic} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Voir la page publique
            </Button>
            
            <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Générer un code QR
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Code QR du tournoi</DialogTitle>
                  <DialogDescription>
                    Scannez ce code pour accéder directement à la page publique du tournoi
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div 
                    ref={qrRef}
                    className="bg-white p-6 rounded-lg border-2 border-gray-200"
                  >
                    <QRCodeSVG
                      value={publicUrl}
                      size={256}
                      level="H"
                      includeMargin={true}
                      imageSettings={tournament.logoUrl ? {
                        src: tournament.logoUrl,
                        height: 48,
                        width: 48,
                        excavate: true,
                      } : undefined}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{tournament.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {publicUrl}
                    </p>
                  </div>
                  <Button onClick={handleDownloadQR} className="gap-2 w-full">
                    <Download className="h-4 w-4" />
                    Télécharger le QR Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diaporama</CardTitle>
          <CardDescription>
            Affichage pour grand écran (TV, projecteur)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Fonctionnalité en cours de développement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
