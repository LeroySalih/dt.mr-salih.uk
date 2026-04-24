import { describe, it, expect } from "vitest"
import { groupIntoPanels } from "@/components/notes/StudyNotes"
import type { Activity } from "@/lib/content"

function makeActivity(overrides: Partial<Activity> & { type: Activity["type"] }): Activity {
  return {
    activityId: overrides.activityId ?? crypto.randomUUID(),
    type: overrides.type,
    title: overrides.title ?? null,
    orderBy: overrides.orderBy ?? 0,
    bodyData: overrides.bodyData ?? null,
  }
}

describe("groupIntoPanels", () => {
  it("returns a single ungrouped panel when there are no display-section activities", () => {
    const activities: Activity[] = [
      makeActivity({ type: "text", title: "Intro" }),
      makeActivity({ type: "display-image" }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(1)
    expect(panels[0].type).toBe("ungrouped")
    expect(panels[0].sections.length).toBeGreaterThan(0)
  })

  it("produces no ungrouped panel when display-section is the first activity", () => {
    const activities: Activity[] = [
      makeActivity({ type: "display-section", title: "Starter", bodyData: { description: "Do now" } }),
      makeActivity({ type: "text", title: "Some text" }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(1)
    expect(panels[0].type).toBe("display-section")
    if (panels[0].type === "display-section") {
      expect(panels[0].index).toBe(1)
      expect(panels[0].title).toBe("Starter")
      expect(panels[0].description).toBe("Do now")
      expect(panels[0].sections).toHaveLength(1)
    }
  })

  it("produces an ungrouped panel followed by a display-section panel when activities precede the first display-section", () => {
    const activities: Activity[] = [
      makeActivity({ type: "text", title: "Before" }),
      makeActivity({ type: "display-section", title: "Main", bodyData: { description: "Main task" } }),
      makeActivity({ type: "text", title: "Inside" }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(2)
    expect(panels[0].type).toBe("ungrouped")
    expect(panels[1].type).toBe("display-section")
    if (panels[1].type === "display-section") {
      expect(panels[1].index).toBe(1)
    }
  })

  it("assigns sequential 1-based indices to display-section panels", () => {
    const activities: Activity[] = [
      makeActivity({ type: "display-section", title: "A", bodyData: { description: "" } }),
      makeActivity({ type: "text", title: "In A" }),
      makeActivity({ type: "display-section", title: "B", bodyData: { description: "" } }),
      makeActivity({ type: "text", title: "In B" }),
      makeActivity({ type: "display-section", title: "C", bodyData: { description: "" } }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(3)
    const indices = panels.map((p) => (p.type === "display-section" ? p.index : null))
    expect(indices).toEqual([1, 2, 3])
  })

  it("produces an empty sections array for a display-section with no following activities", () => {
    const activities: Activity[] = [
      makeActivity({ type: "display-section", title: "Empty", bodyData: { description: "" } }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(1)
    if (panels[0].type === "display-section") {
      expect(panels[0].sections).toHaveLength(0)
    }
  })

  it("handles consecutive display-section activities (nothing between them)", () => {
    const activities: Activity[] = [
      makeActivity({ type: "display-section", title: "First", bodyData: { description: "" } }),
      makeActivity({ type: "display-section", title: "Second", bodyData: { description: "" } }),
      makeActivity({ type: "text", title: "Only in second" }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(2)
    if (panels[0].type === "display-section") expect(panels[0].sections).toHaveLength(0)
    if (panels[1].type === "display-section") expect(panels[1].sections).toHaveLength(1)
  })

  it("returns an empty array for an empty activity list", () => {
    expect(groupIntoPanels([])).toHaveLength(0)
  })
})
