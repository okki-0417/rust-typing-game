import { describe, expect, test } from "vite-plus/test";
import { createSession } from "../src/index.ts";
import type { Scheme, Unit } from "../src/index.ts";

/** 単位列を直接与える入力方式。判定そのものの仕様だけを見るために使う。 */
const fixed =
  (...units: Unit[]): Scheme =>
  () =>
    units;

const sourceOf = (units: Unit[]) => units.map((unit) => unit.source).join("");

const sessionOf = (...units: Unit[]) => createSession(sourceOf(units), { scheme: fixed(...units) });

describe("createSession", () => {
  test("既定の入力方式は原文をそのまま打たせる", () => {
    const session = createSession("a1!");

    expect(session.remaining).toBe("a1!");
    expect(session.cursor).toBe(0);
    expect(session.done).toBe(false);
  });

  test("受理した打鍵は hit、原文を打ち切った打鍵は complete", () => {
    const session = sessionOf({ source: "ab", candidates: ["ab"] });

    expect(session.input("a")).toBe("hit");
    expect(session.input("b")).toBe("complete");
    expect(session.done).toBe(true);
    expect(session.typed).toBe("ab");
    expect(session.remaining).toBe("");
    expect(session.cursor).toBe(2);
  });

  test("単位を打ち切っても、後続があるうちは hit", () => {
    const session = sessionOf(
      { source: "あ", candidates: ["a"] },
      { source: "い", candidates: ["i"] },
    );

    expect(session.input("a")).toBe("hit");
    expect(session.done).toBe(false);
    expect(session.cursor).toBe(1);
  });

  test("受理されない打鍵は miss で、状態は一切変わらない", () => {
    const session = sessionOf({ source: "ab", candidates: ["ab"] });
    session.input("a");

    expect(session.input("z")).toBe("miss");
    expect(session.typed).toBe("a");
    expect(session.remaining).toBe("b");
    expect(session.cursor).toBe(0);
    expect(session.done).toBe(false);

    expect(session.input("b")).toBe("complete");
  });

  test("候補が複数あるとき、remaining は打った経路に追従する", () => {
    const session = sessionOf({ source: "し", candidates: ["shi", "si"] });

    expect(session.remaining).toBe("shi");
    expect(session.input("s")).toBe("hit");
    expect(session.remaining).toBe("hi");
    expect(session.input("i")).toBe("complete");
    expect(session.typed).toBe("si");
  });

  test("候補から外れる打鍵は、その単位の途中でも miss になる", () => {
    const session = sessionOf({ source: "し", candidates: ["shi", "si"] });
    session.input("s");

    expect(session.input("a")).toBe("miss");
    expect(session.remaining).toBe("hi");
  });

  test("remaining は後続の単位の推奨候補まで繋げて返す", () => {
    const session = sessionOf(
      { source: "っこ", candidates: ["kko", "xtuko"] },
      { source: "！", candidates: ["!"] },
    );

    expect(session.remaining).toBe("kko!");
    session.input("x");
    expect(session.remaining).toBe("tuko!");
  });

  test("cursor は単位が対応する原文の文字数ぶん進む", () => {
    const session = sessionOf(
      { source: "っこ", candidates: ["kko"] },
      { source: "！", candidates: ["!"] },
    );

    expect(session.cursor).toBe(0);
    session.input("k");
    expect(session.cursor).toBe(0);
    session.input("k");
    session.input("o");
    expect(session.cursor).toBe(2);
    expect(session.source.slice(0, session.cursor)).toBe("っこ");
  });

  test("打ち切ったあとの入力は常に miss", () => {
    const session = sessionOf({ source: "あ", candidates: ["a"] });
    session.input("a");

    expect(session.input("a")).toBe("miss");
    expect(session.typed).toBe("a");
    expect(session.cursor).toBe(1);
  });

  test("reset で打鍵前の状態に戻る", () => {
    const session = sessionOf({ source: "し", candidates: ["shi", "si"] });
    session.input("s");
    session.reset();

    expect(session.typed).toBe("");
    expect(session.remaining).toBe("shi");
    expect(session.cursor).toBe(0);
    expect(session.done).toBe(false);
  });

  test("空の原文は最初から打ち切った状態になる", () => {
    const session = createSession("");

    expect(session.done).toBe(true);
    expect(session.remaining).toBe("");
    expect(session.cursor).toBe(0);
    expect(session.input("a")).toBe("miss");
  });

  test("打鍵列を持たない単位を返す入力方式は受け付けない", () => {
    expect(() => createSession("あ", { scheme: fixed({ source: "あ", candidates: [] }) })).toThrow(
      TypeError,
    );
    expect(() =>
      createSession("あ", { scheme: fixed({ source: "あ", candidates: [""] }) }),
    ).toThrow(TypeError);
  });
});
