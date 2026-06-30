import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  // ⭐ 核心：必须放在最前面，告诉 ESLint 绝对不要扫描这些文件夹
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/out/**",
      "**/build/**"
    ]
  },

  ...compat.extends("next/core-web-vitals"),
  
  {
    rules: {},
  },
];

export default eslintConfig;