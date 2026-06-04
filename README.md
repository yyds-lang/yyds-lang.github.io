# yyds-lang.github.io

YYDS Web Studio 独立站点仓库（用于组织主页 `https://yyds-lang.github.io/`）。

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## GitHub Pages

- 已包含工作流：`.github/workflows/deploy-pages.yaml`
- 仓库设置中将 `Pages` 的 `Source` 设为 `GitHub Actions`

## 迁移说明

- 本仓库已移除 monorepo `workspace:*` / `catalog:` 依赖
- 所有依赖均为明确 semver 版本
- 仍需手动补充 `public/wasm` 下的运行时资源（见 `public/wasm/README.md`）
