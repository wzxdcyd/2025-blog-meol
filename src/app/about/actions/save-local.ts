'use server'

import fs from 'fs'
import path from 'path'
import type { AboutData } from '../services/push-about'

export async function saveLocalAbout(data: AboutData) {
	if (process.env.NODE_ENV !== 'development') {
		throw new Error('仅在开发模式下可用')
	}

	const listFile = path.join(process.cwd(), 'src/app/about/list.json')

	fs.writeFileSync(listFile, JSON.stringify(data, null, '\t'))

	return { success: true }
}
