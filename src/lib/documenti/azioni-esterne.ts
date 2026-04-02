import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { FileTransfer } from '@capacitor/file-transfer'
import { FileViewer } from '@capacitor/file-viewer'

type PayloadBase = {
  signedUrl: string
  nomeFile: string
}

type PayloadCondivisione = PayloadBase & {
  titolo: string
}

function isNative() {
  return Capacitor.isNativePlatform()
}

function pulisciNomeFile(nomeFile: string) {
  return nomeFile.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
}

function buildNomeFileUnico(nomeFile: string) {
  const nomePulito = pulisciNomeFile(nomeFile || 'documento')
  return `${Date.now()}-${nomePulito}`
}

async function fetchBlob(signedUrl: string) {
  const response = await fetch(signedUrl)

  if (!response.ok) {
    throw new Error('Impossibile recuperare il file remoto.')
  }

  return response.blob()
}

async function scaricaFileNativoInDirectory(
  signedUrl: string,
  nomeFile: string,
  directory: Directory
) {
  const fileName = buildNomeFileUnico(nomeFile)

  const fileInfo = await Filesystem.getUri({
    directory,
    path: fileName,
  })

  await FileTransfer.downloadFile({
    url: signedUrl,
    path: fileInfo.uri,
    progress: false,
  })

  return {
    uri: fileInfo.uri,
    fileName,
  }
}

export async function condividiDocumentoEsterno({
  signedUrl,
  nomeFile,
  titolo,
}: PayloadCondivisione): Promise<'share-sheet' | 'link-copiato'> {
  if (isNative()) {
    const downloaded = await scaricaFileNativoInDirectory(
      signedUrl,
      nomeFile,
      Directory.Cache
    )

    await Share.share({
      title: titolo,
      text: titolo,
      files: [downloaded.uri],
      dialogTitle: 'Condividi documento',
    })

    return 'share-sheet'
  }

  const blob = await fetchBlob(signedUrl)
  const file = new File([blob], nomeFile, {
    type: blob.type || 'application/octet-stream',
  })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: titolo,
      files: [file],
    })

    return 'share-sheet'
  }

  if (navigator.share) {
    await navigator.share({
      title: titolo,
      url: signedUrl,
    })

    return 'share-sheet'
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(signedUrl)
    return 'link-copiato'
  }

  window.open(signedUrl, '_blank', 'noopener,noreferrer')
  return 'share-sheet'
}

export async function scaricaDocumentoEsterno({
  signedUrl,
  nomeFile,
}: PayloadBase): Promise<'web' | 'native'> {
  if (isNative()) {
    await scaricaFileNativoInDirectory(
      signedUrl,
      nomeFile,
      Directory.Documents
    )

    return 'native'
  }

  const blob = await fetchBlob(signedUrl)
  const blobUrl = URL.createObjectURL(blob)

  try {
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = nomeFile
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  }

  return 'web'
}

export async function apriDocumentoEsterno({
  signedUrl,
}: PayloadBase): Promise<'web' | 'native'> {
  if (isNative()) {
    await FileViewer.openDocumentFromUrl({
      url: signedUrl,
    })

    return 'native'
  }

  window.open(signedUrl, '_blank', 'noopener,noreferrer')
  return 'web'
}