import { describe, expect, it } from "vitest";

import { demoRoleLabel } from "@/lib/demo-auth";

describe("demo role labels", () => {
  it.each([
    ["citizen", "Citizen"],
    ["official", "Official"],
    ["demo_admin", "Demo Admin"],
  ] as const)("labels %s as %s", (role, label) => {
    expect(demoRoleLabel(role)).toBe(label);
  });
});