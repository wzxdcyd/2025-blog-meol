'use server'

import fs from 'fs'
import path from 'path'
import type { SiteContent, CardStyles } from '../stores/config-store'

type FileToSave = {
	filePath: string // Relative path from project root, e.g. "public/favicon.png"
	contentBase64: string
}

type LocalSiteData = {
	siteContent: SiteContent
	cardStyles: CardStyles
	files: FileToSave[]
}

export async function saveSiteContentLocal(data: LocalSiteData) {
	if (process.env.NODE_ENV !== 'development') {
		throw new Error('仅在开发模式下可用')
	}

	const { siteContent, cardStyles, files } = data
	
	// 1. Save Configs
	fs.writeFileSync(path.join(process.cwd(), 'src/config/site-content.json'), JSON.stringify(siteContent, null, '\t'))
	fs.writeFileSync(path.join(process.cwd(), 'src/config/card-styles.json'), JSON.stringify(cardStyles, null, '\t'))

	// 2. Save Files
	for (const file of files) {
		const fullPath = path.join(process.cwd(), file.filePath)
		const dir = path.dirname(fullPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		const buffer = Buffer.from(file.contentBase64, 'base64')
		fs.writeFileSync(fullPath, buffer)
	}

	return { success: true }
}
