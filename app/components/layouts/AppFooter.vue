<script lang="ts" setup>
import { Icon } from '#components'
import blogConfig from '~~/blog.config'
</script>

<template>
<footer id="main-footer" class="main-footer">
	<div class="footer-content">
		<div class="footer-left">
			<div class="copyright">
				<span class="time">© {{ new Date(blogConfig.site.timeEstablished).getFullYear() }} - {{ new Date().getFullYear() }} By </span>
				<a :href="blogConfig.profile.homepage" class="author link" target="_blank">
					<img :src="blogConfig.profile.avatar" alt="author">
					{{ blogConfig.profile.name }}
				</a>
			</div>
			<div class="beian-group">
				<a v-for="item in blogConfig.beian" :key="item.name" class="icp" :href="item.link" target="_blank">
					<img v-if="item.icon" :src="item.icon" alt="beian">
					{{ item.name }}
				</a>
				<a class="theme" target="_blank" href="https://github.com/jr-jx/Xin">
					<Icon name="solar:adhesive-plaster-bold-duotone" />
					Xin
				</a>
			</div>
		</div>
		<div class="meta">
			<a class="rss link" href="/atom.xml" target="_blank">
				<span class="name">订阅</span>
			</a>
			<a
				class="cc link"
				href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans"
				target="_blank"
			>
				<Icon name="ri:creative-commons-line" />
				<Icon name="ri:creative-commons-by-line" />
				<Icon name="ri:creative-commons-nc-line" />
				<Icon name="ri:creative-commons-nd-line" />
			</a>
		</div>
	</div>
</footer>
</template>

<style lang="scss" scoped>
.main-footer {
	display: flex;
	overflow: hidden;
	margin-top: 1rem;
	padding: 1rem 0;
	border-top: 1px solid var(--border-color);
	background-color: var(--card-bg);
	transition:
		color 0.3s,
		border 0.3s,
		background-color 0.3s;
	animation: show 0.3s backwards;

	.footer-content {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 32px;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		line-height: 1;
		color: var(--main-font-color);

		.copyright {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: center;
			gap: 4px;

			.author {
				img {
					width: 20px;
					height: 20px;
					margin-right: 4px;
					border-radius: 50%;
				}
			}
		}

		.beian-group {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.5rem;

			a {
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: 4px;
				opacity: 0.8;
				font-size: 12px;

				svg {
					font-size: 16px;
				}

				img {
					width: 16px;
					height: 16px;
				}
			}
		}

		.meta {
			display: flex;
			flex-direction: row;
			align-items: center;

			.rss {
				margin-right: 4px;

				svg {
					margin-right: 6px;
					font-weight: normal;
				}
			}

			.cc {
				svg {
					margin: 0 2px;
					font-weight: normal;
				}
			}
		}

		.link {
			display: inline-flex;
			flex-direction: row;
			align-items: center;
			overflow: hidden;
			height: 38px;
			margin: 0 2px;
			padding: 8px;
			border-radius: 12px;
			font-weight: bold;
			white-space: nowrap;
			text-overflow: ellipsis;
			transition:
				color 0.3s,
				background-color 0.3s;
			cursor: pointer;

			svg {
				margin-right: 4px;
				font-size: 22px;
				transition: color 0.3s;
			}

			&:hover {
				background-color: var(--main-color-bg);
				color: var(--main-color);

				svg {
					color: var(--main-color);
				}
			}
		}

		@media (max-width: 768px) {
			font-size: 14px;

			.meta {
				display: none;
			}
		}

		@media (max-width: 420px) {
			.copyright {
				.icp {
					svg {
						display: none;
					}
				}
			}
		}
	}
}
</style>
