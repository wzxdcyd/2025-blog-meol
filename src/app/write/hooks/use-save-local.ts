import { useCallback } from 'react'
import { toast } from 'sonner'
import { useWriteStore } from '../stores/write-store'
import { saveLocalBlog } from '../actions/save-local'
import { fileToBase64NoPrefix } from '@/lib/file-utils'
import { getFileExt } from '@/lib/utils'
import { formatDateTimeLocal } from '../stores/write-store'

export function useSaveLocal() {
	const { form, cover, images, setLoading } = useWriteStore()
	// Next.js explicitly replaces process.env.NODE_ENV at build time
	const isDev = process.env.NODE_ENV === 'development'

	const handleSaveLocal = useCallback(async () => {
		try {
			if (!form.slug) {
				toast.error('请输入 Slug')
				return
			}

			setLoading(true)
			toast.info('正在保存到本地...')

			const dateStr = form.date || formatDateTimeLocal()

			// Prepare images
			const localImages: { name: string; contentBase64: string }[] = []
			let mdToSave = form.md
			let coverUrl = undefined

			// Helper to process an image file
			const processImage = async (file: File, id: string, isCover: boolean = false) => {
				const base64 = await fileToBase64NoPrefix(file)
				const ext = getFileExt(file.name)
				// Use a simple naming convention for local dev: img-{id}.{ext}
				// This avoids hash calculation overhead and potential complexity
				const filename = isCover ? `cover-${id}${ext}` : `img-${id}${ext}`
				
				return { filename, base64 }
			}

			// Process content images
			for (const img of images || []) {
				if (img.type === 'file') {
					const { filename, base64 } = await processImage(img.file, img.id)
					
					localImages.push({
						name: filename,
						contentBase64: base64
					})

					const placeholder = `local-image:${img.id}`
					const publicPath = `/blogs/${form.slug}/${filename}`
					mdToSave = mdToSave.split(`(${placeholder})`).join(`(${publicPath})`)

					// If this content image is also the cover
					if (cover?.type === 'file' && cover.id === img.id) {
						coverUrl = publicPath
					}
				}
			}

			// Process separate cover image if needed
			if (cover?.type === 'file') {
				// Check if this cover file was already processed as a content image
				const alreadyProcessed = localImages.some(img => img.name.includes(cover.id))
				
				if (!alreadyProcessed) {
					const { filename, base64 } = await processImage(cover.file, cover.id, true)
					
					localImages.push({
						name: filename,
						contentBase64: base64
					})
					
					coverUrl = `/blogs/${form.slug}/${filename}`
				}
			} else if (cover?.type === 'url') {
				coverUrl = cover.url
			}

			await saveLocalBlog({
				slug: form.slug,
				title: form.title,
				md: mdToSave,
				tags: form.tags,
				date: dateStr,
				summary: form.summary,
				hidden: form.hidden,
				category: form.category,
				coverUrl,
				localImages
			})

			toast.success('已保存到本地 public/blogs')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message || '保存失败')
		} finally {
			setLoading(false)
		}
	}, [form, cover, images, setLoading])

	return { handleSaveLocal, isDev }
}
