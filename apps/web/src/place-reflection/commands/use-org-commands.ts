/**
 * use-org-commands — typed wrappers around `useCommand` for the
 * shipped org/space/project/connector writers.
 *
 * Surfaces NEVER mutate canonical state directly; every mutation flows
 * through `useCommand` to the daemon. This hook's only purpose is to
 * give call sites typed argument shapes sourced from
 * `@ema/surface-core/adapter`.
 */

import { useCallback } from "react";
import type {
  ConnectorConnectArgs,
  OrgCreateArgs,
  ProjectCreateArgs,
  SpaceCreateArgs,
} from "@ema/surface-core/adapter";
import type { CommandResult } from "@ema/surface-core/ipc-client";
import { useCommand } from "../../lib/ipc";

export type OrgCommands = {
  createOrg(args: OrgCreateArgs): Promise<CommandResult>;
  createSpace(args: SpaceCreateArgs): Promise<CommandResult>;
  createProject(args: ProjectCreateArgs): Promise<CommandResult>;
  connectConnector(args: ConnectorConnectArgs): Promise<CommandResult>;
};

export function useOrgCommands(): OrgCommands {
  const dispatch = useCommand();
  const createOrg = useCallback(
    (args: OrgCreateArgs) => dispatch("org.create", args),
    [dispatch],
  );
  const createSpace = useCallback(
    (args: SpaceCreateArgs) => dispatch("space.create", args),
    [dispatch],
  );
  const createProject = useCallback(
    (args: ProjectCreateArgs) => dispatch("project.create", args),
    [dispatch],
  );
  const connectConnector = useCallback(
    (args: ConnectorConnectArgs) => dispatch("connector.connect", args),
    [dispatch],
  );
  return { createOrg, createSpace, createProject, connectConnector };
}
