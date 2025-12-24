import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore } from '../stores/preview-store'
import { usePublish } from '../hooks/use-publish'
import { saveLocalBlog } from '../actions/save-local'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { getFileExt } from '@/lib/utils'

export function WriteActions() {
	const { loading, mode, form, loadBlogForEdit, originalSlug, updateForm, images, cover } = useWriteStore()
	const { openPreview } = usePreviewStore()
	const { isAuth, onChoosePrivateKey, onPublish, onDelete } = usePublish()
	const [saving, setSaving] = useState(false)
	const keyInputRef = useRef<HTMLInputElement>(null)
	const mdInputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

	const handleImportOrPublish = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			onPublish()
		}
	}

	const handleCancel = () => {
		if (!window.confirm('放弃本次修改吗？')) {
			return
		}
		if (mode === 'edit' && originalSlug) {
			router.push(`/blog/${originalSlug}`)
		} else {
			router.push('/')
		}
	}

	const handleSaveLocal = async () => {
		if (!form.slug || !form.title) {
			toast.error('请填写标题和 Slug')
			return
		}

		try {
			setSaving(true)
			toast.info('正在准备本地保存...')

			const localImages: { name: string; contentBase64: string }[] = []
			let mdToUpload = form.md
			let coverPath: string | undefined = undefined

			// Helper to process image
			const processImage = async (img: any, isCover: boolean) => {
				if (img.type === 'file') {
					const hash = img.hash || (await hashFileSHA256(img.file))
					const ext = getFileExt(img.file.name)
					const filename = `${hash}${ext}`
					
					// Avoid duplicate processing if same file used multiple times
					if (!localImages.some(li => li.name === filename)) {
						const contentBase64 = await fileToBase64NoPrefix(img.file)
						localImages.push({ name: filename, contentBase64 })
					}

					const publicPath = `/blogs/${form.slug}/${filename}`

					// Replace in Markdown
					const placeholder = `local-image:${img.id}`
					mdToUpload = mdToUpload.split(`(${placeholder})`).join(`(${publicPath})`)

					if (isCover) coverPath = publicPath
				} else if (img.type === 'url' && isCover) {
					coverPath = img.url
				}
			}

			// Process content images
			for (const img of images) {
				await processImage(img, false)
			}
			// Process cover
			if (cover) {
				await processImage(cover, true)
			}
			
			// Handle cover if it was not a file but matched a content image file or was just a URL
			if (cover?.type === 'file' && !coverPath) {
				// Should have been set in processImage, but double check logic
			}

			await saveLocalBlog({
				slug: form.slug,
				title: form.title,
				md: mdToUpload,
				tags: form.tags,
				date: form.date || new Date().toISOString(),
				summary: form.summary,
				hidden: form.hidden,
				category: form.category,
				coverUrl: coverPath,
				localImages
			})

			toast.success('已保存到本地 public/blogs')
		} catch (error: any) {
			console.error(error)
			toast.error('保存失败: ' + error.message)
		} finally {
			setSaving(false)
		}
	}

	const buttonText = isAuth ? (mode === 'edit' ? '更新' : '发布') : '导入密钥'

	const handleDelete = () => {
		if (!isAuth) {
			toast.info('请先导入密钥')
			return
		}
		const confirmMsg = form?.title ? `确定删除《${form.title}》吗？该操作不可恢复。` : '确定删除当前文章吗？该操作不可恢复。'
		if (window.confirm(confirmMsg)) {
			onDelete()
		}
	}

	const handleImportMd = () => {
		mdInputRef.current?.click()
	}

	const handleMdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		try {
			const text = await file.text()
			updateForm({ md: text })
			toast.success('已导入 Markdown 文件')
		} catch (error) {
			toast.error('导入失败，请重试')
		} finally {
			if (e.currentTarget) e.currentTarget.value = ''
		}
	}

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await onChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>
			<input ref={mdInputRef} type='file' accept='.md' className='hidden' onChange={handleMdFileChange} />

			<ul className='absolute top-4 right-6 flex items-center gap-2'>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='bg-card rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700'
					disabled={loading || saving}
					onClick={handleSaveLocal}>
					保存到本地
				</motion.button>

				{mode === 'edit' && (
					<>
						<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='flex items-center gap-2'>
							<div className='rounded-lg border bg-blue-50 px-4 py-2 text-sm text-blue-700'>编辑模式</div>
						</motion.div>

						<motion.button
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100'
							disabled={loading}
							onClick={handleDelete}>
							删除
						</motion.button>

						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={saving}
							className='bg-card rounded-xl border px-4 py-2 text-sm'>
							取消
						</motion.button>
					</>
				)}

				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='bg-card rounded-xl border px-4 py-2 text-sm'
					disabled={loading}
					onClick={handleImportMd}>
					导入 MD
				</motion.button>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='bg-card rounded-xl border px-6 py-2 text-sm'
					disabled={loading}
					onClick={openPreview}>
					预览
				</motion.button>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='brand-btn px-6'
					disabled={loading}
					onClick={handleImportOrPublish}>
					{buttonText}
				</motion.button>
			</ul>
		</>
	)
}
