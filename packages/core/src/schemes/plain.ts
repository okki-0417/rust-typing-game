import type { Scheme } from "../types.ts";

/**
 * 原文をそのまま打つ入力方式。1文字（コードポイント単位）が1単位になる。
 * 打鍵と原文が一致する ASCII の原文に使う。大文字小文字は区別する。
 */
export const plain: Scheme = (source) =>
  Array.from(source, (char) => ({ source: char, candidates: [char] }));
