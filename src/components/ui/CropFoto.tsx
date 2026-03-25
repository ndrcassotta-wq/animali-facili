'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'

// Ritaglia l'immagine in base all'area selezionata e restituisce un File
async function cropImmagine(imageSrc: string, croppedAreaPixels: Area, fileName: string): Promise<File> {
  const image = await createImageBitmap(await (await fetch(imageSrc)).blob())
  const canvas = document.createElement('canvas')
  const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height)
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    size,
    size
  )
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(new File([blob!], fileName, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}

interface Props {
  imageSrc: string
  fileName: string
  onConfirm: (file: File) => void
  onCancel: () => void
}

export function CropFoto({ imageSrc, fileName, onConfirm, onCancel }: Props) {
  const [crop,           setCrop]           = useState({ x: 0, y: 0 })
  const [zoom,           setZoom]           = useState(1)
  const [croppedArea,    setCroppedArea]    = useState<Area | null>(null)
  const [isProcessing,   setIsProcessing]   = useState(false)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedArea) return
    setIsProcessing(true)
    try {
      const file = await cropImmagine(imageSrc, croppedArea, fileName)
      onConfirm(file)
    } catch (e) {
      console.error('Errore crop:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">

      {/* Area crop */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controlli */}
      <div className="shrink-0 bg-black px-5 pb-10 pt-4 space-y-4">

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <ZoomOut size={18} className="text-white/60 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-amber-400"
          />
          <ZoomIn size={18} className="text-white/60 shrink-0" />
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 py-4 text-base font-semibold text-white active:opacity-70"
          >
            <X size={18} />
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md disabled:opacity-60 active:scale-[0.98]"
          >
            <Check size={18} />
            {isProcessing ? 'Elaborazione...' : 'Usa questa foto'}
          </button>
        </div>

      </div>
    </div>
  )
}