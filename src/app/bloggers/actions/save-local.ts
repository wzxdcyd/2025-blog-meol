'use server'

import fs from 'fs'
import path from 'path'
import type { Blogger } from '../grid-view'

type ImageToSave = {
	urlKey: string
	name: string
	contentBase64: string
}

type LocalBloggerData = {
	bloggers: Blogger[]
	localImages: ImageToSave[]
}

export async function saveLocalBloggers(data: LocalBloggerData) {
	if (process.env.NODE_ENV !== 'development') {
		throw new Error('仅在开发模式下可用')
	}

	const { bloggers, localImages } = data
	const imagesDir = path.join(process.cwd(), 'public/images/blogger')
	const listFile = path.join(process.cwd(), 'src/app/bloggers/list.json')

	if (!fs.existsSync(imagesDir)) {
		fs.mkdirSync(imagesDir, { recursive: true })
	}

	const urlToPathMap = new Map<string, string>()
	for (const img of localImages) {
		const buffer = Buffer.from(img.contentBase64, 'base64')
		fs.writeFileSync(path.join(imagesDir, img.name), buffer)
		urlToPathMap.set(img.urlKey, `/images/blogger/${img.name}`)
	}

	const updatedBloggers = bloggers.map(b => {
		if (urlToPathMap.has(b.url)) {
			return { ...b, avatar: urlToPathMap.get(b.url)! }
		}
		return b
	})

	fs.writeFileSync(listFile, JSON.stringify(updatedBloggers, null, '\t'))

	return { success: true }
}
