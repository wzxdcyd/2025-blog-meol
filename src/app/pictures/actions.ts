'use server'

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const PICTURES_DIR = path.join(process.cwd(), 'public/images/pictures')
const LIST_JSON_PATH = path.join(process.cwd(), 'src/app/pictures/list.json')

interface Picture {
	id: string
	uploadedAt: string
	description?: string
	image?: string // Compatibility
	images?: string[]
}

export async function savePicturesLocally(formData: FormData) {
	if (process.env.NODE_ENV !== 'development') {
		throw new Error('Local save is only available in development mode')
	}

	try {
		const picturesJson = formData.get('pictures') as string
		if (!picturesJson) throw new Error('Missing pictures data')

		let pictures: Picture[] = JSON.parse(picturesJson)
		
		// Ensure directory exists
		await fs.mkdir(PICTURES_DIR, { recursive: true })

		// 1. Process uploaded files
		const uploadedFiles = new Map<string, string>() // key -> filename
		
		// Helper to calculate hash
		const getHash = async (buffer: Buffer) => {
			const hash = crypto.createHash('sha256')
			hash.update(buffer)
			return hash.digest('hex').slice(0, 16)
		}

		// Iterate over FormData to find files
		// Keys are expected to be "id::index"
		for (const [key, value] of Array.from(formData.entries())) {
			if (typeof value === 'object' && (value as any).name) { // It's a File
				const file = value as File
				if (key === 'pictures') continue

				const arrayBuffer = await file.arrayBuffer()
				const buffer = Buffer.from(arrayBuffer)
				const hash = await getHash(buffer)
				const ext = path.extname(file.name)
				const filename = `${hash}${ext}`
				const filePath = path.join(PICTURES_DIR, filename)

				// Write file if it doesn't exist (or just overwrite)
				await fs.writeFile(filePath, buffer)
				
				// Update the mapping logic
				// We need to update the specific picture's image list
				const [pictureId, indexStr] = key.split('::')
				const imageIndex = parseInt(indexStr, 10)

				pictures = pictures.map(p => {
					if (p.id !== pictureId) return p

					const currentImages = p.images && p.images.length > 0 ? [...p.images] : (p.image ? [p.image] : [])
					// Ensure array is large enough (though it should be)
					if (currentImages[imageIndex] !== undefined || currentImages.length === imageIndex) {
						currentImages[imageIndex] = `/images/pictures/${filename}`
					}
					
					return {
						...p,
						image: undefined, // Clear legacy field
						images: currentImages
					}
				})
			}
		}

		// 2. Identify and delete unused files
		// Read current list.json to know what was there before, but actually
		// we should look at the file system or just compare with the NEW list vs OLD list?
		// A safer approach is: Read all files in the directory, and delete those NOT in the new list.
		
		const currentFiles = await fs.readdir(PICTURES_DIR)
		const activeFiles = new Set<string>()
		
		pictures.forEach(p => {
			p.images?.forEach(url => {
				if (url.startsWith('/images/pictures/')) {
					activeFiles.add(path.basename(url))
				}
			})
			if (p.image && p.image.startsWith('/images/pictures/')) {
				activeFiles.add(path.basename(p.image))
			}
		})

		for (const file of currentFiles) {
			if (!activeFiles.has(file) && file !== '.DS_Store') {
				// Safety check: only delete likely image files or check against known extensions?
				// For now, assume anything in this folder not in the list is garbage.
				try {
					await fs.unlink(path.join(PICTURES_DIR, file))
				} catch (e) {
					console.error(`Failed to delete orphan file: ${file}`, e)
				}
			}
		}

		// 3. Save new list.json
		await fs.writeFile(LIST_JSON_PATH, JSON.stringify(pictures, null, '\t'))

		return { success: true }
	} catch (error: any) {
		console.error('Local save failed:', error)
		throw new Error(error.message || 'Local save failed')
	}
}
