'use server'

import fs from 'fs'
import path from 'path'
import type { Project } from '../components/project-card'

type ImageToSave = {
	urlKey: string // The project URL used as key in the map to identify which project this image belongs to
	name: string
	contentBase64: string // without prefix
}

type LocalProjectsData = {
	projects: Project[]
	localImages: ImageToSave[]
}

export async function saveLocalProjects(data: LocalProjectsData) {
	if (process.env.NODE_ENV !== 'development') {
		throw new Error('仅在开发模式下可用')
	}

	const { projects, localImages } = data
	const imagesDir = path.join(process.cwd(), 'public/images/project')
	const listFile = path.join(process.cwd(), 'src/app/projects/list.json')

	// 1. Create directory
	if (!fs.existsSync(imagesDir)) {
		fs.mkdirSync(imagesDir, { recursive: true })
	}

	// 2. Save images
	const urlToPathMap = new Map<string, string>()
	for (const img of localImages) {
		const buffer = Buffer.from(img.contentBase64, 'base64')
		fs.writeFileSync(path.join(imagesDir, img.name), buffer)
		urlToPathMap.set(img.urlKey, `/images/project/${img.name}`)
	}

	// 3. Update projects list with new image paths
	const updatedProjects = projects.map(p => {
		if (urlToPathMap.has(p.url)) {
			return { ...p, image: urlToPathMap.get(p.url)! }
		}
		return p
	})

	// 4. Save list.json
	fs.writeFileSync(listFile, JSON.stringify(updatedProjects, null, '\t'))

	return { success: true }
}
