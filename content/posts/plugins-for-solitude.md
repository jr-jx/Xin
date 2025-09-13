---
title: 在 Solitude 上优雅的使用 CDN 加速静态资源文件
tags: [Solitude]
categories: [实用教程]
date: 2025-08-11
description: 本文介绍了如何在 Solitude 博客主题中配置 CDN 加速静态资源文件，包括内置 CDN、第三方 CDN、自定义格式和自建第三方插件 CDN 的详细步骤，帮助用户提升网站性能和加载速度。
image: https://cdn.lightxi.com/cloudreve/uploads/2025/08/11/ehJKn09c_a6d3ae108b21a8d80e1924352e76242d.jpg
---

什么是 CDN？

> CDN（Content Delivery Network）是一种分布式的网络架构，旨在通过将内容存储在多个地理位置分散的服务器上来加速内容的传输。CDN 可以显著提高网站的加载速度和可靠性，尤其是对于静态资源文件如图片、CSS 和 JavaScript 文件。

## 在 Solitude 上配置 CDN

以下是完整的配置项：
```yml
# --------------------------- start ---------------------------
# 非必要请勿修改
CDN:
  internal: local # local / cdnjs / jsdelivr / unpkg / custom
  third_party: cdnjs # cdnjs / jsdelivr / unpkg / custom
  version: true # 是否使用版本号
  custom_format: https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/${cdnjs_name}/${version}/${min_cdnjs_file}
  # 直接覆盖默认 CDN 链接（优先级最高）
  options:
    # algolia_search
    # aplayer_css
    # aplayer_js
    # artalk_css
    # artalk_js
    # blueimp_md5
    # busuanzi_js
    # chart_js
    # color_thief
    # fancyapps_css
    # fancyapps_ui
    # fontawesome
    # instantsearch
    # katex
    # katex_copytex
    # lazyload
    # medium_zoom
    # mermaid_js
    # meting_js
    # pace_js
    # pjax
    # qrcode
    # snackbar
    # swiper_css
    # swiper_js
    twikoo: https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/twikoo/1.6.40/twikoo.all.min.js
    # typeit_js
    # valine
    # waline_css
    # waline_js
# --------------------------- end ---------------------------
```

## Internal

此部分代表 Solitude 内部文件使用的 CDN 配置，通常不需要修改。

**如果你魔改的有关js的内容**请保持它使用`local`，以避免出现问题。

可选项：`local` / `cdnjs` / `jsdelivr` / `unpkg` / `custom`

## Third Party

此部分代表第三方文件使用的 CDN 配置。

可选项：`cdnjs` / `jsdelivr` / `unpkg` / `custom`

## Version

如果设置为 `true`，则会在 CDN 链接中添加版本号。

## Custom Format

> 这部分算高级配置

如果你选择了 `custom`，则需要提供一个自定义格式的 CDN 链接。

例如：
```yml
custom_format: https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/${cdnjs_name}/${version}/${min_cdnjs_file}
```
其中 `${cdnjs_name}` 是库的名称，`${version}` 是版本号，`${min_cdnjs_file}` 是压缩后的文件名。

| 变量名              | 说明               |
|-------------------|------------------|
| `${name}`         | 库的名称            |
| `${cdnjs_name}`   | CDNJS 上的库名称       |
| `${version}`      | 版本号             |
| `${file}`        | 原始文件名           |
| `${cdnjs_file}` | CDNJS 上的文件名       |
| `${min_file}`    | 压缩后的文件名         |
| `${min_cdnjs_file}` | CDNJS 上的压缩文件名  |

## Options

此部分代表你可以覆盖的 CDN 链接。

例如，如果你想使用自定义的 Twikoo CDN 链接，可以在 `options` 中添加：
```yml
twikoo: https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/twikoo/1.6.40/twikoo.all.min.js
```

## 自建第三方插件 CDN

如果你有自己的服务器或者云存储，想要自建第三方插件的 CDN（此方法有易于网站维护，保证网站稳定性），可以按照以下步骤进行：

