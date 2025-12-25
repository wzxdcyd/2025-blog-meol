'use client'

import React, { useEffect, useRef } from 'react'
import { init } from '@waline/client'
import '@waline/client/waline.css'
import { cn } from '@/lib/utils'

interface CommentsProps {
	className?: string
	path?: string
}

export const Comments = ({ className, path }: CommentsProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const walineInstanceRef = useRef<any>(null)

	useEffect(() => {
		if (!containerRef.current) return

		const serverURL = process.env.NEXT_PUBLIC_WALINE_SERVER_URL
		if (!serverURL) {
			console.warn('Waline serverURL is not configured. Comments will not be loaded.')
			return
		}

		try {
			walineInstanceRef.current = init({
				el: containerRef.current,
				serverURL,
				path: path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
				dark: 'html[class="dark"]',
			})
		} catch (e) {
			console.error('Failed to initialize Waline:', e)
		}

		return () => {
			if (walineInstanceRef.current) {
				walineInstanceRef.current.destroy()
			}
		}
	}, [path])

	return <div className={cn('mt-10 w-full', className)} ref={containerRef} />
}
