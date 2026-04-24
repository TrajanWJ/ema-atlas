/**
 * Org / space / project selector state.
 *
 * Pure, framework-agnostic. The React shell binds these to the
 * `topbar` projection.
 */

export type OrgLite = { id: string; name: string };
export type SpaceLite = { id: string; name: string; org_id: string };
export type ProjectLite = { id: string; name: string; space_id: string };

export type SelectorState = {
  orgs: OrgLite[];
  current_org?: OrgLite;
  spaces: SpaceLite[];
  current_space?: SpaceLite;
  projects: ProjectLite[];
  current_project?: ProjectLite;
};

export function emptySelectorState(): SelectorState {
  return { orgs: [], spaces: [], projects: [] };
}
