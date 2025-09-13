---
title: 宝塔部署 Twikoo 评论系统
tags: [bt, twikoo]
categories: [经验分享]
date: 2025-08-02
description: 本文详细介绍了如何在宝塔面板环境下部署 Twikoo 评论系统，包括 Node 环境配置、项目初始化、依赖安装、脚本配置、项目添加与启动、端口和域名设置等完整流程，适合有建站和评论系统需求的用户参考。
image: https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/5WUC8w1g_fa439908-0c1b-430c-99ab-e367939468af.png

references:
  - title: 使用宝塔面板轻松部署Twikoo评论系统
    url: https://blog.qjqq.cn/posts/908.html
---

## Twikoo 评论系统简介

Twikoo 是一个轻量级的评论系统，支持多种平台和数据库。它的特点是简单易用、开源免费，并且可以与各种前端框架兼容。

## 在宝塔面板上部署 Twikoo

直接部署 **Twikoo** 便于管理评论数据。

1. **进入网站面板**，点击**Node项目**。

![进入 Node 项目](https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/OgL6RgJd_31453bcd-10f3-4638-9a34-e2f9e9c4c629.png)

2. **添加Node版本**：点击**Node版本管理器**，选择合适的 Node 版本（如 18.x），然后点击**安装**。

![添加 Node 版本](https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/WcP3h927_475ddd82-e339-4b9e-b0e1-3f5b71c900a6.png)

3. **初始化项目文件夹**：在`/www/wwwroot`目录下创建一个新的文件夹（如`twikoo`），然后进入该文件夹。
   执行：
   ```bash
   npm init -y
   ```
   这将创建一个`package.json`文件。
   ```json
   {
     "name": "twikoo",
     "version": "1.0.0",
     "description": "Twikoo comment system",
     "main": "index.js",
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1",
     },
     "dependencies": {},
   }
   ```
4. **安装 tkserver**：在项目文件夹中执行以下命令安装 Twikoo：
    ```bash
    npm i tkserver
    ```
5. **修改配置文件**：修改`package.json`文件，添加以下内容：
    ```json
    {
      "scripts": {
        "start": "tkserver",
      },
    }
    ```
6. **添加Node项目**：回到宝塔面板的 Node 项目页面，点击**添加项目**，填写以下信息：
   - **项目目录**：选择刚才创建的`twikoo`文件夹
   - **项目名称**：填写`twikoo`
   - **启动选项**：这里选择`start: tkserver`
   - **Node版本**：选择之前安装的 Node 版本（如 18.x）
   - **包管理器**：选择`npm`，勾选`不安装依赖`

   ![填写项目信息](https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/xF3gIZSK_1ad1776d-eacb-49f9-ad63-abe49bae9076.png)

7. **启动项目**：点击**启动**按钮，等待项目启动完成。

8. **配置端口**：单击`twikoo`项目，进入项目设置页面，配置域名和端口。端口设置为`8080`。

   ![配置端口](https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/DByvSAVT_7b2824d2-0627-4965-9cba-b7f217b7086c.png)

9. **配置域名**：根据自身需要，配置域名，记得打开外网访问。

## 下课

![](https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/AfQcz2Ov_2025-08-02_122553_411.png)