1. 在博客根目录下新建 `plugins.js` 文件。（PS：注意两个变量 `isNPM` 和 `foderName` 的值，此方法不是唯一❗️）
    ```js
    #!/usr/bin/env node
    /**
     * plugins.js
     * 用于下载 Hexo 主题 Solitude 中第三方的插件文件。
     * 该脚本会读取主题目录下的 plugins.yml 文件，解析其中的插件信息，
     * 并从 CDN 上下载相应的文件到指定的本地目录。
     * node plugins.js
     */

    // 变量
    const isNPM = true; // 是否是 NPM 安装
    const foderName = 'plugins'; // 存储文件夹名称

    // 模块
    const fs = require('node:fs');
    const fsPromises = require('node:fs/promises');
    const https = require('node:https');
    const path = require('node:path');

    const THEME_DIR = isNPM ? path.join(__dirname, 'node_modules', 'hexo-theme-solitude') : path.join(__dirname, 'themes', 'solitude');
    const PLUGIN_FILE = path.join(THEME_DIR, 'plugins.yml');
    const OUTPUT_DIR = path.join(__dirname, foderName);

    function parsePluginsYml(text) {
      const res = {};
      let cur = null;
      text.split(/\r?\n/).forEach((l) => {
        const ln = l.split('#')[0].trimEnd();
        if (!ln)
    return;
        const sec = ln.match(/^([\w\-]+):\s*$/);
        if (sec) {
          cur = sec[1];
          res[cur] = {};
          return;
        }
        const kv = ln.match(/^ {2}([\w\-]+):(.+)$/);
        if (kv && cur) {
          res[cur][kv[1]] = kv[2].trim();
        }
      });
      return res;
    }

    async function mkdirp(d) {
      try {
        await fsPromises.mkdir(d, { recursive: true });
      }
    catch (e) {
        if (e.code !== 'EEXIST')
    throw e;
      }
    }

    function fetch(url, dest) {
      return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
          // 处理重定向
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            response.destroy();
            return fetch(response.headers.location, dest).then(resolve, reject);
          }

          if (response.statusCode !== 200) {
            response.destroy();
            return reject(new Error(`${response.statusCode} ${url}`));
          }

          const fileStream = fs.createWriteStream(dest);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(resolve);
          });

          fileStream.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
          });
        }).on('error', (err) => {
          reject(err);
        });
      });
    }

    function minFile(f) {
      return f.replace(/(?<!\.min)\.(js|css)$/i, '.min.$1');
    }

    (async () => {
      try {
        const pluginsText = await fsPromises.readFile(PLUGIN_FILE, 'utf8');
        const plugins = parsePluginsYml(pluginsText);
        await mkdirp(OUTPUT_DIR);

        for (const [key, def] of Object.entries(plugins)) {
          if (!def.name || !def.file || !def.version) {
            console.warn(`[SKIP] ${key} 缺少 name/file/version`);
            continue;
          }

          const { name, file, version, other_name } = def;

          const dirName = `${other_name || name}@${version}`;

          const url = `https://cdnjs.cloudflare.com/ajax/libs/${other_name || name}/${version}/${minFile(file.replace(/^[lib|dst]*\/|browser\//g, ''))}`;

          const dest = path.join(OUTPUT_DIR, dirName, file);

          try {
            await fsPromises.access(dest);
            console.log(`[SKIP] ${key}`);
            continue;
          }
    catch (e) {
            if (e.code !== 'ENOENT') {
              console.error(`[ERROR] ${key} 访问文件失败: ${e.message}`);
              continue;
            }
          }

          console.log(`[DOWN] ${key} → ${dest}`);
          try {
            await mkdirp(path.dirname(dest));
            await fetch(url, dest);
            console.log(`[OK]   ${key}`);
          }
    catch (e) {
            console.error(`[FAIL] ${key}: ${e.message}`);
          }
        }
        console.log('全部完成！');
      }
    catch (error) {
        console.error(`脚本执行失败: ${error.message}`);
      }
    })();
    ```
2. 执行脚本：
   ```bash
   node plugins.js
   ```
   这将会下载所有在 `plugins.yml` 中定义的插件文件到 `plugins`（或者你定义的文件夹） 文件夹中。
3. 将整个 `plugins` 文件夹上传到你的服务器或云存储中。
4. 在你的博客配置文件中，将 `CDN.third_party` 设置为 `custom`
    ```yml
    CDN:
      third_party: custom
    ```
5. 修改 `CDN.custom_format`，将其指向你上传的 `plugins` 文件夹的 URL，例如：
    ```yml
    CDN:
      custom_format: https://your-cdn-url.com/plugins/${cdnjs_name}/${version}/${min_cdnjs_file}
    ```

这样就可以在 Solitude 中使用自定义的 CDN 链接了。
