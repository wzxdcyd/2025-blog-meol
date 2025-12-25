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

		walineInstanceRef.current = init({
			el: containerRef.current,
			serverURL: process.env.NEXT_PUBLIC_WALINE_SERVER_URL || '',
			path: path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
			dark: 'html[class="dark"]',
		})

		return () => {
			if (walineInstanceRef.current) {
				walineInstanceRef.current.destroy()
			}
		}
	}, [path])

	return <div className={cn('mt-10 w-full', className)} ref={containerRef} />
}
