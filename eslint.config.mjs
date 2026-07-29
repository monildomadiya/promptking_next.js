import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals.map(config => {
     if (config.rules) {
       return {
         ...config,
         rules: {
           ...config.rules,
           "react-hooks/set-state-in-effect": "off",
           "react-hooks/immutability": "off",
           "react-hooks/exhaustive-deps": "off",
           "react-hooks/rules-of-hooks": "off",
           "react/no-unescaped-entities": "off",
           "@next/next/no-img-element": "off",
           "jsx-a11y/alt-text": "off",
           "no-use-before-define": "off"
         }
       }
     }
     return config;
  }),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
