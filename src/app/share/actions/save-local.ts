'use server'

import fs from 'fs'
import path from 'path'
import type { Share } from '../components/share-card'

type ImageToSave = {
	urlKey: string
	name: string
	contentBase64: string
}

type LocalShareData = {
	shares: Share[]
	localImages: ImageToSave[]
}

export async function saveLocalShares(data: LocalShareData) {
	if (process.env.NODE_ENV !== 'development') {
		throw new Error('仅在开发模式下可用')
	}

	const { shares, localImages } = data
	const imagesDir = path.join(process.cwd(), 'public/images/share')
	const listFile = path.join(process.cwd(), 'src/app/share/list.json')

	if (!fs.existsSync(imagesDir)) {
		fs.mkdirSync(imagesDir, { recursive: true })
	}

	const urlToPathMap = new Map<string, string>()
	for (const img of localImages) {
		const buffer = Buffer.from(img.contentBase64, 'base64')
		fs.writeFileSync(path.join(imagesDir, img.name), buffer)
		urlToPathMap.set(img.urlKey, `/images/share/${img.name}`)
	}

	const updatedShares = shares.map(s => {
		if (urlToPathMap.has(s.url)) {
			return { ...s, image: urlToPathMap.get(s.url)! }
		}
		return s
	})

	fs.writeFileSync(listFile, JSON.stringify(updatedShares, null, '\t'))

	return { success: true }
}
