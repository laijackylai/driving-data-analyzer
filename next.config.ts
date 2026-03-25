import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    resolveAlias: {
      // react-plotly.js requires plotly.js/dist/plotly at runtime.
      // This project ships plotly.js-basic-dist-min instead of the full build.
      "plotly.js/dist/plotly": "plotly.js-basic-dist-min/plotly-basic.min.js",
    },
  },
};

export default nextConfig;
