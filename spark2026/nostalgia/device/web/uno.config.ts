import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  // ⚠️ 默认的扫描范围只有 .vue/.tsx 这类组件文件，**不含 .ts**。
  // 而本项目的菜单渐变、图标名、行颜色都写在 composables/*.ts 里，
  // 不显式把 .ts 加进来它们就永远生成不出来（图标空白、渐变变灰）。
  content: {
    pipeline: {
      include: [/\.(vue|ts|tsx|js|jsx)($|\?)/],
      // 不扫描自身配置：里面的 `i-` 选择器会被当成图标名，报 `failed to load icon "-"`
      exclude: [/uno\.config\.ts$/, /node_modules/],
    },
  },
  preflights: [
    {
      // ⚠️ presetIcons 只给 `i-*` 生成了 width/height（1.2em），**没有 display**。
      // <i> 默认是 inline，宽高会被忽略 —— 于是「只有图标的按钮」会塌成 0×0
      // （音乐播放器的上一首/下一首就是这么消失的）。这里统一补成 inline-block。
      getCSS: () => `
[class^="i-"], [class*=" i-"] {
  display: inline-block;
  flex-shrink: 0;
}
`,
    },
  ],
})
