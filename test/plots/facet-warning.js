import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

export default async function () {
  const anscombe = await d3.csv("data/anscombe.csv", d3.autoType);
  return Plot.plot({
    grid: true,
    inset: 10,
    width: 960,
    height: 240,
    facet: {
      data: anscombe.filter((_, i) => i % 2),
      x: "series"
    },
    marks: [
      Plot.frame(),
      Plot.dot(
        anscombe.filter((_, i) => i % 2),
        {x: "x", y: "y" /* , facet: true */}
      )
    ]
  });
}