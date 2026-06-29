import { resolveRpcSpecVersion as resolveRpcSpecVersionShared } from '../../../scripts/rpc-spec-version.mjs';

export type SupportedRpcSpecVersion = '0.9.0' | '0.10.0';

export function resolveRpcSpecVersion(value: string | undefined): SupportedRpcSpecVersion {
  return resolveRpcSpecVersionShared(value) as SupportedRpcSpecVersion;
}
