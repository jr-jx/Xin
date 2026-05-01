#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const skillDir = path.resolve(scriptDir, '..')
const skillsRoot = path.resolve(skillDir, '..')
const checks = []

function check(name, ok, detail = '') {
	checks.push({ name, ok: Boolean(ok), detail })
}

function readRelative(file) {
	const fullPath = path.join(skillDir, file)
	return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : ''
}

const skillText = readRelative('SKILL.md')
const agentText = readRelative('agents/openai.yaml')

check('SKILL.md exists', Boolean(skillText))
check('SKILL.md has frontmatter', /^---\n[\s\S]+?\n---\n/.test(skillText))
check('SKILL.md name is project', /name:\s*project/.test(skillText))
check('SKILL.md description has Chinese triggers', /项目维护|博客内容|部署|排障/.test(skillText))
check('SKILL.md delegates dependency work', /依赖|dependency/.test(skillText) && /dependency-update/.test(skillText))
check('SKILL.md delegates changelog work', /修改日志|更新日志|changelog/.test(skillText) && /commit-changelog/.test(skillText))

check('agents/openai.yaml exists', Boolean(agentText))
check('agents/openai.yaml keeps display name', /display_name:\s*["']Xin Project["']/.test(agentText))
check('agents/openai.yaml describes workflow', /工作流|workflow/i.test(agentText))
check('agents/openai.yaml allows implicit invocation', /allow_implicit_invocation:\s*true/.test(agentText))

const linkedReferences = [...skillText.matchAll(/references\/([A-Za-z0-9_.-]+\.md)/g)].map(match => `references/${match[1]}`)
for (const file of new Set(linkedReferences))
	check(`${file} exists`, existsSync(path.join(skillDir, file)))

const expectedReferences = [
	'references/project-map.md',
	'references/task-workflows.md',
	'references/validation-matrix.md',
	'references/content-guide.md',
]
for (const file of expectedReferences)
	check(`${file} present`, existsSync(path.join(skillDir, file)))

const expectedScripts = [
	'scripts/project_snapshot.mjs',
	'scripts/verification_picker.mjs',
	'scripts/skill_doctor.mjs',
]
for (const file of expectedScripts) {
	const fullPath = path.join(skillDir, file)
	check(`${file} present`, existsSync(fullPath))
	if (existsSync(fullPath)) {
		const mode = statSync(fullPath).mode
		check(`${file} has shebang`, readFileSync(fullPath, 'utf8').startsWith('#!/usr/bin/env node'))
		check(`${file} syntax check`, (() => {
			try {
				execFileSync(process.execPath, ['--check', fullPath], { stdio: 'pipe' })
				return true
			}
			catch {
				return false
			}
		})())
		check(`${file} executable bit`, (mode & 0o111) !== 0, 'recommended for direct local execution')
	}
}

const expectedProjectSkills = ['project', 'dependency-update', 'commit-changelog']
for (const name of expectedProjectSkills) {
	const dir = path.join(skillsRoot, name)
	const skillFile = path.join(dir, 'SKILL.md')
	const agentFile = path.join(dir, 'agents/openai.yaml')
	const nestedSkillText = existsSync(skillFile) ? readFileSync(skillFile, 'utf8') : ''
	const nestedAgentText = existsSync(agentFile) ? readFileSync(agentFile, 'utf8') : ''
	check(`project skill ${name} directory exists`, existsSync(dir))
	check(`project skill ${name} frontmatter name matches directory`, new RegExp(`name:\\s*${name}\\b`).test(nestedSkillText))
	check(`project skill ${name} agent prompt uses matching token`, new RegExp(`\\$${name}\\b`).test(nestedAgentText))
}

const skillDirectories = existsSync(skillsRoot)
	? execFileSync('find', [skillsRoot, '-mindepth', '1', '-maxdepth', '1', '-type', 'd', '-print'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean)
	: []
for (const dir of skillDirectories) {
	const name = path.basename(dir)
	check(`project skill ${name} avoids xin-* prefix`, !name.startsWith('xin-'))
	check(`project skill ${name} uses hyphen-case naming`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
}

const failed = checks.filter(item => !item.ok)
console.log(JSON.stringify({
	ok: failed.length === 0,
	checks,
}, null, 2))

if (failed.length > 0)
	process.exitCode = 1
