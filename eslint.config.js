import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist/**", "node_modules/**"] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        files: ["src/**/*.ts", "vite.config.ts"],
        languageOptions: {
            globals: {
                document: "readonly",
                window: "readonly",
                navigator: "readonly",
                localStorage: "readonly",
                performance: "readonly",
                console: "readonly",
                Blob: "readonly",
                URL: "readonly",
                Image: "readonly",
                FileReader: "readonly",
                HTMLCanvasElement: "readonly",
                HTMLElement: "readonly",
                crypto: "readonly",
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            // Legacy code intentionally contains compatibility fallbacks and
            // staged feature hooks. TypeScript remains the unused-code gate
            // until those hooks have been migrated out of run.ts.
            "@typescript-eslint/no-unused-vars": "off",
            "no-empty": "off",
            "no-irregular-whitespace": "off",
            "no-useless-assignment": "off",
            "no-useless-escape": "off",
            "prefer-const": "off",
            "no-debugger": "error",
            "no-eval": "error",
        },
    },
);
