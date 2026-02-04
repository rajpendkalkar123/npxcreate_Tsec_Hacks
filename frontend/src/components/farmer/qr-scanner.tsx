"use client"

import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface QRScannerProps {
  onScanSuccess: (data: any) => void
  onClose: () => void
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scanner.render(
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText)
          onScanSuccess(data)
          scanner.clear()
          setScanning(false)
        } catch (error) {
          alert('Invalid QR code format')
        }
      },
      (error) => {
        console.log(error)
      }
    )

    return () => {
      scanner.clear().catch(console.error)
    }
  }, [onScanSuccess])

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Scan eNWR QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div id="qr-reader" className="w-full"></div>
        <Button onClick={onClose} variant="outline" className="w-full mt-4">
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
