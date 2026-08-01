# 沟厢品尚厨卫设计

面向厨房、卫浴方案设计的 2D / 3D WebGL 工具，包含本地方案库、PBR 材质、已验收真实模型、渐进式高清预览和 Android 壳应用。

- 在线体验：https://shi3435254161-lgtm.github.io/empty/
- Android 安装包：https://github.com/shi3435254161-lgtm/empty/releases/tag/v1.1.0

## 本地运行

```powershell
npm ci
npm run dev
```

打开 `http://127.0.0.1:8765/`。不要直接双击 `index.html`，模型、HDRI 和 Service Worker 需要通过 HTTP 加载。

## 生产 Web 包

```powershell
npm run build:web
```

输出到 `dist/web`。构建脚本只复制已验收的生产模型，不会把 Sketchfab 下载区、待验收素材和隔离素材发布出去。推送 `main` 分支后，GitHub Actions 会自动部署 GitHub Pages。

## Android

需要 Java 21 和 Android SDK 36。

```powershell
npm run build:android-web
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

调试 APK 位于 `android/app/build/outputs/apk/debug/app-debug.apk`。发布版还需要单独配置签名密钥；密钥、APK 和本机 `local.properties` 均不会提交到 Git。

## 素材与授权

- Poly Haven、ambientCG 素材按各目录中的授权信息使用，主要为 CC0。
- Sketchfab 模型仅允许已完成画面验收且授权明确的条目进入生产包。
- CC BY 模型的作者、来源和协议保存在模型注册表及应用内署名信息中。
- Sketchfab API Token 只能通过 `SKETCHFAB_TOKEN` 环境变量提供，禁止写入代码、提交记录或前端包。
