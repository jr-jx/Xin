import blogConfig from '~~/blog.config'

// 个人信息数据
export const profile = {
	name: blogConfig.profile.name,
	bio: blogConfig.profile.bio,
	avatar: blogConfig.profile.avatar,
	location: '中国',
	birthYear: '2004',
	education: '软件工程技术',
	profession: '设计师 & 开发者',
}

// 技能标签
export const skills = [
	{ name: 'Figma', icon: 'i-skill-icons:figma-light' },
	{ name: 'Sketch', icon: 'i-devicon:sketch' },
	{ name: 'Vue.js', icon: 'i-skill-icons:vuejs-light' },
	{ name: 'TypeScript', icon: 'i-skill-icons:typescript' },
	{ name: 'CSS/SCSS', icon: 'i-skill-icons:css' },
	{ name: 'Git', icon: 'i-skill-icons:git' },
	{ name: 'Photoshop', icon: 'i-skill-icons:photoshop' },
	{ name: 'Illustrator', icon: 'i-skill-icons:illustrator' },
]

export const personalitie = {
	title: '领导者',
	en_title: 'ENFJ-A',
	color: '#56a178',
	img: 'https://cdn.lightxi.com/cloudreve/uploads/2025/07/31/4jR76Exr_enfj.svg',
	link: 'https://www.16personalities.com/enfj-personality',
}

// 个人介绍
export const introduction = {
	title: '为什么建站？',
	content: `创建这个站的时候，想要就是能够有一个自己能够积累知识、积累兴趣的地方。和他人分享，会让这些成为积累和沉淀。如果能够帮助到更多的人，帮助更多人解决问题，那一定是非常棒的事情。

分享这件事我从很早就开始了，因为我比较喜欢研究设计和开发，想要探究在互联网上的事物是如何被创造和发展的。网络给我带来了非常多的知识和眼界，我也想力所能及的分享一些我生活的琐碎知识。

与大多数垂直类的技术博客不同，这里的种类会非常的繁杂，有技能的教程干货、有生活上的吐槽和妙招、有话题上的思考和想法。一般我研究什么、发现了什么都会分享在这里。

这些就是创造这个小站的本意，也是我分享生活的方式。有幸能和你相遇在这里，相信我们能共同留下一段美好记忆。`,
}

// 默认导出所有数据
export default {
	profile,
	skills,
	introduction,
}
