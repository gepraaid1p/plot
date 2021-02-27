import {groups} from "d3-array";
import {defined} from "../defined.js";
import {valueof, range, offsetRange, maybeLabel, first, second, identity} from "../mark.js";

export function groupX({x = identity, normalize, ...options} = {}) {
  const y = groupLength(normalize);
  return {
    ...options,
    transform: maybeNormalize(group1(x), y),
    x: maybeLabel(first, x),
    y
  };
}

export function groupY({y = identity, normalize, ...options} = {}) {
  const x = groupLength(normalize);
  return {
    ...options,
    transform: maybeNormalize(group1(y), x),
    y: maybeLabel(first, y),
    x
  };
}

export function group({x = first, y = second, out, ...options} = {}) {
  return {
    ...options,
    transform: group2(x, y),
    x: maybeLabel(first, x),
    y: maybeLabel(second, y),
    [out]: length3
  };
}

function group1(x) {
  return (data, facets) => {
    const values = valueof(data, x);
    let g = groups(range(data), i => values[i]).filter(defined1);
    return regroup(g, facets);
  };
}

function group2(x, y) {
  return (data, facets) => {
    const valuesX = valueof(data, x);
    const valuesY = valueof(data, y);
    let g = groups(range(data), i => valuesX[i], i => valuesY[i]).filter(defined1);
    g = g.flatMap(([x, xgroup]) => xgroup.filter(defined1).map(([y, ygroup]) => [x, y, ygroup]));
    return regroup(g, facets);
  };
}

// When faceting, subdivides the given groups according to the facet indexes.
function regroup(groups, facets) {
  if (facets === undefined) return {index: range(groups), data: groups};
  const index = [];
  const data = [];
  let k = 0;
  for (const facet of facets.map(subset)) {
    let g = groups.map(facet).filter(nonempty1);
    index.push(offsetRange(g, k));
    data.push(g);
    k += g.length;
  }
  return {index, data: data.flat()};
}

function subset(facet) {
  const f = new Set(facet);
  return ([key, group]) => [key, group.filter(i => f.has(i))];
}

// Since marks don’t render when channel values are undefined (or null or NaN),
// we apply the same logic when grouping. If you want to preserve the group for
// undefined data, map it to an “other” value first.
function defined1([key]) {
  return defined(key);
}

// When faceting, some groups may be empty; these are filtered out.
function nonempty1([, {length}]) {
  return length > 0;
}

function length2([, group]) {
  return group.length;
}

function length3([,, group]) {
  return group.length;
}

length2.label = length3.label = "Frequency";

// Returns a channel definition that’s either the number of elements in the
// given group (length2 above), or the same as a proportion of the total number
// of elements in the data scaled by k. If k is true, it is treated as 100 for
// percentages; otherwise, it is typically 1.
function groupLength(k) {
  if (!k) return length2;
  k = k === true ? 100 : +k;
  let length; // set lazily by the transform
  const value = ([, group]) => group.length * k / length;
  value.normalize = data => void (length = data.length);
  value.label = `Frequency${k === 100 ? " (%)" : ""}`;
  return value;
}

// If the group length requires normalization (per groupLength above), this
// wraps the specified transform to allow it.
function maybeNormalize(transform, length) {
  return length.normalize ? (data, facets) => {
    length.normalize(data);
    return transform(data, facets);
  } : transform;
}
