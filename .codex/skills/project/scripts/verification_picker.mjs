#!/usr/bin/env node
import { execFileSync } from 'node:child_process'

function unique(values) {
	return [...new Set(values.filter(Boolean))]
}

function changedFilesFromGit() {
	const commands = [
		['git', ['diff', '--name-only']],
		['git', ['diff', '--name-only', '--cached']],
	]
	const files = []
	for (const [cmd, args] of commands) {
		try {
			files.push(...execFileSync(cmd, args, { encoding: 'utf8' }).split(/\r?\n/))
		}
		catch {
			return []
		}
	}
	return unique(files)
}

const files = unique(process.argv.slice(2).length > 0 ? process.argv.slice(2) : changedFilesFromGit())

function classify(file) {
	if (/^\.codex\/skills\/project\//.test(file))
		return { type: 'skill', command: 'node .codex/skills/project/scripts/skill_doctor.mjs', reason: 'Project skill metadata, references, or scripts changed' }
	if (/^content\/posts\/.+\.md$/.test(file))
		return { type: 'content', command: null, reason: 'Markdown post changed; build only if schema, feed, or rendering behavior is affected' }
	if (/^content\.config\.ts$/.test(file))
		return { type: 'content-config', command: 'pnpm build', reason: 'Nuxt Content schema changed' }
	if (/^(nuxt\.config\.ts|blog\.config\.ts|app\/app\.config\.ts)$/.test(file))
		return { type: 'config', command: 'pnpm build', reason: 'Nuxt or site config changed' }
	if (/^server\/(?:api|routes)\//.test(file))
		return { type: 'server', command: /^server\/routes\/(?:atom\.xml|efu\.opml)\.get\.ts$/.test(file) ? 'pnpm generate' : 'pnpm build', reason: 'Nitro server code changed' }
	if (/\.vue$|\.tsx?$|\.jsx?$/.test(file))
		return { type: 'app-code', command: 'pnpm lint:fix', reason: 'Vue or client TypeScript changed' }
	if (/\.s?css$/.test(file))
		return { type: 'style', command: 'pnpm lint:fix', reason: 'SCSS or CSS changed' }
	if (/^(netlify\.toml|pnpm-workspace\.yaml|package\.json|pnpm-lock\.yaml)$/.test(file) || /^patches\//.test(file))
		return { type: 'dependency-or-deploy', command: 'pnpm build', reason: 'Dependency, workspace, patch, or deploy config changed' }
	return { type: 'other', command: null, reason: 'No Nuxt-specific verification rule matched' }
}

const classified = files.map(file => ({ file, ...classify(file) }))
const commands = unique(classified.map(item => item.command))

const notes = []
if (classified.some(item => item.type === 'content'))
	notes.push('For Markdown-only edits with valid frontmatter, no full build is required; run pnpm build if feed, SEO, or rendering behavior matters.')
if (classified.some(item => item.type === 'dependency-or-deploy'))
	notes.push('If dependency versions or lockfile changed, confirm install state before building.')
if (commands.includes('pnpm generate'))
	notes.push('pnpm generate covers prerender/static output risks and is preferred for Atom/OPML/static deploy changes.')

console.log(JSON.stringify({
	files,
	recommendations: commands,
	notes,
	details: classified,
}, null, 2))
