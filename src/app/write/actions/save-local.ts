'use server'

import fs from 'fs'
import path from 'path'
import { readdir } from 'fs/promises'

type ImageToSave = {
	name: string
	contentBase64: string // without prefix
}

type LocalBlogData = {
	slug: string
	title: string
	md: string
	tags: string[]
	date: string
	summary?: string
	hidden?: boolean
	category?: string
	coverUrl?: string // if external url
	localImages: ImageToSave[] // cover can be here too
}

export async function saveLocalBlog(data: LocalBlogData) {
	if (process.env.NODE_ENV !== 'development') {
		throw new Error('仅在开发模式下可用')
	}

	const { slug, localImages, md, ...configRest } = data
	const blogDir = path.join(process.cwd(), 'public/blogs', slug)

	// 1. Create directory
	if (!fs.existsSync(blogDir)) {
		fs.mkdirSync(blogDir, { recursive: true })
	}

	// 2. Save images
	for (const img of localImages) {
		const buffer = Buffer.from(img.contentBase64, 'base64')
		fs.writeFileSync(path.join(blogDir, img.name), buffer)
	}

	// 3. Save config.json
	const { coverUrl, ...rest } = configRest
	const config = {
		...rest,
		cover: coverUrl
	}
	fs.writeFileSync(path.join(blogDir, 'config.json'), JSON.stringify(config, null, 2))

	// 4. Save index.md
	fs.writeFileSync(path.join(blogDir, 'index.md'), md)

	// 5. Update index.json (Sync logic)
	await syncBlogsIndex()

	return { success: true }
}

async function syncBlogsIndex() {
	const BLOGS_DIR = path.join(process.cwd(), 'public/blogs')
	const INDEX_FILE = path.join(BLOGS_DIR, 'index.json')

	const entries = await readdir(BLOGS_DIR, { withFileTypes: true })
	const folders = entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

	const blogIndex = folders
		.map(slug => {
			const configPath = path.join(BLOGS_DIR, slug, 'config.json')
			if (fs.existsSync(configPath)) {
				try {
					const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
					return {
						slug,
						...config
					}
				} catch {
					return null
				}
			}
			return null
		})
		.filter(Boolean)

	// Sort by date desc
	blogIndex.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

	fs.writeFileSync(INDEX_FILE, JSON.stringify(blogIndex, null, 2))
}
